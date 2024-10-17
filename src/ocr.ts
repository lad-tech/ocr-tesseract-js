import fs from 'fs';
import path from 'path';

import sharp from 'sharp';
import { recognize } from 'tesseract.js';

const langPath = path.resolve(__dirname, '../testdata');

export const performOCR = async (imageBuffer: Buffer): Promise<string> => {
  const result = await recognize(imageBuffer, 'rus', {
    langPath: langPath,
    gzip: false,
    // logger: console.log,
  });
  return result.data.text;
};

export const processImage = async (imagePath: string): Promise<Buffer> => {
  const imageBuffer = fs.readFileSync(imagePath);

  // Преобразуем обратно в буфер для дальнейшей обработки
  return await sharp(imageBuffer)
    .greyscale() // Преобразование в градации серого
    .normalize() // Нормализация изображения
    .toBuffer();
};
