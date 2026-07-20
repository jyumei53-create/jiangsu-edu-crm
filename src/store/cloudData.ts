/**
 * 云端数据模块 — 基于 GitHub 仓库作为数据后端
 * 
 * 数据流程：
 * 1. 用户录入数据 → localStorage 保存（本地即时生效）
 * 2. 保存时自动推送到 GitHub 仓库 data/app-data.json（fire-and-forget，不影响本地）
 * 3. 其他用户打开系统 → 点击"从云端拉取"按钮 → 从 GitHub Raw 下载 → 覆盖 localStorage
 * 
 * 核心原则：
 * - 初始化 100% 同步读取 localStorage，零异步网络请求
 * - 上传是 fire-and-forget，不阻塞用户操作
 * - 下载是用户主动触发，不自动覆盖
 */

import type { AppData } from '../types';

const GITHUB_API_BASE = 'https://api.github.com/repos/jyumei53-create/jiangsu-edu-crm';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/jyumei53-create/jiangsu-edu-crm/main/data/app-data.json';
const DATA_FILE_PATH = 'data/app-data.json';

/** 从 sessionStorage 获取 GitHub Token（管理员登录后设置） */
function getToken(): string | null {
  try {
    return sessionStorage.getItem('crm_github_token');
  } catch {
    return null;
  }
}

/**
 * 自动推送数据到 GitHub 云端存储
 * Fire-and-forget：不阻塞本地保存，失败静默处理
 */
export function pushToCloud(data: AppData): void {
  const token = getToken();
  if (!token) return; // 未配置 Token，静默跳过

  // 异步执行，不阻塞主线程
  (async () => {
    try {
      const content = JSON.stringify(data, null, 2);
      const base64 = btoa(unescape(encodeURIComponent(content)));

      // 获取当前文件 SHA
      let sha = '';
      try {
        const resp = await fetch(`${GITHUB_API_BASE}/contents/${DATA_FILE_PATH}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const json = await resp.json();
          sha = json.sha || '';
        }
      } catch { /* 文件可能不存在 */ }

      const body: Record<string, string> = {
        message: `data: 自动同步 - ${new Date().toLocaleString('zh-CN')}`,
        content: base64,
        branch: 'main',
      };
      if (sha) body.sha = sha;

      await fetch(`${GITHUB_API_BASE}/contents/${DATA_FILE_PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('✅ 数据已自动同步到云端');
    } catch (e) {
      // 静默失败，不影响本地操作
      console.warn('云端自动同步失败:', e);
    }
  })();
}

/**
 * 从云端拉取最新数据
 * 用户主动触发（登录页按钮）
 */
export async function pullFromCloud(): Promise<AppData | null> {
  try {
    const resp = await fetch(GITHUB_RAW_URL, {
      cache: 'no-store', // 不使用缓存，确保获取最新数据
    });
    if (!resp.ok) return null;

    const data: AppData = await resp.json();
    if (!data.cities || !data.version) return null;
    if (data.cities.length === 0) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * 设置 GitHub Token 到 sessionStorage
 */
export function setCloudToken(token: string): void {
  try {
    sessionStorage.setItem('crm_github_token', token);
  } catch { /* ignore */ }
}

/**
 * 检查是否已配置 Token
 */
export function hasCloudToken(): boolean {
  return getToken() !== null;
}
