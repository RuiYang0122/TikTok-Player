/**
 * 处理进度页面
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, message, Result as AntResult } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

import { ProgressIndicator } from '@/components/progress/ProgressIndicator';
import { StatusDisplay } from '@/components/progress/StatusDisplay';
import { LoadingState, ErrorAlert } from '@/components/common';
import { useErrorHandler, useLoading } from '@/hooks';
import { useAppStore } from '@/store/app';
import { useTaskProgress, QUERY_KEYS } from '@/services/queries';
import { ApiService } from '@/services/api';
import type { Task } from '@/types';

export const Progress: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [autoRefresh, setAutoRefresh] = useState(false); // Default to false as we use WebSocket
  const queryClient = useQueryClient();
  
  // 错误处理和加载状态
  const { error, hasError, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { loading: retryLoading, withLoading } = useLoading();

  // 获取任务进度 (Initial fetch)
  const {
    data: progress,
    isLoading,
    error: queryError,
    refetch,
  } = useTaskProgress(fileId!, {
    enabled: !!fileId,
    refetchInterval: false, // Disable polling, use WebSocket
  });

  // WebSocket connection
  useEffect(() => {
    if (!fileId) return;

    // Initial fetch to make sure we have the latest state
    refetch();

    const socket = ApiService.connectWebSocket((data) => {
      if (data.taskId === fileId) {
        // Update React Query cache
        queryClient.setQueryData(QUERY_KEYS.PROGRESS(fileId), data.data);
        // 移除日志累积显示
        
        // Show notification on completion
        if (data.data.status === 'completed' && !progress?.completed) {
             addNotification({
                type: 'success',
                title: '处理完成',
                message: '视频高光提取已完成，可以查看结果了！',
              });
             // 不再显示完成时的日志追加
        } else if (data.data.status === 'failed' && progress?.status !== 'failed') {
             addNotification({
                type: 'error',
                title: '处理失败',
                message: data.data.stage || '视频处理过程中出现错误',
              });
        }
      }
    });

    return () => {
      ApiService.disconnectWebSocket();
    };
  }, [fileId, queryClient, addNotification, refetch]);

  // 监听任务状态变化 (Local effects)
  useEffect(() => {
    if (progress) {
      if (progress.completed) {
         // Task completed
      }
    }
  }, [progress]);

  // 处理重试
  const handleRetry = withLoading(
    withErrorHandling(async () => {
      if (!fileId) {
        throw new Error('文件ID不存在');
      }
      
      refetch();
      message.success('已刷新任务状态');
    })
  );

  // 查看结果
  const handleViewResult = () => {
    if (progress?.completed && fileId) {
      navigate(`/result/${fileId}`);
    }
  };

  // 返回首页
  const handleGoBack = () => {
    navigate('/');
  };

  // 手动刷新
  const handleRefresh = withErrorHandling(async () => {
    await refetch();
    message.success('已刷新任务状态');
  });

  // 错误状态
  if (queryError) {
    // 检查是否是404错误（任务不存在）
    if (queryError.message?.includes('404')) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <AntResult
            status="404"
            title="任务不存在"
            subTitle="找不到指定的处理任务，可能已被删除或ID错误"
            extra={
              <Button type="primary" onClick={handleGoBack}>
                返回首页
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AntResult
          status="error"
          title="加载失败"
          subTitle="无法获取任务信息，请检查网络连接或稍后重试"
          extra={[
            <Button key="back" onClick={handleGoBack}>
              返回首页
            </Button>,
            <Button key="retry" type="primary" onClick={() => refetch()}>
              重试
            </Button>,
          ]}
        />
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <LoadingState
        type="page"
        tip="加载任务信息中..."
        size="large"
      />
    );
  }

  // 进度信息不存在
  if (!progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AntResult
          status="404"
          title="任务不存在"
          subTitle="找不到指定的处理任务，可能已被删除或ID错误"
          extra={
            <Button type="primary" onClick={handleGoBack}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 全局错误提示 */}
        {hasError && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <ErrorAlert
              title="操作失败"
              message={error?.message || '发生未知错误'}
              type="error"
              showIcon
              closable
              onClose={clearError}
            />
          </div>
        )}

        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                className="flex items-center w-fit"
              >
                返回首页
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  处理进度
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  实时跟踪视频处理状态和进度 (WebSocket已连接)
                </p>
              </div>
            </div>
            
            <Space wrap className="flex-wrap">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                size="small"
                className="sm:size-default"
              >
                <span className="hidden sm:inline">刷新</span>
              </Button>
            </Space>
          </div>
        </div>

        {/* 进度指示器 + 日志 */}
        <div className="mb-6">
          <Card>
            {
              /* 将后端状态映射到前端阶段键 */
            }
            {(() => {
              const status = progress.status as string;
              const stageText = progress.stage || '';
              let stageKey: any = 'uploading';
              if (status === 'detecting') stageKey = stageText.includes('分析') ? 'analyzing' : 'detecting';
              else if (status === 'generating') stageKey = 'generating';
              else if (status === 'completed') stageKey = 'completed';
              else if (status === 'failed') stageKey = 'finalizing';

              return (
                <ProgressIndicator
                  status={(progress.status === 'completed' || progress.status === 'failed' || progress.status === 'pending') ? (progress.status as any) : 'processing'}
                  stage={stageKey}
                  progress={progress.progress}
                  message={progress.stage}
                  currentStep={undefined}
                  totalSteps={undefined}
                  estimatedTime={undefined}
                />
              );
            })()}
            
          </Card>
        </div>

        {/* 状态详情 */}
          <StatusDisplay
          task={{
            id: fileId!,
            status: (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'pending') ? (progress.status as any) : 'processing',
            stage: progress.stage,
            progress: progress.progress,
            message: progress.stage || '',
            result: progress.result,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: (progress as any).error,
          }}
          onRetry={handleRetry}
          onViewResult={() => {
            const filename = (progress as any)?.result?.highlightVideo;
            if (!filename) return;
            const url = ApiService.getDownloadUrl(filename);
            const a = document.createElement('a');
            a.href = url;
            a.download = `basketball_highlight_${filename}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          retryLoading={retryLoading}
        />
      </div>
    </div>
  );
};
