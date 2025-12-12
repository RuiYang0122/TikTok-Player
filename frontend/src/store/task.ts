/**
 * 任务状态管理
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  Task, 
  TaskStatus, 
  ProcessingStage, 
  ProcessingConfig, 
  VideoFile,
  TaskResult
} from '@/types';
import { DEFAULT_PROCESSING_CONFIG } from '@/utils';

interface TaskState {
  // 当前任务
  currentTask: Task | null;
  
  // 处理配置
  processingConfig: ProcessingConfig;
  
  // 轮询控制
  pollingEnabled: boolean;
  pollingInterval: number;
  
  // 错误状态
  error: string | null;
}

interface TaskActions {
  // 任务操作
  createTask: (videoFile: VideoFile, config?: Partial<ProcessingConfig>) => Task;
  setCurrentTask: (task: Task | null) => void;
  updateTask: (updates: Partial<Task>) => void;
  updateTaskProgress: (progress: number, stage: ProcessingStage, message: string) => void;
  updateTaskResult: (result: TaskResult) => void;
  setTaskError: (error: string) => void;
  clearTask: () => void;
  
  // 配置操作
  updateProcessingConfig: (config: Partial<ProcessingConfig>) => void;
  resetProcessingConfig: () => void;
  
  // 轮询控制
  enablePolling: () => void;
  disablePolling: () => void;
  setPollingInterval: (interval: number) => void;
  
  // 错误处理
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 重置
  reset: () => void;
}

type TaskStore = TaskState & TaskActions;

// 生成任务ID
const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 初始状态
const initialState: TaskState = {
  currentTask: null,
  processingConfig: DEFAULT_PROCESSING_CONFIG,
  pollingEnabled: false,
  pollingInterval: 2000,
  error: null,
};

export const useTaskStore = create<TaskStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 任务操作
      createTask: (videoFile, config = {}) => {
        const taskId = generateTaskId();
        const finalConfig = { ...get().processingConfig, ...config };
        
        const task: Task = {
          id: taskId,
          status: 'pending' as TaskStatus,
          stage: 'uploading' as ProcessingStage,
          progress: 0,
          message: '准备上传视频...',
          video_file: videoFile,
          config: finalConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set((state) => {
          state.currentTask = task;
          state.error = null;
        });

        return task;
      },

      setCurrentTask: (task) => {
        set((state) => {
          state.currentTask = task;
          if (task) {
            state.error = null;
          }
        });
      },

      updateTask: (updates) => {
        set((state) => {
          if (state.currentTask) {
            Object.assign(state.currentTask, {
              ...updates,
              updated_at: new Date().toISOString(),
            });
          }
        });
      },

      updateTaskProgress: (progress, stage, message) => {
        set((state) => {
          if (state.currentTask) {
            state.currentTask.progress = progress;
            state.currentTask.stage = stage;
            state.currentTask.message = message;
            state.currentTask.updated_at = new Date().toISOString();
            
            // 根据阶段更新状态
            if (stage === 'completed') {
              state.currentTask.status = 'completed';
            } else if (progress > 0) {
              state.currentTask.status = 'processing';
            }
          }
        });
      },

      updateTaskResult: (result) => {
        set((state) => {
          if (state.currentTask) {
            state.currentTask.result = result;
            state.currentTask.status = 'completed';
            state.currentTask.stage = 'completed';
            state.currentTask.progress = 100;
            state.currentTask.message = '处理完成！';
            state.currentTask.updated_at = new Date().toISOString();
          }
        });
      },

      setTaskError: (error) => {
        set((state) => {
          if (state.currentTask) {
            state.currentTask.status = 'failed';
            state.currentTask.error_message = error;
            state.currentTask.updated_at = new Date().toISOString();
          }
          state.error = error;
        });
      },

      clearTask: () => {
        set((state) => {
          state.currentTask = null;
          state.error = null;
          state.pollingEnabled = false;
        });
      },

      // 配置操作
      updateProcessingConfig: (config) => {
        set((state) => {
          Object.assign(state.processingConfig, config);
        });
      },

      resetProcessingConfig: () => {
        set((state) => {
          state.processingConfig = { ...DEFAULT_PROCESSING_CONFIG };
        });
      },

      // 轮询控制
      enablePolling: () => {
        set((state) => {
          state.pollingEnabled = true;
        });
      },

      disablePolling: () => {
        set((state) => {
          state.pollingEnabled = false;
        });
      },

      setPollingInterval: (interval) => {
        set((state) => {
          state.pollingInterval = interval;
        });
      },

      // 错误处理
      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // 重置
      reset: () => {
        set(() => ({ ...initialState }));
      },
    })),
    {
      name: 'task-store',
    }
  )
);

// 选择器 hooks
export const useCurrentTask = () => useTaskStore((state) => state.currentTask);
export const useProcessingConfig = () => useTaskStore((state) => state.processingConfig);
export const usePollingState = () => useTaskStore((state) => ({
  enabled: state.pollingEnabled,
  interval: state.pollingInterval,
}));
export const useTaskError = () => useTaskStore((state) => state.error);

// 操作 hooks
export const useTaskActions = () => {
  const store = useTaskStore();
  return {
    createTask: store.createTask,
    setCurrentTask: store.setCurrentTask,
    updateTask: store.updateTask,
    updateTaskProgress: store.updateTaskProgress,
    updateTaskResult: store.updateTaskResult,
    setTaskError: store.setTaskError,
    clearTask: store.clearTask,
  };
};

export const useConfigActions = () => {
  const store = useTaskStore();
  return {
    updateProcessingConfig: store.updateProcessingConfig,
    resetProcessingConfig: store.resetProcessingConfig,
  };
};

export const usePollingActions = () => {
  const store = useTaskStore();
  return {
    enablePolling: store.enablePolling,
    disablePolling: store.disablePolling,
    setPollingInterval: store.setPollingInterval,
  };
};

// 计算属性 hooks
export const useTaskStatus = () => {
  const task = useCurrentTask();
  
  return {
    isIdle: !task,
    isPending: task?.status === 'pending',
    isProcessing: task?.status === 'processing',
    isCompleted: task?.status === 'completed',
    isFailed: task?.status === 'failed',
    hasResult: !!task?.result,
    canDownload: task?.status === 'completed' && !!task?.result?.output_file,
  };
};

export const useTaskProgress = () => {
  const task = useCurrentTask();
  
  if (!task) {
    return {
      progress: 0,
      stage: 'uploading' as ProcessingStage,
      message: '',
      estimatedTime: undefined,
    };
  }
  
  return {
    progress: task.progress,
    stage: task.stage,
    message: task.message,
    estimatedTime: task.estimated_time,
  };
};