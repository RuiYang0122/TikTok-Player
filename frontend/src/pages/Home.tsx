/**
 * 主页面组件
 */
import React, { useState, useCallback } from 'react';
import { Button, Row, Col, Card, Typography, Space, message, Alert } from 'antd';
import { 
  PlayCircleOutlined, 
  RocketOutlined, 
  HistoryOutlined,
  StarOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { VideoUpload } from '@/components/upload/VideoUpload';
import { ConfigPanel } from '@/components/ui/ConfigPanel';
import { useAppStore, useTaskStore } from '@/store';
import { useUploadVideo, useProcessVideo } from '@/services';
import { VideoFile, ProcessingConfig } from '@/types';
import { validateProcessingConfig } from '@/utils';
import { useErrorHandler, useLoading } from '@/hooks';

const { Title, Paragraph, Text } = Typography;

export const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [processingConfig, setProcessingConfig] = useState<ProcessingConfig>({
    sensitivity: 0.7,
    minDuration: 2,
    maxDuration: 10,
    outputFormat: 'mp4',
    quality: 'high',
    includeSlowMotion: true,
    autoEnhance: true,
    detectShots: true,
    detectDunks: true,
    detectPasses: false,
    detectDefense: false,
  });

  // Store hooks
  const { addNotification } = useAppStore();
  const { createTask, setProcessingConfig: setStoreConfig } = useTaskStore();

  // Custom hooks
  const { error, hasError, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { loading: customLoading, withLoading } = useLoading();

  // API hooks
  const uploadMutation = useUploadVideo();
  const processMutation = useProcessVideo();

  // 处理文件选择
  const handleFileSelect = useCallback((file: VideoFile | null) => {
    setSelectedFile(file);
  }, []);

  // 处理配置变更
  const handleConfigChange = useCallback((config: ProcessingConfig) => {
    setProcessingConfig(config);
  }, []);

  // 开始处理视频
  const handleStartProcessing = useCallback(
    withLoading(
      withErrorHandling(async () => {
        if (!selectedFile) {
          throw new Error('请先选择视频文件');
        }

        // 验证配置
        const configValidation = validateProcessingConfig(processingConfig);
        if (!configValidation.valid) {
          throw new Error(configValidation.error || '配置参数无效');
        }

        // 1. 上传视频文件
        addNotification({
          type: 'info',
          title: '开始上传',
          message: '正在上传视频文件...',
        });

        const uploadResult = await uploadMutation.mutateAsync({
          file: selectedFile.file,
          onProgress: (progress) => {
            console.log('Upload progress:', progress);
          },
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.message || '上传失败');
        }

        // 2. 创建任务并保存配置
        const fileId = uploadResult.fileId;
        createTask({
          id: fileId,
          status: 'pending',
          progress: 0,
          stage: 'uploading',
          videoFile: selectedFile,
          config: processingConfig,
          createdAt: Date.now(),
        });

        setStoreConfig(processingConfig);

        // 3. 开始处理视频
        addNotification({
          type: 'success',
          title: '上传成功',
          message: '开始处理视频，请稍候...',
        });

        await processMutation.mutateAsync({
          fileId,
          beforeSeconds: processingConfig.beforeSeconds,
          afterSeconds: processingConfig.afterSeconds,
        });

        addNotification({
          type: 'success',
          title: '处理开始',
          message: '视频处理已开始，您可以在进度页面查看详情',
        });

        // 跳转到进度页面
        // 这里需要路由跳转，暂时用 console.log 代替
        console.log('Navigate to progress page:', fileId);
      }, {
        customMessage: '视频处理失败，请检查文件格式和网络连接后重试'
      })
    ),
    [selectedFile, processingConfig, uploadMutation, processMutation, addNotification, createTask, setStoreConfig, withLoading, withErrorHandling]
  );

  const isProcessing = uploadMutation.isPending || processMutation.isPending || customLoading;

  return (
    <div className="home-page min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* 全局错误提示 */}
      {hasError && error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert
            message="操作失败"
            description={error.message}
            type="error"
            showIcon
            closable
            onClose={clearError}
            action={
              <Button size="small" onClick={clearError}>
                重试
              </Button>
            }
            className="shadow-lg"
          />
        </div>
      )}

      {/* 头部区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <VideoCameraOutlined className="text-white text-2xl" />
              </div>
              <Title level={1} className="!mb-0 !text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                篮球高光生成器
              </Title>
            </div>
            <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
              使用 AI 技术自动识别篮球视频中的精彩瞬间，生成专业的高光集锦
            </Paragraph>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Row gutter={[24, 24]}>
          {/* 左侧：视频上传区域 */}
          <Col xs={24} lg={14}>
            <div className="space-y-6">
              {/* 上传组件 */}
              <Card className="shadow-sm">
                <VideoUpload
                  onFileSelect={handleFileSelect}
                  loading={isProcessing}
                  disabled={isProcessing}
                />
              </Card>

              {/* 功能特色 */}
              <Card title="功能特色" className="shadow-sm">
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <TrophyOutlined className="text-orange-600 text-xl" />
                      </div>
                      <Text className="text-sm font-medium text-gray-700">智能识别</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <StarOutlined className="text-blue-600 text-xl" />
                      </div>
                      <Text className="text-sm font-medium text-gray-700">自动剪辑</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <PlayCircleOutlined className="text-green-600 text-xl" />
                      </div>
                      <Text className="text-sm font-medium text-gray-700">高清输出</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <RocketOutlined className="text-purple-600 text-xl" />
                      </div>
                      <Text className="text-sm font-medium text-gray-700">快速处理</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          </Col>

          {/* 右侧：参数设置面板 */}
          <Col xs={24} lg={10}>
            <div className="space-y-6">
              {/* 配置面板 */}
              <ConfigPanel
                config={processingConfig}
                onChange={handleConfigChange}
                disabled={isProcessing}
              />

              {/* 操作按钮 */}
              <Card className="shadow-sm">
                <Space direction="vertical" size="middle" className="w-full">
                  <Button
                    type="primary"
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={handleStartProcessing}
                    loading={isProcessing}
                    disabled={!selectedFile}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {isProcessing ? '处理中...' : '开始生成高光'}
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      icon={<HistoryOutlined />}
                      className="flex-1"
                      onClick={() => console.log('Navigate to history')}
                    >
                      历史记录
                    </Button>
                    <Button
                      icon={<PlayCircleOutlined />}
                      className="flex-1"
                      onClick={() => console.log('View examples')}
                    >
                      示例视频
                    </Button>
                  </div>
                </Space>
              </Card>

              {/* 使用提示 */}
              <Card title="使用提示" size="small" className="shadow-sm">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 上传清晰的篮球比赛或训练视频</p>
                  <p>• 确保视频中包含明显的篮球动作</p>
                  <p>• 建议视频时长在 1-30 分钟之间</p>
                  <p>• 处理时间约为视频时长的 1/3</p>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* 底部统计信息 */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Row gutter={[24, 24]} className="text-center">
            <Col xs={12} sm={6}>
              <div>
                <div className="text-2xl font-bold text-orange-600 mb-1">1000+</div>
                <div className="text-sm text-gray-600">处理视频</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">50000+</div>
                <div className="text-sm text-gray-600">精彩瞬间</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">98%</div>
                <div className="text-sm text-gray-600">识别准确率</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">5min</div>
                <div className="text-sm text-gray-600">平均处理时间</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};