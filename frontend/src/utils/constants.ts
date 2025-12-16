/**
 * 应用常量定义
 */

// API 配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  TIMEOUT: 30000, // 30秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
} as const;

// API 端点
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  PROCESS: '/api/process',
  PROGRESS: '/api/progress',
  DOWNLOAD: '/api/download',
  HEALTH: '/api/health',
} as const;

// 任务状态
export const TASK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// 处理阶段
export const PROCESSING_STAGES = {
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  DETECTING: 'detecting',
  GENERATING: 'generating',
  FINALIZING: 'finalizing',
  COMPLETED: 'completed',
} as const;

// 阶段显示名称
export const STAGE_NAMES = {
  [PROCESSING_STAGES.UPLOADING]: '上传视频',
  [PROCESSING_STAGES.ANALYZING]: '分析视频',
  [PROCESSING_STAGES.DETECTING]: '检测投篮',
  [PROCESSING_STAGES.GENERATING]: '生成高光',
  [PROCESSING_STAGES.FINALIZING]: '完成处理',
  [PROCESSING_STAGES.COMPLETED]: '处理完成',
} as const;

// 阶段描述
export const STAGE_DESCRIPTIONS = {
  [PROCESSING_STAGES.UPLOADING]: '正在上传您的篮球视频...',
  [PROCESSING_STAGES.ANALYZING]: '正在分析视频内容和结构...',
  [PROCESSING_STAGES.DETECTING]: '使用AI模型检测投篮动作...',
  [PROCESSING_STAGES.GENERATING]: '正在生成精彩高光片段...',
  [PROCESSING_STAGES.FINALIZING]: '正在完成最后的处理步骤...',
  [PROCESSING_STAGES.COMPLETED]: '您的高光视频已经准备就绪！',
} as const;

// 默认处理配置
export const DEFAULT_PROCESSING_CONFIG = {
  beforeSeconds: 3,
  afterSeconds: 1,
};

// 文件限制
export const FILE_LIMITS = {
  MAX_SIZE: 2048 * 1024 * 1024, // 2GB
  MIN_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_FORMATS: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  SUPPORTED_MIME_TYPES: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
  ],
} as const;

// 轮询配置
export const POLLING_CONFIG = {
  INTERVAL: 2000, // 2秒
  MAX_ATTEMPTS: 1800, // 最多轮询30分钟 (1800 * 2秒)
  BACKOFF_FACTOR: 1.1, // 退避因子
  MAX_INTERVAL: 10000, // 最大轮询间隔10秒
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  SETTINGS: 'basketball_highlight_settings',
  HISTORY: 'basketball_highlight_history',
  CURRENT_TASK: 'basketball_highlight_current_task',
  THEME: 'basketball_highlight_theme',
  LANGUAGE: 'basketball_highlight_language',
} as const;

// 主题配置
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// 语言配置
export const LANGUAGE_CONFIG = {
  ZH: 'zh',
  EN: 'en',
} as const;

// 通知配置
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 4500, // 4.5秒
  SUCCESS_DURATION: 3000, // 3秒
  ERROR_DURATION: 6000, // 6秒
  WARNING_DURATION: 4500, // 4.5秒
  INFO_DURATION: 4000, // 4秒
} as const;

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// 响应式断点
export const BREAKPOINTS = {
  XS: 480,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1600,
} as const;

// 颜色配置
export const COLORS = {
  PRIMARY: '#FF6B35',
  SECONDARY: '#1E3A8A',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
} as const;

// 路由路径
export const ROUTES = {
  HOME: '/',
  PROCESSING: '/processing/:taskId',
  RESULT: '/result/:taskId',
  HISTORY: '/history',
  SETTINGS: '/settings',
} as const;

// 页面标题
export const PAGE_TITLES = {
  HOME: '篮球高光生成器',
  PROCESSING: '处理中',
  RESULT: '处理结果',
  HISTORY: '历史记录',
  SETTINGS: '设置',
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  FILE_TOO_LARGE: '文件大小超出限制',
  FILE_FORMAT_NOT_SUPPORTED: '不支持的文件格式',
  UPLOAD_FAILED: '文件上传失败',
  PROCESSING_FAILED: '视频处理失败',
  TASK_NOT_FOUND: '任务不存在',
  DOWNLOAD_FAILED: '下载失败',
  UNKNOWN_ERROR: '发生未知错误',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '视频上传成功',
  PROCESSING_COMPLETE: '视频处理完成',
  DOWNLOAD_SUCCESS: '下载成功',
  SETTINGS_SAVED: '设置已保存',
} as const;