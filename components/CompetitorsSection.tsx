import React, { useState } from 'react';
import { CompetitorData } from '@/types';
import { formatLargeNumber, formatPercent } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeftRight, Percent, DollarSign, Activity } from 'lucide-react';

interface Props {
  targetTicker: string;
  targetName: string;
  targetMetrics: {
    revenue: number | null;
    marketCap: number | null;
    peRatio: number | null;
    profitMargin: number | null;
    revenueGrowth: number | null;
  };
  competitors: CompetitorData[];
  qualitativeSummary: string;
}

export default function CompetitorsSection({
  targetTicker,
  targetName,
  targetMetrics,
  competitors,
  qualitativeSummary,
}: Props) {
  const [activeMetric, setActiveMetric] = useState<'marketCap' | 'peRatio' | 'growth'>('marketCap');

  // Combine target company with competitors for charting
  const allCompanies = [
    {
      ticker: targetTicker,
      name: targetName,
      marketCap: targetMetrics.marketCap || 0,
      revenue: targetMetrics.revenue || 0,
      peRatio: targetMetrics.peRatio || 0,
      profitMargin: targetMetrics.profitMargin || 0,
      growth: targetMetrics.revenueGrowth ? targetMetrics.revenueGrowth * 100 : 0, // ensure in % format
      isTarget: true,
    },
    ...competitors.map((c) => ({
      ticker: c.ticker,
      name: c.name,
      marketCap: c.marketCap,
      revenue: c.revenue,
      peRatio: c.peRatio,
      profitMargin: c.profitMargin * 100, // yahoo finance margin decimals vs %
      growth: c.growth * 100,
      isTarget: false,
    })),
  ];

  // Helper to format values on the chart
  const formatChartVal = (val: number, type: typeof activeMetric) => {
    if (type === 'marketCap') return `$${(val / 1e9).toFixed(1)}B`;
    if (type === 'peRatio') return `${val.toFixed(1)}x`;
    return `${val.toFixed(1)}%`;
  };

  const getMetricIcon = (type: typeof activeMetric) => {
    if (type === 'marketCap') return <DollarSign className="h-4 w-4 text-emerald-400" />;
    if (type === 'peRatio') return <Activity className="h-4 w-4 text-sky-400" />;
    return <Percent className="h-4 w-4 text-purple-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Competitor Benchmarking
          </h2>
          <p className="text-gray-400 text-sm mt-1">Cross-sectional peer analysis and market position</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table comparison */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Peer Comparison Matrix</h3>
            <ArrowLeftRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                  <th className="p-4">Company</th>
                  <th className="p-4 text-right">Market Cap</th>
                  <th className="p-4 text-right">P/E Ratio</th>
                  <th className="p-4 text-right">Profit Margin</th>
                  <th className="p-4 text-right">Revenue Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allCompanies.map((c, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors hover:bg-white/[0.02] ${c.isTarget ? 'bg-indigo-500/5 font-semibold text-white' : 'text-gray-300'}`}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[150px]">{c.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono font-medium">
                          {c.ticker} {c.isTarget && '(Target)'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatLargeNumber(c.marketCap)}
                    </td>
                    <td className="p-4 text-right">
                      {c.peRatio > 0 ? `${c.peRatio.toFixed(1)}x` : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      {formatPercent(c.profitMargin / 100, true)}
                    </td>
                    <td className="p-4 text-right">
                      {formatPercent(c.growth / 100, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmarking Charts */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              {getMetricIcon(activeMetric)}
              <h3 className="text-sm font-semibold text-white">Benchmark Metric</h3>
            </div>
            
            {/* Metric Selectors */}
            <div className="flex bg-white/5 border border-white/10 rounded-md p-0.5 text-[10px] font-bold">
              {(['marketCap', 'peRatio', 'growth'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveMetric(type)}
                  className={`px-2 py-1 rounded transition-all ${activeMetric === type ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {type === 'marketCap' ? 'Cap' : type === 'peRatio' ? 'P/E' : 'Growth'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart visual */}
          <div className="flex-1 min-h-[180px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allCompanies} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="ticker"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-panel p-2.5 rounded shadow-lg text-[11px]">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="text-indigo-300 mt-0.5 font-medium">
                            {activeMetric === 'marketCap' ? 'Market Cap' : activeMetric === 'peRatio' ? 'P/E Ratio' : 'Revenue Growth'}:{' '}
                            {formatChartVal(payload[0].value as number, activeMetric)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey={activeMetric} radius={[0, 4, 4, 0]} barSize={12}>
                  {allCompanies.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isTarget ? '#6366f1' : 'rgba(99, 102, 241, 0.3)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Qualitative Comparison Text */}
      <div className="glass-panel p-5 rounded-2xl border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-500/5 to-transparent">
        <h4 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
          Analyst Peer Commentary
        </h4>
        <p className="text-gray-300 text-sm leading-relaxed">{qualitativeSummary}</p>
      </div>
    </div>
  );
}
