import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // 从旧地址迁移数据
  const handleMigrateData = async () => {
    setMigrating(true);
    try {
      const existing = localStorage.getItem('jiangsu_crm_data_v3');
      if (existing) {
        Modal.confirm({
          title: '本地已有数据',
          content: '迁移操作会覆盖当前数据，是否继续？',
          okText: '确认覆盖', cancelText: '取消',
          onOk: () => doMigrate(), onCancel: () => setMigrating(false),
        });
      } else { await doMigrate(); }
    } catch { message.error('迁移失败'); setMigrating(false); }
  };

  const doMigrate = async () => {
    message.loading({ content: '正在从旧版系统拉取数据…', key: 'migrate', duration: 0 });
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://jyumei53-create.github.io/jiangsu-edu-crm/';
    document.body.appendChild(iframe);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => { document.body.removeChild(iframe); reject(new Error('连接超时')); }, 15000);
      iframe.onload = () => {
        clearTimeout(t);
        setTimeout(() => {
          try {
            const s = (iframe.contentWindow as any)?.localStorage;
            const d = s?.getItem('jiangsu_crm_data_v3');
            if (d && JSON.parse(d)?.cities) {
              localStorage.setItem('jiangsu_crm_data_v3', d);
              message.success({ content: `迁移成功！`, key: 'migrate' });
              document.body.removeChild(iframe); setMigrating(false); resolve(); return;
            }
            document.body.removeChild(iframe); reject(new Error('未读取到有效数据'));
          } catch (e) { document.body.removeChild(iframe); reject(e); }
        }, 2000);
      };
      iframe.onerror = () => { clearTimeout(t); document.body.removeChild(iframe); reject(new Error('无法连接')); };
    });
  };

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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1e40af 60%, #1e293b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,119,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          width: 420,
          borderRadius: 20,
          boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08) inset',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.97)',
        }}
        styles={{ body: { padding: '44px 36px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 30px rgba(22,119,255,0.35)',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: '0 0 6px', fontWeight: 700, color: '#111827' }}>
            江苏教育CRM
          </Title>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
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
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="用户名"
              style={{ height: 48, borderRadius: 10, fontSize: 15 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="密码"
              style={{ height: 48, borderRadius: 10, fontSize: 15 }}
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
                background: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
                border: 'none',
                boxShadow: '0 6px 20px rgba(22,119,255,0.4)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" size="small" loading={migrating} onClick={handleMigrateData}
            style={{ color: '#94a3b8', fontSize: 12 }} icon={<CloudDownloadOutlined />}>
            从旧版系统迁移数据
          </Button>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        >
          <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
            默认账号：<b style={{ color: '#334155' }}>admin / admin123</b><br />
            苏南经理：<b style={{ color: '#334155' }}>sunan / sunan123</b><br />
            苏中经理：<b style={{ color: '#334155' }}>suzhong / suzhong123</b><br />
            苏北经理：<b style={{ color: '#334155' }}>subei / subei123</b>
          </Text>
        </div>
      </Card>
    </div>
  );
}
