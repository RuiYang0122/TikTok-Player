/**
 * 格式化工具函数
 */

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 格式化持续时间（秒转换为 mm:ss 格式）
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 格式化百分比
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// 格式化时间戳
export const formatTimestamp = (timestamp: string | Date, format: 'full' | 'date' | 'time' | 'relative' = 'full'): string => {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return '无效时间';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('zh-CN');
    
    case 'time':
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    
    case 'relative':
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      if (seconds > 0) return `${seconds}秒前`;
      return '刚刚';
    
    case 'full':
    default:
      return date.toLocaleString('zh-CN');
  }
};

// 格式化处理时间（毫秒转换为可读格式）
export const formatProcessingTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  return `${seconds}s`;
};

// 格式化数字（添加千分位分隔符）
export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

// 截断文本
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// 格式化文件名（移除扩展名）
export const formatFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
};

// 获取文件扩展名
export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : '';
};