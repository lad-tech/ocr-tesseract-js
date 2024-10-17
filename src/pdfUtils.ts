import fs from 'fs';
import os from 'os';
import path from 'path';
import { Worker } from 'worker_threads';

import { PDFDocument } from 'pdf-lib';

interface ConvertOptions {
  startPage?: number;
  endPage?: number;
  limit?: number; // Дополнительное ограничение на количество параллельных потоков
}

// Получаем количество доступных ядер
const numCPUs = os.cpus().length;

// Функция для запуска воркера для обработки страницы
const processPageInWorker = (
  pdfPath: string,
  page: number,
): Promise<{ page: number; ocrResult: string; error: any }> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker.ts'), {
      workerData: { pdfPath, page },
      execArgv: ['-r', 'ts-node/register'],
    });

    worker.on('message', ({ page, ocrResult, error }) => {
      if (error) {
        reject({ page, error });
      } else {
        resolve({ page, ocrResult, error: null });
      }
    });

    worker.on('error', error => reject({ page, error }));
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

export const runInBatches = async <T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> => {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => {
      console.log(`Задача завершена: ${result}`);
      results.push(result);
      // Удаляем завершившиеся задачи
      executing.splice(
        executing.findIndex(e => e === p),
        1,
      );
    });

    executing.push(p);

    // Добавляем задачу в массив выполняющихся задач
    if (executing.length >= limit) {
      // console.log(`Достигнут лимит: ${limit} задач, ждем завершения одной из них`);

      // Если количество выполняющихся задач превышает лимит, ждем завершения одной из них
      await Promise.race(executing);
    }
  }

  // Дожидаемся завершения всех оставшихся задач
  await Promise.all(executing);
  return results;
};

export const convertPdfToImages = async (
  pdfBuffer: Buffer,
  options: ConvertOptions,
): Promise<{ page: number; ocrResult: string }[]> => {
  const { startPage = 1, endPage, limit = numCPUs } = options;
  const pdfPath = path.join(__dirname, '../temp.pdf');

  // Сохраняем PDF в файл для использования с воркерами
  fs.writeFileSync(pdfPath, pdfBuffer);
  const pdf = await PDFDocument.load(pdfBuffer);
  const numPages = endPage || pdf.getPageCount();
  console.log('pages count', numPages);

  // Собираем задачи для каждой страницы
  const workerTasks: (() => Promise<{ page: number; ocrResult: string }>)[] = [];
  for (let i = startPage - 1; i < numPages; i++) {
    workerTasks.push(() => processPageInWorker(pdfPath, i));
  }

  const results = await runInBatches(workerTasks, limit);

  // Удаляем временный PDF файл
  fs.unlinkSync(pdfPath);

  return results;
};
