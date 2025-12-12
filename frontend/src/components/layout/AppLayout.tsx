import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Badge, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuOutlined,
  HomeOutlined,
  HistoryOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/app';

const { Header, Content, Sider } = Layout;

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, settings } = useAppStore();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = React.useState(false);

  // 侧边栏菜单项
  const sidebarItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  // 通知菜单
  const notificationMenuItems: MenuProps['items'] = notifications.slice(0, 5).map((notification, index) => ({
    key: `notification-${index}`,
    label: (
      <div className="max-w-xs">
        <div className="font-medium text-sm">{notification.title}</div>
        <div className="text-xs text-gray-500 truncate">{notification.message}</div>
      </div>
    ),
  }));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout className="min-h-screen">
      {/* 桌面端侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="hidden lg:block"
        theme="light"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <VideoCameraOutlined className="text-white text-lg" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                篮球高光
              </span>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={sidebarItems}
          onClick={handleMenuClick}
          className="border-r-0"
        />
      </Sider>

      <Layout>
        {/* 顶部导航栏 */}
        <Header className="bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between">
          {/* 左侧：移动端菜单按钮和Logo */}
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
              className="lg:hidden"
            />
            <div className="lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <VideoCameraOutlined className="text-white text-lg" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                篮球高光
              </span>
            </div>
          </div>

          {/* 右侧：通知和用户菜单 */}
          <Space size="middle">
            {/* 通知 */}
            <Dropdown
              menu={{ items: notificationMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" className="flex items-center">
                <Badge count={unreadCount} size="small">
                  <BellOutlined className="text-lg" />
                </Badge>
              </Button>
            </Dropdown>

            {/* 用户菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" className="flex items-center space-x-2 px-2">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="hidden sm:inline">用户</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* 移动端菜单 */}
        {mobileMenuVisible && (
          <div className="lg:hidden bg-white border-b border-gray-200">
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={sidebarItems}
              onClick={handleMenuClick}
              className="border-b-0"
            />
          </div>
        )}

        {/* 主要内容区域 */}
        <Content className="p-6 bg-gray-50 min-h-screen">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};