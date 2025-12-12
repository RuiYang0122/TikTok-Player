import type { TaskStatus, ProcessingStage, DetectionStats, ProcessingResult } from './api';

// 应用主题类型
export type Theme = 'light' | 'dark';

// 语言类型
export type Language = 'zh' | 'en';

// 视频文件信息
export interface VideoFile {
  file: File;
  preview?: string;
  duration?: number;
  size: number;
  type: string;
  name: string;
}

// 处理配置
export interface ProcessingConfig {
  sensitivity: number;
  minDuration: number;
  maxDuration: number;
  outputFormat: 'mp4' | 'avi' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeSlowMotion: boolean;
  autoEnhance: boolean;
  detectShots: boolean;
  detectDunks: boolean;
  detectPasses: boolean;
  detectDefense: boolean;
}

// 任务信息
export interface Task {
  id: string;
  status: TaskStatus;
  stage: ProcessingStage;
  progress: number;
  message: string;
  video_file?: VideoFile;
  config?: ProcessingConfig;
  result?: TaskResult;
  created_at: string;
  updated_at: string;
  estimated_time?: number;
  error_message?: string;
}

// 任务结果
// 使用ProcessingResult作为TaskResult的别名
export type TaskResult = ProcessingResult;

// 历史记录项
export interface HistoryItem {
  id: string;
  task_id: string;
  original_filename: string;
  output_filename?: string;
  status: TaskStatus;
  stats?: DetectionStats;
  created_at: string;
  completed_at?: string;
  file_size?: number;
  processing_time?: number;
}

// 应用设置
export interface AppSettings {
  theme: Theme;
  language: Language;
  auto_download: boolean;
  notification_enabled: boolean;
  default_config: ProcessingConfig;
}

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 通知消息
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
  read?: boolean;
}

// 上传状态
export interface UploadState {
  isUploading: boolean;
  progress: number;
  file?: VideoFile;
  error?: string;
}

// 应用状态
export interface AppState {
  // 当前任务
  currentTask?: Task;
  
  // 历史记录
  history: HistoryItem[];
  
  // 上传状态
  upload: UploadState;
  
  // 应用设置
  settings: AppSettings;
  
  // 通知列表
  notifications: Notification[];
  
  // 加载状态
  loading: {
    upload: boolean;
    processing: boolean;
    history: boolean;
  };
  
  // 错误状态
  error?: string;
}

// 路由参数类型
export interface RouteParams {
  taskId?: string;
}

// 页面类型
export type PageType = 'home' | 'processing' | 'result' | 'history' | 'settings';