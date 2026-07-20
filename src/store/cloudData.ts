/**
 * 云端数据模块
 * 
 * 数据流程：
 * 1. 管理员录入数据 → localStorage
 * 2. 点击"同步到云端" → GitHub API 更新 cloud-data.json
 * 3. GitHub Actions 自动构建 → 数据打���进 JS bundle
 * 4. 其他用户刷新 → 自动合并云端数据到 localStorage
 * 
 * 全程同步操作，零异步网络请求，不会导致白屏。
 */

import type { AppData } from '../types';

// cloud-data.json 由 Vite 构建时打包进 bundle
// 初始为空对象，管理员同步后包含完整业务数据
import cloudDataRaw from './cloud-data.json';

/** 获取打包进 bundle 的云端数据 */
export function getCloudData(): AppData | null {
  try {
    // cloud-data.json 为空对象 {} 表示未同步过
    if (!cloudDataRaw || typeof cloudDataRaw !== 'object') return null;
    const data = cloudDataRaw as any;
    // 必须有 cities 和 version 才视为有效数据
    if (!data.cities || !data.version) return null;
    if (data.cities.length === 0) return null;
    return data as AppData;
  } catch {
    return null;
  }
}

/**
 * 将云端数据合并到本地数据
 * 策略：云端数据中的学校信息（状态、产品、1把手等）覆盖本地
 * 但保留本地独有的学校（云端没有的 = 管理员新增的）
 */
export function mergeCloudToLocal(localData: AppData, cloudData: AppData): AppData {
  const merged = { ...localData };
  const cloudWuxi = cloudData.cities.find((c: any) => c.id === 'wuxi');
  const localWuxi = merged.cities.find((c: any) => c.id === 'wuxi');

  if (cloudWuxi && localWuxi) {
    for (const cd of cloudWuxi.districts) {
      const ld = localWuxi.districts.find((d: any) => d.id === cd.id);
      if (!ld) continue;

      // 云端学校名称集合
      const cloudNames = new Set((cd.schools || []).map((s: any) => s.name));

      // 保留本地独有的学校（不在云端数据中的）
      const localOnly = (ld.schools || []).filter((s: any) => !cloudNames.has(s.name));

      // 云端数据覆盖本地（云端数据是最新同步的）
      ld.schools = [...(cd.schools || []), ...localOnly];
    }
  }

  merged.updatedAt = new Date().toISOString();
  return merged;
}
