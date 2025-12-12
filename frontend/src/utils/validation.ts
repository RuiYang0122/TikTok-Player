/**
 * 验证工具函数
 */

// 支持的视频格式
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/mkv'
];

// 支持的视频扩展名
export const SUPPORTED_VIDEO_EXTENSIONS = [
  'mp4',
  'avi',
  'mov',
  'wmv',
  'flv',
  'webm',
  'mkv'
];

// 最大文件大小（500MB）
export const MAX_FILE_SIZE = 500 * 1024 * 1024;

// 最小文件大小（1MB）
export const MIN_FILE_SIZE = 1024 * 1024;

// 验证视频文件
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  // 检查文件是否存在
  if (!file) {
    return { valid: false, error: '请选择一个文件' };
  }
  
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `文件大小不能超过 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` };
  }
  
  if (file.size < MIN_FILE_SIZE) {
    return { valid: false, error: `文件大小不能小于 ${Math.round(MIN_FILE_SIZE / 1024 / 1024)}MB` };
  }
  
  // 检查文件类型
  const isValidType = SUPPORTED_VIDEO_FORMATS.includes(file.type);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = fileExtension && SUPPORTED_VIDEO_EXTENSIONS.includes(fileExtension);
  
  if (!isValidType && !isValidExtension) {
    return { 
      valid: false, 
      error: `不支持的文件格式。支持的格式：${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}` 
    };
  }
  
  return { valid: true };
};

// 验证处理配置
export const validateProcessingConfig = (config: {
  confidence_threshold: number;
  min_shot_duration: number;
  max_highlight_duration: number;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // 验证置信度阈值
  if (config.confidence_threshold < 0 || config.confidence_threshold > 1) {
    errors.confidence_threshold = '置信度阈值必须在 0 到 1 之间';
  }
  
  // 验证最小投篮持续时间
  if (config.min_shot_duration < 0.1 || config.min_shot_duration > 10) {
    errors.min_shot_duration = '最小投篮持续时间必须在 0.1 到 10 秒之间';
  }
  
  // 验证最大高光持续时间
  if (config.max_highlight_duration < 10 || config.max_highlight_duration > 600) {
    errors.max_highlight_duration = '最大高光持续时间必须在 10 到 600 秒之间';
  }
  
  // 验证逻辑关系
  if (config.max_highlight_duration < config.min_shot_duration * 2) {
    errors.max_highlight_duration = '最大高光持续时间应该至少是最小投篮持续时间的两倍';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// 验证任务ID
export const validateTaskId = (taskId: string): boolean => {
  return /^[a-zA-Z0-9-_]{8,64}$/.test(taskId);
};

// 验证文件名
export const validateFileName = (fileName: string): boolean => {
  // 检查文件名长度
  if (fileName.length < 1 || fileName.length > 255) {
    return false;
  }
  
  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  return !invalidChars.test(fileName);
};

// 验证URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 验证邮箱
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证手机号
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 通用必填验证
export const validateRequired = (value: any, fieldName: string): { valid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName}不能为空` };
  }
  return { valid: true };
};

// 数字范围验证
export const validateNumberRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): { valid: boolean; error?: string } => {
  if (isNaN(value)) {
    return { valid: false, error: `${fieldName}必须是数字` };
  }
  
  if (value < min || value > max) {
    return { valid: false, error: `${fieldName}必须在 ${min} 到 ${max} 之间` };
  }
  
  return { valid: true };
};