import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Space, Table, Tag, Input, Select } from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, ExperimentOutlined,
  EditOutlined, SearchOutlined, FilterOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import SchoolAnalytics from '../../components/SchoolAnalytics';
import { getScopedCity } from '../../store/permissions';
import type { School, SchoolStatus } from '../../types';
import { ALL_PRODUCTS } from '../../types';

const { Title, Text } = Typography;

export default function EssayProjectDashboard() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const { data } = useAppContext();
  const { user } = useAuth();

  const city = getScopedCity(user, cityId || '', data);

  // 筛选状态
  const [nameFilter, setNameFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [trialProductFilter, setTrialProductFilter] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [cooperationProductFilter, setCooperationProductFilter] = useState<string[]>([]);
  const [keyPersonFilter, setKeyPersonFilter] = useState('');
  const [streetFilter, setStreetFilter] = useState('');

  const essayData = useMemo(() => {
    if (!city) return { schools: [], total: 0, cooperating: 0, trialing: 0, reported: 0, pending: 0 };
    let schools: Array<School & { districtName: string; districtId: string }> = [];
    for (const d of city.districts) {
      for (const s of d.schools) {
        // 纳入范围：产品或合作产品中包含「作文」且非种子数据
        const hasEssay = (s.products && s.products.includes('作文')) || (s.cooperationProducts && s.cooperationProducts.includes('作文'));
        if (hasEssay && !s.seed) {
          schools.push({ ...s, districtName: d.name, districtId: d.id });
        }
      }
    }

    // 筛选逻辑不变...

    if (nameFilter.trim()) {
      const kw = nameFilter.trim().toLowerCase();
      schools = schools.filter((s) => s.name.toLowerCase().includes(kw));
    }
    if (districtFilter.length > 0) {
      schools = schools.filter((s) => districtFilter.includes(s.districtName));
    }
    if (stageFilter.length > 0) {
      schools = schools.filter((s) => s.stage && stageFilter.includes(s.stage));
    }
    if (statusFilter.length > 0) {
      schools = schools.filter((s) => statusFilter.includes(s.status));
    }
    if (trialProductFilter.length > 0) {
      schools = schools.filter((s) => s.trialProducts && s.trialProducts.some((p) => trialProductFilter.includes(p)));
    }
    if (productFilter.length > 0) {
      schools = schools.filter((s) => s.products && s.products.some((p) => productFilter.includes(p)));
    }
    if (cooperationProductFilter.length > 0) {
      schools = schools.filter((s) => s.cooperationProducts && s.cooperationProducts.some((p) => cooperationProductFilter.includes(p)));
    }
    if (keyPersonFilter.trim()) {
      const kw = keyPersonFilter.trim().toLowerCase();
      schools = schools.filter((s) => (s.keyPerson || '').toLowerCase().includes(kw));
    }
    if (streetFilter.trim()) {
      const kw = streetFilter.trim().toLowerCase();
      schools = schools.filter((s) => (s.street || '').toLowerCase().includes(kw));
    }

    return {
      schools,
      total: schools.length,
      // 作文专项统计：合作产品含「作文」= 已合作
      cooperating: schools.filter((s) => s.cooperationProducts && s.cooperationProducts.includes('作文')).length,
      // 产品含作文但合作产品不含作文 = 试用/推进中
      trialing: schools.filter((s) => (!s.cooperationProducts || !s.cooperationProducts.includes('作文'))).length,
      reported: 0,
      pending: 0,
    };
  }, [city, nameFilter, districtFilter, stageFilter, statusFilter, productFilter, cooperationProductFilter, keyPersonFilter, streetFilter]);

  const statusColor: Record<SchoolStatus, string> = {
    '已合作': 'green', '试用中': 'orange', '已汇报': 'purple', '待开发': 'default',
  };

  const handleExportCSV = () => {
    const headers = ['学校名称', '学段', '状态', '试用产品', '汇报产品', '合作产品', '关键人', '所属街道', '区县', '民办校', '市直属', '备注'];
    const rows = essayData.schools.map((s) => [
      s.name, s.stage || '', s.status,
      (s.trialProducts || []).join('、'),
      (s.products || []).join('、'),
      (s.cooperationProducts || []).join('、'),
      s.keyPerson || '', s.street || '',
      (s as any).districtName || '',
      s.isPrivate ? '是' : '否',
      s.isMunicipal ? '是' : '否',
      s.remark || '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${city?.name || '城市'}_作文专项名单_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const productColorMap: Record<string, string> = {
    '作文': '#1677ff', '作业': '#52c41a', '双师课': '#722ed1',
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

  const districtNames = [...new Set(city.districts.map((d) => d.name))];
  const stageNames = [...new Set(essayData.schools.map((s) => s.stage).filter(Boolean))] as string[];

  const statCards = [
    { title: '作文专项学校', value: essayData.total, icon: <EditOutlined />, color: '#1677ff' },
    { title: '已合作（作文）', value: essayData.cooperating, icon: <CheckCircleOutlined />, color: '#10b981' },
    { title: '推进中', value: essayData.trialing, icon: <ExperimentOutlined />, color: '#f59e0b' },
  ];

  const columns = [
    {
      title: '学校名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true,
      filtered: !!nameFilter,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 220 }}>
          <Input placeholder="搜索学校名称" value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            prefix={<SearchOutlined />} allowClear onPressEnter={() => close()} />
        </div>
      ),
      filterIcon: (f: boolean) => <SearchOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: '所属区县', dataIndex: 'districtName', key: 'district', width: 100,
      filtered: districtFilter.length > 0,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 180 }}>
          <Select mode="multiple" placeholder="筛选区县" value={districtFilter}
            onChange={(v) => setDistrictFilter(v)} style={{ width: '100%' }}
            options={districtNames.map((d) => ({ label: d, value: d }))}
            allowClear maxTagCount={2} onBlur={() => close()} autoFocus />
        </div>
      ),
      filterIcon: (f: boolean) => <FilterOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: '学段', dataIndex: 'stage', key: 'stage', width: 90,
      filtered: stageFilter.length > 0,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 180 }}>
          <Select mode="multiple" placeholder="筛选学段" value={stageFilter}
            onChange={(v) => setStageFilter(v)} style={{ width: '100%' }}
            options={stageNames.map((s) => ({ label: s, value: s }))}
            allowClear maxTagCount={2} onBlur={() => close()} autoFocus />
        </div>
      ),
      filterIcon: (f: boolean) => <FilterOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (t: string) => t || '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 85,
      filtered: statusFilter.length > 0,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 180 }}>
          <Select mode="multiple" placeholder="筛选状态" value={statusFilter}
            onChange={(v) => setStatusFilter(v)} style={{ width: '100%' }}
            options={['已合作','试用中','已汇报','待开发'].map((s) => ({ label: s, value: s }))}
            allowClear maxTagCount={2} onBlur={() => close()} autoFocus />
        </div>
      ),
      filterIcon: (f: boolean) => <FilterOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (s: SchoolStatus) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: '试用产品', dataIndex: 'trialProducts', key: 'trialProducts', width: 160,
      filtered: trialProductFilter.length > 0,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Select mode="multiple" placeholder="筛选试用产品" value={trialProductFilter}
            onChange={(v) => setTrialProductFilter(v)} style={{ width: '100%' }}
            options={ALL_PRODUCTS.map((p) => ({ label: p, value: p }))}
            allowClear maxTagCount={2} onBlur={() => close()} autoFocus />
        </div>
      ),
      filterIcon: (f: boolean) => <FilterOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (products: string[] | undefined) => {
        if (!products || products.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space size={2} wrap>
            {products.map((p) => <Tag key={p} color={productColorMap[p] || 'default'} style={{ margin: 0, fontSize: 11 }}>{p}</Tag>)}
          </Space>
        );
      },
    },
    {
      title: '合作产品', dataIndex: 'cooperationProducts', key: 'cooperationProducts', width: 160,
      filtered: cooperationProductFilter.length > 0,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Select mode="multiple" placeholder="筛选合作产品" value={cooperationProductFilter}
            onChange={(v) => setCooperationProductFilter(v)} style={{ width: '100%' }}
            options={ALL_PRODUCTS.map((p) => ({ label: p, value: p }))}
            allowClear maxTagCount={2} onBlur={() => close()} autoFocus />
        </div>
      ),
      filterIcon: (f: boolean) => <FilterOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (products: string[] | undefined) => {
        if (!products || products.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space size={2} wrap>
            {products.map((p) => <Tag key={p} color={productColorMap[p] || 'default'} style={{ margin: 0, fontSize: 11 }}>{p}</Tag>)}
          </Space>
        );
      },
    },
    {
      title: '汇报产品', dataIndex: 'products', key: 'products', width: 160,
      filtered: productFilter.length > 0,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Select mode="multiple" placeholder="筛选汇报产品" value={productFilter}
            onChange={(v) => setProductFilter(v)} style={{ width: '100%' }}
            options={ALL_PRODUCTS.map((p) => ({ label: p, value: p }))}
            allowClear maxTagCount={2} onBlur={() => close()} autoFocus />
        </div>
      ),
      filterIcon: (f: boolean) => <FilterOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (products: string[] | undefined) => {
        if (!products || products.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space size={2} wrap>
            {products.map((p) => <Tag key={p} color={productColorMap[p] || 'default'} style={{ margin: 0, fontSize: 11 }}>{p}</Tag>)}
          </Space>
        );
      },
    },
    {
      title: '关键人', dataIndex: 'keyPerson', key: 'keyPerson', width: 80,
      filtered: !!keyPersonFilter,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Input placeholder="搜索关键人" value={keyPersonFilter}
            onChange={(e) => setKeyPersonFilter(e.target.value)}
            prefix={<SearchOutlined />} allowClear onPressEnter={() => close()} />
        </div>
      ),
      filterIcon: (f: boolean) => <SearchOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (t: string) => t || '-',
    },
    {
      title: '所属街道', dataIndex: 'street', key: 'street', width: 110, ellipsis: true,
      filtered: !!streetFilter,
      filterDropdown: ({ close }: { close: () => void }) => (
        <div style={{ padding: 8, width: 200 }}>
          <Input placeholder="搜索街道" value={streetFilter}
            onChange={(e) => setStreetFilter(e.target.value)}
            prefix={<SearchOutlined />} allowClear onPressEnter={() => close()} />
        </div>
      ),
      filterIcon: (f: boolean) => <SearchOutlined style={{ color: f ? '#1677ff' : undefined }} />,
      render: (t: string) => t || '-',
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 140, ellipsis: true, render: (t: string) => t || '-' },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/city/${cityId}`)} style={{ borderRadius: 8, fontWeight: 500 }}>
          返回{city.name}
        </Button>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          <EditOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          {city.name}作文专项数据看板
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

      <SchoolAnalytics schools={essayData.schools} groupBy="district" groupLabel="区县" mode="essay"
        allSchoolsTotal={city ? city.districts.reduce((sum, d) => sum + d.schools.filter((s) => !s.seed).length, 0) : 0}
        districtSchoolTotals={(() => {
          const map: Record<string, number> = {};
          for (const d of city?.districts || []) {
            map[d.name] = d.schools.filter((s) => !s.seed).length;
          }
          return map;
        })()}
      />

      <Card title={<Space><EditOutlined style={{ color: '#1677ff' }} /><span style={{ fontWeight: 600, color: '#1e293b' }}>作文专项学校明细</span></Space>}
        extra={<Button type="text" size="small" onClick={handleExportCSV} style={{ color: '#8b9cb0', fontSize: 12 }}>导出</Button>}
        style={{ borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Table rowKey="id" columns={columns} dataSource={essayData.schools} size="middle" scroll={{ x: 1000 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 所学校` }}
          onRow={(record) => ({
            onClick: () => navigate(`/city/${cityId}/${record.districtId}`),
            style: { cursor: 'pointer' },
          })} />
      </Card>
    </div>
  );
}
