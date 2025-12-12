/**
 * 全局加载组件
 * 用于显示全屏加载状态
 */
import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface GlobalLoadingProps {
  loading?: boolean;
  tip?: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  loading = true,
  tip = '加载中...',
  size = 'large',
  className = '',
}) => {
  if (!loading) return null;

  return (
    <div className={`fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Spin
          size={size}
          indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'default' ? 24 : 16 }} spin />}
          tip={tip}
        />
        <div className="mt-4 text-gray-600 text-sm">
          {tip}
        </div>
      </div>
    </div>
  );
};

export default GlobalLoading;