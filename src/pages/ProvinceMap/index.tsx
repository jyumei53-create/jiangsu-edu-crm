import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Space, Tag, Spin } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  BankOutlined,
  EnvironmentOutlined,
  RightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { computeStats, computeCityStats } from '../../store';
import { JIANGSU_GEOJSON } from '../../utils/jiangsuGeoJson';

const { Text } = Typography;

// ==================== 常量 ====================

/** GeoJSON 市名 → cityId */
const GEO_NAME_TO_CITY_ID: Record<string, string> = {
  '南京市': 'nanjing', '无锡市': 'wuxi', '徐州市': 'xuzhou',
  '常州市': 'changzhou', '苏州市': 'suzhou', '南通市': 'nantong',
  '连云港市': 'lianyungang', '淮安市': 'huaian', '盐城市': 'yancheng',
  '扬州市': 'yangzhou', '镇江市': 'zhenjiang', '泰州市': 'taizhou',
  '宿迁市': 'suqian',
};

/** 13市固定行政区划配色（柔和风格） */
const CITY_COLORS: Record<string, string> = {
  '南京市': '#B5C7E3', '无锡市': '#B5D6A7', '徐州市': '#F0C8A0',
  '常州市': '#D4B8D4', '苏州市': '#A8D8D0', '南通市': '#F0C8C8',
  '连云港市': '#D8E0A8', '淮安市': '#C0C8D8', '盐城市': '#E8D8B8',
  '扬州市': '#B8D8C8', '镇江市': '#E0C8D0', '泰州市': '#E0D8C0',
  '宿迁市': '#C8D0D8',
};

/** 悬停加深比例 */
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 注册地图
echarts.registerMap('jiangsu', JIANGSU_GEOJSON as never);

// ==================== 组件 ====================

export default function ProvinceMap() {
  const navigate = useNavigate();
  const { data, loading } = useAppContext();
  const { user } = useAuth();

  // 区域经理：直接跳转到第一个负责的城市
  useEffect(() => {
    if (!loading && user?.role === 'manager' && data.cities.length > 0) {
      navigate(`/city/${data.cities[0].id}`, { replace: true });
    }
  }, [loading, user, data.cities, navigate]);

  // 全省统计
  const stats = useMemo(() => computeStats(data), [data]);

  // 地图配置
  const mapOption = useMemo(() => {
    const mapData = data.cities.map((city) => ({
      name: city.name,
      itemStyle: {
        areaColor: CITY_COLORS[city.name] || '#E8E8E8',
      },
      emphasis: {
        itemStyle: {
          areaColor: darkenColor(CITY_COLORS[city.name] || '#E8E8E8', 30),
        },
      },
      cityId: city.id,
      value: computeCityStats(city).totalSchools,
    }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#d9d9d9',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        formatter: (params: { name: string; data?: { value?: number } }) => {
          if (!params.data) return params.name;
          const city = data.cities.find((c) => c.name === params.name);
          if (!city) return params.name;
          const s = computeCityStats(city);
          return `
            <div style="padding:4px 8px">
              <strong style="font-size:15px">${params.name}</strong>
              <div style="margin-top:6px;line-height:1.8">
                学校总数：<b>${s.totalSchools}</b> 所<br/>
                已合作：<span style="color:#52c41a">${s.cooperating}</span> |
                试用中：<span style="color:#faad14">${s.trialing}</span><br/>
                已汇报：<span style="color:#722ed1">${s.reported}</span> |
                待开发：${s.pending}<br/>
                下辖区县：${city.districts.length} 个<br/>
                合作项目：${s.totalProjects}
              </div>
              <div style="margin-top:4px;color:#1677ff;font-size:12px">点击进入详情 →</div>
            </div>`;
        },
      },
      series: [
        {
          name: '江苏省',
          type: 'map',
          map: 'jiangsu',
          roam: false,
          label: {
            show: true,
            color: '#333',
            fontSize: 13,
            fontWeight: 'bold',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 15,
              fontWeight: 'bold',
              color: '#000',
            },
            itemStyle: {
              borderColor: '#fa8c16',
              borderWidth: 2.5,
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          select: {
            label: { fontWeight: 'bold', color: '#000' },
            itemStyle: { areaColor: '#ffd666', borderColor: '#fa8c16', borderWidth: 2 },
          },
          selectedMode: 'single',
          data: mapData,
        },
      ],
    };
  }, [data]);

  // 地图点击 → 直接进入市级
  const onChartClick = (params: { name?: string }) => {
    if (params.name) {
      const cityId = GEO_NAME_TO_CITY_ID[params.name];
      if (cityId) {
        navigate(`/city/${cityId}`);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  // 全省统计卡片
  const statCards = [
    { title: '地级市', value: stats.totalCities, icon: <BankOutlined />, color: '#1677ff' },
    { title: '区县总数', value: stats.totalDistricts, icon: <EnvironmentOutlined />, color: '#13c2c2' },
    { title: 'CRM学校总数', value: stats.totalSchools, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '已合作', value: stats.cooperating, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '试用中', value: stats.trialing, icon: <ExperimentOutlined />, color: '#faad14' },
    { title: '已汇报', value: stats.reported, icon: <FileTextOutlined />, color: '#722ed1' },
    { title: '待开发', value: stats.pending, icon: <ClockCircleOutlined />, color: '#bfbfbf' },
    { title: '区域合作项目', value: stats.totalProjects, icon: <ProjectOutlined />, color: '#ff7a45' },
  ];

  return (
    <div>
      {/* 全省统计卡片 */}
      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col xs={12} sm={8} md={6} lg={3} key={card.title}>
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
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                    {card.value}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 行政地图 */}
      <Card
        styles={{ body: { padding: 8 } }}
        style={{
          marginBottom: 24,
          borderRadius: 14,
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ padding: '8px 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <Text strong style={{ fontSize: 15, color: '#1e293b' }}>江苏省行政地图</Text>
        </div>
        <ReactECharts
          option={mapOption}
          style={{ height: 520 }}
          onEvents={{ click: onChartClick }}
        />
        <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            点击地图上的城市进入详情
          </Text>
        </div>
      </Card>

      {/* 13市概况卡片 */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <BankOutlined style={{ color: '#1677ff', fontSize: 16 }} />
          <Text strong style={{ fontSize: 15, color: '#1e293b' }}>各城市概览</Text>
        </div>
      </div>
      <Row gutter={[14, 14]}>
        {data.cities.map((city) => {
          const cityStats = computeCityStats(city);
          const borderColor = CITY_COLORS[city.name] || '#e8e8e8';
          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={Math.floor(24 / 7)} key={city.id}>
              <Card
                hoverable
                size="small"
                style={{
                  borderLeft: `4px solid ${borderColor}`,
                  cursor: 'pointer',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                styles={{ body: { padding: '14px 18px' } }}
                onClick={() => navigate(`/city/${city.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        backgroundColor: borderColor,
                        boxShadow: `0 2px 6px ${borderColor}60`,
                      }}
                    />
                    <Text strong style={{ fontSize: 15, color: '#1e293b' }}>{city.name}</Text>
                  </Space>
                  <RightOutlined style={{ color: '#cbd5e1', fontSize: 12 }} />
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                    区县：<b style={{ color: '#475569' }}>{city.districts.length}</b>
                  </Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                    学校：<b style={{ color: '#475569' }}>{cityStats.totalSchools}</b>
                  </Text>
                  {cityStats.cooperating > 0 && (
                    <Tag color="success" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>
                      已合作 {cityStats.cooperating}
                    </Tag>
                  )}
                  {cityStats.trialing > 0 && (
                    <Tag color="warning" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>
                      试用 {cityStats.trialing}
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
