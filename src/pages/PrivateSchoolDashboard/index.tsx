import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Space, Table, Tag, Statistic } from 'antd';
import {
  ArrowLeftOutlined, TeamOutlined, CheckCircleOutlined, ExperimentOutlined,
  FileTextOutlined, ClockCircleOutlined, BankOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../../store/AppContext';
import type { School, SchoolStatus } from '../../types';

const { Title, Text } = Typography;

const PRIVATE_KEYWORDS = ['私立', '民办', '国际', '外国语'];

function isPrivateSchool(school: School): boolean {
  return PRIVATE_KEYWORDS.some((kw) => school.name.includes(kw));
}

export default function PrivateSchoolDashboard() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { data } = useAppContext();
  const city = data.cities.find((c) => c.id === cityId);

  const privateData = useMemo(() => {
    if (!city) return { schools: [], total: 0, cooperating: 0, trialing: 0, reported: 0, pending: 0 };
    const schools: Array<School & { districtName: string; districtId: string }> = [];
    for (const d of city.districts) {
      for (const s of d.schools) {
        if (isPrivateSchool(s)) {
          schools.push({ ...s, districtName: d.name, districtId: d.id });
        }
      }
    }
    return {
      schools,
      total: schools.length,
      cooperating: schools.filter((s) => s.status === '已合作').length,
      trialing: schools.filter((s) => s.status === '试用中').length,
      reported: schools.filter((s) => s.status === '已汇报').length,
      pending: schools.filter((s) => s.status === '待开发').length,
    };
  }, [city]);

  const statusColor: Record<SchoolStatus, string> = {
    '已合作': 'green', '试用中': 'orange', '已汇报': 'purple', '待开发': 'default',
  };

  const productColorMap: Record<string, string> = {
    '作文': '#1677ff', '作业': '#52c41a', '通识课': '#722ed1',
    '飞象老师': '#fa8c16', '学习空间': '#13c2c2', '墨水屏': '#eb2f96',
  };

  if (!city) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={4}>城市未找到</Title>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const statCards = [
    { title: '私立/民办学校', value: privateData.total, icon: <BankOutlined />, color: '#1677ff' },
    { title: '已合作', value: privateData.cooperating, icon: <CheckCircleOutlined />, color: '#10b981' },
    { title: '试用中', value: privateData.trialing, icon: <ExperimentOutlined />, color: '#f59e0b' },
    { title: '已汇报', value: privateData.reported, icon: <FileTextOutlined />, color: '#8b5cf6' },
    { title: '待开发', value: privateData.pending, icon: <ClockCircleOutlined />, color: '#94a3b8' },
  ];

  const columns = [
    { title: '学校名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
    { title: '所属区县', dataIndex: 'districtName', key: 'district', width: 100, render: (t: string) => <Tag>{t}</Tag> },
    { title: '学段', dataIndex: 'stage', key: 'stage', width: 90, render: (t: string) => t || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 85,
      render: (s: SchoolStatus) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: '产品', dataIndex: 'products', key: 'products', width: 160,
      render: (products: string[] | undefined) => {
        if (!products || products.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space size={2} wrap>
            {products.map((p) => <Tag key={p} color={productColorMap[p] || 'default'} style={{ margin: 0, fontSize: 11 }}>{p}</Tag>)}
          </Space>
        );
      },
    },
    { title: '关键人', dataIndex: 'keyPerson', key: 'keyPerson', width: 80, render: (t: string) => t || '-' },
    { title: '所属街道', dataIndex: 'street', key: 'street', width: 110, ellipsis: true, render: (t: string) => t || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 140, ellipsis: true, render: (t: string) => t || '-' },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/city/${cityId}`)} style={{ borderRadius: 8, fontWeight: 500 }}>
          返回{city.name}
        </Button>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          <BankOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          {city.name}私立校数据看板
        </Title>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col xs={12} sm={8} md={Math.floor(24 / 5)} key={card.title}>
            <Card hoverable size="small" styles={{ body: { padding: '14px 16px' } }}
              style={{ borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: card.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: card.color, fontSize: 18 }}>{card.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{card.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{card.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title={<Space><BankOutlined style={{ color: '#1677ff' }} /><span style={{ fontWeight: 600, color: '#1e293b' }}>私立/民办学校明细</span></Space>}
        style={{ borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Table rowKey="id" columns={columns} dataSource={privateData.schools} size="middle" scroll={{ x: 1000 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 所学校` }}
          onRow={(record) => ({
            onClick: () => navigate(`/city/${cityId}/${record.districtId}`),
            style: { cursor: 'pointer' },
          })} />
      </Card>
    </div>
  );
}
