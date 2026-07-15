import { useState, type ReactNode } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  InputNumber,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Dropdown,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  WechatOutlined,
  MailOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { School, SchoolStatus, AppData, EducationLeader } from '../../types';
import { ALL_STATUSES, ALL_PRODUCTS } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { updateDistrict } from '../../store';
import { canAccessDistrict } from '../../store/permissions';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 状态配色（与全局分析图保持一致，避免风格漂移）
const STATUS_PALETTE: Record<string, { color: string; bg: string }> = {
  已合作: { color: '#10b981', bg: '#ecfdf5' },
  试用中: { color: '#f59e0b', bg: '#fef3c7' },
  已汇报: { color: '#8b5cf6', bg: '#f5f3ff' },
  待开发: { color: '#64748b', bg: '#f8fafc' },
};

/** 统一的合作状态标签 */
function StatusTag({ status }: { status: string }) {
  const c = STATUS_PALETTE[status] || STATUS_PALETTE['待开发'];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.color }} />
      {status}
    </span>
  );
}

/** 区块标题（带彩色图标徽章） */
function SectionTitle({
  icon,
  label,
  accent = '#1677ff',
}: {
  icon: ReactNode;
  label: string;
  accent?: string;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: `linear-gradient(135deg, ${accent}1a, ${accent}0d)`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${accent}1a`,
        }}
      >
        <span style={{ color: accent, fontSize: 16 }}>{icon}</span>
      </span>
      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>{label}</span>
    </span>
  );
}

export default function DistrictDetail() {
  const { cityId, districtId } = useParams<{ cityId: string; districtId: string }>();
  const navigate = useNavigate();
  const { data, setData } = useAppContext();
  const { user } = useAuth();

  const city = data.cities.find((c) => c.id === cityId);
  const district = city?.districts.find((d) => d.id === districtId);

  // 区县权限硬校验：区域经理无权访问该区县时，重定向回所属城市
  if (user && user.role === 'manager' && !canAccessDistrict(user, cityId || '', districtId || '')) {
    return <Navigate to={`/city/${cityId}`} replace />;
  }

  if (!city || !district) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={4}>区县未找到</Title>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  // 区县级统计（排除 seed 示例学校）
  const realSchools = district.schools.filter((s) => !s.seed);
  const totalSchools = realSchools.length;
  const cooperating = realSchools.filter((s) => s.status === '已合作').length;
  const trialing = realSchools.filter((s) => s.status === '试用中').length;
  const reported = realSchools.filter((s) => s.status === '已汇报').length;
  const pending = realSchools.filter((s) => s.status === '待开发').length;

  const statCards = [
    { title: '学校总数', value: totalSchools, color: '#1677ff', bg: '#eff6ff', icon: <TeamOutlined /> },
    { title: '已合作', value: cooperating, color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
    { title: '试用中', value: trialing, color: '#f59e0b', bg: '#fef3c7', icon: <ExperimentOutlined /> },
    { title: '已汇报', value: reported, color: '#8b5cf6', bg: '#f5f3ff', icon: <FileTextOutlined /> },
    { title: '待开发', value: pending, color: '#64748b', bg: '#f8fafc', icon: <ClockCircleOutlined /> },
  ];

  return (
    <div>
      {/* 顶部 Hero 标题区 */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20,
          padding: '22px 28px',
          borderRadius: 16,
          background: 'linear-gradient(120deg, #1e3a8a 0%, #4338ca 55%, #6d28d9 100%)',
          boxShadow: '0 10px 30px rgba(30,58,138,0.28)',
          color: '#fff',
        }}
      >
        <div style={{ position: 'absolute', right: -40, top: -50, width: 190, height: 190, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 70, bottom: -70, width: 130, height: 130, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Button
              ghost
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/city/${cityId}`)}
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', marginBottom: 14, borderRadius: 8 }}
            >
              返回{city.name}
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
                {district.name}
              </Title>
              {district.isKey && (
                <Tag
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: 8,
                    padding: '1px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  重点区域
                </Tag>
              )}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
              {city.name} · {district.name} · 共 {totalSchools} 所学校
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ textAlign: 'center', padding: '8px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.14)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{cooperating}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>已合作</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.14)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{totalSchools - cooperating}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>未合作</div>
            </div>
          </div>
        </div>
      </div>

      {/* 第一块：区域学校统计 */}
      <Card
        size="small"
        style={{
          marginBottom: 20,
          borderRadius: 14,
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: '20px 24px' } }}
        title={<SectionTitle icon={<TeamOutlined />} label="区域学校统计" />}
      >
        <Row gutter={[14, 14]}>
          {statCards.map((card) => (
            <Col xs={12} sm={8} md={Math.floor(24 / 5)} key={card.title}>
              <div
                style={{
                  textAlign: 'center', padding: '16px 12px', borderRadius: 12,
                  background: card.bg, border: `1px solid ${card.color}33`,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 20px ${card.color}26`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ marginBottom: 8, color: card.color, fontSize: 22 }}>{card.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1, marginBottom: 4 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{card.title}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 第二块：教育局领导 */}
      <Card
        title={<SectionTitle icon={<UserOutlined />} label="教育局领导" />}
        style={{
          marginBottom: 20,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <LeadersPanel district={district} data={data} setData={setData} cityId={cityId!} />
      </Card>

      {/* 第三块：学校管理 */}
      <Card
        title={<SectionTitle icon={<EditOutlined />} label="学校管理" accent="#f59e0b" />}
        style={{
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <SchoolPanel cityId={cityId!} district={district} data={data} setData={setData} />
      </Card>
    </div>
  );
}

// ==================== 教育局领导面板 ====================

function LeadersPanel({
  district,
  data,
  setData,
  cityId,
}: {
  district: import('../../types').District;
  data: AppData;
  setData: (newData: AppData) => boolean;
  cityId: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<EducationLeader | null>(null);

  const handleAdd = () => {
    setEditingLeader({
      id: Math.random().toString(36).substring(2, 10),
      name: '',
      position: '',
      phone: '',
      wechat: '',
      email: '',
      lastContact: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (leader: EducationLeader) => {
    setEditingLeader({ ...leader });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!editingLeader) return;
    if (!editingLeader.name.trim()) {
      message.warning('请输入姓名');
      return;
    }
    if (!editingLeader.position.trim()) {
      message.warning('请输入职位');
      return;
    }

    const existing = district.leaders.find((l) => l.id === editingLeader.id);
    let updatedLeaders: EducationLeader[];

    if (existing) {
      updatedLeaders = district.leaders.map((l) =>
        l.id === editingLeader.id ? editingLeader : l
      );
    } else {
      updatedLeaders = [...district.leaders, editingLeader];
    }

    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      leaders: updatedLeaders,
    }));

    if (result.success) {
      setData(result.data);
      message.success(existing ? '领导信息已更新' : '领导已添加');
      setModalOpen(false);
      setEditingLeader(null);
    } else {
      message.error('保存失败');
    }
  };

  const handleDelete = (leaderId: string) => {
    const updatedLeaders = district.leaders.filter((l) => l.id !== leaderId);
    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      leaders: updatedLeaders,
    }));
    if (result.success) {
      setData(result.data);
      message.success('已删除');
    } else {
      message.error('删除失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          添加领导
        </Button>
      </div>

      {district.leaders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', background: '#f8fafc', borderRadius: 10 }}>
          暂无教育局领导信息，点击上方按钮添加
        </div>
      ) : (
        <Row gutter={[14, 14]}>
          {district.leaders.map((leader) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={leader.id}>
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                    </div>
                    <Text strong style={{ fontSize: 15, color: '#1e293b' }}>
                      {leader.name}
                    </Text>
                  </div>
                  <Space size={4}>
                    <EditOutlined
                      style={{ fontSize: 14, color: '#64748b', cursor: 'pointer' }}
                      onClick={() => handleEdit(leader)}
                    />
                    <Popconfirm
                      title="确定删除此领导？"
                      onConfirm={() => handleDelete(leader.id)}
                    >
                      <DeleteOutlined
                        style={{ fontSize: 14, color: '#ef4444', cursor: 'pointer' }}
                      />
                    </Popconfirm>
                  </Space>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Tag color="blue" style={{ borderRadius: 6 }}>{leader.position}</Tag>
                </div>
                {leader.phone && (
                  <div style={{ marginBottom: 3 }}>
                    <PhoneOutlined style={{ marginRight: 6, color: '#94a3b8', fontSize: 12 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }}>{leader.phone}</Text>
                  </div>
                )}
                {leader.wechat && (
                  <div style={{ marginBottom: 3 }}>
                    <WechatOutlined style={{ marginRight: 6, color: '#10b981', fontSize: 12 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }}>{leader.wechat}</Text>
                  </div>
                )}
                {leader.email && (
                  <div style={{ marginBottom: 3 }}>
                    <MailOutlined style={{ marginRight: 6, color: '#94a3b8', fontSize: 12 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }}>{leader.email}</Text>
                  </div>
                )}
                {leader.lastContact && (
                  <div style={{ marginBottom: 3 }}>
                    <CalendarOutlined style={{ marginRight: 6, color: '#94a3b8', fontSize: 12 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }}>最近联系：{leader.lastContact}</Text>
                  </div>
                )}
                {leader.notes && (
                  <div style={{ marginTop: 6, padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                    <FileTextOutlined style={{ marginRight: 6, color: '#94a3b8', fontSize: 12 }} />
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                      {leader.notes}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={
          editingLeader && district.leaders.find((l) => l.id === editingLeader.id)
            ? '编辑领导'
            : '添加领导'
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingLeader(null);
        }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="姓名" required>
                <Input
                  value={editingLeader?.name || ''}
                  onChange={(e) =>
                    setEditingLeader((prev) =>
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
                  value={editingLeader?.position || ''}
                  onChange={(e) =>
                    setEditingLeader((prev) =>
                      prev ? { ...prev, position: e.target.value } : null
                    )
                  }
                  placeholder="如：局长、副局长、科长"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="电话">
                <Input
                  value={editingLeader?.phone || ''}
                  onChange={(e) =>
                    setEditingLeader((prev) =>
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
                  value={editingLeader?.wechat || ''}
                  onChange={(e) =>
                    setEditingLeader((prev) =>
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
              value={editingLeader?.email || ''}
              onChange={(e) =>
                setEditingLeader((prev) =>
                  prev ? { ...prev, email: e.target.value } : null
                )
              }
              placeholder="电子邮箱"
            />
          </Form.Item>
          <Form.Item label="最近联系">
            <Input
              value={editingLeader?.lastContact || ''}
              onChange={(e) =>
                setEditingLeader((prev) =>
                  prev ? { ...prev, lastContact: e.target.value } : null
                )
              }
              placeholder="如：2025-01-15"
            />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea
              rows={3}
              value={editingLeader?.notes || ''}
              onChange={(e) =>
                setEditingLeader((prev) =>
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

// ==================== 学校面板 ====================

function SchoolPanel({
  cityId,
  district,
  data,
  setData,
}: {
  cityId: string;
  district: import('../../types').District;
  data: AppData;
  setData: (newData: AppData) => boolean;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [orderCache, setOrderCache] = useState<Record<string, number>>({});

  const sortedSchools = [...district.schools].sort((a, b) => a.order - b.order);

  const handleOrderChange = (schoolId: string, value: number | null) => {
    if (value !== null && value !== undefined) {
      setOrderCache((prev) => ({ ...prev, [schoolId]: value }));
    }
  };

  const handleReorder = (fromOrder: number, toOrder: number) => {
    if (fromOrder === toOrder || toOrder < 1) return;
    const schools = [...district.schools].sort((a, b) => a.order - b.order);
    const fromIdx = schools.findIndex((s) => s.order === fromOrder);
    if (fromIdx === -1) return;

    const [moved] = schools.splice(fromIdx, 1);
    const targetIdx = Math.min(toOrder - 1, schools.length);
    schools.splice(targetIdx, 0, moved);

    const updated = schools.map((s, i) => ({ ...s, order: i + 1 }));
    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      schools: updated,
    }));

    if (result.success) {
      setData(result.data);
      setOrderCache({});
      message.success('顺序已更新');
    } else {
      message.error('保存失败');
    }
  };

  const handleOrderSubmit = (schoolId: string, currentOrder: number) => {
    const targetOrder = orderCache[schoolId];
    if (targetOrder !== undefined && targetOrder !== currentOrder) {
      handleReorder(currentOrder, targetOrder);
    }
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool({ ...school });
    setEditModalOpen(true);
  };

  const handleAddSchool = () => {
    setEditingSchool({
      id: Math.random().toString(36).substring(2, 10),
      name: '',
      status: '待开发',
      stage: '',
      products: [],
      street: '',
      keyPerson: '',
      remark: '',
      order: district.schools.length + 1,
      isPrivate: false,
    });
    setEditModalOpen(true);
  };

  const handleSaveSchool = () => {
    if (!editingSchool) return;
    if (!editingSchool.name.trim()) {
      message.warning('请输入学校名称');
      return;
    }

    const existing = district.schools.find((s) => s.id === editingSchool.id);
    let updatedSchools: School[];

    if (existing) {
      updatedSchools = district.schools.map((s) =>
        s.id === editingSchool.id ? editingSchool : s
      );
    } else {
      // 首次正式录入：清除所有 seed 示例学校，重新编号
      const nonSeed = district.schools
        .filter((s) => !s.seed)
        .map((s, i) => ({ ...s, order: i + 1 }));
      const newSchool = { ...editingSchool, order: nonSeed.length + 1 };
      updatedSchools = [...nonSeed, newSchool];
    }

    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      schools: updatedSchools,
    }));

    if (result.success) {
      setData(result.data);
      message.success(existing ? '学校已更新' : '学校已添加');
      setEditModalOpen(false);
      setEditingSchool(null);
    } else {
      message.error('保存失败');
    }
  };

  const handleDeleteSchool = (schoolId: string) => {
    const updatedSchools = district.schools.filter((s) => s.id !== schoolId);
    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      schools: updatedSchools,
    }));
    if (result.success) {
      setData(result.data);
      message.success('已删除');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== schoolId));
    } else {
      message.error('删除失败');
    }
  };

  const handleBatchStatus = (status: SchoolStatus) => {
    const updatedSchools = district.schools.map((s) =>
      selectedRowKeys.includes(s.id) ? { ...s, status } : s
    );
    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      schools: updatedSchools,
    }));
    if (result.success) {
      setData(result.data);
      message.success(`已将 ${selectedRowKeys.length} 所学校设为「${status}」`);
      setSelectedRowKeys([]);
    } else {
      message.error('操作失败');
    }
  };

  const handleBatchDelete = () => {
    const updatedSchools = district.schools.filter(
      (s) => !selectedRowKeys.includes(s.id)
    );
    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      schools: updatedSchools,
    }));
    if (result.success) {
      setData(result.data);
      message.success(`已删除 ${selectedRowKeys.length} 所学校`);
      setSelectedRowKeys([]);
    } else {
      message.error('删除失败');
    }
  };

  const handleImport = () => {
    const lines = importText
      .split(/[\n]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      message.warning('请输入学校数据');
      return;
    }

    const newSchools: School[] = lines.map((line, i) => {
      const parts = line.split(/[\t,，\s]+/).filter(Boolean);
      const [name, stage, status, productStr, street, keyPerson, remark] = parts;
      const products = productStr ? productStr.split(/[、/]/).filter(Boolean) : [];

      return {
        id: Math.random().toString(36).substring(2, 10),
        name: name || `未命名学校 ${i + 1}`,
        status: (ALL_STATUSES.includes(status as SchoolStatus) ? status : '待开发') as SchoolStatus,
        stage: stage || '',
        products,
        street: street || '',
        keyPerson: keyPerson || '',
        remark: remark || '',
        order: district.schools.length + i + 1,
      };
    });

    const updatedSchools = [...district.schools, ...newSchools];
    const result = updateDistrict(data, cityId, district.id, (d) => ({
      ...d,
      schools: updatedSchools,
    }));

    if (result.success) {
      setData(result.data);
      message.success(`成功导入 ${newSchools.length} 所学校`);
      setImportModalOpen(false);
      setImportText('');
    } else {
      message.error('导入失败');
    }
  };

  const columns: ColumnsType<School> = [
    {
      title: '序号',
      dataIndex: 'order',
      key: 'order',
      width: 70,
      render: (_: unknown, record: School) => (
        <InputNumber
          size="small"
          min={1}
          max={district.schools.length}
          value={orderCache[record.id] ?? record.order}
          onChange={(v) => handleOrderChange(record.id, v)}
          onPressEnter={() => handleOrderSubmit(record.id, record.order)}
          onBlur={() => handleOrderSubmit(record.id, record.order)}
          style={{ width: 52 }}
        />
      ),
    },
    {
      title: '学校名称',
      dataIndex: 'name',
      key: 'name',
      width: 190,
      ellipsis: true,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '学段',
      dataIndex: 'stage',
      key: 'stage',
      width: 90,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 85,
      render: (status: SchoolStatus) => <StatusTag status={status} />,
    },
    {
      title: '产品',
      dataIndex: 'products',
      key: 'products',
      width: 150,
      render: (products: string[] | undefined) => {
        if (!products || products.length === 0) return <Text type="secondary">-</Text>;
        const colorMap: Record<string, string> = {
          '作文': '#1677ff', '作业': '#52c41a', '通识课': '#722ed1',
          '飞象老师': '#fa8c16', '学习空间': '#13c2c2', '墨水屏': '#eb2f96',
        };
        return (
          <Space size={2} wrap>
            {products.map((p) => (
              <Tag key={p} color={colorMap[p] || 'default'} style={{ margin: 0, fontSize: 11 }}>
                {p}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '关键人',
      dataIndex: 'keyPerson',
      key: 'keyPerson',
      width: 90,
      render: (text: string) => text || '-',
    },
    {
      title: '所属街道',
      dataIndex: 'street',
      key: 'street',
      width: 120,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '民办校',
      dataIndex: 'isPrivate',
      key: 'isPrivate',
      width: 75,
      render: (v: boolean | undefined) =>
        v ? <Tag color="volcano" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>民办</Tag> : null,
    },
    {
      title: '市直属',
      dataIndex: 'isMunicipal',
      key: 'isMunicipal',
      width: 75,
      render: (v: boolean | undefined) =>
        v ? <Tag color="geekblue" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>市直属</Tag> : null,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: School) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSchool(record)}
          />
          <Popconfirm
            title="确定删除此学校？"
            onConfirm={() => handleDeleteSchool(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSchool}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            添加学校
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setImportModalOpen(true)}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            批量导入
          </Button>
        </Space>

        {selectedRowKeys.length > 0 && (
          <Space>
            <span
              style={{
                padding: '4px 12px',
                background: '#eff6ff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#1677ff',
              }}
            >
              已选 {selectedRowKeys.length} 项
            </span>
            <Dropdown
              menu={{
                items: ALL_STATUSES.map((s) => ({
                  key: s,
                  label: s,
                  onClick: () => handleBatchStatus(s),
                })),
              }}
            >
              <Button style={{ borderRadius: 8 }}>批量改状态</Button>
            </Dropdown>
            <Popconfirm
              title={`确定删除 ${selectedRowKeys.length} 所学校？`}
              onConfirm={handleBatchDelete}
            >
              <Button danger style={{ borderRadius: 8 }}>批量删除</Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={sortedSchools}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        onRow={(record: School) => ({
          style: record.seed
            ? { color: '#9ca3af', fontStyle: 'italic' as const, background: '#fafafa' }
            : undefined,
        })}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 所学校`,
        }}
        locale={{
          emptyText: (
            <div style={{ padding: '28px 0' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <div style={{ color: '#475569', fontWeight: 600 }}>暂无学校数据</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                      点击「添加学校」或「批量导入」开始录入本区县的学校
                    </div>
                  </div>
                }
              />
            </div>
          ),
        }}
        size="middle"
        scroll={{ x: 1100 }}
      />

      <Modal
        title={
          editingSchool && district.schools.find((s) => s.id === editingSchool.id)
            ? '编辑学校'
            : '添加学校'
        }
        open={editModalOpen}
        onOk={handleSaveSchool}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingSchool(null);
        }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="学校名称" required>
            <Input
              value={editingSchool?.name || ''}
              onChange={(e) =>
                setEditingSchool((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              placeholder="请输入学校名称"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="学段">
                <Select
                  value={editingSchool?.stage || undefined}
                  onChange={(v) =>
                    setEditingSchool((prev) =>
                      prev ? { ...prev, stage: v } : null
                    )
                  }
                  allowClear
                  placeholder="选择学段"
                  options={[
                    { value: '小学', label: '小学' },
                    { value: '初中', label: '初中' },
                    { value: '高中', label: '高中' },
                    { value: '九年一贯制', label: '九年一贯制' },
                    { value: '十二年一贯制', label: '十二年一贯制' },
                    { value: '完中', label: '完中' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="状态">
                <Select
                  value={editingSchool?.status || '待开发'}
                  onChange={(v) =>
                    setEditingSchool((prev) =>
                      prev ? { ...prev, status: v } : null
                    )
                  }
                  options={ALL_STATUSES.map((s) => ({ value: s, label: s }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="关键人">
                <Input
                  value={editingSchool?.keyPerson || ''}
                  onChange={(e) =>
                    setEditingSchool((prev) =>
                      prev ? { ...prev, keyPerson: e.target.value } : null
                    )
                  }
                  placeholder="关键人姓名"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="产品">
            <Select
              mode="multiple"
              value={editingSchool?.products || []}
              onChange={(v) =>
                setEditingSchool((prev) =>
                  prev ? { ...prev, products: v } : null
                )
              }
              allowClear
              placeholder="可选择多个产品"
              options={ALL_PRODUCTS.map((p) => ({ value: p, label: p }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="所属街道">
                <Input
                  value={editingSchool?.street || ''}
                  onChange={(e) =>
                    setEditingSchool((prev) =>
                      prev ? { ...prev, street: e.target.value } : null
                    )
                  }
                  placeholder="如：新街口街道"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="备注">
                <Input
                  value={editingSchool?.remark || ''}
                  onChange={(e) =>
                    setEditingSchool((prev) =>
                      prev ? { ...prev, remark: e.target.value } : null
                    )
                  }
                  placeholder="备注信息"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="民办校">
            <Switch
              checked={editingSchool?.isPrivate || false}
              onChange={(v) =>
                setEditingSchool((prev) =>
                  prev ? { ...prev, isPrivate: v } : null
                )
              }
            />
            <Text type="secondary" style={{ marginLeft: 10, fontSize: 12 }}>
              标记为民办学校（将出现在民办校数据看板中）
            </Text>
          </Form.Item>
          <Form.Item label="市直属">
            <Switch
              checked={editingSchool?.isMunicipal || false}
              onChange={(v) =>
                setEditingSchool((prev) =>
                  prev ? { ...prev, isMunicipal: v } : null
                )
              }
            />
            <Text type="secondary" style={{ marginLeft: 10, fontSize: 12 }}>
              标记为市教育局直属学校（列表中显示「市直属」标签）
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入学校"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => {
          setImportModalOpen(false);
          setImportText('');
        }}
        okText="导入"
      >
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">
            每行一所学校，用 Tab/逗号/空格 分隔：<br />
            格式：学校名称 学段 状态 产品(多个用/分隔) 街道 关键人 备注
          </Text>
        </div>
        <TextArea
          rows={8}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`示例：\n${district.name}第一小学 小学 已合作 通识课/作文 新街口街道 张主任\n${district.name}第二中学 初中 试用中 作业 湖南路街道`}
        />
      </Modal>
    </div>
  );
}
