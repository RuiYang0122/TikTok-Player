// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 视频上传响应 - 匹配Flask后端格式
export interface UploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  fileSize: number;
  message: string;
}

// 任务状态类型
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 处理阶段类型
export type ProcessingStage = 
  | 'uploading'
  | 'analyzing'
  | 'detecting'
  | 'generating'
  | 'finalizing'
  | 'completed';

// 进度信息 - 匹配Flask后端格式
export interface ProgressInfo {
  progress: number;
  stage: ProcessingStage;
  status: TaskStatus;
  completed: boolean;
  result?: ProcessingResult;
}

// 检测结果统计
export interface DetectionStats {
  total_shots: number;
  successful_shots: number;
  missed_shots: number;
  accuracy_rate: number;
  total_duration: number;
  highlight_duration: number;
  shots_made?: number;
  dunks_made?: number;
  assists_made?: number;
  steals_made?: number;
}

// 高光片段类型
export type HighlightType = 'shot' | 'dunk' | 'pass' | 'defense';

// 高光片段
export interface Highlight {
  id: string;
  type: HighlightType;
  start_time: number;
  end_time: number;
  confidence: number;
  description?: string;
}

// 输出文件信息
export interface OutputFile {
  filename: string;
  size: number;
  duration: number;
  format: string;
  url?: string;
}

// 视频处理结果
export interface ProcessingResult {
  task_id: string;
  status: TaskStatus;
  output_file?: OutputFile;
  file_size?: number;
  stats?: DetectionStats;
  highlights?: Highlight[];
  processing_time?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

// 健康检查响应
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  components: {
    ai_model: boolean;
    storage: boolean;
    processing: boolean;
  };
  version: string;
}

// 视频上传参数
export interface UploadParams {
  file: File;
}

// 视频处理参数 - 匹配Flask后端格式
export interface ProcessParams {
  fileId: string;
  beforeSeconds?: number;
  afterSeconds?: number;
}

// 任务查询参数
export interface TaskQueryParams {
  fileId: string;
}

// 下载参数
export interface DownloadParams {
  filename: string;
}