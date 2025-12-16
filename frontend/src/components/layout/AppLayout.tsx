import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

export const AppLayout: React.FC = () => {

  return (
    <Layout className="min-h-screen">
      <Content className="p-6 min-h-screen">
        <Outlet />
      </Content>
    </Layout>
  );
};
