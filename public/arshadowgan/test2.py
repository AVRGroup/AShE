import sys
import os
import os.path as osp
import cv2 as cv
import numpy as np
import tensorflow as tf
import imutils

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
	image = cv.imread(image_path, cv.IMREAD_COLOR)
	if channels == 3:
		image = cv.imread(image_path, cv.IMREAD_COLOR)
	else:
		image = cv.imread(image_path, cv.IMREAD_GRAYSCALE)
		image = np.expand_dims(image, 2)
	image = image.astype(np.float32) / 127.5 - 1.0
	return image


def test():
    if not osp.exists(data_root):
        print("No data directory")
        exit(0)

    if not osp.exists(output_dir):
        os.makedirs(output_dir)

    image_list = sorted(os.listdir(osp.join(data_root, 'noshadow')))
    for i in image_list:
        # Teste geração simplificada de sombras
        image = read_image(osp.join(data_root, 'noshadow', i), 3)
        shadow_mask = np.zeros_like(image)
        shadow_mask[:, :128, :] = -0.5  # Teste de escurecimento da metade esquerda da imagem
        image_with_shadow = np.clip(image + shadow_mask, -1, 1)
        # Salva imagem resultante
        output_image = ((1.0 + image_with_shadow) * 127.5).astype(np.uint8)
        cv.imwrite(osp.join(output_dir, 'simplified_shadow_' + i), output_image)

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