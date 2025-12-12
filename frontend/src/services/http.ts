/**
 * HTTP 客户端配置
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '@/utils/constants';
import type { ApiResponse } from '@/types';

// 创建 axios 实例
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 添加请求时间戳
      config.metadata = { startTime: Date.now() };
      
      // 如果是文件上传，设置正确的 Content-Type
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }
      
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const duration = Date.now() - (response.config.metadata?.startTime || 0);
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
      
      return response;
    },
    (error: AxiosError) => {
      const duration = Date.now() - (error.config?.metadata?.startTime || 0);
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error);
      
      return Promise.reject(handleApiError(error));
    }
  );

  return client;
};

// 错误处理函数
const handleApiError = (error: AxiosError): Error => {
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    const message = (data as any)?.message || (data as any)?.error || ERROR_MESSAGES.UNKNOWN_ERROR;
    
    switch (status) {
      case 400:
        return new Error(message || '请求参数错误');
      case 401:
        return new Error('未授权访问');
      case 403:
        return new Error('访问被拒绝');
      case 404:
        return new Error('请求的资源不存在');
      case 413:
        return new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
      case 422:
        return new Error(message || '请求数据验证失败');
      case 429:
        return new Error('请求过于频繁，请稍后再试');
      case 500:
        return new Error('服务器内部错误');
      case 502:
        return new Error('网关错误');
      case 503:
        return new Error('服务暂时不可用');
      case 504:
        return new Error('网关超时');
      default:
        return new Error(message || `服务器错误 (${status})`);
    }
  } else if (error.request) {
    // 网络错误
    if (error.code === 'ECONNABORTED') {
      return new Error('请求超时，请检查网络连接');
    }
    return new Error(ERROR_MESSAGES.NETWORK_ERROR);
  } else {
    // 其他错误
    return new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
  }
};

// 创建 HTTP 客户端实例
export const httpClient = createHttpClient();

// 通用请求方法
export class HttpService {
  // GET 请求
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.get(url, config);
    return response.data;
  }

  // POST 请求
  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.post(url, data, config);
    return response.data;
  }

  // PUT 请求
  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.put(url, data, config);
    return response.data;
  }

  // DELETE 请求
  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.delete(url, config);
    return response.data;
  }

  // 文件上传
  static async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }

  // 文件下载
  static async download(
    url: string,
    filename?: string,
    onDownloadProgress?: (progressEvent: any) => void
  ): Promise<Blob> {
    const response = await httpClient.get(url, {
      responseType: 'blob',
      onDownloadProgress,
    });
    
    // 如果提供了文件名，自动下载
    if (filename) {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }
    
    return response.data;
  }
}

// 重试机制
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = API_CONFIG.RETRY_ATTEMPTS,
  delay: number = API_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // 指数退避
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.warn(`请求失败，${waitTime}ms 后重试 (${attempt}/${maxAttempts}):`, error);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};

// 扩展 AxiosRequestConfig 类型以支持 metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}