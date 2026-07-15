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
  Spin,
  Input,
  message,
  Statistic,
  Modal,
  Form,
  Popconfirm,
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
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useAppContext } from '../../store/AppContext';
import { computeCityStats, updateDistrict, updateCity } from '../../store';
import { WUXI_GEOJSON } from '../../utils/wuxiGeoJson';
import type { District, DistrictProject, EducationLeader } from '../../types';
import { PROJECT_CATEGORIES } from '../../types';

const { Title, Text } = Typography;

// 注册无锡市地图
if (!echarts.getMap('wuxi')) {
  echarts.registerMap('wuxi', WUXI_GEOJSON as never);
}

// 无锡市各区行政颜色
const DISTRICT_COLORS: Record<string, string> = {
  '锡山区': '#B5D6A7',
  '惠山区': '#F0C8A0',
  '滨湖区': '#A8D8D0',
  '梁溪区': '#D4B8D4',
  '新吴区': '#B5C7E3',
  '江阴市': '#F0C8C8',
  '宜兴市': '#C8D0D8',
};

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface Props {
  city: import('../../types').City;
}

export default function WuxiCityMap({ city }: Props) {
  const navigate = useNavigate();
  const { data, setData } = useAppContext();
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // 市级领导管理
  const [cityLeaderModalOpen, setCityLeaderModalOpen] = useState(false);
  const [editingCityLeader, setEditingCityLeader] = useState<EducationLeader | null>(null);
  const cityLeaders = city.cityLeaders || [];

  const stats = useMemo(() => computeCityStats(city), [city]);

  const districtMap = useMemo(() => {
    return new Map(city.districts.map((d) => [d.name, d]));
  }, [city.districts]);

  const mapOption = useMemo(() => {
    const mapData = city.districts.map((d) => {
      const color = DISTRICT_COLORS[d.name] || '#E8E8E8';
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
          name: '无锡市',
          type: 'map',
          map: 'wuxi',
          roam: false,
          label: {
            show: true,
            color: '#333',
            fontSize: 13,
            fontWeight: 'bold',
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
  }, [city.districts]);

  const onChartClick = (params: { name?: string }) => {
    if (params.name) {
      const district = districtMap.get(params.name);
      if (district) {
        navigate(`/city/${city.id}/${district.id}`);
      }
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

  // ===== 编辑逻辑 =====
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

  const getDistrictColor = (name: string) => DISTRICT_COLORS[name] || '#E8E8E8';

  // ===== 市级领导操作 =====
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
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {city.name}教育市场作战地图
        </Title>
      </div>

      {/* 各区颜色导航 + 全市数据看板入口 */}
      <Card
        size="small"
        styles={{ body: { padding: '12px 16px' } }}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
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
                  borderColor: color,
                  color: '#333',
                  fontWeight: 500,
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkenColor(color, 20);
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
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
            <UserOutlined />
            <span>无锡市教育局领导</span>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddCityLeader}>
            添加
          </Button>
        }
        styles={{ body: { padding: '12px 16px' } }}
        style={{ marginBottom: 16 }}
      >
        {cityLeaders.length === 0 ? (
          <Text type="secondary">暂无市级领导信息，点击右上角添加</Text>
        ) : (
          <Row gutter={[12, 12]}>
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
                      <DeleteOutlined style={{ color: '#ff4d4f' }} />
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ marginBottom: 6 }}>
                    <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                    <Text strong>{leader.name}</Text>
                  </div>
                  <Tag color="blue">{leader.position}</Tag>
                  {leader.phone && (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <PhoneOutlined style={{ marginRight: 4, color: '#999' }} />
                      {leader.phone}
                    </div>
                  )}
                  {leader.wechat && (
                    <div style={{ marginTop: 2, fontSize: 12 }}>
                      <WechatOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                      {leader.wechat}
                    </div>
                  )}
                  {leader.email && (
                    <div style={{ marginTop: 2, fontSize: 12 }}>
                      <MailOutlined style={{ marginRight: 4, color: '#999' }} />
                      {leader.email}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {/* 左侧：行政地图 */}
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 8 } }}>
            <ReactECharts
              option={mapOption}
              style={{ height: 520 }}
              onEvents={{ click: onChartClick }}
            />
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                点击地图上的区域进入详情
              </Text>
            </div>
          </Card>
        </Col>

        {/* 右侧：区域合作状态面板 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ProjectOutlined />
                <span>区域合作状态</span>
              </Space>
            }
            styles={{ body: { padding: '12px 16px', maxHeight: 560, overflowY: 'auto' } }}
          >
            {/* 重点区域 — 固定展示锡山/梁溪/滨湖/惠山 */}
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>重点区域</Text>
            </div>
            {city.districts.filter(d => d.isKey).map((district) => {
              const color = getDistrictColor(district.name);
              const schoolCount = district.schools.length;
              const cooperating = district.schools.filter((s) => s.status === '已合作').length;
              const isEditing = editingDistrictId === district.id;

              return (
                <div
                  key={district.id}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 8,
                    borderLeft: `4px solid ${color}`,
                    backgroundColor: '#fafafa',
                  }}
                >
                  {/* 标题行 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Space>
                      <EnvironmentOutlined style={{ color }} />
                      <Text strong>{district.name}</Text>
                      <Tag color="blue">重点</Tag>
                    </Space>
                    <Space size={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        学校{schoolCount} · 已合作{cooperating}
                      </Text>
                      {!isEditing && (
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleStartEdit(district)}
                        />
                      )}
                    </Space>
                  </div>

                  {/* 编辑态 / 展示态 */}
                  {isEditing ? (
                    <div>
                      {PROJECT_CATEGORIES.map((cat) => (
                        <div key={cat} style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {cat}
                          </Text>
                          <Input
                            size="small"
                            value={editValues[cat] || ''}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, [cat]: e.target.value }))
                            }
                            placeholder={`请输入${cat}`}
                            style={{ marginTop: 2 }}
                          />
                        </div>
                      ))}
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <Button size="small" type="primary" onClick={handleSaveEdit}>
                          保存
                        </Button>
                        <Button size="small" onClick={handleCancelEdit}>
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {PROJECT_CATEGORIES.map((cat) => {
                        const content = getProjectContent(district, cat);
                        return (
                          <div key={cat} style={{ marginBottom: 3 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {cat}：
                            </Text>
                            <Text style={{ fontSize: 13 }}>
                              {content || '未设置'}
                            </Text>
                          </div>
                        );
                      })}
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 0 }}
                          onClick={() => navigate(`/city/${city.id}/${district.id}`)}
                        >
                          查看学校与领导详情 →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 其他区域 */}
            {city.districts.filter(d => !d.isKey).length > 0 && (
              <>
                <div style={{ marginTop: 16, marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>其他区域</Text>
                </div>
                {city.districts.filter(d => !d.isKey).map((district) => {
                  const color = getDistrictColor(district.name);
                  const schoolCount = district.schools.length;
                  const cooperating = district.schools.filter((s) => s.status === '已合作').length;
                  const isEditing = editingDistrictId === district.id;

                  return (
                    <div
                      key={district.id}
                      style={{
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 8,
                        borderLeft: `4px solid ${color}`,
                        backgroundColor: '#fafafa',
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
                          <EnvironmentOutlined style={{ color }} />
                          <Text strong>{district.name}</Text>
                        </Space>
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            学校{schoolCount} · 已合作{cooperating}
                          </Text>
                          {!isEditing && (
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleStartEdit(district)}
                            />
                          )}
                        </Space>
                      </div>

                      {isEditing ? (
                        <div>
                          {PROJECT_CATEGORIES.map((cat) => (
                            <div key={cat} style={{ marginBottom: 8 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>{cat}</Text>
                              <Input
                                size="small"
                                value={editValues[cat] || ''}
                                onChange={(e) => setEditValues((prev) => ({ ...prev, [cat]: e.target.value }))}
                                placeholder={`请输入${cat}`}
                                style={{ marginTop: 2 }}
                              />
                            </div>
                          ))}
                          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <Button size="small" type="primary" onClick={handleSaveEdit}>保存</Button>
                            <Button size="small" onClick={handleCancelEdit}>取消</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {PROJECT_CATEGORIES.map((cat) => {
                            const content = getProjectContent(district, cat);
                            return (
                              <div key={cat} style={{ marginBottom: 3 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>{cat}：</Text>
                                <Text style={{ fontSize: 13 }}>{content || '未设置'}</Text>
                              </div>
                            );
                          })}
                          <div style={{ marginTop: 8 }}>
                            <Button
                              type="link"
                              size="small"
                              style={{ padding: 0 }}
                              onClick={() => navigate(`/city/${city.id}/${district.id}`)}
                            >
                              查看学校与领导详情 →
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* 市级领导编辑 Modal */}
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
