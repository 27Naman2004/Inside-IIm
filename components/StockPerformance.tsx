import React, { useState } from 'react';
import { StockPerf, HistoricalPrice } from '@/types';
import { formatCurrency } from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, Maximize2 } from 'lucide-react';

interface Props {
  stockPerf: StockPerf;
  history: HistoricalPrice[];
}

export default function StockPerformance({ stockPerf, history }: Props) {
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Filter history to last 12 months, 3 years, or 5 years.
  // We can let the user toggle, but displaying the full historical range is nice.
  const [timeRange, setTimeRange] = useState<'1Y' | '3Y' | '5Y'>('5Y');

  const filteredHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
  
  let displayData = filteredHistory;
  if (timeRange === '1Y') {
    displayData = filteredHistory.slice(-12);
  } else if (timeRange === '3Y') {
    displayData = filteredHistory.slice(-36);
  }

  // Calculate 52-week slider position
  const get52WeekPosition = () => {
    const low = stockPerf.fiftyTwoWeekLow;
    const high = stockPerf.fiftyTwoWeekHigh;
    const current = stockPerf.currentPrice;
    if (!low || !high || !current) return 50;
    const position = ((current - low) / (high - low)) * 100;
    return Math.min(100, Math.max(0, position));
  };

  const getReturnBadge = (ret: number | null) => {
    if (ret === null || ret === undefined) return <span className="text-gray-400 font-semibold">N/A</span>;
    const isPos = ret > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPos ? '+' : ''}
        {ret.toFixed(2)}%
      </span>
    );
  };

  // Find min/max for chart scale
  const closes = displayData.map((d) => d.close);
  const minPrice = closes.length > 0 ? Math.min(...closes) : 0;
  const maxPrice = closes.length > 0 ? Math.max(...closes) : 100;
  const yDomainMin = Math.max(0, Math.floor(minPrice * 0.9));
  const yDomainMax = Math.ceil(maxPrice * 1.1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Stock Performance
          </h2>
          <p className="text-gray-400 text-sm mt-1">Interactive price charts and returns benchmarking</p>
        </div>
        
        {/* Time range picker */}
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-semibold self-start">
          {(['1Y', '3Y', '5Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-md transition-all ${timeRange === r ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chart Column */}
        <div className="lg:col-span-3 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div>
              <span className="text-xs text-gray-400">Current Share Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(hoveredData?.close || stockPerf.currentPrice)}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {hoveredData?.date ? `As of ${hoveredData.date}` : 'Live'}
                </span>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-indigo-400/70" />
          </div>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayData}
                onMouseMove={(state: any) => {
                  if (state.activePayload && state.activePayload.length > 0) {
                    setHoveredData(state.activePayload[0].payload);
                  }
                }}
                onMouseLeave={() => setHoveredData(null)}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(tick) => {
                    const [year, month] = tick.split('-');
                    const date = new Date(Number(year), Number(month) - 1, 1);
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis
                  domain={[yDomainMin, yDomainMax]}
                  axisLine={false}
                  tickLine={false}
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(tick) => `$${tick}`}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 1.5 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const dateObj = new Date(data.date + '-01');
                      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <div className="glass-panel p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="text-gray-400 font-medium">{formattedDate}</p>
                          <p className="text-white font-bold">Price: {formatCurrency(data.close)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* returns card */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 flex-1">
            <h3 className="text-sm font-semibold text-white mb-2">Historical Returns</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 block mb-1">1 Month</span>
                {getReturnBadge(stockPerf.oneMonthReturn)}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 block mb-1">6 Month</span>
                {getReturnBadge(stockPerf.sixMonthReturn)}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 block mb-1">1 Year</span>
                {getReturnBadge(stockPerf.oneYearReturn)}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 block mb-1">5 Year</span>
                {getReturnBadge(stockPerf.fiveYearReturn)}
              </div>
            </div>
          </div>

          {/* 52-week slider card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">52-Week Range</h3>
              <Maximize2 className="h-4 w-4 text-gray-400/50" />
            </div>
            
            <div className="space-y-1">
              <div className="h-2 w-full bg-white/5 rounded-full relative overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${get52WeekPosition()}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-semibold font-mono">
                <span>L: {formatCurrency(stockPerf.fiftyTwoWeekLow)}</span>
                <span>H: {formatCurrency(stockPerf.fiftyTwoWeekHigh)}</span>
              </div>
            </div>
            
            <p className="text-[11px] text-gray-400 pt-1 leading-normal">
              Trading at <span className="text-white font-medium">{get52WeekPosition().toFixed(0)}%</span> of the yearly high-low channel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
