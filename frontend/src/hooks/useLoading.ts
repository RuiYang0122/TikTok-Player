/**
 * 加载状态管理 Hook
 * 用于管理组件的加载状态
 */
import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R>;
}

export const useLoading = (initialLoading = false): UseLoadingReturn => {
  const [loading, setLoading] = useState(initialLoading);

  const withLoading = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R> => {
        setLoading(true);
        try {
          const result = await fn(...args);
          return result;
        } finally {
          setLoading(false);
        }
      };
    },
    []
  );

  return {
    loading,
    setLoading,
    withLoading,
  };
};

export default useLoading;