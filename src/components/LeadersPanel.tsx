import { useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Tag,
  message,
  Popconfirm,
  Empty,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  WechatOutlined,
  MailOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { EducationLeader, AppData } from '../types';
import { updateDistrict } from '../store';

const { Text } = Typography;

interface Props {
  district: import('../types').District;
  data: AppData;
  setData: (newData: AppData) => boolean;
  cityId: string;
}

export default function LeadersPanel({ district, data, setData, cityId }: Props) {
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

  const leaders = district.leaders;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加领导
        </Button>
      </div>

      {leaders.length === 0 ? (
        <Empty description="暂无教育局领导信息，点击上方按钮添加" />
      ) : (
        <Row gutter={[16, 16]}>
          {leaders.map((leader) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={leader.id}>
              <Card
                hoverable
                size="small"
                actions={[
                  <EditOutlined
                    key="edit"
                    onClick={() => handleEdit(leader)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定删除此领导？"
                    onConfirm={() => handleDelete(leader.id)}
                  >
                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                  </Popconfirm>,
                ]}
              >
                <div style={{ marginBottom: 8 }}>
                  <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                  <Text strong style={{ fontSize: 15 }}>
                    {leader.name}
                  </Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Tag color="blue">{leader.position}</Tag>
                </div>

                {leader.phone && (
                  <div style={{ marginBottom: 2 }}>
                    <PhoneOutlined style={{ marginRight: 6, color: '#999', fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>{leader.phone}</Text>
                  </div>
                )}
                {leader.wechat && (
                  <div style={{ marginBottom: 2 }}>
                    <WechatOutlined style={{ marginRight: 6, color: '#52c41a', fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>{leader.wechat}</Text>
                  </div>
                )}
                {leader.email && (
                  <div style={{ marginBottom: 2 }}>
                    <MailOutlined style={{ marginRight: 6, color: '#999', fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>{leader.email}</Text>
                  </div>
                )}
                {leader.lastContact && (
                  <div style={{ marginBottom: 2 }}>
                    <CalendarOutlined style={{ marginRight: 6, color: '#999', fontSize: 12 }} />
                    <Text style={{ fontSize: 12 }}>最近联系：{leader.lastContact}</Text>
                  </div>
                )}
                {leader.notes && (
                  <div style={{ marginTop: 4 }}>
                    <FileTextOutlined style={{ marginRight: 6, color: '#999', fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
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
