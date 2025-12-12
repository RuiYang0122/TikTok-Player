/**
 * 加载状态组件
 * 用于显示不同类型的加载状态
 */
import React from 'react';
import { Spin, Skeleton, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingStateProps {
  type?: 'spin' | 'skeleton' | 'card' | 'page';
  loading?: boolean;
  tip?: string;
  size?: 'small' | 'default' | 'large';
  children?: React.ReactNode;
  className?: string;
  rows?: number;
  avatar?: boolean;
  title?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spin',
  loading = true,
  tip = '加载中...',
  size = 'default',
  children,
  className = '',
  rows = 3,
  avatar = false,
  title = true,
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  if (!loading) {
    return null;
  }

  const renderLoading = () => {
    switch (type) {
      case 'skeleton':
        return (
          <Skeleton
            active
            avatar={avatar}
            title={title}
            paragraph={{ rows }}
            className={className}
          />
        );

      case 'card':
        return (
          <Card className={className}>
            <Skeleton
              active
              avatar={avatar}
              title={title}
              paragraph={{ rows }}
            />
          </Card>
        );

      case 'page':
        return (
          <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
            <div className="text-center">
              <Spin
                size={size}
                indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                tip={tip}
              />
              <div className="mt-4 text-gray-600">
                {tip}
              </div>
            </div>
          </div>
        );

      case 'spin':
      default:
        return (
          <div className={`flex items-center justify-center p-8 ${className}`}>
            <Spin
              size={size}
              indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24 }} spin />}
              tip={tip}
            />
          </div>
        );
    }
  };

  return renderLoading();
};

export default LoadingState;