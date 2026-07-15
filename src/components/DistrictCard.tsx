import { useState } from 'react';
import { Card, Button, Input, Space, Tag, message, Typography } from 'antd';
import { EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { DistrictProject } from '../types';
import { PROJECT_CATEGORIES } from '../types';
import { useAppContext } from '../store/AppContext';
import { updateDistrict } from '../store';

const { Text } = Typography;

interface Props {
  district: import('../types').District;
  onClick: () => void;
  cityId?: string;
}

export default function DistrictCard({ district, onClick, cityId }: Props) {
  const { data, setData } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [editProjects, setEditProjects] = useState<DistrictProject[]>([]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProjects(
      district.projects.map((p) => ({ ...p }))
    );
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = () => {
    const result = updateDistrict(data, cityId || '', district.id, (d) => ({
      ...d,
      projects: editProjects,
    }));

    if (result.success) {
      setData(result.data);
      message.success('保存成功');
      setEditing(false);
    } else {
      message.error('保存失败，请重试');
    }
  };

  const handleProjectChange = (category: DistrictProject['category'], value: string) => {
    setEditProjects((prev) =>
      prev.map((p) =>
        p.category === category ? { ...p, content: value } : p
      )
    );
  };

  const getProjectContent = (category: DistrictProject['category']) => {
    const p = district.projects.find((p) => p.category === category);
    return p?.content || '';
  };

  const schoolCount = district.schools.length;
  const cooperatingCount = district.schools.filter((s) => s.status === '已合作').length;

  return (
    <Card
      hoverable
      title={
        <Space>
          <EnvironmentOutlined />
          <span>{district.name}</span>
          {district.isKey && <Tag color="blue">重点</Tag>}
        </Space>
      }
      extra={
        !editing && (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={handleStartEdit}
          />
        )
      }
      onClick={editing ? undefined : onClick}
      style={{ cursor: editing ? 'default' : 'pointer' }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          {PROJECT_CATEGORIES.map((cat) => {
            const p = editProjects.find((p) => p.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cat}
                </Text>
                <Input
                  size="small"
                  value={p?.content || ''}
                  onChange={(e) => handleProjectChange(cat, e.target.value)}
                  placeholder={`请输入${cat}`}
                  style={{ marginTop: 2 }}
                />
              </div>
            );
          })}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Button size="small" type="primary" onClick={handleSave}>
              保存
            </Button>
            <Button size="small" onClick={handleCancel}>
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {PROJECT_CATEGORIES.map((cat) => {
            const content = getProjectContent(cat);
            if (!content) return null;
            return (
              <div key={cat} style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cat}：
                </Text>
                <Text style={{ fontSize: 13 }}>{content}</Text>
              </div>
            );
          })}
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              学校：{schoolCount}所
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              已合作：{cooperatingCount}所
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
