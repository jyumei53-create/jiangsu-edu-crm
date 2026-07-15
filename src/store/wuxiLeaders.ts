import type { EducationLeader } from '../types';

/** 无锡市市级教育局领导 */
export const WUXI_CITY_LEADERS: EducationLeader[] = [
  {
    id: 'wuxi_city_ld_1',
    name: '宋新春',
    position: '市委教育工委副书记、市教育局局长',
    phone: '',
    wechat: '',
    email: '',
    lastContact: '',
    notes: '1976年1月生，江苏宜兴人，大学学历，中共党员。全面主持市教育局工作。',
  },
  {
    id: 'wuxi_city_ld_2',
    name: '陈曦',
    position: '市委教育工委委员、市教育局副局长',
    phone: '',
    wechat: '',
    email: '',
    lastContact: '',
    notes: '1970年2月生，江苏无锡人。分管高中教育、基础教育。',
  },
  {
    id: 'wuxi_city_ld_3',
    name: '潘鹰',
    position: '市教育局副局长（义务教育）',
    phone: '',
    wechat: '',
    email: '',
    lastContact: '',
    notes: '分管义务教育。同��兼任梁溪区教育局相关职务。',
  },
  {
    id: 'wuxi_city_ld_4',
    name: '胡正良',
    position: '基础教育处',
    phone: '',
    wechat: '',
    email: '',
    lastContact: '',
    notes: '负责基础教育处工作。',
  },
  {
    id: 'wuxi_city_ld_5',
    name: '朱卓伟',
    position: '信息装备中心',
    phone: '',
    wechat: '',
    email: '',
    lastContact: '',
    notes: '负责教育信息化、技术装备工作。',
  },
  {
    id: 'wuxi_city_ld_6',
    name: '张先义',
    position: '市教师发展学院院长',
    phone: '',
    wechat: '',
    email: '',
    lastContact: '',
    notes: '负责全市教师培训和专业发展工作。',
  },
];

/** 无锡市各区县教育局领导 */
export const WUXI_DISTRICT_LEADERS: Record<string, EducationLeader[]> = {
  liangxi: [
    { id: 'lx_ld_1', name: '李力', position: '区委教育工委书记', phone: '', wechat: '', email: '', lastContact: '', notes: '1974年9月生，江苏沭阳人，大学学历，硕士学位，中共党员。主持区委教育工委全面工作。' },
    { id: 'lx_ld_2', name: '邵华强', position: '区委教育工委委员、教育局副局长（信息化）', phone: '', wechat: '', email: '', lastContact: '', notes: '分管社会教育、行政许可、语言文字、体卫艺、装备与学生资助、教育信息化。' },
    { id: 'lx_ld_3', name: '钱艳霞', position: '副局长（义务教育）、教法书记', phone: '', wechat: '', email: '', lastContact: '', notes: '分管义务教育、教育法治工作。' },
    { id: 'lx_ld_4', name: '徐涌', position: '基础教育科', phone: '', wechat: '', email: '', lastContact: '', notes: '负责基础教育科工作。' },
    { id: 'lx_ld_5', name: '韩凯', position: '信息装备科', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教育信息化和装备管理工作。' },
    { id: 'lx_ld_6', name: '姚斌', position: '区少年宫', phone: '', wechat: '', email: '', lastContact: '', notes: '负责区少年宫工作。' },
    { id: 'lx_ld_7', name: '马舟', position: '东林中学', phone: '', wechat: '', email: '', lastContact: '', notes: '东林中学。' },
  ],
  huishan: [
    { id: 'hs_ld_1', name: '徐旭昕', position: '区委教育工委书记、教育局党委书记、局长', phone: '', wechat: '', email: '', lastContact: '', notes: '全面主持惠山区教育局工作。' },
    { id: 'hs_ld_2', name: '裴成功', position: '区委教育工委副书记', phone: '', wechat: '', email: '', lastContact: '', notes: '协助书记分管党建工作。' },
    { id: 'hs_ld_3', name: '林涛', position: '教师发展中心、装备信息化', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教师发展中心和教育装备信息化工作。' },
    { id: 'hs_ld_4', name: '谢龙', position: '基础教育科', phone: '', wechat: '', email: '', lastContact: '', notes: '负责基础教育科工作。' },
  ],
  binhu: [
    { id: 'bh_ld_1', name: '王永胜', position: '区委教育工委书记、教育局党委书记、局长', phone: '', wechat: '', email: '', lastContact: '', notes: '1973年11月生，江苏句容人，大学学历。全面主持滨湖区教育局工作。' },
    { id: 'bh_ld_2', name: '李攻', position: '副局长（装备）', phone: '', wechat: '', email: '', lastContact: '', notes: '分管教育装备工作。' },
    { id: 'bh_ld_3', name: '王星', position: '教师发展中心主任', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教师发展中心工作。' },
    { id: 'bh_ld_4', name: '唐建英', position: '基础教育科', phone: '', wechat: '', email: '', lastContact: '', notes: '负责基础教育科工作。' },
    { id: 'bh_ld_5', name: '钱耀刚', position: '区教育技术装备站', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教育技术装备站工作。' },
  ],
  xishan: [
    { id: 'xs_ld_1', name: '顾凤艳', position: '区委教育工委书记', phone: '', wechat: '', email: '', lastContact: '', notes: '1979年2月生，江苏无锡人，苏州大学新闻学专业。主持区委教育工委全面工作。' },
    { id: 'xs_ld_2', name: '王昭煜', position: '副局长（高中、科学工程教育）', phone: '', wechat: '', email: '', lastContact: '', notes: '分管高中教育、科学工程教育。' },
    { id: 'xs_ld_3', name: '钱毓平', position: '教师发展中心、装备信息化', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教师发展中心和教育装备信息化工作。' },
    { id: 'xs_ld_4', name: '倪林峰', position: '教育科', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教育科工作。' },
  ],
  xinwu: [
    { id: 'xw_ld_1', name: '杨柳', position: '区委教育工委书记、教育局局长', phone: '', wechat: '', email: '', lastContact: '', notes: '全面主持新吴区教育局工作。' },
    { id: 'xw_ld_2', name: '彭雷', position: '副局长（义务教育、信息化）', phone: '', wechat: '', email: '', lastContact: '', notes: '分管义务教育、教育信息化。' },
    { id: 'xw_ld_3', name: '谢彬', position: '副局长（财务、后勤）', phone: '', wechat: '', email: '', lastContact: '', notes: '分管财务和后勤保障工作。' },
    { id: 'xw_ld_4', name: '陈晓靓', position: '基础教育处', phone: '', wechat: '', email: '', lastContact: '', notes: '负责基础教育处工作。' },
    { id: 'xw_ld_5', name: '丁强', position: '教师发展中心', phone: '', wechat: '', email: '', lastContact: '', notes: '负责教师发展中心工作。' },
  ],
};
