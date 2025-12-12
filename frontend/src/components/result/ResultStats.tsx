/**
 * 结果统计组件
 */
import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Timeline, Divider } from 'antd';
import {
  TrophyOutlined,
  TargetOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  FireOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { DetectionStats, ProcessingResult } from '@/types';
import { formatDuration, formatFileSize } from '@/utils';

interface ResultStatsProps {
  result: ProcessingResult;
  className?: string;
}

export const ResultStats: React.FC<ResultStatsProps> = ({
  result,
  className = '',
}) => {
  const { stats, highlights, processing_time, output_file } = result;

  // 计算命中率颜色
  const getAccuracyColor = (rate: number) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 60) return '#faad14';
    return '#ff4d4f';
  };

  // 生成高光时间线
  const getHighlightTimeline = () => {
    if (!highlights || highlights.length === 0) {
      return [];
    }

    return highlights.slice(0, 5).map((highlight, index) => ({
      color: highlight.type === 'shot' ? 'orange' : 
             highlight.type === 'dunk' ? 'red' : 
             highlight.type === 'pass' ? 'blue' : 'green',
      children: (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Tag color={
              highlight.type === 'shot' ? 'orange' : 
              highlight.type === 'dunk' ? 'red' : 
              highlight.type === 'pass' ? 'blue' : 'green'
            }>
              {highlight.type === 'shot' ? '投篮' :
               highlight.type === 'dunk' ? '扣篮' :
               highlight.type === 'pass' ? '传球' : '防守'}
            </Tag>
            <span className="font-medium">
              {formatDuration(highlight.start_time)} - {formatDuration(highlight.end_time)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            置信度: {(highlight.confidence * 100).toFixed(1)}%
          </div>
          {highlight.description && (
            <div className="text-sm text-gray-500 mt-1">
              {highlight.description}
            </div>
          )}
        </div>
      ),
    }));
  };

  return (
    <div className={`result-stats ${className}`}>
      <Row gutter={[16, 16]}>
        {/* 核心统计数据 */}
        <Col xs={24} lg={16}>
          <Card title="检测统计" className="h-full">
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="总投篮次数"
                  value={stats.total_shots}
                  prefix={<TargetOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="成功投篮"
                  value={stats.successful_shots}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="命中率"
                  value={stats.accuracy_rate}
                  precision={1}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: getAccuracyColor(stats.accuracy_rate) }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="高光时长"
                  value={stats.highlight_duration}
                  precision={1}
                  suffix="秒"
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            <Divider />

            {/* 详细统计 */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">投篮命中率</span>
                    <span className="font-semibold">{stats.accuracy_rate.toFixed(1)}%</span>
                  </div>
                  <Progress
                    percent={stats.accuracy_rate}
                    strokeColor={getAccuracyColor(stats.accuracy_rate)}
                    showInfo={false}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">高光占比</span>
                    <span className="font-semibold">
                      {((stats.highlight_duration / (output_file?.duration || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    percent={(stats.highlight_duration / (output_file?.duration || 1)) * 100}
                    strokeColor="#722ed1"
                    showInfo={false}
                  />
                </div>
              </Col>
            </Row>

            {/* 动作类型统计 */}
            {(stats.shots_made > 0 || stats.dunks_made > 0 || stats.assists_made > 0 || stats.steals_made > 0) && (
              <>
                <Divider />
                <Row gutter={16}>
                  {stats.shots_made > 0 && (
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="投篮得分"
                        value={stats.shots_made}
                        prefix={<TargetOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Col>
                  )}
                  {stats.dunks_made > 0 && (
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="扣篮次数"
                        value={stats.dunks_made}
                        prefix={<FireOutlined />}
                        valueStyle={{ color: '#f5222d' }}
                      />
                    </Col>
                  )}
                  {stats.assists_made > 0 && (
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="助攻次数"
                        value={stats.assists_made}
                        prefix={<ThunderboltOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                  )}
                  {stats.steals_made > 0 && (
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="抢断次数"
                        value={stats.steals_made}
                        prefix={<EyeOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  )}
                </Row>
              </>
            )}
          </Card>
        </Col>

        {/* 处理信息 */}
        <Col xs={24} lg={8}>
          <Card title="处理信息" className="h-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">处理时长:</span>
                <span className="font-semibold">
                  <ClockCircleOutlined className="mr-1" />
                  {formatDuration(processing_time)}
                </span>
              </div>
              
              {output_file && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">输出文件:</span>
                    <span className="font-semibold">{output_file.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">文件大小:</span>
                    <span className="font-semibold">{formatFileSize(output_file.size)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">视频时长:</span>
                    <span className="font-semibold">{formatDuration(output_file.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">分辨率:</span>
                    <span className="font-semibold">{output_file.resolution}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">帧率:</span>
                    <span className="font-semibold">{output_file.fps} FPS</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600">完成时间:</span>
                <span className="font-semibold">
                  {new Date(result.completed_at).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </Col>

        {/* 高光时间线 */}
        {highlights && highlights.length > 0 && (
          <Col xs={24}>
            <Card title={`高光片段 (${highlights.length}个)`}>
              <Timeline items={getHighlightTimeline()} />
              {highlights.length > 5 && (
                <div className="text-center text-gray-500 mt-4">
                  还有 {highlights.length - 5} 个高光片段...
                </div>
              )}
            </Card>
          </Col>
        )}

        {/* 性能指标 */}
        <Col xs={24}>
          <Card title="性能指标">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {(stats.total_shots / (processing_time / 60)).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">检测速度 (次/分钟)</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {((stats.highlight_duration / (output_file?.duration || 1)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">精彩度</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {highlights ? (highlights.reduce((sum, h) => sum + h.confidence, 0) / highlights.length * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">平均置信度</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};