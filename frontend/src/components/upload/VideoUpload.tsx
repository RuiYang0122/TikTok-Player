/**
 * 视频上传组件
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Button, Progress, Alert, message } from 'antd';
import { InboxOutlined, VideoCameraOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import { validateVideoFile, formatFileSize, formatDuration } from '@/utils';
import { VideoFile } from '@/types';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { Dragger } = Upload;

interface VideoUploadProps {
  onFileSelect: (file: VideoFile | null) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onFileSelect,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { error, hasError, handleError, clearError } = useErrorHandler();

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    clearError();
    setIsProcessing(true);
    
    try {
      // 验证文件
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || '文件验证失败');
      }

      // 创建预览URL
      const preview = URL.createObjectURL(file);
      
      // 获取视频时长
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const duration = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('获取视频信息超时'));
        }, 10000); // 10秒超时

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve(video.duration);
        };
        
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('无法读取视频文件，请检查文件格式'));
        };
        
        video.src = preview;
      });

      const videoFile: VideoFile = {
        file,
        preview,
        duration,
        size: file.size,
        type: file.type,
        name: file.name,
      };

      setSelectedFile(videoFile);
      setPreviewUrl(preview);
      onFileSelect(videoFile);
      
      message.success('视频文件加载成功');
      
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('处理文件时发生未知错误'));
    } finally {
      setIsProcessing(false);
    }

    return false; // 阻止默认上传行为
  }, [onFileSelect, handleError, clearError]);

  // 移除文件
  const handleRemoveFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    clearError();
    onFileSelect(null);
  }, [previewUrl, onFileSelect, clearError]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Upload 组件配置
  const uploadProps: UploadProps = {
    name: 'video',
    multiple: false,
    accept: 'video/*',
    disabled: disabled || loading || isProcessing,
    showUploadList: false,
    beforeUpload: handleFileSelect,
    onDrop: (e) => {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
  };

  return (
    <div className={`video-upload ${className}`}>
      {!selectedFile ? (
        <Dragger {...uploadProps} className="upload-zone">
          <div className="p-4 sm:p-8">
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-4xl sm:text-6xl text-primary" />
            </p>
            <p className="ant-upload-text text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              点击或拖拽上传篮球视频
            </p>
            <p className="ant-upload-hint text-gray-500 mb-4 text-sm sm:text-base">
              支持 MP4、AVI、MOV、WMV、FLV、WebM、MKV 格式
              <br />
              文件大小限制：1MB - 500MB
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-400">
              <span>• 自动检测投篮动作</span>
              <span>• 生成精彩高光</span>
              <span>• 支持多种格式</span>
            </div>
          </div>
        </Dragger>
      ) : (
        <div className="selected-file-preview bg-white rounded-lg border-2 border-dashed border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
            {/* 视频预览 */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <div className="w-full sm:w-32 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <VideoCameraOutlined className="text-white text-2xl" />
                </div>
              </div>
            </div>

            {/* 文件信息 */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-800 truncate mb-2">
                    {selectedFile.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex justify-between sm:flex-col">
                      <span>文件大小:</span>
                      <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                      <span>视频时长:</span>
                      <span className="font-medium">
                        {selectedFile.duration ? formatDuration(selectedFile.duration) : '未知'}
                      </span>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                      <span>文件格式:</span>
                      <span className="font-medium uppercase">
                        {selectedFile.name.split('.').pop() || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveFile}
                    disabled={loading}
                    className="hover:bg-red-50"
                    size="small"
                  >
                    移除
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 处理进度 */}
          {(loading || isProcessing) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {isProcessing ? '处理文件中...' : '上传中...'}
                </span>
                <span className="text-sm text-gray-500">请稍候</span>
              </div>
              <Progress
                percent={isProcessing ? 50 : 0}
                status="active"
                strokeColor={{
                  '0%': '#FF6B35',
                  '100%': '#ff8c42',
                }}
                className="mb-2"
              />
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {hasError && error && (
        <Alert
          message="文件处理错误"
          description={error.message}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mt-4"
          action={
            <Button size="small" onClick={clearError}>
              重试
            </Button>
          }
        />
      )}

      {/* 提示信息 */}
      {!selectedFile && !hasError && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <VideoCameraOutlined className="text-blue-500 text-lg mt-0.5" />
            </div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">上传提示：</p>
              <ul className="space-y-1 text-blue-600">
                <li>• 建议上传清晰度较高的篮球比赛或训练视频</li>
                <li>• 确保视频中包含明显的投篮动作</li>
                <li>• 视频时长建议在 1-30 分钟之间以获得最佳效果</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};