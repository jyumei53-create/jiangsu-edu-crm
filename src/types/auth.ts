// ==================== 认证相关类型 ====================

/** 用户角色 */
export type UserRole = 'admin' | 'manager';

/** 用户 */
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  allowedCityIds: string[];
  /** 区县级权限：为空表示「所负责城市的全部区县」；非空则仅限列表内的具体区县 */
  allowedDistrictIds: string[];
}

/** 会话 token */
export interface Session {
  token: string;
  userId: string;
  expiresAt: number; // 时间戳（毫秒）
}

/** 认证状态 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

/** 登录凭据 */
export interface LoginCredentials {
  username: string;
  password: string;
}
