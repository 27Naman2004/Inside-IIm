import React from 'react';
import { FinancialAnalysis } from '@/types';
import { formatCurrency, formatLargeNumber, formatPercent } from '@/utils/format';
import { TrendingUp, TrendingDown, ShieldAlert, Award, PiggyBank, Scale } from 'lucide-react';

interface Props {
  financials: FinancialAnalysis;
}

export default function FinancialsSection({ financials }: Props) {
  // Margins and Growth typically return as decimals, check and display properly
  const formatGrowthValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    // Sometimes growth is returned as percentage (e.g. 12.5 = 12.5%), sometimes as fraction (e.g. 0.125 = 12.5%)
    // If it's absolute value > 1, assume it's already in % format.
    const isDecimal = Math.abs(val) <= 1.0;
    return formatPercent(val, isDecimal);
  };

  const getGrowthIndicator = (val: number | null | undefined) => {
    if (val === null || val === undefined) return null;
    const isPositive = val > 0;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? 'Growth' : 'Decline'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Financial Analysis
        </h2>
        <p className="text-gray-400 text-sm mt-1">Core income statement and balance sheet benchmarking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Revenue & Net Income */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Award className="h-5 w-5" />
            <h3 className="font-semibold text-white">Top & Bottom Line</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Revenue</span>
                {getGrowthIndicator(financials.revenueGrowth)}
              </div>
              <p className="text-2xl font-bold text-white">{formatLargeNumber(financials.revenue)}</p>
              <div className="text-xs text-gray-500 mt-0.5">
                YoY Growth: <span className="text-gray-300 font-medium">{formatGrowthValue(financials.revenueGrowth)}</span>
              </div>
            </div>
            <hr className="border-white/5" />
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Net Income</span>
                {getGrowthIndicator(financials.earningsGrowth)}
              </div>
              <p className="text-2xl font-bold text-white">{formatLargeNumber(financials.netIncome)}</p>
              <div className="text-xs text-gray-500 mt-0.5">
                YoY EPS Growth: <span className="text-gray-300 font-medium">{formatGrowthValue(financials.earningsGrowth)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Margins & Profitability */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <PiggyBank className="h-5 w-5" />
            <h3 className="font-semibold text-white">Profitability Margins</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Gross Margin</span>
                <span className="text-white font-medium">{formatPercent(financials.grossMargin, true)}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (financials.grossMargin || 0) * 100))}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Operating Margin</span>
                <span className="text-white font-medium">{formatPercent(financials.operatingMargin, true)}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (financials.operatingMargin || 0) * 100))}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Net Profit Margin</span>
                <span className="text-white font-medium">{formatPercent(financials.profitMargin, true)}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (financials.profitMargin || 0) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Debt & Free Cash Flow */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Scale className="h-5 w-5" />
            <h3 className="font-semibold text-white">Solvency & Cash Flow</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Free Cash Flow (FCF)</span>
              <p className="text-2xl font-bold text-white">{formatLargeNumber(financials.freeCashFlow)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Primary indicator of cash generation strength.</p>
            </div>
            <hr className="border-white/5" />
            <div>
              <span className="text-xs text-gray-400 block mb-1">Total Leverage / Debt</span>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-white">{formatLargeNumber(financials.debt)}</p>
                {financials.debt && financials.freeCashFlow && financials.debt > financials.freeCashFlow * 5 && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                    <ShieldAlert className="h-3 w-3" /> High Leverage
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratios row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">P/E Ratio (Trailing)</span>
          <span className="text-xl font-bold text-white">
            {financials.peRatio ? `${financials.peRatio.toFixed(2)}x` : 'N/A'}
          </span>
          <span className="text-[10px] text-gray-500 block mt-1">Valuation multiple</span>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">Earnings Per Share (EPS)</span>
          <span className="text-xl font-bold text-white">
            {financials.eps !== null && financials.eps !== undefined ? `$${financials.eps.toFixed(2)}` : 'N/A'}
          </span>
          <span className="text-[10px] text-gray-500 block mt-1">Net income per common share</span>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">Return on Equity (ROE)</span>
          <span className="text-xl font-bold text-white">{formatPercent(financials.roe, true)}</span>
          <span className="text-[10px] text-gray-500 block mt-1">Efficiency using book value</span>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">Return on Assets (ROA)</span>
          <span className="text-xl font-bold text-white">{formatPercent(financials.roa, true)}</span>
          <span className="text-[10px] text-gray-500 block mt-1">Earnings relative to total assets</span>
        </div>
      </div>
    </div>
  );
}
