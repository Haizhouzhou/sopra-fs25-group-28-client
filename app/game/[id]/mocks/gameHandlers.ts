// 从项目根目录的 mock 文件夹中导入 worker
import { worker } from '../../../../mock/browsers';

// 导出 setupMocks 函数，供页面中调用启动 MSW
export function setupMocks() {
  // 确保只在浏览器端启动
  if (typeof window === 'undefined') return;
  worker.start({ onUnhandledRequest: 'bypass' });
}
