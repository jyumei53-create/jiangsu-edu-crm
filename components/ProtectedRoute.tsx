import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../store/AuthContext';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedCityIds?: string[];
}

/** 路由守卫：未登录跳转登录页，adminOnly 限制管理员 */
export default function ProtectedRoute({ children, adminOnly, allowedCityIds }: Props) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 管理员专属页面
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 区域经理城市权限检查（如果传入了 allowedCityIds）
  if (allowedCityIds && user.role === 'manager') {
    const hasAccess = allowedCityIds.some((id) => user.allowedCityIds.includes(id));
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
