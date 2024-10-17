import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { convertPdfToImages } from './pdfUtils';

const MIME_PDF = 'application/pdf';
async function main() {
  const fastify = Fastify({
    logger: false,
  });

  // Настройка Swagger
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'PDF Parsing API',
        description: 'API для парсинга PDF в текст с использованием OCR и Worker Threads',
        version: '1.0.0',
      },
      tags: [
        {
          name: 'PDF Parsing',
          description: 'Операции для парсинга PDF и OCR с использованием воркеров',
        },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
  });

  fastify.addContentTypeParser(MIME_PDF, (_request, payload, done) => {
    const buffers: Buffer[] = [];
    payload.on('data', chunk => {
      buffers.push(chunk);
    });
    payload.on('end', () => {
      done(null, Buffer.concat(buffers));
    });
  });

  // API-метод для загрузки PDF и извлечения текста
  fastify.post<{
    Querystring: {
      startPage?: number;
      endPage?: number;
      limit?: number;
    };
    Body: Buffer;
  }>(
    '/parse-pdf',
    {
      schema: {
        summary: 'Парсинг PDF в текст',
        description: 'Загружает PDF и возвращает распознанный текст с каждой страницы',
        tags: ['PDF Parsing'],
        querystring: {
          type: 'object',
          properties: {
            startPage: { type: 'number', description: 'Начальная страница для парсинга', default: 1 },
            endPage: { type: 'number', description: 'Последняя страница для парсинга' },
            limit: { type: 'number', description: 'Лимит параллельных задач', default: 10 },
          },
        },
        consumes: [MIME_PDF],
        response: {
          200: {
            description: 'Успешный парсинг PDF',
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: { type: 'object', properties: { page: { type: 'number' }, ocrResult: { type: 'string' } } },
              },
              processedPages: { type: 'number' },
              failedPage: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const mimetype = request.headers['content-type'];
      if (mimetype !== MIME_PDF) {
        return reply.code(415).send({ error: 'Unsupported Media Type' });
      }

      const { body: pdfBuffer } = request;
      const { startPage = 1, endPage, limit = 10 } = request.query;

      try {
        // Конвертируем PDF в изображения и выполняем OCR параллельно
        const results = await convertPdfToImages(pdfBuffer, { startPage, endPage, limit });

        reply.send({ results, processedPages: results.length });
      } catch (err) {
        console.error(err);
        reply.code(500).send({ error: 'Error processing PDF', details: err });
      }
    },
  );

  // Запуск сервера
  try {
    await fastify.listen({ port: Number(process.env.APP_PORT) || 3000, host: '0.0.0.0' });
    console.log('--->');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main().catch(console.error);
