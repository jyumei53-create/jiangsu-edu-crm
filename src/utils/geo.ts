import nanjing from './geo/nanjing.json';
import wuxi from './geo/wuxi.json';
import xuzhou from './geo/xuzhou.json';
import changzhou from './geo/changzhou.json';
import suzhou from './geo/suzhou.json';
import nantong from './geo/nantong.json';
import lianyungang from './geo/lianyungang.json';
import huaian from './geo/huaian.json';
import yancheng from './geo/yancheng.json';
import yangzhou from './geo/yangzhou.json';
import zhenjiang from './geo/zhenjiang.json';
import taizhou from './geo/taizhou.json';
import suqian from './geo/suqian.json';

const GEOJSON_MAP: Record<string, unknown> = {
  nanjing, wuxi, xuzhou, changzhou, suzhou, nantong,
  lianyungang, huaian, yancheng, yangzhou, zhenjiang, taizhou, suqian,
};

export function getCityGeoJson(cityId: string): unknown | null {
  return GEOJSON_MAP[cityId] || null;
}

export function hasGeoJson(cityId: string): boolean {
  return cityId in GEOJSON_MAP;
}

// 为每个城市生成柔和的行政颜色
export function getCityDistrictColors(city: { districts: { name: string }[] }): Record<string, string> {
  const palette = [
    '#B5D6A7', '#F0C8A0', '#A8D8D0', '#D4B8D4', '#B5C7E3',
    '#F0C8C8', '#C8D0D8', '#D8E0A8', '#E8D8B8', '#B8D8C8',
    '#E0C8D0', '#E0D8C0', '#C8D0E0', '#A8E6CF', '#FDB99B',
    '#FFB7B2', '#D7BDE2', '#AED9E0', '#FFD166', '#A8D5E5',
  ];

  const result: Record<string, string> = {};
  city.districts.forEach((d, i) => {
    result[d.name] = palette[i % palette.length];
  });
  return result;
}

export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
