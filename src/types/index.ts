// ==================== 数据模型 v3 ====================

/** 学校状态 */
export type SchoolStatus = '已合作' | '试用中' | '已汇报' | '待开发';

/** 学校 */
export interface School {
  id: string;
  name: string;
  status: SchoolStatus;
  stage?: string;
  trialProducts?: string[];
  products?: string[];
  cooperationProducts?: string[];
  street?: string;
  keyPerson?: string;
  remark?: string;
  order: number;
  isPrivate?: boolean;
  seed?: boolean;
  isMunicipal?: boolean;
}

/** 教育局领导 */
export interface EducationLeader {
  id: string;
  name: string;
  position: string;
  phone?: string;
  wechat?: string;
  email?: string;
  lastContact?: string;
  notes?: string;
}

/** 区域统筹项目 */
export interface DistrictProject {
  id: string;
  category: '市场现状' | '人工智能通识' | '心理通识';
  content: string;
  updatedAt?: string;
}

/** 区县 */
export interface District {
  id: string;
  name: string;
  isKey: boolean;
  /** 区域合作状态面板中的展示排序（仅在同一 isKey 组内生效，数字越小越靠前） */
  order?: number;
  projects: DistrictProject[];
  schools: School[];
  leaders: EducationLeader[];
}

/** 地级市 */
export interface City {
  id: string;
  name: string;
  districts: District[];
  cityLeaders: EducationLeader[];
}

/** 应用根数据 */
export interface AppData {
  version: number;
  cities: City[];
  updatedAt: string;
  /** 无锡市学校种子版本：用于精准迁移，避免覆盖用户在其他城市/项目的编辑 */
  wuxiSeedVersion?: number;
}

// ==================== 常量 ====================

export const ALL_STATUSES: SchoolStatus[] = ['已合作', '试用中', '已汇报', '待开发'];

export const ALL_PRODUCTS = [
  '作文',
  '作业',
  '双师课',
  '飞象老师',
  '学习空间',
  '墨水屏',
] as const;

export const PROJECT_CATEGORIES: DistrictProject['category'][] = [
  '市场现状',
  '人工智能通识',
  '心理通识',
];
