import { useMemo, useState, type DragEvent } from 'react';
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
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  EditOutlined,
  ProjectOutlined,
  BarChartOutlined,
  BankOutlined,
  RobotOutlined,
  UserOutlined,
  PhoneOutlined,
  WechatOutlined,
  MailOutlined,
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useAppContext } from '../../store/AppContext';
import { updateDistrict, updateCity } from '../../store';
import { getCityGeoJson, getCityDistrictColors, darkenColor, getGeoBbox } from '../../utils/geo';
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

  // 区域拖拽排序：当前被拖拽的区县 id
  const [dragId, setDragId] = useState<string | null>(null);

  const districtColors = useMemo(() => getCityDistrictColors(city), [city]);

  const districtMap = useMemo(() => {
    return new Map(city.districts.map((d) => [d.name, d]));
  }, [city.districts]);

  // 按 order 排序展示（同一 isKey 组内生效；未设置 order 时回退到原始数组顺序）
  const sortedGroups = useMemo(() => {
    const idxById = new Map(city.districts.map((d, i) => [d.id, i] as const));
    const byOrder = (a: District, b: District) =>
      (a.order ?? idxById.get(a.id)! + 10000) - (b.order ?? idxById.get(b.id)! + 10000);
    return {
      key: [...city.districts.filter((d) => d.isKey)].sort(byOrder),
      other: [...city.districts.filter((d) => !d.isKey)].sort(byOrder),
    };
  }, [city.districts]);

  /**
   * 在「重点区域」或「其他区域」组内拖动重排后写回 order 并持久化
   * @param isKeyGroup 被拖拽元素所属组（重点=true / 其他=false）
   * @param draggedId 被拖拽区县 id
   * @param targetId  放置目标区县 id（落点在其上方）
   */
  const handleReorderDistrict = (isKeyGroup: boolean, draggedId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const group = city.districts.filter((d) => d.isKey === isKeyGroup);
    const ids = group.map((d) => d.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const moved = ids.splice(from, 1)[0];
    ids.splice(to, 0, moved);
    const orderMap = new Map(ids.map((id, i) => [id, i + 1] as const));
    const result = updateCity(data, city.id, (c) => ({
      ...c,
      districts: c.districts.map((d) =>
        orderMap.has(d.id) ? { ...d, order: orderMap.get(d.id) } : d
      ),
    }));
    if (result.success) setData(result.data);
  };

  // 根据城市 GeoJSON 几何中心自适应居中，避免写死缩放导致边缘区县被裁切
  const geoBbox = useMemo(() => {
    const gj = getCityGeoJson(city.id);
    return gj ? getGeoBbox(gj as never) : null;
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
          scaleLimit: { min: 0.5, max: 8 },
          zoom: 1,
          center: geoBbox ? geoBbox.center : undefined,
          layoutCenter: ['50%', '50%'],
          layoutSize: '95%',
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
  }, [city, districtColors, geoBbox]);

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
          <Space size={8}>
            <Button
              onClick={() => navigate(`/city/${city.id}/private-schools`)}
              size="middle"
              icon={<BankOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                color: '#fff',
                border: 'none',
                background: 'linear-gradient(135deg, #ff7a45 0%, #fa8c16 100%)',
                boxShadow: '0 4px 14px rgba(255,122,69,0.35)',
              }}
            >
              民办校数据看板
            </Button>
            <Button
              onClick={() => navigate(`/city/${city.id}/essay-project`)}
              size="middle"
              icon={<EditOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                color: '#fff',
                border: 'none',
                background: 'linear-gradient(135deg, #52c41a 0%, #13c2c2 100%)',
                boxShadow: '0 4px 14px rgba(82,196,26,0.35)',
              }}
            >
              作文专项数据看板
            </Button>
            <Button
              onClick={() => navigate(`/city/${city.id}/ai-label-schools`)}
              size="middle"
              icon={<RobotOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                color: '#fff',
                border: 'none',
                background: 'linear-gradient(135deg, #1677ff 0%, #13c2c2 100%)',
                boxShadow: '0 4px 14px rgba(22,119,255,0.35)',
              }}
            >
              AI标签校数据看板
            </Button>
            <Button
              type="primary"
              size="middle"
              icon={<BarChartOutlined />}
              onClick={() => navigate(`/city/${city.id}/dashboard`)}
              style={{
                borderRadius: 8, fontWeight: 600,
                background: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
                border: 'none', boxShadow: '0 4px 14px rgba(22,119,255,0.35)',
              }}
            >
              全市数据看板
            </Button>
          </Space>
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
                  style={{
                    borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  styles={{ body: { padding: '14px 16px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #1677ff, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 10px rgba(22,119,255,0.3)',
                      }}
                    >
                      <UserOutlined style={{ color: '#fff', fontSize: 17 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 15, color: '#1e293b', display: 'block' }}>{leader.name}</Text>
                      <Tag color="blue" style={{ borderRadius: 6, marginTop: 4 }}>{leader.position}</Tag>
                    </div>
                    <Space size={4}>
                      <EditOutlined
                        style={{ fontSize: 14, color: '#64748b', cursor: 'pointer' }}
                        onClick={() => handleEditCityLeader(leader)}
                      />
                      <Popconfirm
                        title="确定删除？"
                        onConfirm={() => handleDeleteCityLeader(leader.id)}
                      >
                        <DeleteOutlined style={{ fontSize: 14, color: '#ef4444', cursor: 'pointer' }} />
                      </Popconfirm>
                    </Space>
                  </div>
                  {leader.notes && (
                    <div
                      style={{
                        padding: '8px 10px', borderRadius: 8,
                        background: 'linear-gradient(135deg, #fffbeb, #fefce8)',
                        border: '1px solid #fef3c7', marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>{leader.notes}</Text>
                    </div>
                  )}
                  {leader.phone && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
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

        {/* 右侧：区域统筹推进状态 */}
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
                <span style={{ fontWeight: 600, color: '#1e293b' }}>区域统筹推进状态</span>
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
            {sortedGroups.key.map((district) => renderDistrictCard(district, getDistrictColor, city.id, editingDistrictId, editValues, setEditValues, handleSaveEdit, handleCancelEdit, handleStartEdit, navigate, getProjectContent, {
              draggable: true,
              isDragging: dragId === district.id,
              onDragStart: (e: DragEvent<HTMLDivElement>) => {
                setDragId(district.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', district.id);
              },
              onDragOver: (e: DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              },
              onDrop: (e: DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                const dragged = e.dataTransfer.getData('text/plain') || dragId;
                if (dragged) handleReorderDistrict(true, dragged, district.id);
                setDragId(null);
              },
              onDragEnd: () => setDragId(null),
            }))}

            {/* 其他区域 */}
            {sortedGroups.other.length > 0 && (
              <>
                <div style={{ marginTop: 18, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    其他区域
                  </Text>
                </div>
                {sortedGroups.other.map((district) => renderDistrictCard(district, getDistrictColor, city.id, editingDistrictId, editValues, setEditValues, handleSaveEdit, handleCancelEdit, handleStartEdit, navigate, getProjectContent, {
                  draggable: true,
                  isDragging: dragId === district.id,
                  onDragStart: (e: DragEvent<HTMLDivElement>) => {
                    setDragId(district.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', district.id);
                  },
                  onDragOver: (e: DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  },
                  onDrop: (e: DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    const dragged = e.dataTransfer.getData('text/plain') || dragId;
                    if (dragged) handleReorderDistrict(false, dragged, district.id);
                    setDragId(null);
                  },
                  onDragEnd: () => setDragId(null),
                }))}
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
  getProjectContent: (d: District, c: DistrictProject['category']) => string,
  dragProps?: {
    draggable?: boolean;
    isDragging?: boolean;
    onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
  }
) {
  const color = getDistrictColor(district.name);
  const schoolCount = district.schools.length;
  const cooperating = district.schools.filter((s) => s.status === '已合作').length;
  const isEditing = editingDistrictId === district.id;

  return (
    <div
      key={district.id}
      data-district-id={district.id}
      draggable={dragProps?.draggable}
      onDragStart={dragProps?.onDragStart}
      onDragOver={dragProps?.onDragOver}
      onDrop={dragProps?.onDrop}
      onDragEnd={dragProps?.onDragEnd}
      style={{
        marginBottom: 12,
        padding: 14,
        borderRadius: 10,
        borderLeft: `4px solid ${color}`,
        backgroundColor: '#fafbfc',
        boxShadow: dragProps?.isDragging
          ? '0 0 0 2px #1677ff, 0 4px 12px rgba(22,119,255,0.18)'
          : '0 1px 2px rgba(0,0,0,0.03)',
        opacity: dragProps?.isDragging ? 0.55 : 1,
        cursor: dragProps?.draggable ? 'grab' : 'default',
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
          <HolderOutlined
            style={{ color: '#cbd5e1', fontSize: 14, cursor: 'grab' }}
            title="拖动可调整排列顺序"
          />
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
