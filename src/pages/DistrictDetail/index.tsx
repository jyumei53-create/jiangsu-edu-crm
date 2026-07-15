import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  InputNumber,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tabs,
  Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { School, SchoolStatus, AppData } from '../../types';
import { ALL_STATUSES } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { updateDistrict } from '../../store';
import LeadersPanel from '../../components/LeadersPanel';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function DistrictDetail() {
  const { cityId, districtId } = useParams<{ cityId: string; districtId: string }>();
  const navigate = useNavigate();
  const { data, setData } = useAppContext();

  const city = data.cities.find((c) => c.id === cityId);
  const district = city?.districts.find((d) => d.id === districtId);

  if (!city || !district) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={4}>区县未找到</Title>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'schools',
      label: `学校管理 (${district.schools.length})`,
      children: (
        <SchoolPanel
          cityId={cityId!}
          district={district}
          data={data}
          setData={setData}
        />
      ),
    },
    {
      key: 'leaders',
      label: `教育局领导 (${district.leaders.length})`,
      children: (
        <LeadersPanel
          district={district}
          data={data}
          setData={setData}
          cityId={cityId!}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/city/${cityId}`)}
        >
          返回{city.name}
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {district.name}
        </Title>
        {district.isKey && <Tag color="blue">重点区域</Tag>}
      </div>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

// ==================== 学校面板 ====================

function SchoolPanel({ cityId, district, data, setData }: {
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
      product: '',
      address: '',
      keyPerson: '',
      contactPhone: '',
      order: district.schools.length + 1,
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
      updatedSchools = [...district.schools, editingSchool];
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
      const [name, stage, status, product, address] = parts;

      return {
        id: Math.random().toString(36).substring(2, 10),
        name: name || `未命名学校 ${i + 1}`,
        status: (ALL_STATUSES.includes(status as SchoolStatus) ? status : '待开发') as SchoolStatus,
        stage: stage || '',
        product: product || '',
        address: address || '',
        keyPerson: '',
        contactPhone: '',
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

  const statusColor: Record<SchoolStatus, string> = {
    '已合作': 'green',
    '试用中': 'orange',
    '已汇报': 'purple',
    '待开发': 'default',
  };

  const columns: ColumnsType<School> = [
    {
      title: '顺序',
      dataIndex: 'order',
      key: 'order',
      width: 90,
      render: (_: unknown, record: School) => (
        <InputNumber
          size="small"
          min={1}
          max={district.schools.length}
          value={orderCache[record.id] ?? record.order}
          onChange={(v) => handleOrderChange(record.id, v)}
          onPressEnter={() => handleOrderSubmit(record.id, record.order)}
          onBlur={() => handleOrderSubmit(record.id, record.order)}
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: '学校名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '学段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SchoolStatus) => (
        <Tag color={statusColor[status]}>{status}</Tag>
      ),
    },
    {
      title: '产品',
      dataIndex: 'product',
      key: 'product',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '关键人',
      dataIndex: 'keyPerson',
      key: 'keyPerson',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
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
          gap: 8,
        }}
      >
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSchool}>
            添加学校
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
            批量导入
          </Button>
        </Space>

        {selectedRowKeys.length > 0 && (
          <Space>
            <Text type="secondary">已选 {selectedRowKeys.length} 项</Text>
            <Dropdown
              menu={{
                items: ALL_STATUSES.map((s) => ({
                  key: s,
                  label: s,
                  onClick: () => handleBatchStatus(s),
                })),
              }}
            >
              <Button>批量改状态</Button>
            </Dropdown>
            <Popconfirm
              title={`确定删除 ${selectedRowKeys.length} 所学校？`}
              onConfirm={handleBatchDelete}
            >
              <Button danger>批量删除</Button>
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
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 所学校`,
        }}
        size="middle"
        scroll={{ x: 900 }}
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
            <Col span={12}>
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
            <Col span={12}>
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
          </Row>
          <Form.Item label="产品">
            <Input
              value={editingSchool?.product || ''}
              onChange={(e) =>
                setEditingSchool((prev) =>
                  prev ? { ...prev, product: e.target.value } : null
                )
              }
              placeholder="请输入产品名称"
            />
          </Form.Item>
          <Form.Item label="地址">
            <Input
              value={editingSchool?.address || ''}
              onChange={(e) =>
                setEditingSchool((prev) =>
                  prev ? { ...prev, address: e.target.value } : null
                )
              }
              placeholder="请输入地址"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item label="联系电话">
                <Input
                  value={editingSchool?.contactPhone || ''}
                  onChange={(e) =>
                    setEditingSchool((prev) =>
                      prev ? { ...prev, contactPhone: e.target.value } : null
                    )
                  }
                  placeholder="联系电话"
                />
              </Form.Item>
            </Col>
          </Row>
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
            格式：学校名称 学段 状态 产品 地址
          </Text>
        </div>
        <TextArea
          rows={8}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`示例：\n${district.name}第一小学 小学 已合作 AI通识课\n${district.name}第二中学 初中 试用中 心理通识`}
        />
      </Modal>
    </div>
  );
}
