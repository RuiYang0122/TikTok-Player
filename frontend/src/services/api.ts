/**
 * API 服务类
 */
import { HttpService, withRetry } from './http';
import { API_ENDPOINTS } from '@/utils/constants';
import { io, Socket } from 'socket.io-client';
import type {
  UploadResponse,
  ProgressInfo,
  ProcessingResult,
  HealthCheckResponse,
  UploadParams,
  ProcessParams,
  ProcessResponse,
  TaskQueryParams,
  DownloadParams,
} from '@/types';

export class ApiService {
  private static socket: Socket | null = null;

  /**
   * 初始化 WebSocket 连接
   */
  static connectWebSocket(onTaskProgress: (data: any) => void) {
    if (!this.socket) {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });
      
      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    }

    // 移除之前的监听器以避免重复
    this.socket.off('task_progress');
    this.socket.on('task_progress', (message) => {
        onTaskProgress(message);
    });

    return this.socket;
  }

  static disconnectWebSocket() {
    if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
    }
  }

  /**
   * 分块上传视频文件
   */
  static async uploadVideo(
    params: UploadParams,
    onUploadProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
    const file = params.file;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // 1. Initialize upload
    const initResponse = await HttpService.post<{ success: boolean; fileId: string; message: string }>(
      '/api/upload/init', 
      { filename: file.name }
    );
    
    if (!initResponse.success) {
      throw new Error(initResponse.message || 'Upload initialization failed');
    }

    const fileId = initResponse.fileId;

    // 2. Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('fileId', fileId);
      formData.append('chunkIndex', i.toString());

      await HttpService.upload(
        '/api/upload/chunk',
        formData
      );

      if (onUploadProgress) {
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        onUploadProgress(progress);
      }
    }

    // 3. Complete upload
    const completeResponse = await HttpService.post<UploadResponse>(
      '/api/upload/complete',
      {
        fileId,
        filename: file.name,
        totalChunks
      }
    );

    if (!completeResponse.success) {
      throw new Error(completeResponse.message || 'Upload completion failed');
    }

    return completeResponse;
  }

  /**
   * 开始处理视频
   */
  static async processVideo(params: ProcessParams): Promise<ProcessResponse> {
    const response = await HttpService.post(API_ENDPOINTS.PROCESS, {
      fileId: params.fileId,
      beforeSeconds: params.beforeSeconds || 8,
      afterSeconds: params.afterSeconds || 2,
    });
    
    if (!response.success) {
      throw new Error((response as any).message || (response as any).error || '开始处理失败');
    }
    return response as unknown as ProcessResponse;
  }

  /**
   * 获取任务进度
   */
  static async getProgress(params: TaskQueryParams): Promise<ProgressInfo> {
    const response = await withRetry(async () => {
      return HttpService.get<ProgressInfo>(`${API_ENDPOINTS.PROGRESS}/${params.taskId}`);
    });

    return response as unknown as ProgressInfo;
  }

  /**
   * 获取处理结果
   */
  static async getResult(taskId: string): Promise<ProcessingResult> {
    const progressInfo = await this.getProgress({ taskId });
    
    if (!progressInfo.completed || !progressInfo.result) {
      throw new Error('处理尚未完成或结果不可用');
    }

    return progressInfo.result;
  }

  /**
   * 下载处理后的视频
   */
  static async downloadVideo(
    params: DownloadParams,
    onDownloadProgress?: (progress: number) => void
  ): Promise<Blob> {
    return HttpService.download(
      `${API_ENDPOINTS.DOWNLOAD}/${params.filename}`,
      params.filename,
      (progressEvent) => {
        if (onDownloadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onDownloadProgress(progress);
        }
      }
    );
  }

  /**
   * 获取下载链接
   */
  static getDownloadUrl(filename: string): string {
    return `${API_ENDPOINTS.DOWNLOAD}/${filename}`;
  }

  static getStreamUrl(filename: string): string {
    return `/api/stream/${filename}`;
  }

  /**
   * 健康检查
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    const response = await HttpService.get<HealthCheckResponse>(API_ENDPOINTS.HEALTH);
    return response as unknown as HealthCheckResponse;
  }

  /**
   * 轮询任务进度
   */
  static async pollProgress(
    fileId: string,
    onProgress: (progress: ProgressInfo) => void,
    onComplete: (result: ProcessingResult) => void,
    onError: (error: Error) => void,
    options: {
      interval?: number;
      maxAttempts?: number;
      backoffFactor?: number;
      maxInterval?: number;
    } = {}
  ): Promise<() => void> {
    const {
      interval = 2000,
      maxAttempts = 1800,
      backoffFactor = 1.1,
      maxInterval = 10000,
    } = options;

    let attempts = 0;
    let currentInterval = interval;
    let timeoutId: number;

    const poll = async () => {
      try {
        attempts++;
        const progress = await this.getProgress({ fileId });
        
        onProgress(progress);

        // 检查是否完成
        if (progress.completed && progress.result) {
          onComplete(progress.result);
          return;
        }

        // 检查是否失败
        if (progress.status === 'failed') {
          onError(new Error(progress.stage || '处理失败'));
          return;
        }

        // 检查是否超过最大尝试次数
        if (attempts >= maxAttempts) {
          onError(new Error('处理超时'));
          return;
        }

        // 继续轮询
        timeoutId = setTimeout(poll, currentInterval);
        
        // 增加轮询间隔（指数退避）
        currentInterval = Math.min(currentInterval * backoffFactor, maxInterval);
        
      } catch (error) {
        onError(error as Error);
      }
    };

    // 开始轮询
    poll();

    // 返回取消函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  /**
   * 批量操作 - 删除任务
   */
  static async deleteTasks(taskIds: string[]): Promise<void> {
    const response = await HttpService.post('/api/tasks/delete', { task_ids: taskIds });
    
    if (!response.success) {
      throw new Error(response.message || response.error || '删除任务失败');
    }
  }

  /**
   * 获取任务列表
   */
  static async getTasks(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    tasks: ProcessingResult[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await HttpService.get(`/api/tasks?${queryParams.toString()}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || '获取任务列表失败');
    }

    return response.data;
  }

  /**
   * 获取系统统计信息
   */
  static async getStats(): Promise<{
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    total_processing_time: number;
    total_videos_processed: number;
    average_processing_time: number;
  }> {
    const response = await HttpService.get('/api/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || '获取统计信息失败');
    }

    return response.data;
  }
}
