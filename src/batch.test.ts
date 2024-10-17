import { runInBatches } from './pdfUtils';

describe('', () => {
  beforeEach(jest.clearAllMocks);

  test('qq', async () => {
    const tasks = [
      () => new Promise(resolve => setTimeout(() => resolve('Task 1'), 1000)),
      () => new Promise(resolve => setTimeout(() => resolve('Task 2'), 500)),
      () => new Promise(resolve => setTimeout(() => resolve('Task 3'), 1200)),
      () => new Promise(resolve => setTimeout(() => resolve('Task 4'), 800)),
      () => new Promise(resolve => setTimeout(() => resolve('Task 5'), 600)),
    ];

    await runInBatches(tasks, 2).then(results => console.log(results));
  });
});
