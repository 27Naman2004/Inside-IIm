import React from 'react';
import { CompanyOverview } from '@/types';
import { formatLargeNumber } from '@/utils/format';
import { Building2, Users, MapPin, Calendar, Briefcase, User, Milestone, Landmark } from 'lucide-react';

interface Props {
  overview: CompanyOverview;
}

export default function OverviewSection({ overview }: Props) {
  const metaItems = [
    {
      label: 'Ticker Symbol',
      value: overview.ticker,
      icon: Milestone,
      color: 'text-indigo-400',
    },
    {
      label: 'Market Capitalization',
      value: formatLargeNumber(overview.marketCap),
      icon: Landmark,
      color: 'text-emerald-400',
    },
    {
      label: 'Chief Executive Officer',
      value: overview.ceo,
      icon: User,
      color: 'text-sky-400',
    },
    {
      label: 'Sector',
      value: overview.sector,
      icon: Briefcase,
      color: 'text-purple-400',
    },
    {
      label: 'Industry',
      value: overview.industry,
      icon: Building2,
      color: 'text-pink-400',
    },
    {
      label: 'Employees',
      value: overview.employees ? overview.employees.toLocaleString() : 'N/A',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Headquarters',
      value: overview.headquarters,
      icon: MapPin,
      color: 'text-amber-400',
    },
    {
      label: 'Founded Year',
      value: overview.founded,
      icon: Calendar,
      color: 'text-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Company Profile
        </h2>
        <p className="text-gray-400 text-sm mt-1">Primary details and metadata</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metaItems.map((item, idx) => (
          <div
            key={idx}
            className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">{item.label}</span>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <span className="text-lg font-semibold text-white tracking-wide truncate">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-lg font-semibold text-white mb-3">Business Description</h3>
        <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line text-justify">
          {overview.description}
        </p>
      </div>
    </div>
  );
}
