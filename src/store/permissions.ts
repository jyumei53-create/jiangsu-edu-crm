import type { User } from '../types/auth';
import type { AppData, City, District } from '../types';

/**
 * 权限语义约定：
 * - admin：拥有全部城市、全部区县的权限。
 * - manager：仅能访问 allowedCityIds 中的城市。
 *   - 若 allowedDistrictIds 为空（或未配置）：可访问该城市下「全部区县」。
 *   - 若 allowedDistrictIds 非空：仅能访问列表内的具体区县。
 * 该约定保证旧账号（无 allowedDistrictIds 字段）向后兼容为「城市内全部区县」。
 */

/** 区域经理对某城市是否有访问权限（admin 恒为 true） */
export function hasCityAccess(user: User | null, cityId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.allowedCityIds.includes(cityId);
}

/** 计算用户在某城市内可见的区县列表（无权限返回空数组） */
export function getScopedDistricts(user: User | null, city: City): District[] {
  if (!hasCityAccess(user, city.id)) return [];
  const allowed = user?.allowedDistrictIds;
  if (!allowed || allowed.length === 0) return city.districts;
  const allowedSet = new Set(allowed);
  return city.districts.filter((d) => allowedSet.has(d.id));
}

/**
 * 返回「按区县权限过滤」后的城市对象：
 * - admin：原样返回（districts 全量）。
 * - manager 无该城市权限：返回 undefined（用于触发未授权重定向）。
 * - manager 有该城市权限：返回 districts 已按权限裁剪的城市副本。
 */
export function getScopedCity(user: User | null, cityId: string, data: AppData): City | undefined {
  const city = data.cities.find((c) => c.id === cityId);
  if (!city) return undefined;
  if (!hasCityAccess(user, city.id)) return undefined;
  const districts = getScopedDistricts(user, city);
  return { ...city, districts };
}

/** 区域经理对某个具体区县是否有权限 */
export function canAccessDistrict(user: User | null, cityId: string, districtId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.allowedCityIds.includes(cityId)) return false;
  const allowed = user.allowedDistrictIds;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(districtId);
}

/** 用户可见的城市列表（admin 全部；manager 仅 allowedCityIds） */
export function getVisibleCities(user: User | null, data: AppData): City[] {
  if (!user) return [];
  if (user.role === 'admin') return data.cities;
  const allowedSet = new Set(user.allowedCityIds);
  return data.cities.filter((c) => allowedSet.has(c.id));
}
