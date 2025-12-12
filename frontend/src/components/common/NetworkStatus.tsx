/**
 * 网络状态检测组件
 * 监控网络连接状态并显示相应提示
 */
import React, { useState, useEffect } from 'react';
import { Alert, Button } from 'antd';
import { WifiOutlined, DisconnectOutlined, ReloadOutlined } from '@ant-design/icons';

interface NetworkStatusProps {
  onRetry?: () => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始检查
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (!showOfflineAlert) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert
        message="网络连接已断开"
        description="请检查您的网络连接，然后重试"
        type="error"
        showIcon
        icon={<DisconnectOutlined />}
        action={
          <Button
            size="small"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
          >
            重试
          </Button>
        }
        closable
        onClose={() => setShowOfflineAlert(false)}
        className="shadow-lg"
      />
    </div>
  );
};

export default NetworkStatus;