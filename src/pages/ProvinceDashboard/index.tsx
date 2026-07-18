import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Space, Tag, Table } from 'antd';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../../store/AppContext';
import SchoolAnalytics from '../../components/SchoolAnalytics';
import { computeStats, computeCityStats, computeDistrictStats } from '../../store';

const { Title, Text } = Typography;

export default function ProvinceDashboard() {
  const navigate = useNavigate();
  const { data } = useAppContext();

  const stats = computeStats(data);

  // 已汇报一把手：isKeyPersonLeader === true 且 status === '已汇报'
  const keyLeaderReported = useMemo(() => {
    let n = 0;
    for (const c of data.cities)
      for (const d of c.districts)
        for (const s of d.schools)
          if (s.isKeyPersonLeader && s.status === '已汇报' && !s.seed) n++;
    return n;
  }, [data]);

  const statCards = [
    { title: 'CRM学校总数', value: stats.totalSchools, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '已合作', value: stats.cooperating, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '试用中', value: stats.trialing, icon: <ExperimentOutlined />, color: '#faad14' },
    { title: '仅汇报', value: stats.reported, icon: <FileTextOutlined />, color: '#722ed1' },
    { title: '待开发', value: stats.pending, icon: <ClockCircleOutlined />, color: '#bfbfbf' },
    { title: '已汇报一把手', value: keyLeaderReported, icon: <UserOutlined />, color: '#f97316' },
  ];

  const cityTable = data.cities.map((city) => {
    const s = computeCityStats(city);
    return {
      key: city.id,
      name: city.name,
      districts: city.districts.length,
      total: s.totalSchools,
      cooperating: s.cooperating,
      trialing: s.trialing,
      reported: s.reported,
      pending: s.pending,
    };
  });

  const districtTable = data.cities.flatMap((city) =>
    city.districts.map((d) => {
      const s = computeDistrictStats(d);
      return {
        key: `${city.id}-${d.id}`,
        cityName: city.name,
        cityId: city.id,
        districtId: d.id,
        name: d.name,
        total: s.totalSchools,
        cooperating: s.cooperating,
        trialing: s.trialing,
        reported: s.reported,
        pending: s.pending,
        isKey: d.isKey,
      };
    })
  );

  const cityColumns = [
    {
      title: '城市',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <BankOutlined style={{ color: '#1677ff' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    { title: '区县数', dataIndex: 'districts', key: 'districts', align: 'center' as const },
    { title: '学校总数', dataIndex: 'total', key: 'total', align: 'center' as const },
    { title: '已合作', dataIndex: 'cooperating', key: 'cooperating', align: 'center' as const },
    { title: '试用中', dataIndex: 'trialing', key: 'trialing', align: 'center' as const },
    { title: '仅汇报', dataIndex: 'reported', key: 'reported', align: 'center' as const },
    { title: '待开发', dataIndex: 'pending', key: 'pending', align: 'center' as const },
  ];

  const districtColumns = [
    {
      title: '区县',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: { isKey: boolean }) => (
        <Space>
          <EnvironmentOutlined />
          <Text strong>{name}</Text>
          {record.isKey && <Tag color="blue">重点</Tag>}
        </Space>
      ),
    },
    {
      title: '所属城市',
      dataIndex: 'cityName',
      key: 'cityName',
      render: (name: string) => <Tag>{name}</Tag>,
    },
    { title: '学校总数', dataIndex: 'total', key: 'total', align: 'center' as const },
    { title: '已合作', dataIndex: 'cooperating', key: 'cooperating', align: 'center' as const },
    { title: '试用中', dataIndex: 'trialing', key: 'trialing', align: 'center' as const },
    { title: '仅汇报', dataIndex: 'reported', key: 'reported', align: 'center' as const },
    { title: '待开发', dataIndex: 'pending', key: 'pending', align: 'center' as const },
  ];

  const allSchools = useMemo(
    () =>
      data.cities.flatMap((city) =>
        city.districts.flatMap((d) =>
          d.schools
            .filter((s) => !s.seed)
            .map((s) => ({ ...s, cityName: city.name, districtName: d.name }))
        )
      ),
    [data]
  );

  return (
    <div>
      {/* 返回 + 标题 */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          返回江苏省作战地图
        </Button>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          <BarChartOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          江苏省全省数据看板
        </Title>
      </div>

      {/* 全省统计卡片 */}
      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col xs={12} sm={8} md={4} key={card.title}>
            <Card
              hoverable
              size="small"
              styles={{ body: { padding: '14px 16px' } }}
              style={{
                borderRadius: 12,
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: card.color, fontSize: 18 }}>{card.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{card.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                    {card.value}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 多维数据分析 */}
      <SchoolAnalytics schools={allSchools} groupBy="city" groupLabel="城市" />

      {/* 13 市数据汇总 */}
      <Card
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BankOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>13 市数据汇总</span>
          </Space>
        }
        style={{
          marginBottom: 24,
          borderRadius: 14,
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Table
          rowKey="key"
          columns={cityColumns}
          dataSource={cityTable}
          pagination={false}
          size="middle"
          onRow={(record) => ({
            onClick: () => navigate(`/city/${record.key}`),
            style: { cursor: 'pointer' },
          })}
          style={{ borderRadius: 10 }}
        />
      </Card>

      {/* 各区县数据明细 */}
      <Card
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>各区县数据明细</span>
          </Space>
        }
        style={{
          borderRadius: 14,
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Table
          rowKey="key"
          columns={districtColumns}
          dataSource={districtTable}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 个区县`,
          }}
          size="middle"
          onRow={(record) => ({
            onClick: () => navigate(`/city/${record.cityId}/${record.districtId}`),
            style: { cursor: 'pointer' },
          })}
          style={{ borderRadius: 10 }}
        />
      </Card>
    </div>
  );
}
