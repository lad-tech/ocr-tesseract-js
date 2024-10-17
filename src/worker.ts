import fs from 'fs';
import path from 'path';
import { parentPort, workerData } from 'worker_threads';

import { PDFImage } from 'pdf-image';

import { performOCR } from './ocr';

require('ts-node/register');
(async () => {
  try {
    const { pdfPath, page } = workerData;
    console.log('page ', page, ' start');
    const outputDir = path.join(__dirname, '../output');

    const pdfImage = new PDFImage(pdfPath, {
      outputDir,
      convertOptions: {
        '-density': '300', // Плотность для рендеринга (качество)
        '-quality': '100', // Качество изображения
      },
    });

    // Генерируем изображение для указанной страницы
    const imagePath = await pdfImage.convertPage(page);

    // Читаем сгенерированное изображение
    const imageBuffer = fs.readFileSync(imagePath);

    // Выполняем OCR
    const ocrResult = await performOCR(imageBuffer);
    fs.unlinkSync(imagePath);
    console.log('page ', page, ' done'); // Возвращаем результат (номер страницы и текст) обратно в основной поток
    parentPort?.postMessage({ page, ocrResult, error: null });
  } catch (error) {
    // Если произошла ошибка, возвращаем номер страницы и ошибку
    parentPort?.postMessage({ page: workerData.page, ocrResult: null, error });
  }
})();
