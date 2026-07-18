import { useMemo } from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { School } from '../../types';
import { ALL_PRODUCTS } from '../../types';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  已合作: '#10b981',
  试用中: '#f59e0b',
  已汇报: '#8b5cf6',
  待开发: '#cbd5e1',
};

export interface AnalyticsSchool extends School {
  cityName?: string;
  districtName?: string;
}

interface SchoolAnalyticsProps {
  schools: AnalyticsSchool[];
  groupBy: 'city' | 'district';
  groupLabel?: string;
  /** 'full' = 完整分析看板，'essay' = 作文专项（仅漏斗+堆叠分布，漏斗按合作产品维度） */
  mode?: 'full' | 'essay';
  /** 作文专项漏斗需要知道所有学校的总数 */
  allSchoolsTotal?: number;
  /** 作文专项堆叠图：各区县总学校数 */
  districtSchoolTotals?: Record<string, number>;
}

function buildFunnelOption(total: number, statusCounts: Record<string, number>) {
  // 已汇报 = 已汇报 + 试用中 + 已合作（每推进到下一个状态都建立在已汇报的基础上）
  const reported = (statusCounts['已汇报'] || 0) + (statusCounts['试用中'] || 0) + (statusCounts['已合作'] || 0);
  // 试用 = 试用中 + 已合作（已合作默认已经试用过）
  const trialed = (statusCounts['试用中'] || 0) + (statusCounts['已合作'] || 0);
  const data = [
    { name: '学校总数', value: total, itemStyle: { color: '#475569' } },
    { name: '已汇报', value: reported, itemStyle: { color: '#8b5cf6' } },
    { name: '试用', value: trialed, itemStyle: { color: '#f59e0b' } },
    { name: '已合作', value: statusCounts['已合作'] || 0, itemStyle: { color: '#10b981' } },
  ];
  return buildFunnelFromData(data);
}

/** 作文专项漏斗：总数为全区学校总数，下钻按合作产品维度 */
function buildEssayFunnelOption(allTotal: number, essaySchools: AnalyticsSchool[]) {
  // 已合作作文 = status已合作 + 合作产品含「作文」
  const essayCooperating = essaySchools.filter((s) => s.status === '已合作' && s.cooperationProducts && s.cooperationProducts.includes('作文')).length;
  // 纯试用中（作文）= trialProducts 中有「作文」且状态是「试用中」
  const essayPureTrial = essaySchools.filter((s) => s.status === '试用中' && s.trialProducts && s.trialProducts.includes('作文')).length;
  // 试用作文 = 纯试用中（作文）+ 已合作作文（已合作必定经历过试用）
  const essayTrialing = essayPureTrial + essayCooperating;
  // 汇报过作文 = 作文专项纳入的全部学校（产品或合作产品含作文）
  const essayReported = essaySchools.length;
  const data = [
    { name: '学校总数', value: allTotal, itemStyle: { color: '#475569' } },
    { name: '汇报作文', value: essayReported, itemStyle: { color: '#8b5cf6' } },
    { name: '试用作文', value: essayTrialing, itemStyle: { color: '#f59e0b' } },
    { name: '合作作文', value: essayCooperating, itemStyle: { color: '#10b981' } },
  ];
  return buildFunnelFromData(data);
}

function buildFunnelFromData(data: { name: string; value: number; itemStyle: { color: string } }[]) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}：{c} 所' },
    series: [
      {
        type: 'funnel',
        left: '6%',
        right: '6%',
        top: 16,
        bottom: 16,
        minSize: '24%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}  {c}',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
        },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        data,
      },
    ],
  };
}

function buildStageOption(stageNames: string[], stageValues: number[]) {
  return {
    grid: { left: 8, right: 18, top: 12, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}：{c} 所' },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
    yAxis: {
      type: 'category',
      data: stageNames,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: stageValues,
        barWidth: '56%',
        itemStyle: { color: '#1677ff', borderRadius: [0, 6, 6, 0] },
      },
    ],
  };
}

/** 作文专项横向进度条：各区县学校总数（灰色底条）+ 作文试用中（橙色）+ 作文已合作（绿色） */
function buildEssayGroupOption(
  groupNames: string[],
  districtTotals: number[],
  essayTrialCounts: number[],
  essayCoopCounts: number[],
) {
  const max = Math.max(...districtTotals, 1);
  return {
    grid: { left: 4, right: 70, top: 10, bottom: 6, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        const name = items[0]?.axisValue || '';
        const total = items.find((p: any) => p.seriesName === '学校总数')?.value || 0;
        const trial = items.find((p: any) => p.seriesName === '作文试用中')?.value || 0;
        const coop = items.find((p: any) => p.seriesName === '作文已合作')?.value || 0;
        const pct = total > 0 ? Math.round(((trial + coop) / total) * 100) : 0;
        return `<b>${name}</b><br/>学校总数：${total} 所<br/>作文试用中：${trial} 所<br/>作文已合作：${coop} 所（合计 ${pct}%）`;
      },
    },
    legend: {
      top: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: '#64748b' },
      data: ['学校总数', '作文试用中', '作文已合作'],
    },
    xAxis: {
      type: 'value',
      max,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: groupNames,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 },
    },
    series: [
      {
        name: '学校总数',
        type: 'bar',
        data: districtTotals,
        barWidth: 24,
        itemStyle: {
          color: '#e2e8f0',
          borderRadius: [6, 6, 6, 6],
        },
        emphasis: { itemStyle: { color: '#cbd5e1' } },
        z: 1,
      },
      {
        name: '作文试用中',
        type: 'bar',
        data: essayTrialCounts,
        barWidth: 24,
        stack: 'essay',
        itemStyle: {
          color: '#f59e0b',
        },
        emphasis: { itemStyle: { color: '#fbbf24' } },
        z: 2,
      },
      {
        name: '作文已合作',
        type: 'bar',
        data: essayCoopCounts,
        barWidth: 24,
        stack: 'essay',
        itemStyle: {
          color: '#10b981',
          borderRadius: [6, 6, 6, 6],
        },
        emphasis: { itemStyle: { color: '#34d399' } },
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => {
            const idx = p.dataIndex;
            const total = districtTotals[idx] || 1;
            const trial = essayTrialCounts[idx] || 0;
            const coop = essayCoopCounts[idx] || 0;
            const pct = Math.round(((trial + coop) / total) * 100);
            return `${pct}%`;
          },
          color: '#10b981',
          fontSize: 12,
          fontWeight: 600,
          distance: 4,
        },
        z: 3,
      },
    ],
  };
}

function buildGroupOption(
  groupNames: string[],
  counts: { coop: number[]; trial: number[]; report: number[]; pending: number[] }
) {
  return {
    grid: { left: 8, right: 24, top: 34, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: '#64748b' },
      data: ['已合作', '试用中', '已汇报', '待开发'],
    },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
    yAxis: {
      type: 'category',
      data: groupNames,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 },
    },
    series: [
      { name: '已合作', type: 'bar', stack: 's', data: counts.coop, itemStyle: { color: STATUS_COLORS['已合作'] }, barWidth: '62%' },
      { name: '试用中', type: 'bar', stack: 's', data: counts.trial, itemStyle: { color: STATUS_COLORS['试用中'] } },
      { name: '已汇报', type: 'bar', stack: 's', data: counts.report, itemStyle: { color: STATUS_COLORS['已汇报'] } },
      { name: '待开发', type: 'bar', stack: 's', data: counts.pending, itemStyle: { color: STATUS_COLORS['待开发'] } },
    ],
  };
}

function buildProductOption(productNames: string[], productValues: number[]) {
  return {
    grid: { left: 8, right: 18, top: 12, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}：{c} 所' },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
    yAxis: {
      type: 'category',
      data: productNames,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: productValues,
        barWidth: '56%',
        itemStyle: { color: '#8b5cf6', borderRadius: [0, 6, 6, 0] },
      },
    ],
  };
}

function buildConversionRateOption(groupNames: string[], rates: number[]) {
  return {
    grid: { left: 8, right: 24, top: 12, bottom: 6, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}：已合作率 {c}%' },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', formatter: '{value}%' } },
    yAxis: {
      type: 'category',
      data: groupNames,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: rates,
        barWidth: '56%',
        itemStyle: { color: '#10b981', borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', formatter: '{c}%', color: '#475569', fontSize: 12 },
      },
    ],
  };
}

/** 已汇报一把手占比分析：横向条形图，展示各区县/城市的一把手数量及占比 */
function buildKeyLeaderOption(
  groupNames: string[],
  counts: number[],
  rates: number[],
) {
  const maxCount = Math.max(...counts, 1);
  return {
    grid: { left: 4, right: 60, top: 10, bottom: 6, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params;
        const idx = item.dataIndex;
        return `<b>${item.name}</b><br/>已汇报一把手：${counts[idx]} 人<br/>占比：${rates[idx]}%`;
      },
    },
    xAxis: {
      type: 'value',
      max: maxCount,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: groupNames,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: counts,
        barWidth: '56%',
        itemStyle: {
          color: '#f97316',
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => `${rates[p.dataIndex]}%`,
          color: '#f97316',
          fontSize: 12,
          fontWeight: 600,
          distance: 4,
        },
      },
    ],
  };
}

function cardTitle(icon: React.ReactNode, label: string) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1677ff',
          fontSize: 14,
        }}
      >
        {icon}
      </span>
      <span style={{ fontWeight: 600, color: '#1e293b' }}>{label}</span>
    </span>
  );
}

export default function SchoolAnalytics({ schools, groupBy, groupLabel = '区县', mode = 'full', allSchoolsTotal, districtSchoolTotals }: SchoolAnalyticsProps) {
  const model = useMemo(() => {
    const real = schools.filter((s) => !s.seed);
    const statusCounts: Record<string, number> = { 已合作: 0, 试用中: 0, 已汇报: 0, 待开发: 0 };
    const stageMap: Record<string, number> = {};
    const groupMap: Record<string, { coop: number; trial: number; report: number; pending: number; total: number; keyLeaderReported: number }> = {};

    for (const s of real) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      const stage = s.stage && s.stage.trim() ? s.stage.trim() : '未填学段';
      stageMap[stage] = (stageMap[stage] || 0) + 1;

      const g = groupBy === 'city' ? s.cityName || '未知' : s.districtName || '未知';
      if (!groupMap[g]) groupMap[g] = { coop: 0, trial: 0, report: 0, pending: 0, total: 0, keyLeaderReported: 0 };
      groupMap[g].total += 1;
      if (s.status === '已合作') groupMap[g].coop += 1;
      else if (s.status === '试用中') groupMap[g].trial += 1;
      else if (s.status === '已汇报') groupMap[g].report += 1;
      else groupMap[g].pending += 1;
      // 已汇报一把手
      if (s.isKeyPersonLeader && s.status === '已汇报') groupMap[g].keyLeaderReported += 1;
    }

    const total = real.length;
    const groupNames = Object.keys(groupMap).sort((a, b) => groupMap[b].total - groupMap[a].total);
    const coop = groupNames.map((g) => groupMap[g].coop);
    const trial = groupNames.map((g) => groupMap[g].trial);
    const report = groupNames.map((g) => groupMap[g].report);
    const pending = groupNames.map((g) => groupMap[g].pending);

    const stageNames = Object.keys(stageMap).sort((a, b) => stageMap[b] - stageMap[a]);
    const stageValues = stageNames.map((k) => stageMap[k]);

    const cooperatingRate = total > 0 ? Math.round((statusCounts['已合作'] / total) * 100) : 0;

    // 产品分布
    const productMap: Record<string, number> = {};
    for (const p of ALL_PRODUCTS) productMap[p] = 0;
    for (const s of real) {
      if (s.products) {
        for (const p of s.products) {
          if (productMap[p] !== undefined) productMap[p] += 1;
        }
      }
    }
    const productEntries = Object.entries(productMap).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const productNames = productEntries.map(([k]) => k);
    const productValues = productEntries.map(([, v]) => v);

    // 区域转化率排名
    const rateEntries = groupNames
      .map((g) => {
        const grp = groupMap[g];
        return { name: g, rate: grp.total > 0 ? Math.round((grp.coop / grp.total) * 100) : 0 };
      })
      .sort((a, b) => b.rate - a.rate);
    const rateNames = rateEntries.map((r) => r.name);
    const rateValues = rateEntries.map((r) => r.rate);

    // 已汇报一把手占比：每个 group 的 keyLeaderReported / total
    const keyLeaderGroupNames = groupNames;
    const keyLeaderGroupRates = groupNames.map((g) => {
      const grp = groupMap[g];
      return grp.total > 0 ? Math.round((grp.keyLeaderReported / grp.total) * 100) : 0;
    });
    const keyLeaderGroupCounts = groupNames.map((g) => groupMap[g]?.keyLeaderReported || 0);

    return {
      total,
      statusCounts,
      groupNames,
      counts: { coop, trial, report, pending },
      stageNames,
      stageValues,
      cooperatingRate,
      productNames,
      productValues,
      rateNames,
      rateValues,
      keyLeaderGroupNames,
      keyLeaderGroupRates,
      keyLeaderGroupCounts,
    };
  }, [schools, groupBy]);

  const cardStyle = {
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  } as const;

  // 作文专项模式：仅漏斗 + 堆叠分布（各区县学校总数 vs 作文试用中+已合作）
  if (mode === 'essay') {
    // 按区县聚合：
    // 作文试用中 = trialProducts 含「作文」且状态为「试用中」
    // 作文已合作 = cooperationProducts 含「作文」且状态为「已合作」
    const essayGroupMap: Record<string, { essayTrial: number; essayCoop: number }> = {};
    for (const s of schools) {
      const g = groupBy === 'city' ? s.cityName || '未知' : s.districtName || '未知';
      if (!essayGroupMap[g]) essayGroupMap[g] = { essayTrial: 0, essayCoop: 0 };
      if (s.trialProducts && s.trialProducts.includes('作文') && s.status === '试用中') {
        essayGroupMap[g].essayTrial += 1;
      }
      if (s.cooperationProducts && s.cooperationProducts.includes('作文') && s.status === '已合作') {
        essayGroupMap[g].essayCoop += 1;
      }
    }

    // 构建区县列表：按总学校数排序
    const essayGroupNames = Object.keys(essayGroupMap).sort((a, b) => {
      const ta = districtSchoolTotals?.[a] || 0;
      const tb = districtSchoolTotals?.[b] || 0;
      return tb - ta;
    });
    const essayDistrictTotals = essayGroupNames.map((g) => districtSchoolTotals?.[g] || 0);
    const essayTrialCounts = essayGroupNames.map((g) => essayGroupMap[g]?.essayTrial || 0);
    const essayCoopCounts = essayGroupNames.map((g) => essayGroupMap[g]?.essayCoop || 0);

    return (
      <div>
        <Row gutter={[14, 14]} style={{ marginBottom: 14, alignItems: 'stretch' }}>
          <Col xs={24} sm={12} style={{ display: 'flex' }}>
            <Card
              styles={{ body: { padding: '14px 16px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
              style={{ ...cardStyle, height: '100%', width: '100%' }}
              title={(
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {cardTitle('▼', '作文合作转化漏斗')}
                </span>
              )}
            >
              <ReactECharts option={buildEssayFunnelOption(allSchoolsTotal || model.total, schools)} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} style={{ display: 'flex' }}>
            <Card
              styles={{ body: { padding: '14px 16px', flex: 1 } }}
              style={{ ...cardStyle, height: '100%', width: '100%' }}
              title={cardTitle('📅', '重要节点提醒')}
            >
              {(() => {
                const today = new Date();
                const trialDeadline = new Date('2026-10-15');
                const payDeadline = new Date('2026-12-31');
                const trialDiff = Math.ceil((trialDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const payDiff = Math.ceil((payDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
                const weekHeaders = ['日','一','二','三','四','五','六'];

                const renderCalendar = (year: number, month: number, highlightDay: number, color: string, bgColor: string, label: string, diffDays: number) => {
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells: React.ReactNode[] = [];
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<td key={`e${i}`} style={{ width: '14.28%', padding: 0, textAlign: 'center' }} />);
                  }
                  for (let d = 1; d <= daysInMonth; d++) {
                    const isTarget = d === highlightDay;
                    const isPast = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    cells.push(
                      <td key={d} style={{ width: '14.28%', padding: 0, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          fontSize: 10,
                          fontWeight: isTarget ? 700 : 400,
                          color: isTarget ? '#fff' : isPast ? '#cbd5e1' : '#475569',
                          background: isTarget ? color : 'transparent',
                          boxShadow: isTarget ? `0 0 0 2px ${bgColor}` : undefined,
                        }}>{d}</span>
                      </td>
                    );
                  }
                  while (cells.length < 42) {
                    cells.push(<td key={`p${cells.length}`} style={{ width: '14.28%', padding: 0 }} />);
                  }
                  const rows: React.ReactNode[] = [];
                  for (let r = 0; r < 6; r++) {
                    rows.push(<tr key={r}>{cells.slice(r * 7, r * 7 + 7)}</tr>);
                  }
                  return (
                    <div style={{
                      background: bgColor,
                      borderRadius: 8,
                      padding: '6px 8px',
                      border: `1px solid ${color}20`,
                      flex: 1,
                      minWidth: 0,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{monthNames[month]} {year}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}15`, borderRadius: 4, padding: '1px 5px' }}>{label}</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {weekHeaders.map((w) => (
                              <th key={w} style={{ width: '14.28%', padding: '1px 0', textAlign: 'center', fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>{w}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                      </table>
                      <div style={{ textAlign: 'center', marginTop: 2, fontSize: 11, fontWeight: 600, color }}>
                        {diffDays > 0 ? `剩余 ${diffDays} 天` : diffDays === 0 ? '今天' : `已超期 ${Math.abs(diffDays)} 天`}
                      </div>
                    </div>
                  );
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 10, flexWrap: 'nowrap', height: '100%' }}>
                      {renderCalendar(2026, 9, 15, '#d97706', '#fffbeb', '🎯 试用', trialDiff)}
                      {renderCalendar(2026, 11, 31, '#059669', '#ecfdf5', '🏆 付费', payDiff)}
                    </div>
                  </div>
                );
              })()}
            </Card>
          </Col>
        </Row>
        <Row gutter={[14, 14]}>
          <Col xs={24}>
            <Card styles={{ body: { padding: '14px 16px' } }} style={cardStyle} title={cardTitle('▤', `按${groupLabel}分布（学校总数 vs 作文试用中+已合作）`)}>
              {essayGroupNames.length > 0 ? (
                <ReactECharts option={buildEssayGroupOption(essayGroupNames, essayDistrictTotals, essayTrialCounts, essayCoopCounts)} style={{ height: 360 }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>暂无数据</div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[14, 14]} style={{ marginBottom: 14 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card styles={{ body: { padding: '14px 16px 8px' } }} style={cardStyle} title={cardTitle('◔', '已汇报一把手占比分析')}>
            {model.keyLeaderGroupNames.length > 0 ? (
              <ReactECharts option={buildKeyLeaderOption(model.keyLeaderGroupNames, model.keyLeaderGroupCounts, model.keyLeaderGroupRates)} style={{ height: 250 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>暂无数据</div>
            )}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                全校已汇报一把手率{' '}
                <Text strong style={{ color: '#f97316', fontSize: 14 }}>
                  {model.total > 0 ? Math.round((model.keyLeaderGroupCounts.reduce((a, b) => a + b, 0) / model.total) * 100) : 0}%
                </Text>
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            styles={{ body: { padding: '14px 16px 8px' } }}
            style={cardStyle}
            title={(
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {cardTitle('▼', '合作转化漏斗')}
                <Tag
                  color="default"
                  style={{
                    marginInlineStart: 2,
                    background: '#f8fafc',
                    color: '#64748b',
                    borderColor: '#e2e8f0',
                    borderRadius: 6,
                    fontSize: 12,
                    lineHeight: '20px',
                    fontWeight: 500,
                  }}
                >
                  待开发 {model.statusCounts['待开发'] || 0} 所
                </Tag>
              </span>
            )}
          >
            <ReactECharts option={buildFunnelOption(model.total, model.statusCounts)} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card styles={{ body: { padding: '14px 16px' } }} style={cardStyle} title={cardTitle('▥', '学段分布')}>
            <ReactECharts option={buildStageOption(model.stageNames, model.stageValues)} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[14, 14]}>
        <Col xs={24}>
          <Card styles={{ body: { padding: '14px 16px' } }} style={cardStyle} title={cardTitle('▤', `按${groupLabel}分布（堆叠合作状态）`)}>
            {model.groupNames.length > 0 ? (
              <ReactECharts option={buildGroupOption(model.groupNames, model.counts)} style={{ height: 360 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
        <Col xs={24} sm={12} lg={12}>
          <Card styles={{ body: { padding: '14px 16px' } }} style={cardStyle} title={cardTitle('◆', '产品分布')}>
            {model.productNames.length > 0 ? (
              <ReactECharts option={buildProductOption(model.productNames, model.productValues)} style={{ height: 280 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>暂无产品数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card styles={{ body: { padding: '14px 16px' } }} style={cardStyle} title={cardTitle('◆', `各${groupLabel}已合作转化率排名`)}>
            {model.rateNames.length > 0 ? (
              <ReactECharts option={buildConversionRateOption(model.rateNames, model.rateValues)} style={{ height: 280 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
