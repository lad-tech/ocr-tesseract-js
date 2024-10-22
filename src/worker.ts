import fs from 'fs';
import path from 'path';
import { parentPort, workerData } from 'worker_threads';

import { PDFImage } from 'pdf-image';
import pdf from 'pdf-parse'; // библиотека для парсинга PDF и извлечения текста

import { performOCR, processImage } from './ocr';

require('ts-node/register');

(async () => {
  try {
    const { pdfPath, page } = workerData;
    const outputDir = path.join(__dirname, '../output');

    // Читаем PDF-файл и парсим его с помощью pdf-parse
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(pdfBuffer);

    // Извлекаем текст из всего документа и разбиваем по страницам
    const pagesText: any[] = data.text.replace('\n', '').split(/\f/); // \f — разделитель страниц в pdf-parse
    if (page <= pagesText.length) {
      const extractedText = pagesText?.[page]?.trim();
      console.log(extractedText);
      // Если на странице есть текст, возвращаем его
      if (extractedText?.length > 0) {
        parentPort?.postMessage({ page, ocrResult: extractedText, error: null });
        return;
      }
    }
    // Если текста нет, продолжаем обработку через OCR
    const pdfImage = new PDFImage(pdfPath, {
      outputDir,
      convertOptions: {
        '-density': '300', // Плотность для рендеринга (качество)
        '-quality': '70', // Качество изображения
      },
    });

    // Генерируем изображение для указанной страницы
    const imagePath = await pdfImage.convertPage(page);

    // Читаем сгенерированное изображение
    const imageBuffer = await processImage(imagePath);

    // Выполняем OCR
    const ocrResult = await performOCR(imageBuffer);
    fs.unlinkSync(imagePath);

    // Возвращаем результат OCR
    parentPort?.postMessage({ page, ocrResult, error: null });
  } catch (error) {
    // Возвращаем ошибку
    parentPort?.postMessage({ page: workerData.page, ocrResult: null, error });
  }
})();
