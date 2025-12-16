/**
 * React Query hooks for API operations
 */
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ApiService } from './api';
import type {
  UploadParams,
  UploadResponse,
  ProcessParams,
  ProcessResponse,
  ProgressInfo,
  ProcessingResult,
  HealthCheckResponse,
  DownloadParams,
} from '@/types';

// Query Keys
export const QUERY_KEYS = {
  HEALTH: ['health'],
  PROGRESS: (fileId: string) => ['progress', fileId],
  RESULT: (fileId: string) => ['result', fileId],
  TASKS: (params?: any) => ['tasks', params],
  STATS: ['stats'],
} as const;

/**
 * 健康检查查询
 */
export const useHealthCheck = (
  options?: UseQueryOptions<HealthCheckResponse, Error>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: ApiService.healthCheck,
    staleTime: 30000, // 30秒内不重新获取
    refetchInterval: 60000, // 每分钟自动刷新
    ...options,
  });
};

/**
 * 任务进度查询
 */
export const useTaskProgress = (
  taskId: string,
  options?: UseQueryOptions<ProgressInfo, Error>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.PROGRESS(taskId),
    queryFn: () => ApiService.getProgress({ taskId }),
    enabled: !!taskId,
    refetchInterval: (query) => {
      // 如果任务已完成或失败，停止轮询
      const data = query.state.data;
      if (data?.completed || data?.status === 'failed') {
        return false;
      }
      return 2000; // 2秒轮询一次
    },
    staleTime: 0, // 总是获取最新数据
    ...options,
  });
};

/**
 * 任务结果查询
 */
export const useTaskResult = (
  taskId: string,
  options?: UseQueryOptions<ProcessingResult, Error>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESULT(taskId),
    queryFn: () => ApiService.getResult(taskId),
    enabled: !!taskId,
    staleTime: 300000, // 5分钟内不重新获取
    ...options,
  });
};

/**
 * 任务列表查询
 */
export const useTasks = (
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.TASKS(params),
    queryFn: () => ApiService.getTasks(params),
    staleTime: 60000, // 1分钟内不重新获取
    ...options,
  });
};

/**
 * 系统统计查询
 */
export const useStats = (
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.STATS,
    queryFn: ApiService.getStats,
    staleTime: 300000, // 5分钟内不重新获取
    ...options,
  });
};

/**
 * 上传视频变更
 */
export const useUploadVideo = (
  options?: UseMutationOptions<UploadResponse, Error, {
    file: File;
    onProgress?: (progress: number) => void;
  }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }) => 
      ApiService.uploadVideo({ file }, onProgress),
    onSuccess: (data: UploadResponse) => {
      // 上传成功后，开始查询进度
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROGRESS(data.fileId) });
    },
    ...options,
  });
};

/**
 * 视频处理 Mutation
 */
export const useProcessVideo = (
  options?: UseMutationOptions<ProcessResponse, Error, ProcessParams>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ApiService.processVideo,
    onSuccess: (resp) => {
      // 开始轮询进度
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROGRESS(resp.taskId) });
    },
    ...options,
  });
};

/**
 * 下载视频变更
 */
export const useDownloadVideo = (
  options?: UseMutationOptions<Blob, Error, {
    params: DownloadParams;
    onProgress?: (progress: number) => void;
  }>
) => {
  return useMutation({
    mutationFn: ({ params, onProgress }) => 
      ApiService.downloadVideo(params, onProgress),
    ...options,
  });
};

/**
 * 删除任务变更
 */
export const useDeleteTasks = (
  options?: UseMutationOptions<void, Error, string[]>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ApiService.deleteTasks,
    onSuccess: () => {
      // 删除成功后，刷新任务列表
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
    },
    ...options,
  });
};

/**
 * 自定义轮询 Hook
 */
export const useTaskPolling = (
  taskId: string,
  onComplete?: (result: ProcessingResult) => void,
  onError?: (error: Error) => void
) => {
  const queryClient = useQueryClient();

  const { data: progress, error, isLoading } = useTaskProgress(taskId);

  // 使用 useEffect 来处理状态变化
  React.useEffect(() => {
    if (progress?.status === 'completed') {
      // 任务完成，获取结果
      ApiService.getResult(taskId)
        .then((result) => {
          queryClient.setQueryData(QUERY_KEYS.RESULT(taskId), result);
          onComplete?.(result);
        })
        .catch((error) => {
          onError?.(error);
        });
    } else if (progress?.status === 'failed') {
      onError?.(new Error(progress.stage || '处理失败'));
    }
  }, [progress?.status, taskId, queryClient, onComplete, onError]);

  React.useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  return {
    progress,
    error,
    isLoading,
    isCompleted: progress?.status === 'completed',
    isFailed: progress?.status === 'failed',
    isProcessing: progress?.status === 'processing',
  };
};

/**
 * 预取数据 Hook
 */
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient();

  const prefetchTaskResult = (taskId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.RESULT(taskId),
      queryFn: () => ApiService.getResult(taskId),
      staleTime: 300000,
    });
  };

  const prefetchTasks = (params?: any) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.TASKS(params),
      queryFn: () => ApiService.getTasks(params),
      staleTime: 60000,
    });
  };

  const prefetchStats = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.STATS,
      queryFn: ApiService.getStats,
      staleTime: 300000,
    });
  };

  return {
    prefetchTaskResult,
    prefetchTasks,
    prefetchStats,
  };
};
