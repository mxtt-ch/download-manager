// ============================================================
// 模拟数据层入口
// 当 VITE_MOCK=true 时，前端 API 通过此模块分流到模拟处理器
// ============================================================

// 任务相关
export {
  getTasksMock,
  getTaskDetailMock,
  createTaskMock,
  pauseTaskMock,
  resumeTaskMock,
  deleteTaskMock,
  retryTaskMock,
} from "./handlers";

// 设置相关
export {
  getSettingsMock,
  updateSettingsMock,
  getCategoriesMock,
  upsertCategoryMock,
  deleteCategoryMock,
} from "./handlers";

// 站点相关
export {
  getSitesMock,
  addSiteMock,
  updateSiteMock,
  deleteSiteMock,
} from "./handlers";

// 队列相关
export {
  getQueuesMock,
  createQueueMock,
  deleteQueueMock,
} from "./handlers";

// 系统相关
export {
  getDiskSpaceMock,
  getSpeedHistoryMock,
} from "./handlers";
