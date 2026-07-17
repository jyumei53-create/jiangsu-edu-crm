import type { AppData, City, District } from '../types';
import { getSeedData, DEFAULT_PROJECTS_TEMPLATE } from './seedData';
import { WUXI_SEED_SCHOOLS } from './wuxiSchools';

const STORAGE_KEY = 'jiangsu_crm_data_v3';
const OLD_STORAGE_KEY = 'wuxi_crm_data_v2';

/** 尝试迁移旧版 v2 数据 */
function migrateFromV2(): AppData | null {
  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return null;

    const oldData = JSON.parse(raw);
    if (!oldData.version || oldData.version < 2) return null;

    // 旧数据中的 districts 作为无锡市的区县
    const seed = getSeedData();
    const wuxiCity = seed.cities.find((c) => c.id === 'wuxi');
    if (wuxiCity && oldData.districts) {
      wuxiCity.districts = oldData.districts;
    }

    // 删除旧键
    localStorage.removeItem(OLD_STORAGE_KEY);
    return seed;
  } catch {
    return null;
  }
}

/** 从 localStorage 加载应用数据 */
export function loadAppData(): AppData {
  try {
    // 先尝试迁移旧数据
    const migrated = migrateFromV2();
    if (migrated) {
      saveAppDataRaw(migrated);
      return migrated;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getSeedData();
      saveAppDataRaw(seed);
      return seed;
    }

    const data: AppData = JSON.parse(raw);

    if (!data.version || data.version < 3) {
      const seed = getSeedData();
      saveAppDataRaw(seed);
      return seed;
    }

    // 精准迁移：仅清理已不存在的区县（如经开区），不动其他数据
    let modified = false;
    const seedCities = getSeedData().cities;
    const WUXI_SEED_VERSION = 4;
    if ((data as AppData).wuxiSeedVersion !== WUXI_SEED_VERSION) {
      const wuxiCity = data.cities.find((c) => c.id === 'wuxi');
      if (wuxiCity) {
        const seedWuxi = seedCities.find((c) => c.id === 'wuxi');
        if (seedWuxi) {
          // 仅删除种子数据中已不存在的区县（如经开区），保留用户在其他区县的编辑
          const validIds = new Set(seedWuxi.districts.map((d) => d.id));
          const removedDistricts = wuxiCity.districts.filter((d) => !validIds.has(d.id));
          if (removedDistricts.length > 0) {
            // 将删除区县的学校迁移到新吴区（xinwu）
            const xinwu = wuxiCity.districts.find((d) => d.id === 'xinwu');
            if (xinwu) {
              for (const rd of removedDistricts) {
                xinwu.schools = [...xinwu.schools, ...rd.schools];
              }
            }
            wuxiCity.districts = wuxiCity.districts.filter((d) => validIds.has(d.id));
            modified = true;
          }
        }
        (data as AppData).wuxiSeedVersion = WUXI_SEED_VERSION;
      }
    }

    // 确保 13 市都存在，各区县 projects/schools 不为空
    for (const sc of seedCities) {
      let existing = data.cities.find((c) => c.id === sc.id);
      if (!existing) {
        data.cities.push({ ...sc });
        modified = true;
        continue;
      }

      // 确保各区县存在
      // 确保 cityLeaders 存在，且为空时从种子数据填充
      if (!existing.cityLeaders || existing.cityLeaders.length === 0) {
        existing.cityLeaders = sc.cityLeaders || [];
        if (existing.cityLeaders.length > 0) modified = true;
      } else if (!existing.cityLeaders) {
        existing.cityLeaders = [];
        modified = true;
      }

      // 删除种子数据中已不存在的区县（如行政区划调整）
      const validDistrictIds = new Set(sc.districts.map((d) => d.id));
      const beforeLength = existing.districts.length;
      existing.districts = existing.districts.filter((d) => validDistrictIds.has(d.id));
      if (existing.districts.length !== beforeLength) {
        modified = true;
      }

      for (const sd of sc.districts) {
        let ed = existing.districts.find((d) => d.id === sd.id);
        if (!ed) {
          existing.districts.push({ ...sd });
          modified = true;
        } else {
          // 空 projects 自动回填
          if (!ed.projects || ed.projects.length === 0) {
            ed.projects = DEFAULT_PROJECTS_TEMPLATE.map((t) => ({
              ...t,
              id: Math.random().toString(36).substring(2, 10),
            }));
            modified = true;
          }
          // 无锡市各区县：若学校为空则自动填充种子数据（来自教育局名录）
          if (sc.id === 'wuxi' && (!ed.schools || ed.schools.length === 0)) {
            const seedSchools = WUXI_SEED_SCHOOLS[sd.id];
            if (seedSchools && seedSchools.length > 0) {
              ed.schools = seedSchools;
              modified = true;
            }
          }
          // 确保 order 字段
          if (ed.schools) {
            ed.schools.forEach((s, i) => {
              if (s.order === undefined || s.order === null) {
                s.order = i + 1;
                modified = true;
              }
            });
          }
          // 确保 leaders 存在，且为空时从种子数据填充
          if (!ed.leaders || ed.leaders.length === 0) {
            if (sd.leaders && sd.leaders.length > 0) {
              ed.leaders = sd.leaders;
              modified = true;
            } else if (!ed.leaders) {
              ed.leaders = [];
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      data.updatedAt = new Date().toISOString();
      saveAppDataRaw(data);
    }

    return data;
  } catch {
    const seed = getSeedData();
    saveAppDataRaw(seed);
    return seed;
  }
}

/** 保存数据 */
export function saveAppData(data: AppData): boolean {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('保存数据失败:', e);
    return false;
  }
}

function saveAppDataRaw(data: AppData): void {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

/** 更新单个区县 */
export function updateDistrict(
  data: AppData,
  cityId: string,
  districtId: string,
  updater: (district: District) => District
): { success: boolean; data: AppData } {
  const newData: AppData = {
    ...data,
    cities: data.cities.map((c) =>
      c.id === cityId
        ? {
            ...c,
            districts: c.districts.map((d) =>
              d.id === districtId ? updater({ ...d }) : d
            ),
          }
        : c
    ),
  };
  const success = saveAppData(newData);
  return { success, data: newData };
}

/** 更新整个城市 */
export function updateCity(
  data: AppData,
  cityId: string,
  updater: (city: City) => City
): { success: boolean; data: AppData } {
  const newData: AppData = {
    ...data,
    cities: data.cities.map((c) =>
      c.id === cityId ? updater({ ...c }) : c
    ),
  };
  const success = saveAppData(newData);
  return { success, data: newData };
}

/** 计算某城市的统计汇总（排除 seed 示例学校） */
export function computeCityStats(city: City) {
  let totalSchools = 0;
  let cooperating = 0;
  let trialing = 0;
  let reported = 0;
  let pending = 0;
  let totalProjects = 0;

  for (const district of city.districts) {
    totalProjects += (district.projects || []).length;

    for (const school of district.schools) {
      if (school.seed) continue;
      totalSchools++;
      switch (school.status) {
        case '已合作': cooperating++; break;
        case '试用中': trialing++; break;
        case '已汇报': reported++; break;
        default: pending++; break;
      }
    }
  }

  return { totalSchools, cooperating, trialing, reported, pending, totalProjects };
}

/** 计算单区县统计汇总（排除 seed 示例学校） */
export function computeDistrictStats(district: District) {
  let totalSchools = 0;
  let cooperating = 0;
  let trialing = 0;
  let reported = 0;
  let pending = 0;

  for (const school of district.schools) {
    if (school.seed) continue;
    totalSchools++;
    switch (school.status) {
      case '已合作': cooperating++; break;
      case '试用中': trialing++; break;
      case '已汇报': reported++; break;
      default: pending++; break;
    }
  }

  return { totalSchools, cooperating, trialing, reported, pending };
}

/** 计算全省统计汇总（排除 seed 示例学校） */
export function computeStats(data: AppData) {
  let totalSchools = 0;
  let cooperating = 0;
  let trialing = 0;
  let reported = 0;
  let pending = 0;
  let totalProjects = 0;
  let totalDistricts = 0;

  for (const city of data.cities) {
    totalDistricts += city.districts.length;
    for (const district of city.districts) {
      totalProjects += (district.projects || []).length;

      for (const school of district.schools) {
        if (school.seed) continue;
        totalSchools++;
        switch (school.status) {
          case '已合作': cooperating++; break;
          case '试用中': trialing++; break;
          case '已汇报': reported++; break;
          default: pending++; break;
        }
      }
    }
  }

  return {
    totalCities: data.cities.length,
    totalDistricts,
    totalSchools,
    cooperating,
    trialing,
    reported,
    pending,
    totalProjects,
  };
}
