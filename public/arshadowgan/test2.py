import sys
import os
import os.path as osp
import cv2 as cv
import numpy as np
import imutils
import higra as hg
from skimage.segmentation import relabel_sequential
import matplotlib.pyplot as plt 

from skimage.metrics import structural_similarity as compare_ssim
from pathlib import Path

source_path = Path(__file__).resolve()
source_dir = source_path.parent
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['CUDA_VISIBLE_DEVICES'] = '0'
node_names = {'input_image':      'placeholder/input_image:0',
              'input_mask':       'placeholder/input_mask:0',
              'output_attention': 'concat_1:0',
              'output_image':     'Tanh:0'}
data_root = osp.join(source_dir, 'data')
output_dir = osp.join(source_dir, 'output')

def read_image(image_path, channels):
    image = cv.imread(image_path, cv.IMREAD_COLOR if channels == 3 else cv.IMREAD_GRAYSCALE)
    if image is None:
        print(f"Erro ao carregar a imagem: {image_path}")
    return image

def kmeans_segmentation(image, nb_classes=6, use_color=False):
    if use_color:
        data = image.reshape((-1, 3)).astype(np.float32)
    else:
        gray_image = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
        data = gray_image.reshape((-1, 1)).astype(np.float32)
    
    criteria = (cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    ret, label, center = cv.kmeans(data, nb_classes, None, criteria, 10, cv.KMEANS_RANDOM_CENTERS)
    segmented_image = label.reshape((image.shape[0], image.shape[1]))
    return segmented_image

def normalize_segments(segmented):
    unique_values = np.unique(segmented)
    max_value = 255
    step = max_value // len(unique_values)
    normalized_image = np.zeros_like(segmented, dtype=np.uint8)
    for i, val in enumerate(unique_values):
        normalized_image[segmented == val] = i * step
    return normalized_image

def analyze_segments_for_shadows(image, labels, nb_classes):
    # Convertendo a imagem para o espaço de cor LAB
    lab_image = cv.cvtColor(image, cv.COLOR_BGR2Lab)
    shadow_mask = np.zeros_like(labels, dtype=np.uint8)

    # Análise de cada segmento
    for i in range(nb_classes):
        segment_mask = (labels == i)
        if np.any(segment_mask):
            segment_lab = lab_image[segment_mask]
            l_channel = segment_lab[:, 0]  # Componente L* que representa a luminosidade
            mean_l = np.mean(l_channel)

            # Considerar sombra se a luminosidade é muito baixa
            # Ajuste o limiar conforme necessário para sua aplicação específica
            if mean_l < 50:  # Limiar de luminosidade para detecção de sombras
                shadow_mask[segment_mask] = 255

    return shadow_mask

def smooth_shadow_mask(shadow_mask):
    # Definir o kernel para operações morfológicas
    kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (3, 3))

    # Fechamento para preencher pequenos buracos
    closed_mask = cv.morphologyEx(shadow_mask, cv.MORPH_CLOSE, kernel, iterations=2)

    # Abertura para remover pequenos pontos
    cleaned_mask = cv.morphologyEx(closed_mask, cv.MORPH_OPEN, kernel, iterations=2)

    return cleaned_mask

def edge_detection(image):
    # Sobel Edge Detection
    sobel_x = cv.Sobel(src=image, ddepth=cv.CV_64F, dx=1, dy=0, ksize=5)
    sobel_y = cv.Sobel(src=image, ddepth=cv.CV_64F, dx=0, dy=1, ksize=5)
    sobel_xy = cv.Sobel(src=image, ddepth=cv.CV_64F, dx=1, dy=1, ksize=5)
    
    # Canny Edge Detection
    edges_canny = cv.Canny(image=image, threshold1=100, threshold2=200)
    
    return sobel_x, sobel_y, sobel_xy, edges_canny

def create_contours_mask(edges):
    # Use um kernel menor para a dilatação
    kernel_dilate = np.ones((3, 3), np.uint8)  # Kernel menor
    dilation = cv.dilate(edges, kernel_dilate, iterations=1)  # Menos iterações

    # Preenchimento dos buracos dentro dos objetos
    flood_fill = dilation.copy()
    h, w = flood_fill.shape[:2]
    mask = np.zeros((h+2, w+2), np.uint8)
    cv.floodFill(flood_fill, mask, (0,0), 255)

    # Inverta a imagem preenchida para obter os objetos
    flood_fill_inv = cv.bitwise_not(flood_fill)
    object_mask = dilation | flood_fill_inv

    # Aplicar erosão para diminuir a expansão das bordas
    kernel_erode = np.ones((3, 3), np.uint8)
    object_mask = cv.erode(object_mask, kernel_erode, iterations=1)

    return object_mask

def combine_masks(segmentation_mask, contour_mask, color = 128):
    # Crie uma cópia da máscara de contornos para manipular
    combined_mask = contour_mask.copy()

    # Onde a máscara de segmentação é proximo de branca, defina a máscara combinada para cinza
    combined_mask[segmentation_mask > 200] = color

    return combined_mask

def main():
    if not osp.exists(data_root):
        print("No data directory")
        exit(0)

    if not osp.exists(output_dir):
        os.makedirs(output_dir)

    image_list = sorted(os.listdir(osp.join(data_root, 'noshadow')))
    for i in image_list:
        image_path = osp.join(data_root, 'noshadow', i)
        mask_path = osp.join(data_root, 'mask', i)

        image = read_image(image_path, 3)
        if image is None:
            continue
        
        #img = cv.imread(image_path, cv.IMREAD_GRAYSCALE)
        img_gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY) 
        mask = read_image(mask_path, 1)
        inverse_mask = cv.bitwise_not(mask)
        masked_img = cv.bitwise_and(img_gray, inverse_mask)
        img_blur = cv.GaussianBlur(masked_img, (3,3), 0) 
        
        # clusterização ################################################################################################################
        # Segmentação por k-means
        nb_classes = 6
        blured_image = cv.GaussianBlur(image, (5, 5), 0)
        segmented = kmeans_segmentation(blured_image, nb_classes, use_color=True)
        normalized_segmented = normalize_segments(segmented)
        # Mapa de cores para visualização
        segmented_image = cv.applyColorMap(normalized_segmented.astype(np.uint8), cv.COLORMAP_JET)
        cv.imwrite(osp.join(output_dir, f'{i}_kmeans_segmented.png'), segmented_image)
        # Análise de sombras nos segmentos
        segmentation_mask = analyze_segments_for_shadows(blured_image, segmented, nb_classes)
        cv.imwrite(osp.join(output_dir, f'{i}_segmentation_mask.png'), segmentation_mask)
        # Suavizar a máscara de sombras para remover ruído
        #segmentation_mask = smooth_shadow_mask(segmentation_mask) #não necessário por agora
        cv.imwrite(osp.join(output_dir, f'{i}smooth_segmentation_mask.png'), segmentation_mask)
        
        # THRESHOLDING #######################################################################################
        # Inverter a máscara para excluir o cubo 3D        
        ret, thresh = cv.threshold(img_blur, 120, 255, cv.THRESH_BINARY + 
                                            cv.THRESH_OTSU) 
        kernel = np.ones((5,5), np.uint8)
        erosion = cv.erode(thresh, kernel, iterations = 1)
        dilation = cv.dilate(erosion, kernel, iterations = 1)

        output_image = dilation
        output_image = cv.subtract(inverse_mask.astype(np.uint8), output_image)
        cv.imwrite(osp.join(output_dir, f'{i}_threshholding_mask.png'), output_image)
        
        # EDGE DETECTION #######################################################################################
        _, _, _, edges_canny = edge_detection(img_blur)
        # Salvando os resultados de Sobel e Canny
        cv.imwrite(osp.join(output_dir, f'{i}_edges_canny.png'), edges_canny)
        #edges[inverse_mask == 0] = 0
        #cv.imwrite(osp.join(output_dir, f'{i}_result_3.png'), edges_canny)
        # Criar máscara dos objetos detectados
        contours_mask = create_contours_mask(edges_canny)
        cv.imwrite(osp.join(output_dir, f'{i}contours_mask.png'), contours_mask)
        
        # REGION BASED SEGMENTATION  #######################################################################################
        img = img_blur
        edges = cv.Canny(img, 100, 100)                                                                                                                                                                    
        size = img.shape[:2]                                                                                                                                                                                
        graph = hg.get_4_adjacency_graph(size)                                                                                                                                                              
        edge_weights = hg.weight_graph(graph, edges, hg.WeightFunction.mean)                                                                                                                                
        tree, altitudes = hg.watershed_hierarchy_by_area(graph, edge_weights)                                                                                                                               
        segments = hg.labelisation_horizontal_cut_from_threshold(tree, altitudes, 500)                                                                                                                      
        segments, _, _ = relabel_sequential(segments)        
        # Conversão dos segmentos para um formato que pode ser salvo como imagem
        # Normaliza os segmentos para o intervalo 0-255
        unique_labels = np.unique(segments)
        image_out = np.zeros_like(segments, dtype=np.uint8)
        for label in unique_labels:
            mk = segments == label
            image_out[mk] = (label / unique_labels.max()) * 255                                                                                                                                                       
        print('The number of segments is ', segments.max() - 1)                                                                                                                                                
        
        cv.imwrite(osp.join(output_dir, f'{i}_region_based.png'), image_out)
        
        # COMBINING MASKS #######################################################################################
        combined_mask = combine_masks(segmentation_mask, contours_mask, 128)
        cv.imwrite(osp.join(output_dir, f'{i}_combined_mask.png'), combined_mask)
        final_image = combine_masks(mask, combined_mask, 0)
        #final_image = cv.subtract(mask.astype(np.uint8), combined_mask)
        cv.imwrite(osp.join(output_dir, f'{i}_final_image.png'), final_image)
        
        output_image = final_image
        
        # Código Aleksander
        mask = read_image(osp.join(data_root, 'mask', i), 1)
        g1 = cv.cvtColor(output_image, cv.COLOR_BGR2GRAY)
        g2 = cv.cvtColor(((1.0 + read_image(osp.join(data_root, 'noshadow', i), 3)) * 127.5).astype(np.uint8), cv.COLOR_BGR2GRAY)
        score, diff = compare_ssim(g1, g2, full=True)
        diff = (diff * 255).astype(np.uint8)
        diff = cv.subtract(mask.astype(np.uint8), diff)
        ret, otsu = cv.threshold(diff, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
        cnts = cv.findContours(otsu, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        diff = cv.cvtColor(diff, cv.COLOR_GRAY2RGB)
        greatest = 0
        cnt = None
        for c in cnts:
            cv.drawContours(diff, [c], -1, (255, 0, 0), 1)
            dm = np.zeros(otsu.shape, np.uint8)
            cv.drawContours(dm, [c], -1, 255, -1)
            area = cv.contourArea(c)
            mean = cv.mean(diff, mask=dm)[0] * area
            if mean > greatest:
                greatest = mean
                cnt = c
        if cnt is not None:
            cp = diff.copy()
            cv.drawContours(diff, [cnt], -1, (0, 255, 0), 1)
            cv.drawContours(cp, [cnt], -1, (0, 255, 0), -1)
            mask = 255 - read_image(osp.join(data_root, 'mask', i), 1).astype(np.uint8)
            ret, m = cv.threshold(mask, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
            cm = cv.findContours(m, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
            cm = imutils.grab_contours(cm)

            dm = np.zeros(otsu.shape, np.uint8)
            cv.drawContours(dm, cnt, -1, 255, 1)
            x = 0
            y = 0
            p = 0
            for j in range(0, dm.shape[0] - 1):
                for k in range(0, dm.shape[1] - 1):
                    if dm[j, k] == 255:
                        p += 1
                        x += j
                        y += k
            if p == 0:
                x = -1
                y = -1
            else:
                aux = x // p
                x = y // p
                y = aux

            cv.circle(diff, (x, y), 3, (0, 0, 255), -1)
        else:
            x = -1
            y = -1
        s = str(x) + " " + str(y) + " "
        for j in range(256):
            for k in range(256):
                if cp[k, j, 0] == 0 and cp[k, j, 1] == 255 and cp[k, j, 2] == 0:
                    s += str(j) + " " + str(k) + " "
        print(s[:-1])
        cv.imwrite(osp.join(output_dir, 'contours_' + i), diff)


if __name__ == '__main__':
	main()