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
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 14 }} />
          </div>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{district.name}</span>
          {district.isKey && <Tag color="blue" style={{ borderRadius: 6 }}>重点</Tag>}
        </Space>
      }
      extra={
        !editing && (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={handleStartEdit}
            style={{ color: '#94a3b8' }}
          />
        )
      }
      onClick={editing ? undefined : onClick}
      style={{
        cursor: editing ? 'default' : 'pointer',
        borderRadius: 12,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      styles={{ body: { padding: '14px 18px' } }}
    >
      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          {PROJECT_CATEGORIES.map((cat) => {
            const p = editProjects.find((p) => p.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {cat}
                </Text>
                <Input
                  size="small"
                  value={p?.content || ''}
                  onChange={(e) => handleProjectChange(cat, e.target.value)}
                  placeholder={`请输入${cat}`}
                  style={{ marginTop: 4, borderRadius: 6 }}
                />
              </div>
            );
          })}
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <Button size="small" type="primary" onClick={handleSave} style={{ borderRadius: 6 }}>
              保存
            </Button>
            <Button size="small" onClick={handleCancel} style={{ borderRadius: 6 }}>
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
              <div key={cat} style={{ marginBottom: 5 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {cat}：
                </Text>
                <Text style={{ fontSize: 13, color: '#475569' }}>{content}</Text>
              </div>
            );
          })}
          <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>
              学校：<b style={{ color: '#475569' }}>{schoolCount}</b>所
            </Text>
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>
              已合作：<b style={{ color: '#475569' }}>{cooperatingCount}</b>所
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
