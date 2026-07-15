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
        ...city.districts.map((d) => ({
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
        width={220}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
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
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Title level={5} style={{ margin: 0, whiteSpace: 'nowrap' }}>
            江苏教育CRM
          </Title>
        </div>

        {/* 菜单区 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
        </div>

        {/* 底部用户区 */}
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            padding: '12px 16px',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: user?.role === 'admin' ? '#1677ff' : '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.displayName}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
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
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            江苏省教育市场作战地图
          </Title>
          <Space>
            <Tag color="blue">{user?.displayName}</Tag>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
