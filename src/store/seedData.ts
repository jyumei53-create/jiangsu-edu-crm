import type { AppData, City, District, School } from '../types';

const createId = () => Math.random().toString(36).substring(2, 10);

// ==================== 江苏省 13 市 95 区县数据 ====================

interface DistrictDef {
  id: string;
  name: string;
  isKey?: boolean;
  projects?: { category: '市场现状' | '人工智能通识' | '心理通识'; content: string }[];
}

interface CityDef {
  id: string;
  name: string;
  districts: DistrictDef[];
}

const JIANGSU_CITIES: CityDef[] = [
  {
    id: 'nanjing',
    name: '南京市',
    districts: [
      { id: 'xuanwu', name: '玄武区' },
      { id: 'qinhuai', name: '秦淮区' },
      { id: 'jianye', name: '建邺区' },
      { id: 'gulou_nj', name: '鼓楼区' },
      { id: 'pukou', name: '浦口区' },
      { id: 'qixia', name: '栖霞区' },
      { id: 'yuhuatai', name: '雨花台区' },
      { id: 'jiangning', name: '江宁区' },
      { id: 'liuhe', name: '六合区' },
      { id: 'lishui', name: '溧水区' },
      { id: 'gaochun', name: '高淳区' },
    ],
  },
  {
    id: 'wuxi',
    name: '无锡市',
    districts: [
      { id: 'xishan', name: '锡山区', isKey: true, projects: [{ category: '市场现状', content: '飞象部分统筹' }, { category: '人工智能通识', content: '全区统筹2个年级（小学1个+初中1个）' }, { category: '心理通识', content: '' }] },
      { id: 'huishan', name: '惠山区', isKey: true },
      { id: 'binhu', name: '滨湖区', isKey: true, projects: [{ category: '市场现状', content: '' }, { category: '人工智能通识', content: '' }, { category: '心理通识', content: '未续费' }] },
      { id: 'liangxi', name: '梁溪区', isKey: true, projects: [{ category: '市场现状', content: '飞象统筹' }, { category: '人工智能通识', content: '飞象统筹' }, { category: '心理通识', content: '' }] },
      { id: 'xinwu', name: '新吴区' },
      { id: 'jiangyin', name: '江阴市' },
      { id: 'yixing', name: '宜兴市' },
    ],
  },
  {
    id: 'xuzhou',
    name: '徐州市',
    districts: [
      { id: 'gulou_xz', name: '鼓楼区' },
      { id: 'yunlong', name: '云龙区' },
      { id: 'jiawang', name: '贾汪区' },
      { id: 'quanshan', name: '泉山区' },
      { id: 'tongshan', name: '铜山区' },
      { id: 'fengxian', name: '丰县' },
      { id: 'peixian', name: '沛县' },
      { id: 'suining', name: '睢宁县' },
      { id: 'xinyi', name: '新沂市' },
      { id: 'pizhou', name: '邳州市' },
    ],
  },
  {
    id: 'changzhou',
    name: '常州市',
    districts: [
      { id: 'tianning', name: '天宁区' },
      { id: 'zhonglou', name: '钟楼区' },
      { id: 'xinbei', name: '新北区' },
      { id: 'wujin', name: '武进区' },
      { id: 'jintan', name: '金坛区' },
      { id: 'liyang', name: '溧阳市' },
    ],
  },
  {
    id: 'suzhou',
    name: '苏州市',
    districts: [
      { id: 'huqiu', name: '虎丘区' },
      { id: 'wuzhong', name: '吴中区' },
      { id: 'xiangcheng', name: '相城区' },
      { id: 'gusu', name: '姑苏区' },
      { id: 'wujiang', name: '吴江区' },
      { id: 'changshu', name: '常熟市' },
      { id: 'zhangjiagang', name: '张家港市' },
      { id: 'kunshan', name: '昆山市' },
      { id: 'taicang', name: '太仓市' },
    ],
  },
  {
    id: 'nantong',
    name: '南通市',
    districts: [
      { id: 'chongchuan', name: '崇川区' },
      { id: 'tongzhou', name: '通州区' },
      { id: 'haimen', name: '海门区' },
      { id: 'rudong', name: '如东县' },
      { id: 'qidong', name: '启东市' },
      { id: 'rugao', name: '如皋市' },
      { id: 'haian', name: '海安市' },
    ],
  },
  {
    id: 'lianyungang',
    name: '连云港市',
    districts: [
      { id: 'lianyun', name: '连云区' },
      { id: 'haizhou', name: '海州区' },
      { id: 'ganyu', name: '赣榆区' },
      { id: 'donghai', name: '东海县' },
      { id: 'guanyun', name: '灌云县' },
      { id: 'guannan', name: '灌南县' },
    ],
  },
  {
    id: 'huaian',
    name: '淮安市',
    districts: [
      { id: 'huaianqu', name: '淮安区' },
      { id: 'huaiyinqu', name: '淮阴区' },
      { id: 'qingjiangpu', name: '清江浦区' },
      { id: 'hongze', name: '洪泽区' },
      { id: 'lianshui', name: '涟水县' },
      { id: 'xuyi', name: '盱眙县' },
      { id: 'jinhu', name: '金湖县' },
    ],
  },
  {
    id: 'yancheng',
    name: '盐城市',
    districts: [
      { id: 'tinghu', name: '亭湖区' },
      { id: 'yandu', name: '盐都区' },
      { id: 'dafeng', name: '大丰区' },
      { id: 'xiangshui', name: '响水县' },
      { id: 'binhai', name: '滨海县' },
      { id: 'funing', name: '阜宁县' },
      { id: 'sheyang', name: '射阳县' },
      { id: 'jianhu', name: '建湖县' },
      { id: 'dongtai', name: '东台市' },
    ],
  },
  {
    id: 'yangzhou',
    name: '扬州市',
    districts: [
      { id: 'guangling', name: '广陵区' },
      { id: 'hanjiang', name: '邗江区' },
      { id: 'jiangdu', name: '江都区' },
      { id: 'baoying', name: '宝应县' },
      { id: 'yizheng', name: '仪征市' },
      { id: 'gaoyou', name: '高邮市' },
    ],
  },
  {
    id: 'zhenjiang',
    name: '镇江市',
    districts: [
      { id: 'jingkou', name: '京口区' },
      { id: 'runzhou', name: '润州区' },
      { id: 'dantu', name: '丹徒区' },
      { id: 'danyang', name: '丹阳市' },
      { id: 'yangzhong', name: '扬中市' },
      { id: 'jurong', name: '句容市' },
    ],
  },
  {
    id: 'taizhou',
    name: '泰州市',
    districts: [
      { id: 'hailing', name: '海陵区' },
      { id: 'gaogang', name: '高港区' },
      { id: 'jiangyan', name: '姜堰区' },
      { id: 'xinghua', name: '兴化市' },
      { id: 'jingjiang', name: '靖江市' },
      { id: 'taixing', name: '泰兴市' },
    ],
  },
  {
    id: 'suqian',
    name: '宿迁市',
    districts: [
      { id: 'sucheng', name: '宿城区' },
      { id: 'suyu', name: '宿豫区' },
      { id: 'shuyang', name: '沭阳县' },
      { id: 'siyang', name: '泗阳县' },
      { id: 'sihong', name: '泗洪县' },
    ],
  },
];

// ==================== 种子数据生成 ====================

/** 为每个区县生成默认统筹项目 */
function buildDefaultProjects() {
  return [
    { id: createId(), category: '市场现状' as const, content: '' },
    { id: createId(), category: '人工智能通识' as const, content: '' },
    { id: createId(), category: '心理通识' as const, content: '' },
  ];
}

/** 为每个区县生成种子学校 */
function buildSeedSchools(districtName: string): School[] {
  const templates = [
    { name: `${districtName}第一实验小学`, stage: '小学' },
    { name: `${districtName}实验中学`, stage: '初中' },
    { name: `${districtName}高级中学`, stage: '高中' },
  ];

  return templates.map((t, i) => ({
    id: createId(),
    name: t.name,
    status: '待开发' as const,
    stage: t.stage,
    products: [],
    street: '',
    keyPerson: '',
    remark: '',
    order: i + 1,
  }));
}

/** 构建一个区县 */
function buildDistrict(def: DistrictDef): District {
  const projects = def.projects
    ? def.projects.map((p) => ({
        id: createId(),
        category: p.category,
        content: p.content,
        updatedAt: '',
      }))
    : buildDefaultProjects();

  return {
    id: def.id,
    name: def.name,
    isKey: def.isKey ?? false,
    projects,
    schools: buildSeedSchools(def.name),
    leaders: [],
  };
}

/** 构建一个地级市 */
function buildCity(def: CityDef): City {
  return {
    id: def.id,
    name: def.name,
    districts: def.districts.map(buildDistrict),
    cityLeaders: [],
  };
}

/** 生成完整种子数据 */
export function getSeedData(): AppData {
  return {
    version: 3,
    cities: JIANGSU_CITIES.map(buildCity),
    updatedAt: new Date().toISOString(),
  };
}

/** 导出项目模板（用于空项目自动回填） */
export const DEFAULT_PROJECTS_TEMPLATE = buildDefaultProjects();

/** 导出城市定义列表 */
export { JIANGSU_CITIES };
