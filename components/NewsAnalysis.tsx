import React from 'react';
import { NewsArticle } from '@/types';
import { Rss, Smile, Meh, Frown, ExternalLink } from 'lucide-react';

interface Props {
  news: NewsArticle[];
  overallSentiment: 'Positive' | 'Neutral' | 'Negative';
}

export default function NewsAnalysis({ news, overallSentiment }: Props) {
  // Count sentiments
  const counts = news.reduce(
    (acc, item) => {
      const sent = item.sentiment || 'Neutral';
      acc[sent] = (acc[sent] || 0) + 1;
      return acc;
    },
    { Positive: 0, Neutral: 0, Negative: 0 } as Record<'Positive' | 'Neutral' | 'Negative', number>
  );

  const total = news.length || 1;
  const pctPositive = Math.round((counts.Positive / total) * 100);
  const pctNeutral = Math.round((counts.Neutral / total) * 100);
  const pctNegative = Math.round((counts.Negative / total) * 100);

  const getSentimentIcon = (sent: string, className = "h-4 w-4") => {
    if (sent === 'Positive') return <Smile className={`${className} text-emerald-400`} />;
    if (sent === 'Negative') return <Frown className={`${className} text-rose-400`} />;
    return <Meh className={`${className} text-amber-400`} />;
  };

  const getSentimentBadge = (sent: string) => {
    let colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (sent === 'Positive') colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (sent === 'Negative') colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide ${colorClass}`}>
        {getSentimentIcon(sent, "h-3 w-3")}
        {sent}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          News & Sentiment Analysis
        </h2>
        <p className="text-gray-400 text-sm mt-1">Real-time media screening and algorithmic market mood index</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sentiment breakdown card */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Media Sentiment Index</h3>
            <div className="flex items-center gap-3">
              {getSentimentIcon(overallSentiment, "h-8 w-8")}
              <div>
                <span className="text-xl font-bold text-white block">{overallSentiment}</span>
                <span className="text-[10px] text-gray-500">Aggregate news index</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 flex justify-between">
              <span>Sentiment Share</span>
              <span>{news.length} Articles</span>
            </div>
            
            <div className="h-3 w-full bg-white/5 rounded-full flex overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${pctPositive}%` }} title={`Positive: ${pctPositive}%`} />
              <div className="bg-amber-500 h-full" style={{ width: `${pctNeutral}%` }} title={`Neutral: ${pctNeutral}%`} />
              <div className="bg-rose-500 h-full" style={{ width: `${pctNegative}%` }} title={`Negative: ${pctNegative}%`} />
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Pos: {pctPositive}%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Neu: {pctNeutral}%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Neg: {pctNegative}%</span>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="md:col-span-3 space-y-4 max-h-[450px] overflow-y-auto pr-2">
          {news.length === 0 ? (
            <div className="glass-panel p-8 text-center text-gray-400 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <Rss className="h-8 w-8 text-gray-500" />
              <span>No recent news articles discovered.</span>
            </div>
          ) : (
            news.map((item, idx) => (
              <div
                key={idx}
                className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between space-y-3 relative group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-gray-500 font-semibold bg-white/5 px-2 py-0.5 rounded">
                        {item.source}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {item.date}
                      </span>
                    </div>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1 leading-snug"
                      >
                        {item.headline}
                        <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <h4 className="text-sm font-semibold text-white leading-snug">
                        {item.headline}
                      </h4>
                    )}
                  </div>
                  <div className="shrink-0">{getSentimentBadge(item.sentiment)}</div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed text-justify line-clamp-3">
                  {item.summary}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
