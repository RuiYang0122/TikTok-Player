import React from 'react';
import { Card } from 'antd';

interface ProgressLogProps {
  logs: string[];
  className?: string;
}

export const ProgressLog: React.FC<ProgressLogProps> = ({ logs, className = '' }) => {
  const items = logs.slice(-6);
  return (
    <Card title="实时日志" className={className} bodyStyle={{ padding: 0 }}>
      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm">暂无日志</div>
        ) : (
          <ul className="p-3 space-y-2">
            {items.map((line, idx) => (
              <li key={`${idx}-${line}`} className="text-sm text-gray-800">
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

