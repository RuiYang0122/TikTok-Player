/**
 * 错误提示组件
 * 用于显示各种错误状态和提示信息
 */
import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface ErrorAlertProps {
  title?: string;
  message?: string;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  closable?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  onClose?: () => void;
  retryText?: string;
  homeText?: string;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = '操作失败',
  message = '请稍后重试或联系技术支持',
  type = 'error',
  showIcon = true,
  closable = true,
  onRetry,
  onGoHome,
  onClose,
  retryText = '重试',
  homeText = '返回首页',
  className = '',
}) => {
  const actions = [];

  if (onRetry) {
    actions.push(
      <Button
        key="retry"
        size="small"
        type={type === 'error' ? 'primary' : 'default'}
        icon={<ReloadOutlined />}
        onClick={onRetry}
      >
        {retryText}
      </Button>
    );
  }

  if (onGoHome) {
    actions.push(
      <Button
        key="home"
        size="small"
        icon={<HomeOutlined />}
        onClick={onGoHome}
      >
        {homeText}
      </Button>
    );
  }

  return (
    <Alert
      message={title}
      description={message}
      type={type}
      showIcon={showIcon}
      closable={closable}
      onClose={onClose}
      action={actions.length > 0 ? <Space>{actions}</Space> : undefined}
      className={`${className}`}
    />
  );
};

export default ErrorAlert;