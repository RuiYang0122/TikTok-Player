/**
 * 空状态组件
 * 用于显示各种空状态和占位内容
 */
import React from 'react';
import { Empty, Button } from 'antd';
import { 
  FileOutlined, 
  VideoCameraOutlined, 
  HistoryOutlined,
  InboxOutlined,
  SearchOutlined 
} from '@ant-design/icons';

interface EmptyStateProps {
  type?: 'default' | 'video' | 'history' | 'search' | 'upload';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  image?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  description,
  actionText,
  onAction,
  className = '',
  image,
}) => {
  const getEmptyConfig = () => {
    switch (type) {
      case 'video':
        return {
          image: <VideoCameraOutlined className="text-6xl text-gray-300" />,
          title: title || '暂无视频',
          description: description || '还没有上传任何视频文件',
          actionText: actionText || '上传视频',
        };

      case 'history':
        return {
          image: <HistoryOutlined className="text-6xl text-gray-300" />,
          title: title || '暂无历史记录',
          description: description || '还没有处理过任何视频',
          actionText: actionText || '开始处理',
        };

      case 'search':
        return {
          image: <SearchOutlined className="text-6xl text-gray-300" />,
          title: title || '未找到相关内容',
          description: description || '请尝试调整搜索条件',
          actionText: actionText || '重新搜索',
        };

      case 'upload':
        return {
          image: <InboxOutlined className="text-6xl text-gray-300" />,
          title: title || '拖拽文件到此处',
          description: description || '或点击选择文件上传',
          actionText: actionText || '选择文件',
        };

      case 'default':
      default:
        return {
          image: <FileOutlined className="text-6xl text-gray-300" />,
          title: title || '暂无数据',
          description: description || '当前没有可显示的内容',
          actionText: actionText || '刷新',
        };
    }
  };

  const config = getEmptyConfig();

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Empty
        image={image || config.image}
        description={
          <div className="text-center">
            <div className="text-lg font-medium text-gray-600 mb-2">
              {config.title}
            </div>
            <div className="text-sm text-gray-400">
              {config.description}
            </div>
          </div>
        }
      >
        {onAction && (
          <Button type="primary" onClick={onAction}>
            {config.actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;