import React from 'react';
import { Risks } from '@/types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Info } from 'lucide-react';

interface Props {
  risks: Risks;
}

export default function RiskAnalysis({ risks }: Props) {
  // Map risk items to array for charting
  const chartData = [
    { subject: 'Financial', score: risks.financialRisk?.score || 0, fullMark: 10 },
    { subject: 'Business', score: risks.businessRisk?.score || 0, fullMark: 10 },
    { subject: 'Regulatory', score: risks.regulatoryRisk?.score || 0, fullMark: 10 },
    { subject: 'Competition', score: risks.competitionRisk?.score || 0, fullMark: 10 },
    { subject: 'Market', score: risks.marketRisk?.score || 0, fullMark: 10 },
    { subject: 'Technology', score: risks.technologyRisk?.score || 0, fullMark: 10 },
  ];

  const riskDetails = [
    { title: 'Financial Risk', key: 'financialRisk', data: risks.financialRisk },
    { title: 'Business Risk', key: 'businessRisk', data: risks.businessRisk },
    { title: 'Regulatory Risk', key: 'regulatoryRisk', data: risks.regulatoryRisk },
    { title: 'Competition Risk', key: 'competitionRisk', data: risks.competitionRisk },
    { title: 'Market Risk', key: 'marketRisk', data: risks.marketRisk },
    { title: 'Technology Risk', key: 'technologyRisk', data: risks.technologyRisk },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (score >= 5) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return 'bg-rose-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Risk Profiling
        </h2>
        <p className="text-gray-400 text-sm mt-1">Multi-dimensional risk analysis and threat coefficient</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[300px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Risk Dimension Radar</h3>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#4b5563" fontSize={8} />
                <Radar
                  name="Risk Level"
                  dataKey="score"
                  stroke="#818cf8"
                  fill="#4f46e5"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Risk Items */}
        <div className="lg:col-span-3 space-y-3 max-h-[350px] overflow-y-auto pr-2">
          {riskDetails.map((risk, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{risk.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${getScoreColor(risk.data?.score || 0)}`}>
                  Score: {risk.data?.score || 0}/10
                </span>
              </div>
              
              {/* Risk Level Bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(risk.data?.score || 0)}`}
                  style={{ width: `${(risk.data?.score || 0) * 10}%` }}
                />
              </div>

              <p className="text-[11px] text-gray-400 leading-normal text-justify flex items-start gap-1 pt-1">
                <Info className="h-3 w-3 shrink-0 text-gray-500 mt-0.5" />
                <span>{risk.data?.reason || 'Threat factor under baseline.'}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
