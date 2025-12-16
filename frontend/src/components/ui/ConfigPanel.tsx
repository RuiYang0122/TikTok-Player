/**
 * 参数设置面板组件
 */
import React from 'react';
import { Card, Form, Tooltip, Slider } from 'antd';
import { QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import type { ProcessingConfig } from '@/types';

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
  const handleConfigChange = (field: keyof ProcessingConfig, value: number) => {
    const newConfig = { ...config, [field]: value };
    onChange(newConfig);
  };

  // 重置为默认配置
  const resetToDefaults = () => {
    const defaultConfig: ProcessingConfig = {
      beforeSeconds: 3,
      afterSeconds: 1,
    };
    onChange(defaultConfig);
    form.setFieldsValue(defaultConfig);
  };

  return (
    <Card
      title={
        <div className="flex items-center space-x-2">
          <SettingOutlined className="text-primary" />
          <span>剪辑参数设置</span>
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
        <div className="grid grid-cols-1 gap-4">
          <Form.Item
            label={
              <div className="flex items-center space-x-1">
                <span>进球前保留时间</span>
                <Tooltip title="保留进球发生前几秒的画面">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
            }
          >
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Slider
                  min={1}
                  max={15}
                  step={0.5}
                  value={config.beforeSeconds}
                  tooltip={{ formatter: (v) => `${(v ?? 0).toFixed(1)}秒` }}
                  onChange={(value) => handleConfigChange('beforeSeconds', Number(value))}
                />
              </div>
              <div className="px-3 py-1 rounded bg-[#F0EFEA] border border-[#D8DAD3] text-[#8AA29E]">
                {(config.beforeSeconds || 0).toFixed(1)}s
              </div>
            </div>
          </Form.Item>

          <Form.Item
            label={
              <div className="flex items-center space-x-1">
                <span>进球后保留时间</span>
                <Tooltip title="保留进球发生后几秒的画面">
                  <QuestionCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
            }
          >
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={config.afterSeconds}
                  tooltip={{ formatter: (v) => `${(v ?? 0).toFixed(1)}秒` }}
                  onChange={(value) => handleConfigChange('afterSeconds', Number(value))}
                />
              </div>
              <div className="px-3 py-1 rounded bg-[#F0EFEA] border border-[#D8DAD3] text-[#7FB77E]">
                {(config.afterSeconds || 0).toFixed(1)}s
              </div>
            </div>
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
};
