import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, AimOutlined, CloudDownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/AuthContext';
import loginBg from '/bg/login-bg.jpg';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
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

  // 从旧地址迁移数据
  const handleMigrateData = async () => {
    setMigrating(true);
    try {
      // 先检查本地是否已有数据
      const existing = localStorage.getItem('jiangsu_crm_data_v3');
      if (existing) {
        Modal.confirm({
          title: '本地已有数据',
          content: '迁移操作会覆盖当前数据（包括用户账号、学校信息等），是否继续？',
          okText: '确认覆盖',
          cancelText: '取消',
          onOk: () => doMigrate(),
        });
      } else {
        await doMigrate();
      }
    } catch {
      message.error('迁移失败');
    } finally {
      setMigrating(false);
    }
  };

  const doMigrate = async () => {
    const OLD_URL = 'https://jyumei53-create.github.io/jiangsu-edu-crm/';
    message.loading({ content: '正在连接旧版系统…', key: 'migrate', duration: 0 });
    
    try {
      // 尝试通过 fetch 获取旧版页面，利用旧版 localStorage 的数据
      // 由于跨域限制，我们改用 iframe 方案
      message.loading({ content: '正在从旧版系统拉取数据…', key: 'migrate', duration: 0 });
      
      // 方案：打开旧地址的一个隐藏 iframe，从中读取 localStorage
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = OLD_URL;
      document.body.appendChild(iframe);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          reject(new Error('连接超时，请确认旧版系统可以正常访问'));
        }, 15000);
        
        iframe.onload = () => {
          clearTimeout(timeout);
          setTimeout(() => {
            try {
              // 尝试从 iframe 中读取数据
              const iframeStorage = (iframe.contentWindow as any)?.localStorage;
              if (iframeStorage) {
                const data = iframeStorage.getItem('jiangsu_crm_data_v3');
                if (data) {
                  // 验证数据格式
                  const parsed = JSON.parse(data);
                  if (parsed && parsed.cities && parsed.version) {
                    localStorage.setItem('jiangsu_crm_data_v3', data);
                    message.success({ content: `数据迁移成功！已导入 ${parsed.cities.length} 个城市的数据`, key: 'migrate' });
                    document.body.removeChild(iframe);
                    resolve();
                    return;
                  }
                }
              }
              document.body.removeChild(iframe);
              reject(new Error('未能从旧版系统读取到有效数据'));
            } catch (e) {
              document.body.removeChild(iframe);
              reject(e);
            }
          }, 2000);
        };
        
        iframe.onerror = () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          reject(new Error('无法连接旧版系统'));
        };
      });
    } catch (e: any) {
      message.error({ content: e?.message || '迁移失败，请尝试手动迁移', key: 'migrate', duration: 5 });
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
          filter: 'brightness(1.05)',
        }}
      />

      {/* 深蓝科技遮罩 — 保持卡片可读性 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(6,11,20,0.60) 0%, rgba(10,22,45,0.45) 50%, rgba(6,11,20,0.65) 100%)',
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

        {/* 数据导出入口 */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              try {
                const payload = JSON.stringify({
                  data: localStorage.getItem('jiangsu_crm_data_v3'),
                  users: localStorage.getItem('jiangsu_crm_users'),
                  session: localStorage.getItem('jiangsu_crm_session'),
                });
                navigator.clipboard.writeText(payload).then(() => {
                  message.success('✅ 数据已复制到剪贴板！请到迁移工具页面导入');
                }).catch(() => {
                  message.warning('复制失败，请手动选择下方文本');
                });
              } catch {
                message.error('导出失败');
              }
            }}
            style={{ color: '#4dabf7', fontSize: 12, opacity: 0.8 }}
            icon={<ExportOutlined />}
          >
            一键导出数据
          </Button>
          <Button
            type="link"
            size="small"
            loading={migrating}
            onClick={handleMigrateData}
            style={{ color: '#5a7a9a', fontSize: 12, opacity: 0.7 }}
            icon={<CloudDownloadOutlined />}
          >
            从旧版系统迁移数据
          </Button>
        </div>

      </Card>
    </div>
  );
}
