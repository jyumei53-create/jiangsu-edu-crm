import { useState, useEffect, useCallback } from 'react';
import type { AppData } from '../types';
import { loadAppData, saveAppData } from './index';
import { loadSession, loadUsers } from './auth';

/** 获取当前登录用户的允许城市 ID */
function getAllowedCityIds(): string[] | null {
  const session = loadSession();
  if (!session) return null;
  const users = loadUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return null;
  if (user.role === 'admin') return null; // null 表示全部
  return user.allowedCityIds;
}

/** 根据权限过滤数据 */
function filterDataByPermission(data: AppData): AppData {
  const allowedIds = getAllowedCityIds();
  if (allowedIds === null) return data; // 管理员：不过滤

  return {
    ...data,
    cities: data.cities.filter((c) => allowedIds.includes(c.id)),
  };
}

export function useAppState() {
  const [data, setData] = useState<AppData>(() => {
    const raw = loadAppData();
    return filterDataByPermission(raw);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = loadAppData();
    setData(filterDataByPermission(d));
    setLoading(false);
  }, []);

  const updateData = useCallback((newData: AppData) => {
    const ok = saveAppData(newData);
    if (ok) {
      setData(filterDataByPermission(newData));
    }
    return ok;
  }, []);

  return { data, setData: updateData, loading };
}
