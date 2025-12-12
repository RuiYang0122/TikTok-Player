/**
 * 参数设置面板组件
 */
import React from 'react';
import { Card, Form, Slider, Switch, Select, InputNumber, Tooltip, Divider } from 'antd';
import { QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { ProcessingConfig } from '@/types';

const { Option } = Select;

interface ConfigPanelProps {
  config: ProcessingConfig;
  onChange: (config: ProcessingConfig) => void;
  disabled?: boolean;
  className?: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [form] = Form.useForm();

  // 处理配置变更
  const handleConfigChange = (field: keyof ProcessingConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
  };

  // 重置为默认配置
  const resetToDefaults = () => {
    const defaultConfig: ProcessingConfig = {
      sensitivity: 0.7,
      minDuration: 2,
      maxDuration: 10,
      outputFormat: 'mp4',
      quality: 'high',
      includeSlowMotion: true,
      autoEnhance: true,
      detectShots: true,
      detectDunks: true,
      detectPasses: false,
      detectDefense: false,
    };
    onChange(defaultConfig);
    form.setFieldsValue(defaultConfig);
  };

  return (
    <Card
      title={
        <div className="flex items-center space-x-2">
          <SettingOutlined className="text-primary" />
          <span>处理参数设置</span>
        </div>
      }
      extra={
        <button
          onClick={resetToDefaults}
          disabled={disabled}
          className="text-sm text-primary hover:text-primary-dark disabled:text-gray-400"
        >
          重置默认
        </button>
      }
      className={`config-panel ${className}`}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        disabled={disabled}
      >
        {/* 检测灵敏度 */}
        <Form.Item
          label={
            <div className="flex items-center space-x-1">
              <span>检测灵敏度</span>
              <Tooltip title="调整动作检测的敏感程度，数值越高检测越严格">
                <QuestionCircleOutlined className="text-gray-400" />
              </Tooltip>
            </div>
          }
        >
          <div className="px-2">
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={config.sensitivity}
              onChange={(value) => handleConfigChange('sensitivity', value)}
              marks={{
                0.1: '宽松',
                0.5: '中等',
                0.9: '严格',
              }}
              tooltip={{
                formatter: (value) => `${(value! * 100).toFixed(0)}%`,
              }}
            />
          </div>
        </Form.Item>

        {/* 高光片段时长 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            label={
              <div className="flex items-center space-x-1">
                <span>最短时长</span>
                <Tooltip title="单个高光片段的最短持续时间">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
            }
          >
            <InputNumber
              min={1}
              max={30}
              value={config.minDuration}
              onChange={(value) => handleConfigChange('minDuration', value || 2)}
              addonAfter="秒"
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="flex items-center space-x-1">
                <span>最长时长</span>
                <Tooltip title="单个高光片段的最长持续时间">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
            }
          >
            <InputNumber
              min={5}
              max={60}
              value={config.maxDuration}
              onChange={(value) => handleConfigChange('maxDuration', value || 10)}
              addonAfter="秒"
              className="w-full"
            />
          </Form.Item>
        </div>

        {/* 输出设置 */}
        <Divider orientation="left" className="text-sm text-gray-600">
          输出设置
        </Divider>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item label="输出格式">
            <Select
              value={config.outputFormat}
              onChange={(value) => handleConfigChange('outputFormat', value)}
            >
              <Option value="mp4">MP4 (推荐)</Option>
              <Option value="avi">AVI</Option>
              <Option value="mov">MOV</Option>
              <Option value="webm">WebM</Option>
            </Select>
          </Form.Item>

          <Form.Item label="视频质量">
            <Select
              value={config.quality}
              onChange={(value) => handleConfigChange('quality', value)}
            >
              <Option value="low">标清 (480p)</Option>
              <Option value="medium">高清 (720p)</Option>
              <Option value="high">超清 (1080p)</Option>
              <Option value="ultra">4K (2160p)</Option>
            </Select>
          </Form.Item>
        </div>

        {/* 增强功能 */}
        <Divider orientation="left" className="text-sm text-gray-600">
          增强功能
        </Divider>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>慢动作回放</span>
              <Tooltip title="为精彩动作添加慢动作效果">
                <QuestionCircleOutlined className="text-gray-400" />
              </Tooltip>
            </div>
            <Switch
              checked={config.includeSlowMotion}
              onChange={(checked) => handleConfigChange('includeSlowMotion', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>自动增强</span>
              <Tooltip title="自动调整亮度、对比度和色彩">
                <QuestionCircleOutlined className="text-gray-400" />
              </Tooltip>
            </div>
            <Switch
              checked={config.autoEnhance}
              onChange={(checked) => handleConfigChange('autoEnhance', checked)}
            />
          </div>
        </div>

        {/* 动作检测 */}
        <Divider orientation="left" className="text-sm text-gray-600">
          动作检测
        </Divider>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>投篮动作</span>
                <Tooltip title="检测投篮、三分球等得分动作">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
              <Switch
                checked={config.detectShots}
                onChange={(checked) => handleConfigChange('detectShots', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>扣篮动作</span>
                <Tooltip title="检测扣篮、暴扣等精彩动作">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
              <Switch
                checked={config.detectDunks}
                onChange={(checked) => handleConfigChange('detectDunks', checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>传球配合</span>
                <Tooltip title="检测精彩传球和助攻">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
              <Switch
                checked={config.detectPasses}
                onChange={(checked) => handleConfigChange('detectPasses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>防守动作</span>
                <Tooltip title="检测抢断、盖帽等防守动作">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
              <Switch
                checked={config.detectDefense}
                onChange={(checked) => handleConfigChange('detectDefense', checked)}
              />
            </div>
          </div>
        </div>

        {/* 预设配置 */}
        <Divider orientation="left" className="text-sm text-gray-600">
          快速预设
        </Divider>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange({
              ...config,
              sensitivity: 0.8,
              detectShots: true,
              detectDunks: true,
              detectPasses: false,
              detectDefense: false,
              includeSlowMotion: true,
            })}
            disabled={disabled}
            className="px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            得分集锦
          </button>

          <button
            type="button"
            onClick={() => onChange({
              ...config,
              sensitivity: 0.6,
              detectShots: true,
              detectDunks: true,
              detectPasses: true,
              detectDefense: true,
              includeSlowMotion: false,
            })}
            disabled={disabled}
            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            全场精彩
          </button>

          <button
            type="button"
            onClick={() => onChange({
              ...config,
              sensitivity: 0.9,
              detectShots: true,
              detectDunks: false,
              detectPasses: false,
              detectDefense: false,
              includeSlowMotion: true,
            })}
            disabled={disabled}
            className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            投篮专辑
          </button>
        </div>
      </Form>
    </Card>
  );
};