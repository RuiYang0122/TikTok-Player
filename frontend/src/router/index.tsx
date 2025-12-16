/**
 * 路由配置
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Home } from '@/pages/Home';
import { Progress } from '@/pages/Progress';
import { Result } from '@/pages/Result';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'progress/:fileId',
        element: <Progress />,
      },
      {
        path: 'result/:fileId',
        element: <Result />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
