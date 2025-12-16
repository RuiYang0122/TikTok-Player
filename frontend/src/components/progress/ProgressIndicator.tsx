/**
 * 进度指示器组件
 */
import React from 'react';
import { Steps, Progress, Card, Typography, Space } from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined, 
  SearchOutlined, 
  VideoCameraOutlined, 
  CheckCircleOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import type { ProcessingStage, TaskStatus } from '@/types';

const { Text, Title } = Typography;

interface ProgressIndicatorProps {
  status: TaskStatus;
  stage: ProcessingStage;
  progress: number;
  message?: string;
  currentStep?: string;
  totalSteps?: number;
  estimatedTime?: number;
  className?: string;
}

// 阶段配置
const stageConfig = {
  uploading: {
    title: '上传视频',
    icon: <UploadOutlined />,
    description: '正在上传视频文件到服务器',
    color: '#1890ff',
  },
  analyzing: {
    title: '分析视频',
    icon: <EyeOutlined />,
    description: '正在分析视频内容和结构',
    color: '#722ed1',
  },
  detecting: {
    title: '动作检测',
    icon: <SearchOutlined />,
    description: '正在识别篮球动作和精彩瞬间',
    color: '#fa8c16',
  },
  generating: {
    title: '生成高光',
    icon: <VideoCameraOutlined />,
    description: '正在生成高光视频片段',
    color: '#52c41a',
  },
  finalizing: {
    title: '最终处理',
    icon: <CheckCircleOutlined />,
    description: '最终处理完成',
    color: '#52c41a',
  },
  completed: {
    title: '处理完成',
    icon: <CheckCircleOutlined />,
    description: '视频处理已完成',
    color: '#52c41a',
  },
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  stage,
  progress,
  message,
  currentStep,
  totalSteps,
  estimatedTime,
  className = '',
}) => {
  // 获取当前阶段索引
  const getCurrentStepIndex = () => {
    const stages: ProcessingStage[] = ['uploading', 'analyzing', 'detecting', 'generating', 'finalizing', 'completed'];
    return stages.indexOf(stage);
  };

  // 生成步骤项
  const getStepsItems = () => {
    const stages: ProcessingStage[] = ['uploading', 'analyzing', 'detecting', 'generating', 'finalizing', 'completed'];
    const currentIndex = getCurrentStepIndex();

    return stages.map((stageKey, index) => {
      const config = stageConfig[stageKey];
      let stepStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';

      if (status === 'failed') {
        stepStatus = index <= currentIndex ? 'error' : 'wait';
      } else if (index < currentIndex) {
        stepStatus = 'finish';
      } else if (index === currentIndex) {
        stepStatus = status === 'completed' ? 'finish' : 'process';
      }

      return {
        title: config.title,
        description: config.description,
        icon: config.icon,
        status: stepStatus,
      };
    });
  };

  // 格式化剩余时间
  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) {
      return `约 ${Math.ceil(seconds)} 秒`;
    } else if (seconds < 3600) {
      return `约 ${Math.ceil(seconds / 60)} 分钟`;
    } else {
      return `约 ${Math.ceil(seconds / 3600)} 小时`;
    }
  };

  // 获取进度条状态
  const getProgressStatus = () => {
    if (status === 'failed') return 'exception';
    if (status === 'completed') return 'success';
    return 'active';
  };

  // 获取进度条颜色
  const getProgressColor = () => {
    if (status === 'failed') return '#ff4d4f';
    if (status === 'completed') return '#52c41a';
    return stageConfig[stage]?.color || '#1890ff';
  };

  return (
    <div className={`progress-indicator ${className}`}>
      {/* 整体进度 */}
      <Card className="mb-6">
        <div className="text-center mb-4">
          <Title level={3} className="!mb-2">
            {status === 'failed' ? '处理失败' : 
             status === 'completed' ? '处理完成' : 
             '正在处理视频'}
          </Title>
          <Text type="secondary" className="text-lg">
            {message || stageConfig[stage]?.description}
          </Text>
        </div>

        {/* 圆形进度条 */}
        <div className="flex justify-center mb-6">
          <Progress
            type="circle"
            percent={Math.round(progress)}
            status={getProgressStatus()}
            strokeColor={getProgressColor()}
            size={120}
            strokeWidth={8}
            format={(percent) => (
              <div className="text-center">
                <div className="text-2xl font-bold">{percent}%</div>
                {status === 'processing' && (
                  <div className="text-xs text-gray-500 mt-1">
                    {stageConfig[stage]?.title}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* 详细信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <Text type="secondary" className="block text-sm">当前阶段</Text>
            <Text className="font-medium">{stageConfig[stage]?.title}</Text>
          </div>
          {totalSteps && (
            <div>
              <Text type="secondary" className="block text-sm">处理步骤</Text>
              <Text className="font-medium">
                {getCurrentStepIndex() + 1} / {totalSteps}
              </Text>
            </div>
          )}
          {estimatedTime && estimatedTime > 0 && (
            <div>
              <Text type="secondary" className="block text-sm">预计剩余</Text>
              <Text className="font-medium">{formatEstimatedTime(estimatedTime)}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* 步骤指示器 */}
      <Card title="处理流程">
        <Steps
          current={getCurrentStepIndex()}
          status={status === 'failed' ? 'error' : undefined}
          items={getStepsItems()}
          direction="vertical"
          size="small"
        />

        {/* 当前步骤详情 */}
        {currentStep && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <Space>
              <LoadingOutlined className="text-blue-500" />
              <Text className="text-blue-700">{currentStep}</Text>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};
