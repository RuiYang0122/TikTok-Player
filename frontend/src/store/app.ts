/**
 * 应用主状态管理
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  AppState, 
  Task, 
  HistoryItem, 
  AppSettings, 
  Notification, 
  NotificationType,
  Theme,
  Language,
  ProcessingConfig
} from '@/types';
import { 
  STORAGE_KEYS, 
  DEFAULT_PROCESSING_CONFIG, 
  NOTIFICATION_CONFIG,
  THEME_CONFIG,
  LANGUAGE_CONFIG
} from '@/utils';

interface AppStore extends AppState {
  // 任务相关操作
  setCurrentTask: (task: Task | undefined) => void;
  updateCurrentTask: (updates: Partial<Task>) => void;
  clearCurrentTask: () => void;

  // 历史记录操作
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;

  // 上传状态操作
  setUploadProgress: (progress: number) => void;
  setUploadFile: (file: any) => void;
  setUploadError: (error: string | undefined) => void;
  setUploading: (isUploading: boolean) => void;
  clearUpload: () => void;

  // 设置操作
  updateSettings: (settings: Partial<AppSettings>) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  updateDefaultConfig: (config: Partial<ProcessingConfig>) => void;

  // 通知操作
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // 加载状态操作
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  
  // 错误处理
  setError: (error: string | undefined) => void;
  clearError: () => void;

  // 重置状态
  reset: () => void;
}

// 默认设置
const defaultSettings: AppSettings = {
  theme: THEME_CONFIG.LIGHT as Theme,
  language: LANGUAGE_CONFIG.ZH as Language,
  auto_download: false,
  notification_enabled: true,
  default_config: DEFAULT_PROCESSING_CONFIG,
};

// 初始状态
const initialState: AppState = {
  currentTask: undefined,
  history: [],
  upload: {
    isUploading: false,
    progress: 0,
    file: undefined,
    error: undefined,
  },
  settings: defaultSettings,
  notifications: [],
  loading: {
    upload: false,
    processing: false,
    history: false,
  },
  error: undefined,
};

// 生成通知ID
const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // 任务相关操作
        setCurrentTask: (task) => {
          set((state) => {
            state.currentTask = task;
          });
        },

        updateCurrentTask: (updates) => {
          set((state) => {
            if (state.currentTask) {
              Object.assign(state.currentTask, updates);
            }
          });
        },

        clearCurrentTask: () => {
          set((state) => {
            state.currentTask = undefined;
          });
        },

        // 历史记录操作
        addHistoryItem: (item) => {
          set((state) => {
            // 避免重复添加
            const exists = state.history.find(h => h.id === item.id);
            if (!exists) {
              state.history.unshift(item); // 添加到开头
              // 限制历史记录数量
              if (state.history.length > 100) {
                state.history = state.history.slice(0, 100);
              }
            }
          });
        },

        removeHistoryItem: (id) => {
          set((state) => {
            state.history = state.history.filter(item => item.id !== id);
          });
        },

        clearHistory: () => {
          set((state) => {
            state.history = [];
          });
        },

        updateHistoryItem: (id, updates) => {
          set((state) => {
            const item = state.history.find(h => h.id === id);
            if (item) {
              Object.assign(item, updates);
            }
          });
        },

        // 上传状态操作
        setUploadProgress: (progress) => {
          set((state) => {
            state.upload.progress = progress;
          });
        },

        setUploadFile: (file) => {
          set((state) => {
            state.upload.file = file;
          });
        },

        setUploadError: (error) => {
          set((state) => {
            state.upload.error = error;
          });
        },

        setUploading: (isUploading) => {
          set((state) => {
            state.upload.isUploading = isUploading;
          });
        },

        clearUpload: () => {
          set((state) => {
            state.upload = {
              isUploading: false,
              progress: 0,
              file: undefined,
              error: undefined,
            };
          });
        },

        // 设置操作
        updateSettings: (settings) => {
          set((state) => {
            Object.assign(state.settings, settings);
          });
        },

        setTheme: (theme) => {
          set((state) => {
            state.settings.theme = theme;
          });
        },

        setLanguage: (language) => {
          set((state) => {
            state.settings.language = language;
          });
        },

        updateDefaultConfig: (config) => {
          set((state) => {
            Object.assign(state.settings.default_config, config);
          });
        },

        // 通知操作
        addNotification: (notification) => {
          const id = generateNotificationId();
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date().toISOString(),
          };

          set((state) => {
            state.notifications.unshift(newNotification);
            // 限制通知数量
            if (state.notifications.length > 10) {
              state.notifications = state.notifications.slice(0, 10);
            }
          });

          // 自动移除通知
          const duration = notification.duration || NOTIFICATION_CONFIG.DEFAULT_DURATION;
          if (duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, duration);
          }
        },

        removeNotification: (id) => {
          set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== id);
          });
        },

        clearNotifications: () => {
          set((state) => {
            state.notifications = [];
          });
        },

        // 加载状态操作
        setLoading: (key, loading) => {
          set((state) => {
            state.loading[key] = loading;
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
            state.error = undefined;
          });
        },

        // 重置状态
        reset: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: STORAGE_KEYS.SETTINGS,
        partialize: (state) => ({
          settings: state.settings,
          history: state.history,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// 便捷的选择器 hooks
export const useCurrentTask = () => useAppStore((state) => state.currentTask);
export const useHistory = () => useAppStore((state) => state.history);
export const useUploadState = () => useAppStore((state) => state.upload);
export const useSettings = () => useAppStore((state) => state.settings);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useLoading = () => useAppStore((state) => state.loading);
export const useAppError = () => useAppStore((state) => state.error);

// 便捷的操作 hooks
export const useTaskActions = () => {
  const store = useAppStore();
  return {
    setCurrentTask: store.setCurrentTask,
    updateCurrentTask: store.updateCurrentTask,
    clearCurrentTask: store.clearCurrentTask,
  };
};

export const useHistoryActions = () => {
  const store = useAppStore();
  return {
    addHistoryItem: store.addHistoryItem,
    removeHistoryItem: store.removeHistoryItem,
    clearHistory: store.clearHistory,
    updateHistoryItem: store.updateHistoryItem,
  };
};

export const useUploadActions = () => {
  const store = useAppStore();
  return {
    setUploadProgress: store.setUploadProgress,
    setUploadFile: store.setUploadFile,
    setUploadError: store.setUploadError,
    setUploading: store.setUploading,
    clearUpload: store.clearUpload,
  };
};

export const useNotificationActions = () => {
  const store = useAppStore();
  return {
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    clearNotifications: store.clearNotifications,
  };
};

// 便捷的通知方法
export const useNotify = () => {
  const { addNotification } = useNotificationActions();
  
  return {
    success: (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'success' as NotificationType,
        title,
        message,
        duration: duration || NOTIFICATION_CONFIG.SUCCESS_DURATION,
      });
    },
    error: (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'error' as NotificationType,
        title,
        message,
        duration: duration || NOTIFICATION_CONFIG.ERROR_DURATION,
      });
    },
    warning: (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'warning' as NotificationType,
        title,
        message,
        duration: duration || NOTIFICATION_CONFIG.WARNING_DURATION,
      });
    },
    info: (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'info' as NotificationType,
        title,
        message,
        duration: duration || NOTIFICATION_CONFIG.INFO_DURATION,
      });
    },
  };
};