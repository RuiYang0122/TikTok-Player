/**
 * 视频播放器组件
 */
import React, { useRef, useState, useEffect } from 'react';
import { Card, Button, Space, Slider, message, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  PauseOutlined,
  SoundOutlined,
  MutedOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { formatDuration } from '@/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  onDownload,
  onShare,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // 初始化视频事件监听
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 控制栏自动隐藏
  useEffect(() => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    if (isPlaying && showControls) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying, showControls]);

  // 播放/暂停
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {
        message.error('视频播放失败');
      });
    }
  };

  // 跳转到指定时间
  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = time;
    setCurrentTime(time);
  };

  // 调整音量
  const changeVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  // 静音/取消静音
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 全屏/退出全屏
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      message.error('全屏操作失败');
    }
  };

  // 鼠标移动显示控制栏
  const handleMouseMove = () => {
    setShowControls(true);
  };

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 10));
        break;
      case 'ArrowRight':
        e.preventDefault();
        seekTo(Math.min(duration, currentTime + 10));
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeVolume(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeVolume(Math.max(0, volume - 0.1));
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  };

  return (
    <Card className={`video-player ${className}`} bodyStyle={{ padding: 0 }}>
      {title && (
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold mb-0">{title}</h3>
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`relative bg-black ${isFullscreen ? 'h-screen' : 'aspect-video'}`}
        onMouseMove={handleMouseMove}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* 视频元素 */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          preload="metadata"
          onClick={togglePlay}
        />

        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-lg">加载中...</div>
          </div>
        )}

        {/* 播放按钮覆盖层 */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <Button
              type="primary"
              size="large"
              shape="circle"
              icon={<PlayCircleOutlined />}
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center text-2xl"
            />
          </div>
        )}

        {/* 控制栏 */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* 进度条 */}
          <div className="mb-4">
            <Slider
              min={0}
              max={duration}
              value={currentTime}
              onChange={seekTo}
              tooltip={{
                formatter: (value) => formatDuration(value || 0),
              }}
              className="video-progress-slider"
            />
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* 播放/暂停 */}
              <Button
                type="text"
                size="large"
                icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={togglePlay}
                className="text-white hover:text-blue-400"
              />

              {/* 音量控制 */}
              <div className="flex items-center space-x-2">
                <Button
                  type="text"
                  size="large"
                  icon={isMuted || volume === 0 ? <MutedOutlined /> : <SoundOutlined />}
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400"
                />
                <div className="w-20">
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={changeVolume}
                    tooltip={{ formatter: (value) => `${Math.round((value || 0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 时间显示 */}
              <span className="text-white text-sm">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* 下载按钮 */}
              {onDownload && (
                <Tooltip title="下载视频">
                  <Button
                    type="text"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={onDownload}
                    className="text-white hover:text-blue-400"
                  />
                </Tooltip>
              )}

              {/* 分享按钮 */}
              {onShare && (
                <Tooltip title="分享视频">
                  <Button
                    type="text"
                    size="large"
                    icon={<ShareAltOutlined />}
                    onClick={onShare}
                    className="text-white hover:text-blue-400"
                  />
                </Tooltip>
              )}

              {/* 画中画 */}
              <Tooltip title="画中画">
                <Button
                  type="text"
                  size="large"
                  icon={<ExpandOutlined />}
                  onClick={() => {
                    if (videoRef.current && 'requestPictureInPicture' in videoRef.current) {
                      (videoRef.current as any).requestPictureInPicture().catch(() => {
                        message.error('画中画模式不支持');
                      });
                    }
                  }}
                  className="text-white hover:text-blue-400"
                />
              </Tooltip>

              {/* 全屏 */}
              <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
                <Button
                  type="text"
                  size="large"
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400"
                />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};