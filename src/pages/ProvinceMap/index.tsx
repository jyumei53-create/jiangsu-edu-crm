import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Space, Tag, Spin } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BankOutlined,
  EnvironmentOutlined,
  RightOutlined,
  EditOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { computeStats, computeCityStats } from '../../store';
import { getVisibleCities } from '../../store/permissions';
import { JIANGSU_GEOJSON } from '../../utils/jiangsuGeoJson';

const { Title, Text } = Typography;

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

// ==================== 看板入口卡片 ====================

interface DashEntryType {
  key: string;
  title: string;
  desc: string;
  metric: number | string;
  metricLabel: string;
  icon: React.ReactNode;
  to: string;
  gradient: string;
  accent: string;
}

function DashEntry({ entry, onClick }: { entry: DashEntryType; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #f1f5f9',
        boxShadow: hover ? `0 12px 30px ${entry.accent}22` : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
        padding: '18px 18px 16px',
      }}
    >
      <div style={{ height: 3, position: 'absolute', top: 0, left: 0, right: 0, background: entry.gradient }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: entry.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: `0 6px 16px ${entry.accent}40`,
          }}
        >
          {entry.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1e293b', lineHeight: 1.25 }}>{entry.title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{entry.desc}</div>
        </div>
        <ArrowRightOutlined
          style={{
            color: entry.accent,
            fontSize: 16,
            flexShrink: 0,
            transform: hover ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.25s ease',
            opacity: hover ? 1 : 0.45,
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: entry.accent, lineHeight: 1, letterSpacing: '-0.5px' }}>
          {entry.metric}
        </span>
        <span style={{ fontSize: 12.5, color: '#64748b' }}>{entry.metricLabel}</span>
      </div>
    </div>
  );
}

// ==================== 组件 ====================

export default function ProvinceMap() {
  const navigate = useNavigate();
  const { data, loading } = useAppContext();
  const { user } = useAuth();

  // 区域经理：直接跳转到第一个负责的城市（按权限过滤后的可见城市）
  useEffect(() => {
    if (!loading && user?.role === 'manager') {
      const visibleCities = getVisibleCities(user, data);
      if (visibleCities.length > 0) {
        navigate(`/city/${visibleCities[0].id}`, { replace: true });
      }
    }
  }, [loading, user, data, navigate]);

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
          roam: true,
          scaleLimit: { min: 0.8, max: 4 },
          zoom: 1.25,
          label: {
            show: true,
            color: '#1f2937',
            fontSize: 13,
            fontWeight: 'bold',
            textBorderColor: '#fff',
            textBorderWidth: 2,
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
  ];

  // 右侧看板入口数据（排除 seed 示例学校，与看板统计口径一致）
  const privateTotal = useMemo(() => {
    let n = 0;
    for (const c of data.cities)
      for (const d of c.districts)
        for (const s of d.schools)
          if (s.isPrivate && !s.seed) n++;
    return n;
  }, [data]);

  const essayTotal = useMemo(() => {
    let n = 0;
    for (const c of data.cities)
      for (const d of c.districts)
        for (const s of d.schools)
          if (s.products?.includes('作文') && !s.seed) n++;
    return n;
  }, [data]);

  const dashEntries: DashEntryType[] = [
    {
      key: 'private',
      title: '江苏省民办校数据看板',
      desc: '全省民办学校布局与推进',
      metric: privateTotal,
      metricLabel: '所民办学校',
      icon: <BankOutlined />,
      to: '/province/private-schools',
      gradient: 'linear-gradient(135deg, #1677ff 0%, #4f9bff 100%)',
      accent: '#1677ff',
    },
    {
      key: 'essay',
      title: '江苏省作文专项数据看板',
      desc: '作文专项学校覆盖与转化',
      metric: essayTotal,
      metricLabel: '所作文专项学校',
      icon: <EditOutlined />,
      to: '/province/essay-project',
      gradient: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
      accent: '#13c2c2',
    },
    {
      key: 'all',
      title: '江苏省全市数据看板',
      desc: '全省学校全景与区县明细',
      metric: stats.totalSchools,
      metricLabel: `所学校 · ${stats.totalDistricts} 区县`,
      icon: <BarChartOutlined />,
      to: '/province/dashboard',
      gradient: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
      accent: '#7c3aed',
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          <DashboardOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          江苏省教育市场作战地图
        </Title>
        <Text style={{ color: '#64748b', fontSize: 13 }}>点击地图城市进入市级详情 · 右侧进入专项数据看板</Text>
      </div>

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

      {/* 行政地图 + 右侧专项看板入口 */}
      <Row gutter={[16, 16]} align="stretch" style={{ marginBottom: 24 }}>
        <Col xs={24} lg={17}>
          <Card
            styles={{ body: { padding: 8 } }}
            style={{
              height: '100%',
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
        </Col>
        <Col xs={24} lg={7}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
            <Text strong style={{ fontSize: 12.5, color: '#475569', letterSpacing: 1 }}>专项数据看板</Text>
            {dashEntries.map((e) => (
              <DashEntry key={e.key} entry={e} onClick={() => navigate(e.to)} />
            ))}
            <div
              style={{
                marginTop: 'auto',
                padding: '13px 15px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                border: '1px solid #e2e8f0',
                fontSize: 12,
                color: '#64748b',
                lineHeight: 1.65,
              }}
            >
              看板支持按城市 / 区县多维分析，点击卡片进入全省视角。
            </div>
          </div>
        </Col>
      </Row>

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
