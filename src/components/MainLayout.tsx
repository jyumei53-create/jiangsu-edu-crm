import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Space, Dropdown, Tag } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { getScopedDistricts } from '../store/permissions';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useAppContext();
  const { user, logout } = useAuth();

  // 区域经理只看得到自己负责的城市
  const visibleCities = user?.role === 'admin'
    ? data.cities
    : data.cities.filter((c) => user?.allowedCityIds.includes(c.id));

  // 获取当前选中的菜单 key
  const getSelectedKeys = (): string[] => {
    const path = location.pathname;
    if (path === '/') return ['/'];
    if (path === '/admin/users') return ['/admin/users'];
    const cityMatch = path.match(/^\/city\/([^/]+)(\/([^/]+))?/);
    if (cityMatch) {
      const cityId = cityMatch[1];
      const districtId = cityMatch[3];
      if (districtId) return [`/city/${cityId}/${districtId}`];
      return [`/city/${cityId}`];
    }
    return ['/'];
  };

  const getOpenKeys = (): string[] => {
    const path = location.pathname;
    const cityMatch = path.match(/^\/city\/([^/]+)/);
    if (cityMatch) return [`city-group-${cityMatch[1]}`];
    return [];
  };

  // 构建菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: user?.role === 'admin' ? '江苏省作战地图' : '作战地图',
    },
    ...visibleCities.map((city) => ({
      key: `city-group-${city.id}`,
      icon: <EnvironmentOutlined />,
      label: city.name,
      children: [
        {
          key: `/city/${city.id}`,
          icon: <EnvironmentOutlined />,
          label: `${city.name}概览`,
        },
        ...getScopedDistricts(user, city).map((d) => ({
          key: `/city/${city.id}/${d.id}`,
          icon: <EnvironmentOutlined />,
          label: d.name,
        })),
      ],
    })),
    // 管理员专属：用户管理
    ...(user?.role === 'admin'
      ? [
          {
            key: '/admin/users',
            icon: <SettingOutlined />,
            label: '用户管理',
          } as const,
        ]
      : []),
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong>{user?.displayName}</Text>
          <br />
          <Tag color={user?.role === 'admin' ? 'blue' : 'green'} style={{ marginTop: 4 }}>
            {user?.role === 'admin' ? '管理员' : '区域经理'}
          </Tag>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={230}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
        }}
        breakpoint="lg"
        collapsedWidth="60"
      >
        {/* 顶部标题 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(22,119,255,0.4)',
              }}
            >
              <DashboardOutlined style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <Title level={5} style={{ margin: 0, color: '#fff', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
              江苏教育CRM
            </Title>
          </div>
        </div>

        {/* 菜单区 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              borderRight: 0,
              background: 'transparent',
              color: 'rgba(255,255,255,0.85)',
            }}
            theme="dark"
          />
        </div>

        {/* 底部用户区 */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '14px 16px',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '8px 10px',
                borderRadius: 10,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: user?.role === 'admin'
                    ? 'linear-gradient(135deg, #1677ff, #7c3aed)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserOutlined style={{ color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.displayName}
                </div>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {user?.role === 'admin' ? '管理员' : '区域经理'}
                </Text>
              </div>
            </div>
          </Dropdown>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
            height: 56,
          }}
        >
          <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
            江苏省教育市场作战地图
          </Title>
          <Space>
            <Tag
              color="blue"
              style={{
                borderRadius: 8,
                padding: '2px 12px',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {user?.displayName}
            </Tag>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f1f5f9', overflow: 'auto', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
