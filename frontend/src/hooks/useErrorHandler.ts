/**
 * 错误处理 Hook
 * 统一处理应用中的错误
 */
import { useState, useCallback } from 'react';
import { message } from 'antd';

interface ErrorState {
  error: Error | null;
  hasError: boolean;
}

interface UseErrorHandlerReturn extends ErrorState {
  handleError: (error: Error | string) => void;
  clearError: () => void;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options?: {
      showMessage?: boolean;
      customMessage?: string;
    }
  ) => (...args: T) => Promise<R | undefined>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
  });

  const handleError = useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    
    setErrorState({
      error: errorObj,
      hasError: true,
    });

    // 记录错误到控制台
    console.error('Error handled:', errorObj);

    // 可以在这里添加错误上报逻辑
    // reportError(errorObj);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
    });
  }, []);

  const withErrorHandling = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      options: {
        showMessage?: boolean;
        customMessage?: string;
      } = {}
    ) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          clearError();
          const result = await fn(...args);
          return result;
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          handleError(errorObj);

          if (options.showMessage !== false) {
            const errorMessage = options.customMessage || errorObj.message || '操作失败';
            message.error(errorMessage);
          }

          return undefined;
        }
      };
    },
    [handleError, clearError]
  );

  return {
    ...errorState,
    handleError,
    clearError,
    withErrorHandling,
  };
};

export default useErrorHandler;