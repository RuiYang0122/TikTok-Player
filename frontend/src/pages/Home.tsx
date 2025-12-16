/**
 * 主页面组件
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAppStore, useTaskStore, useConfigActions } from '@/store';
import { useUploadVideo, useProcessVideo } from '@/services';
import type { VideoFile, ProcessingConfig } from '@/types';
import { validateProcessingConfig } from '@/utils';
import { useErrorHandler, useLoading } from '@/hooks';

const { Title, Paragraph, Text } = Typography;

export const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingConfig, setProcessingConfig] = useState<ProcessingConfig>({
    beforeSeconds: 3,
    afterSeconds: 1,
  });

  // Store hooks
  const { addNotification } = useAppStore();
  const { createTask } = useTaskStore();
  const { updateProcessingConfig } = useConfigActions();
  
  // Custom hooks
  const { error, hasError, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { loading: customLoading, withLoading } = useLoading();

  const navigate = useNavigate(); // Add navigate

  // API hooks
  const uploadMutation = useUploadVideo();
  const processMutation = useProcessVideo();

  // 处理文件选择
  const handleFileSelect = useCallback((file: VideoFile | null) => {
    setSelectedFile(file);
    setUploadProgress(0);
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
        
        setUploadProgress(0);

        const uploadResult = await uploadMutation.mutateAsync({
          file: selectedFile.file,
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.message || '上传失败');
        }

        // 2. 创建任务（用于本地状态显示，不影响后端任务ID）
        const fileId = uploadResult.fileId;
        createTask(selectedFile, processingConfig);

        updateProcessingConfig(processingConfig);

        // 3. 开始处理视频

        const processResp = await processMutation.mutateAsync({
          fileId,
          beforeSeconds: processingConfig.beforeSeconds,
          afterSeconds: processingConfig.afterSeconds,
        });

        

        // 跳转到进度页面（使用后端返回的 taskId）
        navigate(`/progress/${processResp.taskId}`);
      }, {
        customMessage: '视频处理失败，请检查文件格式和网络连接后重试'
      })
    ),
    [selectedFile, processingConfig, uploadMutation, processMutation, addNotification, createTask, updateProcessingConfig, withLoading, withErrorHandling]
  );

  const isProcessing = uploadMutation.isPending || processMutation.isPending || customLoading;

  return (
    <div className="home-page min-h-screen bg-gradient-to-br from-[#F6F5F2] via-[#FAFAFA] to-[#EDEAE3]">
      {/* 全局错误提示 */}
      

      {/* 头部区域 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Title level={1} className="!mb-0 !text-3xl font-bold bg-gradient-to-r from-[#C3AED6] to-[#F7C8E0] bg-clip-text text-transparent">
                TikTok-Player
              </Title>
            </div>
            <Paragraph className="text-lg text-gray-800 max-w-2xl mx-auto">
              自动识别进球瞬间，一键生成进球集锦
            </Paragraph>
          </div>
        </div>
      </div>

      {/* 主要内容区域（纵向排布） */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 sm:w-1/2 md:w-1/2 mx-auto">
          {/* 上传组件 */}
          <Card className="shadow-sm">
            <VideoUpload onFileSelect={handleFileSelect} loading={isProcessing} progress={uploadProgress} disabled={isProcessing} />
          </Card>

          {/* 剪辑参数设置 */}
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
                {isProcessing ? '处理中...' : '开始生成进球集锦'}
              </Button>
              <div />
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
};
