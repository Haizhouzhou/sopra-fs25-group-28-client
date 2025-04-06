// mock/browser.ts
import { setupWorker } from 'msw';
import { handlers } from './handlers';

// 使用 MSW v1 的 setupWorker 来创建 worker，并传入所有 handler
export const worker = setupWorker(...handlers);
