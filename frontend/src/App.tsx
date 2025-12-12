import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from '@/router';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NetworkStatus from '@/components/common/NetworkStatus';
import './index.css';
import './App.css';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        message.error(error instanceof Error ? error.message : '操作失败');
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN}>
          <NetworkStatus />
          <RouterProvider router={router} />
        </ConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
