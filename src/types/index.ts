// ==================== 数据模型 v3 ====================

/** 学校状态 */
export type SchoolStatus = '已合作' | '试用中' | '已汇报' | '待开发';

/** 学校 */
export interface School {
  id: string;
  name: string;
  status: SchoolStatus;
  stage?: string;
  product?: string;
  street?: string;
  remark?: string;
  order: number;
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
}

// ==================== 常量 ====================

export const ALL_STATUSES: SchoolStatus[] = ['已合作', '试用中', '已汇报', '待开发'];

export const ALL_PRODUCTS = [
  '作文',
  '作业',
  '通识课',
  '飞象老师',
  '学习空间',
  '墨水屏',
] as const;

export const PROJECT_CATEGORIES: DistrictProject['category'][] = [
  '市场现状',
  '人工智能通识',
  '心理通识',
];
