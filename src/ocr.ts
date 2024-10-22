import fs from 'fs';
import path from 'path';

import sharp from 'sharp';
import { createWorker, OEM } from 'tesseract.js';

const langPath = path.join(__dirname, '..', 'tessdata');
export const performOCR = async (imageBuffer: Buffer): Promise<string> => {
  const worker = await createWorker(['eng', 'rus'], OEM.LSTM_ONLY, {
    gzip: false,
    cacheMethod: '',
    legacyCore: false,
    legacyLang: false,
    langPath,
  });
  const {
    data: { text },
  } = await worker.recognize(
    imageBuffer,
    {
      pdfTextOnly: true,
    },
    {
      text: true,
      blocks: false,
      layoutBlocks: false,
      hocr: false,
      tsv: false,
      box: false,
      unlv: false,
      osd: false,
      pdf: false,
      imageColor: false,
      imageGrey: false,
      imageBinary: false,
      debug: false,
    },
  );
  await worker.terminate();
  return text;
};

export const processImage = async (imagePath: string): Promise<Buffer> => {
  const imageBuffer = fs.readFileSync(imagePath);

  // Преобразуем обратно в буфер для дальнейшей обработки
  return await sharp(imageBuffer)
    .greyscale() // Преобразование в градации серого
    .normalize() // Нормализация изображения
    .jpeg({
      quality: 70,
    })
    .toBuffer();
};
