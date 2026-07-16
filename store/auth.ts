import type { User, Session, LoginCredentials } from '../types/auth';

const USERS_KEY = 'jiangsu_crm_users';
const SESSION_KEY = 'jiangsu_crm_session';

// ==================== 密码哈希 ====================

/** SHA-256 哈希（浏览器 Web Crypto API） */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ==================== 默认账号 ====================

const DEFAULT_USERS: Omit<User, 'id'>[] = [
  {
    username: 'admin',
    passwordHash: '', // 将在初始化时设置
    role: 'admin',
    displayName: '系统管理员',
    allowedCityIds: [],
  },
  {
    username: 'sunan',
    passwordHash: '',
    role: 'manager',
    displayName: '苏南区域经理',
    allowedCityIds: ['nanjing', 'suzhou', 'wuxi', 'changzhou', 'zhenjiang'],
  },
  {
    username: 'suzhong',
    passwordHash: '',
    role: 'manager',
    displayName: '苏中区域经理',
    allowedCityIds: ['nantong', 'yangzhou', 'taizhou', 'yancheng'],
  },
  {
    username: 'subei',
    passwordHash: '',
    role: 'manager',
    displayName: '苏北区域经理',
    allowedCityIds: ['xuzhou', 'lianyungang', 'huaian', 'suqian'],
  },
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  sunan: 'sunan123',
  suzhong: 'suzhong123',
  subei: 'subei123',
};

// ==================== 用户管理 ====================

/** 初始化默认用户 */
export async function initDefaultUsers(): Promise<void> {
  const existing = loadUsers();
  if (existing.length > 0) return;

  const users: User[] = [];
  for (const u of DEFAULT_USERS) {
    users.push({
      ...u,
      id: Math.random().toString(36).substring(2, 10),
      passwordHash: await sha256(DEFAULT_PASSWORDS[u.username] || '123456'),
    });
  }

  saveUsersRaw(users);
}

/** 加载所有用户 */
export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** 保存用户列表 */
function saveUsersRaw(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** 验证登录 */
export async function authenticate(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = loadUsers();
  const user = users.find((u) => u.username === credentials.username);

  if (!user) {
    return { success: false, error: '用户名或密码错误' };
  }

  const inputHash = await sha256(credentials.password);
  if (inputHash !== user.passwordHash) {
    return { success: false, error: '用户名或密码错误' };
  }

  return { success: true, user };
}

// ==================== Session 管理 ====================

/** 生成 session token */
export function createSession(userId: string): Session {
  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 小时过期

  const session: Session = { token, userId, expiresAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** 加载当前 session */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);

    // 检查过期
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/** 清除 session */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** 生成随机 token */
function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ==================== 用户 CRUD（管理员用） ====================

export async function createUser(user: Omit<User, 'id' | 'passwordHash'> & { password: string }): Promise<User> {
  const users = loadUsers();
  const newUser: User = {
    id: Math.random().toString(36).substring(2, 10),
    username: user.username,
    passwordHash: await sha256(user.password),
    role: user.role,
    displayName: user.displayName,
    allowedCityIds: user.allowedCityIds,
  };
  users.push(newUser);
  saveUsersRaw(users);
  return newUser;
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'passwordHash'>> & { password?: string }): Promise<User | null> {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const updated = { ...users[idx], ...updates };
  if (updates.password) {
    updated.passwordHash = await sha256(updates.password);
  }

  users[idx] = updated;
  saveUsersRaw(users);
  return updated;
}

export function deleteUser(userId: string): boolean {
  const users = loadUsers();
  const filtered = users.filter((u) => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveUsersRaw(filtered);
  return true;
}
