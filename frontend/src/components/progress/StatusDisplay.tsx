/**
 * 状态展示组件
 */
import React from 'react';
import { Card, Row, Col, Statistic, Tag, Timeline, Alert, Space, Button } from 'antd';
import { 
  ClockCircleOutlined, 
  FileOutlined, 
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { Task, TaskStatus } from '@/types';
import { formatFileSize, formatDuration, formatTimestamp } from '@/utils';

interface StatusDisplayProps {
  task: Task;
  onRetry?: () => void;
  onViewResult?: () => void;
  retryLoading?: boolean;
  className?: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  task,
  onRetry,
  onViewResult,
  retryLoading = false,
  className = '',
}) => {
  // 获取状态标签
  const getStatusTag = (status: TaskStatus | string) => {
    const statusConfig = {
      pending: { color: 'blue', text: '等待中' },
      processing: { color: 'orange', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      failed: { color: 'red', text: '失败' },
    };

    const key = (status === 'completed' || status === 'failed' || status === 'pending')
      ? status
      : 'processing';
    const config = (statusConfig as any)[key];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 生成时间线数据
  const getTimelineItems = () => {
    const items = [
      {
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: (
          <div>
            <div className="font-medium">任务创建</div>
            <div className="text-sm text-gray-500">
              {formatTimestamp(task.created_at)}
            </div>
          </div>
        ),
      },
    ];

    if (task.status === 'processing') {
      items.push({
        color: 'orange',
        dot: <PlayCircleOutlined />,
        children: (
          <div>
            <div className="font-medium">开始处理</div>
            <div className="text-sm text-gray-500">
              当前阶段：{task.stage}
            </div>
          </div>
        ),
      });
    }

    if (task.status === 'completed') {
      items.push(
        {
          color: 'orange',
          dot: <PlayCircleOutlined />,
          children: (
            <div>
              <div className="font-medium">开始处理</div>
              <div className="text-sm text-gray-500">
                {formatTimestamp(task.updated_at)}
              </div>
            </div>
          ),
        },
        {
          color: 'green',
          dot: <CheckCircleOutlined />,
          children: (
            <div>
              <div className="font-medium">处理完成</div>
              <div className="text-sm text-gray-500">
                {task.result?.completed_at && formatTimestamp(task.result.completed_at)}
              </div>
            </div>
          ),
        }
      );
    }

    if (task.status === 'failed') {
      items.push({
        color: 'red',
        dot: <ExclamationCircleOutlined />,
        children: (
          <div>
            <div className="font-medium">处理失败</div>
            <div className="text-sm text-red-500">
              {task.error_message || '未知错误'}
            </div>
          </div>
        ),
      });
    }

    return items;
  };

  return (
    <div className={`status-display ${className}`}>
      <Row gutter={[16, 16]}>
        {/* 基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="任务信息" size="small">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">任务ID:</span>
                <span className="font-mono text-sm">{task.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">状态:</span>
                {getStatusTag(task.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">创建时间:</span>
                <span className="text-sm">{formatTimestamp(task.created_at)}</span>
              </div>
              {task.video_file && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">文件名:</span>
                    <span className="text-sm truncate max-w-32" title={task.video_file.name}>
                      {task.video_file.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">文件大小:</span>
                    <span className="text-sm">{formatFileSize(task.video_file.size)}</span>
                  </div>
                  {task.video_file.duration && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">视频时长:</span>
                      <span className="text-sm">{formatDuration(task.video_file.duration)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </Col>

        {/* 处理统计 */}
        <Col xs={24} lg={12}>
          <Card title="处理统计" size="small">
            {task.status === 'completed' && task.result ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="总投篮次数"
                    value={(task.result as any).totalShots || 0}
                    prefix={<PlayCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="成功投篮"
                    value={(task.result as any).madeShots || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="命中率"
                    value={(task.result as any).accuracy || 0}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="片段数量"
                    value={((task.result as any).timestamps || []).length}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
              </Row>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileOutlined className="text-2xl mb-2" />
                <div>处理完成后将显示统计数据</div>
              </div>
            )}
          </Card>
        </Col>

        {/* 处理时间线 */}
        <Col xs={24}>
          <Card title="处理时间线" size="small">
            <Timeline items={getTimelineItems()} />
          </Card>
        </Col>

        {/* 错误信息 */}
        {task.status === 'failed' && task.error_message && (
          <Col xs={24}>
            <Alert
              message="处理失败"
              description={task.error_message}
              type="error"
              showIcon
              action={
                onRetry && (
                  <Button 
                    size="small" 
                    danger 
                    onClick={onRetry} 
                    icon={<ReloadOutlined />}
                    loading={retryLoading}
                  >
                    重试
                  </Button>
                )
              }
            />
          </Col>
        )}

        {/* 操作按钮 */}
        {task.status === 'completed' && (
          <Col xs={24}>
            <Card size="small">
              <div className="text-center">
                <Space size="middle">
                  {task.result && (task.result as any).highlightVideo && (
                    <Button
                      type="primary"
                      size="large"
                      icon={<FileOutlined />}
                      onClick={onViewResult}
                    >
                      下载视频
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        )}

        {/* 处理配置信息（精简版） */}
        {task.config && (
          <Col xs={24}>
            <Card title="处理配置" size="small">
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={6}>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{task.config.beforeSeconds}s</div>
                    <div className="text-xs text-gray-500">进球前保留</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{task.config.afterSeconds}s</div>
                    <div className="text-xs text-gray-500">进球后保留</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};
