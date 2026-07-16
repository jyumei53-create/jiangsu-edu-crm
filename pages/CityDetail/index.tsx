import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Statistic, Button, Typography, Spin, Empty } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../../store/AppContext';
import { computeCityStats } from '../../store';
import DistrictCard from '../../components/DistrictCard';
import CityMap from '../../components/CityMap';
import { hasGeoJson } from '../../utils/geo';

const { Title } = Typography;

export default function CityDetail() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { data, loading } = useAppContext();

  const city = data.cities.find((c) => c.id === cityId);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!city) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={4}>城市未找到</Title>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  // 有 GeoJSON 的城市使用行政地图模式
  if (hasGeoJson(cityId || '')) {
    return <CityMap city={city} />;
  }

  // 无 GeoJSON 的城市回退到卡片列表模式
  const stats = computeCityStats(city);
  const keyDistricts = city.districts.filter((d) => d.isKey);
  const otherDistricts = city.districts.filter((d) => !d.isKey);

  const statCards = [
    { title: 'CRM学校总数', value: stats.totalSchools, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '已合作', value: stats.cooperating, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '试用中', value: stats.trialing, icon: <ExperimentOutlined />, color: '#faad14' },
    { title: '已汇报', value: stats.reported, icon: <FileTextOutlined />, color: '#722ed1' },
    { title: '待开发', value: stats.pending, icon: <ClockCircleOutlined />, color: '#bfbfbf' },
    { title: '区域合作项目', value: stats.totalProjects, icon: <ProjectOutlined />, color: '#ff7a45' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {city.name}教育市场作战地图
        </Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col xs={12} sm={8} md={4} key={card.title}>
            <Card hoverable size="small">
              <Statistic
                title={card.title}
                value={card.value}
                prefix={<span style={{ color: card.color, fontSize: 20 }}>{card.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {keyDistricts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>重点区域</h3>
          <Row gutter={[16, 16]}>
            {keyDistricts.map((district) => (
              <Col xs={24} sm={12} lg={6} key={district.id}>
                <DistrictCard
                  district={district}
                  cityId={city.id}
                  onClick={() => navigate(`/city/${city.id}/${district.id}`)}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {otherDistricts.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>其他区域</h3>
          <Row gutter={[16, 16]}>
            {otherDistricts.map((district) => (
              <Col xs={24} sm={12} lg={6} key={district.id}>
                <DistrictCard
                  district={district}
                  cityId={city.id}
                  onClick={() => navigate(`/city/${city.id}/${district.id}`)}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {city.districts.length === 0 && (
        <Empty description="暂无区县数据" style={{ marginTop: 60 }} />
      )}
    </div>
  );
}
