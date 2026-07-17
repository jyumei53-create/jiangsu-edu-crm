import { useMemo } from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { School } from '../../types';
import { ALL_PRODUCTS } from '../../types';

const { Text } = Typography;

const STATUS_ORDER = ['已合作', '试用中', '已汇报', '待开发'] as const;
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
}

function buildStatusOption(total: number, statusCounts: Record<string, number>) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}：{c} 所（{d}%）' },
    title: {
      text: String(total),
      subtext: '学校总数',
      left: 'center',
      top: '36%',
      textStyle: { fontSize: 28, fontWeight: 700, color: '#1e293b' },
      subtextStyle: { fontSize: 12, color: '#94a3b8' },
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        data: STATUS_ORDER.map((s) => ({
          name: s,
          value: statusCounts[s] || 0,
          itemStyle: { color: STATUS_COLORS[s] },
        })),
      },
    ],
  };
}

function buildFunnelOption(total: number, statusCounts: Record<string, number>) {
  // 已汇报 = 已汇报 + 试用中 + 已合作（每推进到下一个状态都建立在已汇报的基础上）
  const reported = (statusCounts['已汇报'] || 0) + (statusCounts['试用中'] || 0) + (statusCounts['已合作'] || 0);
  const data = [
    { name: '学校总数', value: total, itemStyle: { color: '#475569' } },
    { name: '已汇报', value: reported, itemStyle: { color: '#8b5cf6' } },
    { name: '试用中', value: statusCounts['试用中'] || 0, itemStyle: { color: '#f59e0b' } },
    { name: '已合作', value: statusCounts['已合作'] || 0, itemStyle: { color: '#10b981' } },
  ];
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

export default function SchoolAnalytics({ schools, groupBy, groupLabel = '区县' }: SchoolAnalyticsProps) {
  const model = useMemo(() => {
    const real = schools.filter((s) => !s.seed);
    const statusCounts: Record<string, number> = { 已合作: 0, 试用中: 0, 已汇报: 0, 待开发: 0 };
    const stageMap: Record<string, number> = {};
    const groupMap: Record<string, { coop: number; trial: number; report: number; pending: number; total: number }> = {};

    for (const s of real) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      const stage = s.stage && s.stage.trim() ? s.stage.trim() : '未填学段';
      stageMap[stage] = (stageMap[stage] || 0) + 1;

      const g = groupBy === 'city' ? s.cityName || '未知' : s.districtName || '未知';
      if (!groupMap[g]) groupMap[g] = { coop: 0, trial: 0, report: 0, pending: 0, total: 0 };
      groupMap[g].total += 1;
      if (s.status === '已合作') groupMap[g].coop += 1;
      else if (s.status === '试用中') groupMap[g].trial += 1;
      else if (s.status === '已汇报') groupMap[g].report += 1;
      else groupMap[g].pending += 1;
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
    };
  }, [schools, groupBy]);

  const cardStyle = {
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  } as const;

  return (
    <div>
      <Row gutter={[14, 14]} style={{ marginBottom: 14 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card styles={{ body: { padding: '14px 16px 8px' } }} style={cardStyle} title={cardTitle('◔', '合作状态分布')}>
            <ReactECharts option={buildStatusOption(model.total, model.statusCounts)} style={{ height: 250 }} />
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                已合作转化率 <Text strong style={{ color: '#10b981', fontSize: 14 }}>{model.cooperatingRate}%</Text>
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
