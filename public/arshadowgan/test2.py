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



def test():
    if not osp.exists(data_root):
        print("No data directory")
        exit(0)

    if not osp.exists(output_dir):
        os.makedirs(output_dir)

    image_list = sorted(os.listdir(osp.join(data_root, 'noshadow')))
    for i in image_list:
        image_path = osp.join(data_root, 'noshadow', i)
        mask_path = osp.join(data_root, 'mask', i)

        # Carregar a imagem original e a máscara
        image = cv.imread(image_path)
        #img = cv.imread(image_path, cv.IMREAD_GRAYSCALE)
        img_gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY) 
        mask = read_image(mask_path, 1)
        inverse_mask = cv.bitwise_not(mask)
        masked_img = cv.bitwise_and(img_gray, inverse_mask)

        img_blur = cv.GaussianBlur(masked_img, (3,3), 0) 
        
        # THRESHOLDING
        # Inverter a máscara para excluir o cubo 3D
        mask_inv = 255 - mask
        
        ret, thresh = cv.threshold(img_blur, 120, 255, cv.THRESH_BINARY + 
                                            cv.THRESH_OTSU) 
        kernel = np.ones((5,5), np.uint8)
        erosion = cv.erode(thresh, kernel, iterations = 1)
        dilation = cv.dilate(erosion, kernel, iterations = 1)

        output_image = dilation
        output_image = cv.subtract(inverse_mask.astype(np.uint8), output_image)
        cv.imwrite(osp.join(output_dir, f'{i}_result_1.png'), output_image)
        
        # EDGE DETECTION
        # Sobel Edge Detection
        cv.imwrite(osp.join(output_dir, f'{i}_result_2.png'), img_blur)        
        sobelx = cv.Sobel(src=img_blur, ddepth=cv.CV_64F, dx=1, dy=0, ksize=5) # Sobel Edge Detection on the X axis
        sobely = cv.Sobel(src=img_blur, ddepth=cv.CV_64F, dx=0, dy=1, ksize=5) # Sobel Edge Detection on the Y axis
        sobelxy = cv.Sobel(src=img_blur, ddepth=cv.CV_64F, dx=1, dy=1, ksize=5) # Combined X and Y Sobel Edge Detection
        # Canny Edge Detection
        edges = cv.Canny(image=img_blur, threshold1=100, threshold2=200) # Canny Edge Detection
        #edges[inverse_mask == 0] = 0
        cv.imwrite(osp.join(output_dir, f'{i}_result_3.png'), edges)

        # REGION BASED SEGMENTATION
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
        
        cv.imwrite(osp.join(output_dir, f'{i}_result_4.png'), image_out)
        
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
	test()