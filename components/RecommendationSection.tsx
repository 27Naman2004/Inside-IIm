import React, { useEffect } from 'react';
import { AIAnalysis } from '@/types';
import { ShieldCheck, ShieldAlert, Award, Star, ListChecks, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  analysis: AIAnalysis;
}

export default function RecommendationSection({ analysis }: Props) {
  const score = analysis.investmentScore || 0;
  const rec = analysis.recommendation || 'Hold';
  const details = analysis.recommendationDetails || {};
  const confidence = details.confidenceScore || 70;

  // Colors based on score
  let scoreColorClass = 'text-amber-400 border-amber-500/20 bg-amber-500/10';
  let gaugeColor = '#f59e0b'; // amber-500
  let recLabelColor = 'text-amber-400';

  if (score >= 80) {
    scoreColorClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    gaugeColor = '#10b981'; // emerald-500
    recLabelColor = 'text-emerald-400';
  } else if (score < 50) {
    scoreColorClass = 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    gaugeColor = '#f43f5e'; // rose-500
    recLabelColor = 'text-rose-400';
  }

  // Svg gauge mathematics
  const pathLength = 126; // approx pi * r (pi * 40)
  const strokeDashoffset = pathLength - (score / 100) * pathLength;

  // Trigger confetti if investment score is high (80+) on load
  useEffect(() => {
    if (score >= 80) {
      const duration = 1.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 50 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [score]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Investment Recommendation
        </h2>
        <p className="text-gray-400 text-sm mt-1">Final decision, thesis, and evidence breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation Score Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Rating</h3>
          
          <div className="relative w-44 h-24 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg viewBox="0 0 100 55" className="w-full h-full gauge-svg absolute inset-0">
              {/* Background Path */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Colored Indicator Path */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${pathLength}`}
                strokeDashoffset={`${strokeDashoffset}`}
                style={{
                  transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </svg>
            
            {/* Centered Score text */}
            <div className="text-center mt-6">
              <span className="text-3xl font-extrabold text-white tracking-tight">{score}</span>
              <span className="text-[10px] text-gray-500 font-bold block">SCORE / 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className={`text-xl font-extrabold tracking-wide uppercase ${recLabelColor}`}>{rec}</span>
            <div className="text-[10px] text-gray-500 font-semibold font-mono">
              CONFIDENCE LEVEL: {confidence}%
            </div>
          </div>

          <hr className="w-full border-white/5" />

          <p className="text-[11px] text-gray-400 leading-normal px-2">
            This rating represents an automated synthesis of financial reports, competitor performance, risk exposure, and media tone.
          </p>
        </div>

        {/* Thesis & Evidence Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Investment Thesis */}
          <div className="glass-panel p-5 rounded-2xl relative">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <Star className="h-4 w-4" />
              <h3 className="text-sm font-semibold text-white">Investment Thesis</h3>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed text-justify">
              {details.investmentThesis}
            </p>
          </div>

          {/* Advantages & Risks Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Advantages */}
            <div className="glass-panel p-5 rounded-2xl border-l-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <ListChecks className="h-4 w-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Key Advantages</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {details.keyAdvantages && details.keyAdvantages.length > 0 ? (
                  details.keyAdvantages.map((adv, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-snug">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500/70" />
                      <span>{adv}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No primary advantage noted.</li>
                )}
              </ul>
            </div>

            {/* Major Risks */}
            <div className="glass-panel p-5 rounded-2xl border-l-2 border-rose-500/50 bg-gradient-to-br from-rose-500/[0.02] to-transparent">
              <div className="flex items-center gap-2 mb-3 text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Major Risk Factors</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {details.majorRisks && details.majorRisks.length > 0 ? (
                  details.majorRisks.map((risk, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-snug">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500/70" />
                      <span>{risk}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No severe risks listed.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Supporting Evidence */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-sky-400">
              <HelpCircle className="h-4 w-4" />
              <h3 className="text-sm font-semibold text-white">Supporting Evidence</h3>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed text-justify">
              {details.supportingEvidence}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
