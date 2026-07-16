import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, AimOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/AuthContext';
import loginBg from '/bg/login-bg.jpg';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login({ username: values.username, password: values.password });
      if (result.success) {
        message.success('登录成功');
        navigate(from, { replace: true });
      } else {
        message.error(result.error || '登录失败');
      }
    } catch {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#060b14',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景图片 — 积极向上、攀登进取 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.85)',
        }}
      />

      {/* 深蓝科技遮罩 — 保持卡片可读性 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(6,11,20,0.78) 0%, rgba(10,22,45,0.65) 50%, rgba(6,11,20,0.82) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 网格背景 — 指挥中心大屏质感 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(22,119,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,119,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      {/* 底部渐变光带 — 沉稳，不抢眼 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 280,
          background: 'linear-gradient(0deg, rgba(22,119,255,0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 左上角微光 */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,119,255,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* 右侧竖线装饰 */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 1,
          height: 200,
          background: 'linear-gradient(180deg, transparent 0%, rgba(22,119,255,0.25) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 'calc(8% + 4px)',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 1,
          height: 120,
          background: 'linear-gradient(180deg, transparent 0%, rgba(22,119,255,0.15) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          width: 420,
          borderRadius: 16,
          border: '1px solid rgba(22,119,255,0.18)',
          boxShadow: '0 0 60px rgba(22,119,255,0.08), 0 8px 40px rgba(0,0,0,0.5)',
          background: 'rgba(10,15,28,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        styles={{ body: { padding: '44px 36px' } }}
      >
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)',
              border: '1px solid rgba(22,119,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 24px rgba(22,119,255,0.20)',
            }}
          >
            <AimOutlined style={{ fontSize: 28, color: '#4dabf7' }} />
          </div>
          <Title level={3} style={{ margin: '0 0 4px', fontWeight: 700, color: '#e2e8f0', letterSpacing: 1 }}>
            江苏教育CRM
          </Title>
          <Text style={{ color: '#7c8db0', fontSize: 13, letterSpacing: 2 }}>
            江苏省教育市场作战地图
          </Text>
        </div>

        <Form
          onFinish={handleSubmit}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            style={{ marginBottom: 18 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#5a7a9a' }} />}
              placeholder="用户名"
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 15,
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(22,119,255,0.20)',
                color: '#e2e8f0',
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#5a7a9a' }} />}
              placeholder="密码"
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 15,
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(22,119,255,0.20)',
                color: '#e2e8f0',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 4,
                background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
                border: '1px solid rgba(22,119,255,0.30)',
                boxShadow: '0 0 20px rgba(22,119,255,0.15)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

      </Card>
    </div>
  );
}
