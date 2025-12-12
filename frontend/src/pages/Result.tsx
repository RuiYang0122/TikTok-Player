/**
 * 结果页面
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Space, 
  message, 
  Result as AntResult, 
  Modal, 
  Input, 
  Tabs,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons';

import { VideoPlayer } from '@/components/result/VideoPlayer';
import { ResultStats } from '@/components/result/ResultStats';
import { LoadingState, ErrorAlert } from '@/components/common';
import { useErrorHandler, useLoading } from '@/hooks';
import { useAppStore } from '@/store/app';
import { useTaskResult } from '@/services';


const { TextArea } = Input;

export const Result: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();

  const { addNotification } = useAppStore();
  
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // 错误处理和加载状态
  const { error, hasError, clearError, withErrorHandling } = useErrorHandler();
  const { loading: actionLoading, withLoading } = useLoading();

  // 获取任务结果
  const {
    data: result,
    isLoading,
    error: queryError,
    refetch,
  } = useTaskResult(fileId!);

  // 处理下载
  const handleDownload = withLoading(
    withErrorHandling(async () => {
      if (!result?.output_file?.url) {
        throw new Error('下载链接不可用');
      }

      const link = document.createElement('a');
      link.href = result.output_file.url;
      link.download = result.output_file.filename || 'highlight.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        type: 'success',
        title: '下载开始',
        message: '高光视频下载已开始',
      });
    })
  );

  // 处理分享
  const handleShare = () => {
    setShareModalVisible(true);
  };

  // 复制分享链接
  const handleCopyLink = withErrorHandling(async () => {
    const shareUrl = `${window.location.origin}/result/${fileId}`;
    await navigator.clipboard.writeText(shareUrl);
    message.success('链接已复制到剪贴板');
  });

  // 返回历史记录
  const handleGoBack = () => {
    navigate('/history');
  };

  // 重新处理
  const handleReprocess = () => {
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
                返回历史记录
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
          subTitle="无法获取任务结果，请检查网络连接或稍后重试"
          extra={[
            <Button key="back" onClick={handleGoBack}>
              返回历史记录
            </Button>,
            <Button key="retry" type="primary" onClick={handleRefresh}>
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
        tip="加载结果中..."
        size="large"
      />
    );
  }

  // 结果不存在
  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AntResult
          status="404"
          title="结果不可用"
          subTitle="找不到指定的处理结果，可能任务尚未完成或已被删除"
          extra={[
            <Button key="back" onClick={handleGoBack}>
              返回历史记录
            </Button>,
            <Button key="progress" type="primary" onClick={() => navigate(`/progress/${fileId}`)}>
              查看进度
            </Button>,
          ]}
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
                返回历史记录
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  处理结果
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  高光视频生成完成，可以预览和下载
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
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                size="small"
                className="sm:size-default"
              >
                <span className="hidden sm:inline">分享</span>
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                size="small"
                className="sm:size-default"
                loading={actionLoading}
              >
                <span className="hidden sm:inline">下载</span>
              </Button>
            </Space>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 视频播放器 */}
          <div className="lg:col-span-2">
            <Card title="高光视频" size="small">
              <VideoPlayer
                src={result.output_file?.url || ''}
                title="高光视频"
              />
            </Card>
          </div>

          {/* 统计信息 */}
          <div className="lg:col-span-1">
            <ResultStats result={result} />
          </div>
        </div>

        {/* 详细信息标签页 */}
        <div className="mt-6">
          <Card>
            <Tabs
              items={[
                {
                  key: 'highlights',
                  label: '高光片段',
                  children: (
                    <div className="space-y-4">
                      {result.highlights?.map((highlight, index) => (
                        <Card key={index} size="small">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">片段 {index + 1}</div>
                              <div className="text-sm text-gray-500">
                                {highlight.start_time}s - {highlight.end_time}s
                                {highlight.confidence && (
                                  <span className="ml-2">
                                    置信度: {(highlight.confidence * 100).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {highlight.type && (
                                <span className="capitalize">{highlight.type}</span>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'info',
                  label: '任务信息',
                  children: (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">文件ID</div>
                          <div className="font-mono text-sm">{fileId}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">完成时间</div>
                          <div className="text-sm">
                            {result.completed_at && new Date(result.completed_at).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">处理时长</div>
                          <div className="text-sm">
                            {result.processing_time && `${result.processing_time}秒`}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">检测统计</div>
                          <div className="text-sm">
                            {result.stats && `检测到 ${result.stats.total_shots} 次投篮`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            size="large"
            onClick={handleReprocess}
          >
            重新处理
          </Button>
        </div>
      </div>

      {/* 分享模态框 */}
      <Modal
        title="分享结果"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setShareModalVisible(false)}>
            取消
          </Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={handleCopyLink}>
            复制链接
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">分享链接</div>
            <Input
              value={`${window.location.origin}/result/${fileId}`}
              readOnly
              addonAfter={
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleCopyLink}
                  size="small"
                />
              }
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">分享描述</div>
            <TextArea
              rows={3}
              placeholder="添加一些描述..."
              defaultValue={`查看我的篮球高光视频！通过AI智能分析生成的精彩片段。`}
            />
          </div>
        </div>
      </Modal>


    </div>
  );
};