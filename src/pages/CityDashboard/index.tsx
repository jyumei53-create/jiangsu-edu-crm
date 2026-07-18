import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Table,
} from 'antd';
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
import { useAuth } from '../../store/AuthContext';
import SchoolAnalytics from '../../components/SchoolAnalytics';
import { computeCityStats, computeDistrictStats } from '../../store';
import { getScopedCity } from '../../store/permissions';

const { Title, Text } = Typography;

export default function CityDashboard() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { data } = useAppContext();
  const { user } = useAuth();

  // 按区县权限过滤后的城市（区域经理仅见被分配的区县）
  const city = getScopedCity(user, cityId || '', data);

  if (!city) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={4}>城市未找到</Title>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const stats = computeCityStats(city);

  // 已汇报一把手：isKeyPersonLeader === true 且 status === '已汇报'
  const keyLeaderReported = useMemo(() => {
    let n = 0;
    for (const d of city.districts) {
      for (const s of d.schools) {
        if (s.isKeyPersonLeader && s.status === '已汇报' && !s.seed) n++;
      }
    }
    return n;
  }, [city]);

  const allSchools = useMemo(
    () =>
      city.districts.flatMap((d) =>
        d.schools
          .filter((s) => !s.seed)
          .map((s) => ({ ...s, cityName: city.name, districtName: d.name }))
      ),
    [city]
  );

  const statCards = [
    { title: 'CRM学校总数', value: stats.totalSchools, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '已合作', value: stats.cooperating, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '试用中', value: stats.trialing, icon: <ExperimentOutlined />, color: '#faad14' },
    { title: '仅汇报', value: stats.reported, icon: <FileTextOutlined />, color: '#722ed1' },
    { title: '待开发', value: stats.pending, icon: <ClockCircleOutlined />, color: '#bfbfbf' },
    { title: '已汇报一把手', value: keyLeaderReported, icon: <UserOutlined />, color: '#f97316' },
  ];

  const districtTable = city.districts.map((d) => {
    const s = computeDistrictStats(d);
    return {
      name: d.name,
      total: s.totalSchools,
      cooperating: s.cooperating,
      trialing: s.trialing,
      reported: s.reported,
      pending: s.pending,
      isKey: d.isKey,
    };
  });

  const columns = [
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
    { title: '学校总数', dataIndex: 'total', key: 'total', align: 'center' as const },
    { title: '已合作', dataIndex: 'cooperating', key: 'cooperating', align: 'center' as const },
    { title: '试用中', dataIndex: 'trialing', key: 'trialing', align: 'center' as const },
    { title: '仅汇报', dataIndex: 'reported', key: 'reported', align: 'center' as const },
    { title: '待开发', dataIndex: 'pending', key: 'pending', align: 'center' as const },
  ];

  return (
    <div>
      {/* 返回 + 标题 */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/city/${cityId}`)}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          返回{city.name}
        </Button>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          <BarChartOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          {city.name}全市数据看板
        </Title>
      </div>

      {/* 全市统计卡片 */}
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
      <SchoolAnalytics schools={allSchools} groupBy="district" groupLabel="区县" />

      {/* 区县明细表 */}
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
          rowKey="name"
          columns={columns}
          dataSource={districtTable}
          pagination={false}
          size="middle"
          onRow={(record) => ({
            onClick: () => {
              const district = city.districts.find((d) => d.name === record.name);
              if (district) navigate(`/city/${cityId}/${district.id}`);
            },
            style: { cursor: 'pointer' },
          })}
          style={{ borderRadius: 10 }}
        />
      </Card>
    </div>
  );
}
