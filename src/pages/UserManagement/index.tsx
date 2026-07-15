import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { User, UserRole } from '../../types/auth';
import { loadUsers, createUser, updateUser, deleteUser } from '../../store/auth';
import { useAppContext } from '../../store/AppContext';

const { Title, Text } = Typography;

export default function UserManagement() {
  const navigate = useNavigate();
  const { data } = useAppContext();
  const [users, setUsers] = useState<User[]>(() => loadUsers());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string }>({});

  const refreshUsers = () => setUsers(loadUsers());

  const handleAdd = () => {
    setEditingUser({
      username: '',
      password: '',
      role: 'manager',
      displayName: '',
      allowedCityIds: [],
      allowedDistrictIds: [],
    });
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser({
      ...user,
      password: '',
      allowedDistrictIds: user.allowedDistrictIds || [],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser.username?.trim()) {
      message.warning('请输入用户名');
      return;
    }
    if (!editingUser.displayName?.trim()) {
      message.warning('请输入显示名称');
      return;
    }

    const existing = users.find((u) => u.id === editingUser.id);

    if (existing) {
      // 编辑
      const updates: Parameters<typeof updateUser>[1] = {
        username: editingUser.username!,
        role: editingUser.role as UserRole,
        displayName: editingUser.displayName!,
        allowedCityIds: editingUser.allowedCityIds || [],
        allowedDistrictIds: editingUser.allowedDistrictIds || [],
      };
      if (editingUser.password) {
        updates.password = editingUser.password;
      }
      const result = await updateUser(existing.id, updates);
      if (result) {
        message.success('用户已更新');
        refreshUsers();
        setModalOpen(false);
      } else {
        message.error('更新失败');
      }
    } else {
      // 新建
      if (!editingUser.password?.trim()) {
        message.warning('请输入密码');
        return;
      }
      try {
        await createUser({
          username: editingUser.username!,
          password: editingUser.password!,
          role: editingUser.role as UserRole,
          displayName: editingUser.displayName!,
          allowedCityIds: editingUser.allowedCityIds || [],
          allowedDistrictIds: editingUser.allowedDistrictIds || [],
        });
        message.success('用户已创建');
        refreshUsers();
        setModalOpen(false);
      } catch {
        message.error('创建失败');
      }
    }
  };

  const handleDelete = (userId: string) => {
    const ok = deleteUser(userId);
    if (ok) {
      message.success('已删除');
      refreshUsers();
    } else {
      message.error('删除失败');
    }
  };

  // 已选城市下的区县选项（按城市分组），用于「负责区县」多选
  const districtOptions = useMemo(() => {
    const cityIds = editingUser.allowedCityIds || [];
    return data.cities
      .filter((c) => cityIds.includes(c.id))
      .map((c) => ({
        label: c.name,
        options: c.districts.map((d) => ({ value: d.id, label: d.name })),
      }));
  }, [editingUser.allowedCityIds, data.cities]);

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: UserRole) => (
        <Tag color={role === 'admin' ? 'blue' : 'green'}>
          {role === 'admin' ? '管理员' : '区域经理'}
        </Tag>
      ),
    },
    {
      title: '负责城市 / 区县',
      dataIndex: 'allowedCityIds',
      key: 'allowedCityIds',
      render: (ids: string[], record: User) => {
        if (record.role === 'admin') return <Tag color="blue">全部</Tag>;
        if (!ids || ids.length === 0) return <Text type="secondary">无</Text>;
        const cityNames = ids
          .map((id) => data.cities.find((c) => c.id === id)?.name)
          .filter(Boolean);
        const districtIds = record.allowedDistrictIds || [];
        return (
          <div>
            <Space size={4} wrap>
              {cityNames.map((n) => (
                <Tag key={n} color="green" style={{ margin: 0 }}>{n?.replace('市', '')}</Tag>
              ))}
            </Space>
            {districtIds.length === 0 ? (
              <div style={{ marginTop: 4 }}>
                <Tag style={{ margin: 0, fontSize: 11 }} color="default">全部区县</Tag>
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                <Space size={2} wrap>
                  {districtIds.map((did) => {
                    const city = data.cities.find((c) => c.districts.some((d) => d.id === did));
                    const dName = city?.districts.find((d) => d.id === did)?.name;
                    return dName ? (
                      <Tag key={did} style={{ margin: 0, fontSize: 11 }}>{dName.replace(/区$|县$/, '')}</Tag>
                    ) : null;
                  })}
                </Space>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定删除此用户？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
          用户管理
        </Title>
      </div>

      <Card
        style={{
          borderRadius: 14,
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            添加用户
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          pagination={false}
          size="middle"
          style={{ borderRadius: 10 }}
        />

        {/* 编辑/添加弹窗 */}
        <Modal
          title={editingUser.id ? '编辑用户' : '添加用户'}
          open={modalOpen}
          onOk={handleSave}
          onCancel={() => setModalOpen(false)}
          destroyOnClose
          width={520}
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="用户名" required>
                  <Input
                    value={editingUser.username || ''}
                    onChange={(e) =>
                      setEditingUser((prev) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="登录用户名"
                    disabled={!!editingUser.id}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="显示名称" required>
                  <Input
                    value={editingUser.displayName || ''}
                    onChange={(e) =>
                      setEditingUser((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="如：苏南区域经理"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="密码" required={!editingUser.id}>
                  <Input.Password
                    value={editingUser.password || ''}
                    onChange={(e) =>
                      setEditingUser((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder={editingUser.id ? '留空则不修改' : '请输入密码'}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="角色" required>
                  <Select
                    value={editingUser.role || 'manager'}
                    onChange={(v) =>
                      setEditingUser((prev) => ({ ...prev, role: v }))
                    }
                    options={[
                      { value: 'admin', label: '管理员（全部权限）' },
                      { value: 'manager', label: '区域经理（限定城市）' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            {(editingUser.role === 'manager' || editingUser.role === undefined) && (
              <Form.Item label="负责城市">
                <Select
                  mode="multiple"
                  value={editingUser.allowedCityIds || []}
                  onChange={(v) =>
                    setEditingUser((prev) => {
                      // 切换城市时，剔除已不属于所选城市的区县，避免脏数据
                      const citySet = new Set(v);
                      const pruned = (prev.allowedDistrictIds || []).filter((did) =>
                        data.cities.some(
                          (c) => citySet.has(c.id) && c.districts.some((d) => d.id === did)
                        )
                      );
                      return { ...prev, allowedCityIds: v, allowedDistrictIds: pruned };
                    })
                  }
                  placeholder="选择该用户可管理的城市"
                  options={data.cities.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
              </Form.Item>
            )}

            {(editingUser.role === 'manager' || editingUser.role === undefined) &&
              (editingUser.allowedCityIds || []).length > 0 && (
                <Form.Item
                  label="负责区县"
                  extra="不选择具体区县 = 可管理所选城市的全部区县；选择后仅限指定区县。"
                >
                  <Select
                    mode="multiple"
                    value={editingUser.allowedDistrictIds || []}
                    onChange={(v) =>
                      setEditingUser((prev) => ({ ...prev, allowedDistrictIds: v }))
                    }
                    placeholder="选择具体区县（可留空表示全部）"
                    options={districtOptions}
                  />
                </Form.Item>
              )}
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
