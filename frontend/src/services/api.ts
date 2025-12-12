/**
 * API 服务类
 */
import { HttpService, withRetry } from './http';
import { API_ENDPOINTS } from '@/utils/constants';
import type {
  UploadResponse,
  ProgressInfo,
  ProcessingResult,
  HealthCheckResponse,
  UploadParams,
  ProcessParams,
  TaskQueryParams,
  DownloadParams,
} from '@/types';

export class ApiService {
  /**
   * 上传视频文件
   */
  static async uploadVideo(
    params: UploadParams,
    onUploadProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('video', params.file);

    const response = await HttpService.upload<UploadResponse>(
      API_ENDPOINTS.UPLOAD,
      formData,
      (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      }
    );

    // Flask后端直接返回UploadResponse格式
    if (!response.success) {
      throw new Error(response.message || '上传失败');
    }

    return response.data!;
  }

  /**
   * 开始处理视频
   */
  static async processVideo(params: ProcessParams): Promise<void> {
    const response = await HttpService.post(API_ENDPOINTS.PROCESS, {
      fileId: params.fileId,
      beforeSeconds: params.beforeSeconds || 8,
      afterSeconds: params.afterSeconds || 2,
    });
    
    if (!response.success) {
      throw new Error(response.message || response.error || '开始处理失败');
    }
  }

  /**
   * 获取任务进度
   */
  static async getProgress(params: TaskQueryParams): Promise<ProgressInfo> {
    const response = await withRetry(async () => {
      return HttpService.get<ProgressInfo>(`${API_ENDPOINTS.PROGRESS}/${params.fileId}`);
    });

    // Flask后端直接返回ProgressInfo格式
    return response.data!;
  }

  /**
   * 获取处理结果
   */
  static async getResult(fileId: string): Promise<ProcessingResult> {
    const progressInfo = await this.getProgress({ fileId });
    
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

  /**
   * 健康检查
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    const response = await HttpService.get<HealthCheckResponse>(API_ENDPOINTS.HEALTH);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || '健康检查失败');
    }

    return response.data;
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