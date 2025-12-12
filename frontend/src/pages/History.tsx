/**
 * 历史记录页面
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Tooltip,
  Dropdown,
  Progress,
  Empty,
} from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table';
import {
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app';
import { taskService } from '@/services/api';
import { Task, TaskStatus } from '@/types';
import { formatDuration, formatFileSize, formatTimestamp } from '@/utils';

const { RangePicker } = DatePicker;
const { Option } = Select;

export const History: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useAppStore();
  
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);

  // 获取任务列表
  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tasks', { search: searchText, status: statusFilter, dateRange }],
    queryFn: () => taskService.getTasks({
      search: searchText || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
      end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
    }),
  });

  // 删除任务
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => 
      Promise.all(ids.map(id => taskService.deleteTask(id))),
    onSuccess: (_, ids) => {
      message.success(`已删除 ${ids.length} 个任务`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedRowKeys([]);
      setDeleteModalVisible(false);
      setBatchDeleteModalVisible(false);
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 获取状态标签
  const getStatusTag = (status: TaskStatus) => {
    const statusConfig = {
      pending: { color: 'blue', text: '等待中' },
      processing: { color: 'orange', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      failed: { color: 'red', text: '失败' },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: Task) => (
        <div>
          <div className="font-medium">
            {name || `任务 ${record.id.slice(0, 8)}`}
          </div>
          {record.video_file && (
            <div className="text-sm text-gray-500">
              {record.video_file.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus, record: Task) => (
        <div>
          {getStatusTag(status)}
          {status === 'processing' && record.progress !== undefined && (
            <Progress
              percent={record.progress}
              size="small"
              className="mt-1"
              showInfo={false}
            />
          )}
        </div>
      ),
      filters: [
        { text: '等待中', value: 'pending' },
        { text: '处理中', value: 'processing' },
        { text: '已完成', value: 'completed' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '统计信息',
      key: 'stats',
      width: 200,
      render: (_, record: Task) => {
        if (record.status === 'completed' && record.result?.stats) {
          const { stats } = record.result;
          return (
            <div className="text-sm">
              <div>投篮: {stats.total_shots} 次</div>
              <div>命中率: {stats.accuracy_rate.toFixed(1)}%</div>
              <div>时长: {formatDuration(stats.highlight_duration)}</div>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: '文件信息',
      key: 'file',
      width: 150,
      render: (_, record: Task) => {
        if (record.video_file) {
          return (
            <div className="text-sm">
              <div>大小: {formatFileSize(record.video_file.size)}</div>
              {record.video_file.duration && (
                <div>时长: {formatDuration(record.video_file.duration)}</div>
              )}
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => (
        <div className="text-sm">
          {formatTimestamp(date)}
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: Task) => (
        <Space size="small">
          {record.status === 'processing' && (
            <Tooltip title="查看进度">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => navigate(`/progress/${record.id}`)}
              />
            </Tooltip>
          )}
          {record.status === 'completed' && (
            <Tooltip title="查看结果">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/result/${record.id}`)}
              />
            </Tooltip>
          )}
          {record.status === 'completed' && record.result?.download_url && (
            <Tooltip title="下载视频">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = record.result!.download_url;
                  link.download = record.result!.output_file?.name || 'highlight.mp4';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              />
            </Tooltip>
          )}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'reprocess',
                  label: '重新处理',
                  icon: <ReloadOutlined />,
                  onClick: () => navigate('/', { state: { reprocessTask: record } }),
                },
                {
                  key: 'delete',
                  label: '删除',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => {
                    setSelectedRowKeys([record.id]);
                    setDeleteModalVisible(true);
                  },
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection: TableRowSelection<Task> = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: Task) => ({
      disabled: record.status === 'processing',
    }),
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的任务');
      return;
    }
    setBatchDeleteModalVisible(true);
  };

  // 确认删除
  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedRowKeys as string[]);
  };

  // 导出数据
  const handleExport = () => {
    const exportData = tasks
      .filter(task => selectedRowKeys.length === 0 || selectedRowKeys.includes(task.id))
      .map(task => ({
        任务名称: task.name || `任务 ${task.id.slice(0, 8)}`,
        状态: task.status,
        创建时间: formatTimestamp(task.created_at),
        文件名: task.video_file?.name || '-',
        文件大小: task.video_file ? formatFileSize(task.video_file.size) : '-',
        投篮次数: task.result?.stats.total_shots || '-',
        命中率: task.result?.stats.accuracy_rate ? `${task.result.stats.accuracy_rate.toFixed(1)}%` : '-',
        高光时长: task.result?.stats.highlight_duration ? formatDuration(task.result.stats.highlight_duration) : '-',
      }));

    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `basketball-highlights-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('数据导出成功');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                历史记录
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                管理和查看所有视频处理任务
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<ImportOutlined />}
                onClick={() => navigate('/')}
                size="small"
                className="sm:size-default"
              >
                <span className="hidden sm:inline">新建任务</span>
                <span className="sm:hidden">新建</span>
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                disabled={tasks.length === 0}
                size="small"
                className="sm:size-default"
              >
                <span className="hidden sm:inline">导出数据</span>
                <span className="sm:hidden">导出</span>
              </Button>
            </div>
          </div>

          {/* 筛选工具栏 */}
          <Card size="small">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Input.Search
                  placeholder="搜索任务名称或文件名"
                  allowClear
                  className="w-full sm:w-80"
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                />
                
                <Select
                  placeholder="状态筛选"
                  className="w-full sm:w-32"
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="all">全部状态</Option>
                  <Option value="pending">等待中</Option>
                  <Option value="processing">处理中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="failed">失败</Option>
                </Select>

                <RangePicker
                  placeholder={['开始日期', '结束日期']}
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full sm:w-auto"
                />

                <Button
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setStatusFilter('all');
                    setDateRange(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">清除筛选</span>
                  <span className="sm:hidden">清除</span>
                </Button>
              </div>

              {selectedRowKeys.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600">
                    已选择 {selectedRowKeys.length} 项
                  </span>
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                  >
                    批量删除
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 任务列表 */}
        <Card>
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              rowSelection={rowSelection}
              loading={isLoading}
              scroll={{ x: 800 }}
              pagination={{
                total: tasks.length,
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                responsive: true,
              }}
              locale={{
                emptyText: (
                  <Empty
                    description="暂无任务记录"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={() => navigate('/')}>
                      创建第一个任务
                    </Button>
                  </Empty>
                ),
              }}
            />
          </div>
        </Card>

        {/* 删除确认模态框 */}
        <Modal
          title="确认删除"
          open={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          onOk={handleDeleteConfirm}
          confirmLoading={deleteMutation.isPending}
          okText="删除"
          okType="danger"
          cancelText="取消"
        >
          <p>确定要删除选中的任务吗？此操作不可撤销。</p>
        </Modal>

        {/* 批量删除确认模态框 */}
        <Modal
          title="批量删除确认"
          open={batchDeleteModalVisible}
          onCancel={() => setBatchDeleteModalVisible(false)}
          onOk={handleDeleteConfirm}
          confirmLoading={deleteMutation.isPending}
          okText="删除"
          okType="danger"
          cancelText="取消"
        >
          <p>确定要删除选中的 {selectedRowKeys.length} 个任务吗？此操作不可撤销。</p>
        </Modal>
      </div>
    </div>
  );
};