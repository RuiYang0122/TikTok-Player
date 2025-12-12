// API 类型
export * from './api';

// 应用类型
export * from './app';

// 常用类型别名
export type ID = string;
export type Timestamp = string;
export type FileSize = number;
export type Duration = number;
export type Percentage = number;

// 工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// 响应包装类型
export type AsyncResult<T> = Promise<T>;
export type MaybePromise<T> = T | Promise<T>;

// 事件处理类型
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// 组件属性类型
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// 表单字段类型
export interface FormField<T = any> {
  name: string;
  label: string;
  value: T;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// 分页类型
export interface Pagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

// 排序类型
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

// 筛选类型
export interface FilterConfig {
  field: string;
  value: any;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
}