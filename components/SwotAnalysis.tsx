import React from 'react';
import { ShieldCheck, Flame, Zap, AlertOctagon } from 'lucide-react';

interface Props {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export default function SwotAnalysis({ swot }: Props) {
  const categories = [
    {
      title: 'Strengths',
      items: swot.strengths,
      icon: ShieldCheck,
      borderColor: 'border-l-emerald-500',
      iconColor: 'text-emerald-400',
      bgColor: 'from-emerald-500/5 to-transparent',
      textColor: 'text-emerald-300',
    },
    {
      title: 'Weaknesses',
      items: swot.weaknesses,
      icon: Flame,
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-400',
      bgColor: 'from-amber-500/5 to-transparent',
      textColor: 'text-amber-300',
    },
    {
      title: 'Opportunities',
      items: swot.opportunities,
      icon: Zap,
      borderColor: 'border-l-indigo-500',
      iconColor: 'text-indigo-400',
      bgColor: 'from-indigo-500/5 to-transparent',
      textColor: 'text-indigo-300',
    },
    {
      title: 'Threats',
      items: swot.threats,
      icon: AlertOctagon,
      borderColor: 'border-l-rose-500',
      iconColor: 'text-rose-400',
      bgColor: 'from-rose-500/5 to-transparent',
      textColor: 'text-rose-300',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          SWOT Analysis
        </h2>
        <p className="text-gray-400 text-sm mt-1">Strategic internal and external factors appraisal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className={`glass-panel border-l-4 ${cat.borderColor} p-6 rounded-2xl bg-gradient-to-br ${cat.bgColor} space-y-4`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
              </div>
              <h3 className={`text-lg font-bold ${cat.textColor}`}>{cat.title}</h3>
            </div>
            
            <ul className="space-y-2.5 text-xs text-gray-300">
              {cat.items && cat.items.length > 0 ? (
                cat.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-2 items-start leading-relaxed text-justify">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 bg-white/20`} />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No specific factor identified.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
