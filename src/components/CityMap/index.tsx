import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Input,
  message,
  Modal,
  Form,
  Popconfirm,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  EditOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  BarChartOutlined,
  UserOutlined,
  PhoneOutlined,
  WechatOutlined,
  MailOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useAppContext } from '../../store/AppContext';
import { computeCityStats, updateDistrict, updateCity } from '../../store';
import { getCityGeoJson, getCityDistrictColors, darkenColor } from '../../utils/geo';
import type { District, DistrictProject, EducationLeader } from '../../types';
import { PROJECT_CATEGORIES } from '../../types';

const { Title, Text } = Typography;

interface CityMapProps {
  city: import('../../types').City;
}

export default function CityMap({ city }: CityMapProps) {
  const navigate = useNavigate();
  const { data, setData } = useAppContext();
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // 市级领导
  const [cityLeaderModalOpen, setCityLeaderModalOpen] = useState(false);
  const [editingCityLeader, setEditingCityLeader] = useState<EducationLeader | null>(null);
  const cityLeaders = city.cityLeaders || [];

  const stats = useMemo(() => computeCityStats(city), [city]);
  const districtColors = useMemo(() => getCityDistrictColors(city), [city]);

  const districtMap = useMemo(() => {
    return new Map(city.districts.map((d) => [d.name, d]));
  }, [city.districts]);

  // 根据城市密度设置初始缩放：区县密集的城市默认放大
  const initialZoom = useMemo(() => {
    const denseCities: Record<string, number> = {
      nanjing: 2.0,
      suzhou: 2.0,
      changzhou: 1.7,
      wuxi: 1.5,
      xuzhou: 1.5,
      nantong: 1.5,
      yangzhou: 1.5,
    };
    return denseCities[city.id] || 1.3;
  }, [city.id]);

  const mapOption = useMemo(() => {
    const mapData = city.districts.map((d) => {
      const color = districtColors[d.name] || '#E8E8E8';
      const schoolCount = d.schools.length;
      const cooperating = d.schools.filter((s) => s.status === '已合作').length;
      return {
        name: d.name,
        value: schoolCount,
        districtId: d.id,
        itemStyle: { areaColor: color },
        emphasis: { itemStyle: { areaColor: darkenColor(color, 30) } },
        labelInfo: { schoolCount, cooperating },
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#d9d9d9',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        formatter: (params: { name: string; data?: { labelInfo?: { schoolCount: number; cooperating: number } } }) => {
          if (!params.data?.labelInfo) return params.name;
          const info = params.data.labelInfo;
          return `
            <div style="padding:6px 10px">
              <strong style="font-size:15px">${params.name}</strong>
              <div style="margin-top:6px;line-height:1.8">
                学校总数：<b>${info.schoolCount}</b> 所<br/>
                已合作：<span style="color:#52c41a">${info.cooperating}</span> 所
              </div>
              <div style="margin-top:4px;color:#1677ff;font-size:12px">点击进入详情 →</div>
            </div>`;
        },
      },
      series: [
        {
          name: city.name,
          type: 'map',
          map: city.id,
          roam: true,
          scaleLimit: { min: 0.8, max: 5 },
          zoom: initialZoom,
          label: {
            show: true,
            color: '#1f2937',
            fontSize: 13,
            fontWeight: 'bold',
            textBorderColor: '#fff',
            textBorderWidth: 2,
            formatter: (params: { name: string }) => params.name.replace(/市$|区$|县$/, ''),
          },
          emphasis: {
            label: { show: true, fontSize: 15, fontWeight: 'bold', color: '#000' },
            itemStyle: { borderColor: '#fa8c16', borderWidth: 2.5 },
          },
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          select: {
            label: { fontWeight: 'bold', color: '#000' },
            itemStyle: { areaColor: '#ffd666', borderColor: '#fa8c16', borderWidth: 2 },
          },
          selectedMode: 'single',
          data: mapData,
        },
      ],
    };
  }, [city, districtColors]);

  // 注册地图
  const geoJson = getCityGeoJson(city.id);
  if (geoJson && !echarts.getMap(city.id)) {
    echarts.registerMap(city.id, geoJson as never);
  }

  const onChartClick = (params: { name?: string }) => {
    if (params.name) {
      const district = districtMap.get(params.name);
      if (district) navigate(`/city/${city.id}/${district.id}`);
    }
  };

  const statCards = [
    { title: 'CRM学校总数', value: stats.totalSchools, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '已合作', value: stats.cooperating, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '试用中', value: stats.trialing, icon: <ExperimentOutlined />, color: '#faad14' },
    { title: '已汇报', value: stats.reported, icon: <FileTextOutlined />, color: '#722ed1' },
    { title: '待开发', value: stats.pending, icon: <ClockCircleOutlined />, color: '#bfbfbf' },
    { title: '区域合作项目', value: stats.totalProjects, icon: <ProjectOutlined />, color: '#ff7a45' },
  ];

  // 区域项目编辑
  const handleStartEdit = (district: District) => {
    const initial: Record<string, string> = {};
    PROJECT_CATEGORIES.forEach((cat) => {
      const p = district.projects.find((p) => p.category === cat);
      initial[cat] = p?.content || '';
    });
    setEditValues(initial);
    setEditingDistrictId(district.id);
  };

  const handleCancelEdit = () => {
    setEditingDistrictId(null);
    setEditValues({});
  };

  const handleSaveEdit = () => {
    if (!editingDistrictId) return;
    const projects: DistrictProject[] = PROJECT_CATEGORIES.map((cat) => ({
      id: `${editingDistrictId}_${cat}`,
      category: cat,
      content: editValues[cat] || '',
      updatedAt: new Date().toISOString().split('T')[0],
    }));

    const result = updateDistrict(data, city.id, editingDistrictId, (d) => ({
      ...d,
      projects,
    }));

    if (result.success) {
      setData(result.data);
      message.success('保存成功');
      setEditingDistrictId(null);
      setEditValues({});
    } else {
      message.error('保存失败，请重试');
    }
  };

  const getProjectContent = (district: District, category: DistrictProject['category']) => {
    const p = district.projects.find((p) => p.category === category);
    return p?.content || '';
  };

  const getDistrictColor = (name: string) => districtColors[name] || '#E8E8E8';

  // 市级领导操作
  const handleAddCityLeader = () => {
    setEditingCityLeader({
      id: Math.random().toString(36).substring(2, 10),
      name: '',
      position: '',
      phone: '',
      wechat: '',
      email: '',
      lastContact: '',
      notes: '',
    });
    setCityLeaderModalOpen(true);
  };

  const handleEditCityLeader = (leader: EducationLeader) => {
    setEditingCityLeader({ ...leader });
    setCityLeaderModalOpen(true);
  };

  const handleDeleteCityLeader = (leaderId: string) => {
    const result = updateCity(data, city.id, (c) => ({
      ...c,
      cityLeaders: (c.cityLeaders || []).filter((l) => l.id !== leaderId),
    }));
    if (result.success) {
      setData(result.data);
      message.success('已删除');
    } else {
      message.error('删除失败');
    }
  };

  const handleSaveCityLeader = () => {
    if (!editingCityLeader) return;
    if (!editingCityLeader.name.trim()) {
      message.warning('请输入姓名');
      return;
    }
    if (!editingCityLeader.position.trim()) {
      message.warning('请输入职位');
      return;
    }

    const existing = cityLeaders.find((l) => l.id === editingCityLeader.id);
    let updated: EducationLeader[];
    if (existing) {
      updated = cityLeaders.map((l) => (l.id === editingCityLeader.id ? editingCityLeader : l));
    } else {
      updated = [...cityLeaders, editingCityLeader];
    }

    const result = updateCity(data, city.id, (c) => ({ ...c, cityLeaders: updated }));
    if (result.success) {
      setData(result.data);
      message.success(existing ? '领导信息已更新' : '领导已添加');
      setCityLeaderModalOpen(false);
      setEditingCityLeader(null);
    } else {
      message.error('保存失败');
    }
  };

  return (
    <div>
      {/* 返回 + 标题 */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          {city.name}教育市场作战地图
        </Title>
        <Tag
          color="blue"
          style={{ borderRadius: 8, padding: '2px 12px', fontSize: 13, fontWeight: 500 }}
        >
          {city.districts.length} 个区县
        </Tag>
      </div>

      {/* 各区颜色导航 + 全市数据看板入口 */}
      <Card
        size="small"
        styles={{ body: { padding: '14px 18px' } }}
        style={{
          marginBottom: 20,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 500 }}>
            快速导航：
          </Text>
          {city.districts.map((district) => {
            const color = getDistrictColor(district.name);
            return (
              <Button
                key={district.id}
                size="middle"
                onClick={() => navigate(`/city/${city.id}/${district.id}`)}
                style={{
                  backgroundColor: color,
                  borderColor: 'transparent',
                  color: '#1e293b',
                  fontWeight: 600,
                  borderRadius: 8,
                  boxShadow: `0 2px 8px ${color}60`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${color}80`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 8px ${color}60`;
                }}
              >
                {district.name}
              </Button>
            );
          })}
          <div style={{ flex: 1, minWidth: 12 }} />
          <Button
            type="primary"
            size="middle"
            icon={<BarChartOutlined />}
            onClick={() => navigate(`/city/${city.id}/dashboard`)}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(22,119,255,0.35)',
            }}
          >
            全市数据看板
          </Button>
        </div>
      </Card>

      {/* 市级教育局领导 */}
      <Card
        size="small"
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff15, #7c3aed15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{city.name}教育局领导</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddCityLeader}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            添加
          </Button>
        }
        styles={{ body: { padding: '14px 18px' } }}
        style={{
          marginBottom: 20,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        {cityLeaders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text style={{ color: '#94a3b8' }}>暂无市级领导信息，点击右上角添加</Text>
          </div>
        ) : (
          <Row gutter={[14, 14]}>
            {cityLeaders.map((leader) => (
              <Col xs={24} sm={12} md={8} xl={6} key={leader.id}>
                <Card
                  hoverable
                  size="small"
                  actions={[
                    <EditOutlined key="edit" onClick={() => handleEditCityLeader(leader)} />,
                    <Popconfirm
                      key="del"
                      title="确定删除？"
                      onConfirm={() => handleDeleteCityLeader(leader.id)}
                    >
                      <DeleteOutlined style={{ color: '#ef4444' }} />
                    </Popconfirm>,
                  ]}
                  style={{
                    borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  styles={{ body: { padding: '14px 16px' } }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <UserOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                    </div>
                    <Text strong style={{ fontSize: 15, color: '#1e293b' }}>{leader.name}</Text>
                  </div>
                  <Tag color="blue" style={{ borderRadius: 6 }}>{leader.position}</Tag>
                  {leader.phone && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                      <PhoneOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                      {leader.phone}
                    </div>
                  )}
                  {leader.wechat && (
                    <div style={{ marginTop: 3, fontSize: 12, color: '#64748b' }}>
                      <WechatOutlined style={{ marginRight: 6, color: '#10b981' }} />
                      {leader.wechat}
                    </div>
                  )}
                  {leader.email && (
                    <div style={{ marginTop: 3, fontSize: 12, color: '#64748b' }}>
                      <MailOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                      {leader.email}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Row gutter={[18, 18]}>
        {/* 左侧：行政地图 */}
        <Col xs={24} lg={16}>
          <Card
            styles={{ body: { padding: 8 } }}
            style={{
              borderRadius: 14,
              border: '1px solid #f1f5f9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              <Text strong style={{ fontSize: 14, color: '#1e293b' }}>{city.name}行政地图</Text>
            </div>
            <ReactECharts option={mapOption} style={{ height: 600 }} onEvents={{ click: onChartClick }} />
            <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                点击地图上的区域进入详情
              </Text>
            </div>
          </Card>
        </Col>

        {/* 右侧：区域合作状态 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #fef3c7, #fef9c3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ProjectOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                </div>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>区域合作状态</span>
              </Space>
            }
            styles={{ body: { padding: '12px 16px', maxHeight: 628, overflowY: 'auto' } }}
            style={{
              borderRadius: 14,
              border: '1px solid #f1f5f9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* 重点区域 */}
            <div style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                重点区域
              </Text>
            </div>
            {city.districts.filter((d) => d.isKey).map((district) => renderDistrictCard(district, getDistrictColor, city.id, editingDistrictId, editValues, setEditValues, handleSaveEdit, handleCancelEdit, handleStartEdit, navigate, getProjectContent))}

            {/* 其他区域 */}
            {city.districts.filter((d) => !d.isKey).length > 0 && (
              <>
                <div style={{ marginTop: 18, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    其他区域
                  </Text>
                </div>
                {city.districts.filter((d) => !d.isKey).map((district) => renderDistrictCard(district, getDistrictColor, city.id, editingDistrictId, editValues, setEditValues, handleSaveEdit, handleCancelEdit, handleStartEdit, navigate, getProjectContent))}
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* 市级领导 Modal */}
      <Modal
        title={
          editingCityLeader && cityLeaders.find((l) => l.id === editingCityLeader.id)
            ? '编辑领导'
            : '添加领导'
        }
        open={cityLeaderModalOpen}
        onOk={handleSaveCityLeader}
        onCancel={() => {
          setCityLeaderModalOpen(false);
          setEditingCityLeader(null);
        }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="姓名" required>
                <Input
                  value={editingCityLeader?.name || ''}
                  onChange={(e) =>
                    setEditingCityLeader((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="请输入姓名"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="职位" required>
                <Input
                  value={editingCityLeader?.position || ''}
                  onChange={(e) =>
                    setEditingCityLeader((prev) =>
                      prev ? { ...prev, position: e.target.value } : null
                    )
                  }
                  placeholder="如：局长、副局长"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="电话">
                <Input
                  value={editingCityLeader?.phone || ''}
                  onChange={(e) =>
                    setEditingCityLeader((prev) =>
                      prev ? { ...prev, phone: e.target.value } : null
                    )
                  }
                  placeholder="手机/座机"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="微信">
                <Input
                  value={editingCityLeader?.wechat || ''}
                  onChange={(e) =>
                    setEditingCityLeader((prev) =>
                      prev ? { ...prev, wechat: e.target.value } : null
                    )
                  }
                  placeholder="微信号"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="邮箱">
            <Input
              value={editingCityLeader?.email || ''}
              onChange={(e) =>
                setEditingCityLeader((prev) =>
                  prev ? { ...prev, email: e.target.value } : null
                )
              }
              placeholder="电子邮箱"
            />
          </Form.Item>
          <Form.Item label="最近联系">
            <Input
              value={editingCityLeader?.lastContact || ''}
              onChange={(e) =>
                setEditingCityLeader((prev) =>
                  prev ? { ...prev, lastContact: e.target.value } : null
                )
              }
              placeholder="如：2025-01-15"
            />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea
              rows={3}
              value={editingCityLeader?.notes || ''}
              onChange={(e) =>
                setEditingCityLeader((prev) =>
                  prev ? { ...prev, notes: e.target.value } : null
                )
              }
              placeholder="备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 区域卡片渲染辅助函数
function renderDistrictCard(
  district: District,
  getDistrictColor: (name: string) => string,
  cityId: string,
  editingDistrictId: string | null,
  editValues: Record<string, string>,
  setEditValues: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void,
  handleSaveEdit: () => void,
  handleCancelEdit: () => void,
  handleStartEdit: (d: District) => void,
  navigate: ReturnType<typeof useNavigate>,
  getProjectContent: (d: District, c: DistrictProject['category']) => string
) {
  const color = getDistrictColor(district.name);
  const schoolCount = district.schools.length;
  const cooperating = district.schools.filter((s) => s.status === '已合作').length;
  const isEditing = editingDistrictId === district.id;

  return (
    <div
      key={district.id}
      style={{
        marginBottom: 12,
        padding: 14,
        borderRadius: 10,
        borderLeft: `4px solid ${color}`,
        backgroundColor: '#fafbfc',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Space>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EnvironmentOutlined style={{ color, fontSize: 14 }} />
          </div>
          <Text strong style={{ color: '#1e293b', fontSize: 14 }}>{district.name}</Text>
          {district.isKey && <Tag color="blue" style={{ borderRadius: 6 }}>重点</Tag>}
        </Space>
        <Space size={4}>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>
            学校{schoolCount} · 已合作{cooperating}
          </Text>
          {!isEditing && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleStartEdit(district)}
              style={{ color: '#94a3b8' }}
            />
          )}
        </Space>
      </div>

      {isEditing ? (
        <div>
          {PROJECT_CATEGORIES.map((cat) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{cat}</Text>
              <Input
                size="small"
                value={editValues[cat] || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [cat]: e.target.value }))
                }
                placeholder={`请输入${cat}`}
                style={{ marginTop: 4, borderRadius: 6 }}
              />
            </div>
          ))}
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <Button size="small" type="primary" onClick={handleSaveEdit} style={{ borderRadius: 6 }}>
              保存
            </Button>
            <Button size="small" onClick={handleCancelEdit} style={{ borderRadius: 6 }}>
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {PROJECT_CATEGORIES.map((cat) => {
            const content = getProjectContent(district, cat);
            return (
              <div key={cat} style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{cat}：</Text>
                <Text style={{ fontSize: 13, color: '#475569' }}>{content || '未设置'}</Text>
              </div>
            );
          })}
          <div style={{ marginTop: 10 }}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, fontWeight: 500, fontSize: 13 }}
              onClick={() => navigate(`/city/${cityId}/${district.id}`)}
            >
              查看学校与领导详情 →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
