"use client";

import React, { useState, useEffect, useRef } from 'react';
import { InvestmentReport } from '@/types';
import OverviewSection from '@/components/OverviewSection';
import FinancialsSection from '@/components/FinancialsSection';
import StockPerformance from '@/components/StockPerformance';
import CompetitorsSection from '@/components/CompetitorsSection';
import NewsAnalysis from '@/components/NewsAnalysis';
import SwotAnalysis from '@/components/SwotAnalysis';
import RiskAnalysis from '@/components/RiskAnalysis';
import RecommendationSection from '@/components/RecommendationSection';
import {
  Search,
  ArrowLeft,
  Download,
  Copy,
  Share2,
  Sparkles,
  History,
  Trash2,
  Check,
  Loader2,
  TrendingUp,
  Brain,
  Printer,
  ChevronRight
} from 'lucide-react';

// Example companies list
const EXAMPLES = [
  { name: 'Apple', ticker: 'AAPL', subtitle: 'US Tech Giant' },
  { name: 'Tesla', ticker: 'TSLA', subtitle: 'EV Pioneer' },
  { name: 'Nvidia', ticker: 'NVDA', subtitle: 'AI Chips Leader' },
  { name: 'Microsoft', ticker: 'MSFT', subtitle: 'Software & Cloud' },
  { name: 'Amazon', ticker: 'AMZN', subtitle: 'E-commerce & AWS' },
  { name: 'Reliance Industries', ticker: 'RELIANCE.NS', subtitle: 'Indian Conglomerate' },
  { name: 'Tata Motors', ticker: 'TATAMOTORS.NS', subtitle: 'Auto Manufacturer' },
];

// Progress steps to display during loading
const PROGRESS_STEPS = [
  'Resolving company details...',
  'Scraping company metrics from Yahoo Finance...',
  'Compiling financial reports...',
  'Reading historical stock prices...',
  'Fetching latest market news...',
  'Benchmarking competitor metrics...',
  'Conducting SWOT profiling...',
  'Scoring risk coefficients...',
  'Generating final investment recommendation...'
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [history, setHistory] = useState<{ ticker: string; name: string; date: string; report: InvestmentReport }[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedText, setCopiedText] = useState<'markdown' | 'share' | null>(null);

  // References for scrolling
  const sectionRefs = {
    overview: useRef<HTMLDivElement>(null),
    financials: useRef<HTMLDivElement>(null),
    stock: useRef<HTMLDivElement>(null),
    competitors: useRef<HTMLDivElement>(null),
    news: useRef<HTMLDivElement>(null),
    swot: useRef<HTMLDivElement>(null),
    risks: useRef<HTMLDivElement>(null),
    recommendation: useRef<HTMLDivElement>(null),
    reasoning: useRef<HTMLDivElement>(null),
  };

  // Load search history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('investment_agent_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to load history from localStorage:', e);
    }
  }, []);

  // Save analysis to history
  const saveToHistory = (newReport: InvestmentReport) => {
    try {
      const item = {
        ticker: newReport.overview.ticker,
        name: newReport.overview.name,
        date: new Date().toLocaleDateString(),
        report: newReport,
      };

      // Filter out existing searches for same ticker to avoid duplicates
      const filtered = history.filter((h) => h.ticker.toUpperCase() !== newReport.overview.ticker.toUpperCase());
      const updatedHistory = [item, ...filtered].slice(0, 10); // Keep last 10 entries

      setHistory(updatedHistory);
      localStorage.setItem('investment_agent_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save history to localStorage:', e);
    }
  };

  // Clear search history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('investment_agent_history');
  };

  // Handle company analysis
  const handleAnalyze = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setReport(null);
    setProgressStep(0);

    // Step animation interval to guide user through AI process
    const stepInterval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: searchQuery }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze the company. Please check the spelling or ticker.');
      }

      const data: InvestmentReport = await response.json();
      setReport(data);
      saveToHistory(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err?.message || 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to section helper
  const scrollToSection = (sectionKey: keyof typeof sectionRefs) => {
    setActiveTab(sectionKey);
    const ref = sectionRefs[sectionKey];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Copy report as markdown helper
  const handleCopyMarkdown = () => {
    if (!report) return;

    const md = `# AI Investment Research Report: ${report.overview.name} (${report.overview.ticker})
Generated on ${new Date().toLocaleDateString()} | Powered by AI Investment Research Agent

## 1. Executive Summary
- **Recommendation**: ${report.aiAnalysis.recommendation.toUpperCase()}
- **Investment Score**: ${report.aiAnalysis.investmentScore}/100
- **Sector**: ${report.overview.sector}
- **Industry**: ${report.overview.industry}
- **CEO**: ${report.overview.ceo}
- **Market Cap**: $${((report.overview.marketCap || 0) / 1e9).toFixed(2)}B

## 2. Investment Thesis
${report.aiAnalysis.recommendationDetails.investmentThesis}

## 3. Key Advantages
${report.aiAnalysis.recommendationDetails.keyAdvantages.map((a) => `- ${a}`).join('\n')}

## 4. Key Risks
${report.aiAnalysis.recommendationDetails.majorRisks.map((r) => `- ${r}`).join('\n')}

## 5. SWOT Analysis
### Strengths
${report.aiAnalysis.swot.strengths.map((s) => `- ${s}`).join('\n')}
### Weaknesses
${report.aiAnalysis.swot.weaknesses.map((w) => `- ${w}`).join('\n')}
### Opportunities
${report.aiAnalysis.swot.opportunities.map((o) => `- ${o}`).join('\n')}
### Threats
${report.aiAnalysis.swot.threats.map((t) => `- ${t}`).join('\n')}

## 6. Financial Health
- **Revenue**: $${((report.financialAnalysis.revenue || 0) / 1e9).toFixed(2)}B
- **Net Income**: $${((report.financialAnalysis.netIncome || 0) / 1e9).toFixed(2)}B
- **Operating Margin**: ${(Number(report.financialAnalysis.operatingMargin) * 100).toFixed(2)}%
- **Net Profit Margin**: ${(Number(report.financialAnalysis.profitMargin) * 100).toFixed(2)}%
- **P/E Ratio**: ${report.financialAnalysis.peRatio ? report.financialAnalysis.peRatio.toFixed(2) + 'x' : 'N/A'}
- **Free Cash Flow**: $${((report.financialAnalysis.freeCashFlow || 0) / 1e9).toFixed(2)}B

## 7. AI Reasoning
${report.aiAnalysis.aiReasoning}
`;

    navigator.clipboard.writeText(md).then(() => {
      setCopiedText('markdown');
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  // Share report helper
  const handleShare = () => {
    if (!report) return;
    const shareUrl = `${window.location.origin}/?ticker=${report.overview.ticker}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedText('share');
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  // Download raw JSON helper
  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.overview.ticker}_investment_report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger PDF print
  const handlePrint = () => {
    window.print();
  };

  // Handle URL query parameters to auto-analyze if provided (e.g. share links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tickerParam = params.get('ticker');
    if (tickerParam) {
      setQuery(tickerParam);
      handleAnalyze(tickerParam);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col relative bg-bg-dark text-white min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background neon gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Container */}
      {!report && !loading ? (
        // LANDING PAGE VIEW
        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full px-6 py-12 md:py-24">
          <div className="text-center space-y-6 animate-fade-in">
            {/* Header Sparkle Icon */}
            <div className="inline-flex items-center justify-center p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl shadow-xl shadow-indigo-500/5 mb-2">
              <Sparkles className="h-7 w-7 text-indigo-400" />
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              AI Investment{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Research Agent
              </span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Research any company with real-time scraping of Yahoo Finance reports and news, paired with institutional SWOT, Risk, and Recommendation matrices.
            </p>

            {/* Search Input Box */}
            <div className="max-w-xl mx-auto pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze(query);
                }}
                className="relative flex items-center bg-card-dark border border-border-glass rounded-2xl p-1.5 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all"
              >
                <div className="pl-3 text-gray-500 shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter company name or ticker (e.g. Apple, TSLA, Nvidia)..."
                  className="w-full bg-transparent border-0 outline-0 py-3 px-3 text-sm text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:text-gray-400 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0"
                >
                  <TrendingUp className="h-4 w-4" />
                  Analyze
                </button>
              </form>
              
              {/* Error Box */}
              {error && (
                <div className="mt-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-left">
                  {error}
                </div>
              )}
            </div>

            {/* Examples Grid */}
            <div className="pt-6 space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">Popular Searches</span>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(ex.ticker);
                      handleAnalyze(ex.ticker);
                    }}
                    className="glass-panel glass-panel-hover px-4 py-2.5 rounded-xl text-left flex flex-col justify-between min-w-[120px]"
                  >
                    <span className="text-xs font-bold text-white">{ex.name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 font-mono">{ex.ticker}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Local Storage History list */}
            {history.length > 0 && (
              <div className="pt-10 border-t border-white/5 max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                    <History className="h-4 w-4" />
                    <span>Recent Reports</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-rose-400/70 hover:text-rose-400 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="h-3 w-3" /> Clear History
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {history.slice(0, 4).map((hist, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReport(hist.report)}
                      className="glass-panel glass-panel-hover p-3 rounded-xl flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <span className="text-xs font-bold text-white block truncate">{hist.name}</span>
                        <span className="text-[9px] text-gray-500 font-mono">{hist.ticker} • {hist.date}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : loading ? (
        // LOADING / PROGRESS TRACKER STATE
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-6 text-center space-y-6">
          <div className="relative flex items-center justify-center">
            {/* Spinning glowing outer ring */}
            <div className="w-16 h-16 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
            <Brain className="h-6 w-6 text-indigo-400 absolute" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Synthesizing Equity Report</h2>
            <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
              Our financial agent is crawling Yahoo Finance, scraping financial ratios, and compiling risk metrics.
            </p>
          </div>

          {/* Stepper Progress Block */}
          <div className="w-full glass-panel p-5 rounded-2xl text-left space-y-3">
            <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400 border-b border-white/5 pb-2 mb-1">
              <span>AGENT TASKS</span>
              <span>{progressStep + 1} / {PROGRESS_STEPS.length}</span>
            </div>
            
            <div className="space-y-2.5">
              {PROGRESS_STEPS.map((step, idx) => {
                const isActive = idx === progressStep;
                const isCompleted = idx < progressStep;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 text-xs transition-opacity ${isActive ? 'text-indigo-400 font-semibold opacity-100' : isCompleted ? 'text-emerald-400 opacity-60' : 'text-gray-600 opacity-30'}`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-700 ml-1 shrink-0" />
                    )}
                    <span className="truncate">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // DASHBOARD VIEW
        <div className="flex-1 flex flex-col">
          {/* Header Action Bar */}
          <header className="sticky top-0 z-30 no-print glass-panel border-x-0 border-t-0 bg-bg-dark/95 backdrop-blur px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setReport(null)}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                title="Back to search"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg font-bold text-white">{report?.overview.name}</h1>
                  <span className="text-xs text-indigo-400 font-mono font-bold uppercase">
                    {report?.overview.ticker}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Sector: {report?.overview.sector} • Industry: {report?.overview.industry}
                </p>
              </div>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center gap-2">
              {report?.isMockMode && (
                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider hidden sm:inline mr-2">
                  Showcase/Demo Mode
                </span>
              )}

              <button
                onClick={handlePrint}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Export PDF / Print Report"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Copy report as markdown text"
              >
                {copiedText === 'markdown' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {copiedText === 'markdown' ? 'Copied' : 'Copy MD'}
                </span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Download raw report as JSON"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download JSON</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Copy share link"
              >
                {copiedText === 'share' ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {copiedText === 'share' ? 'Link Copied' : 'Share'}
                </span>
              </button>
            </div>
          </header>

          {/* Main Dashboard Layout */}
          <div className="flex-1 flex px-6 py-6 gap-8 max-w-7xl mx-auto w-full print-container">
            {/* Sidebar Sticky Navigation (Hidden on print) */}
            <aside className="w-56 shrink-0 sticky top-24 h-[fit-content] space-y-1.5 no-print hidden md:block">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
                Report Sections
              </div>
              
              {[
                { id: 'overview', label: 'Company Profile' },
                { id: 'financials', label: 'Financial Health' },
                { id: 'stock', label: 'Stock Performance' },
                { id: 'competitors', label: 'Competitor Matrix' },
                { id: 'news', label: 'News & Sentiment' },
                { id: 'swot', label: 'SWOT Analysis' },
                { id: 'risks', label: 'Risk Assessment' },
                { id: 'recommendation', label: 'Final Decision' },
                { id: 'reasoning', label: 'AI Reasoning Logs' },
              ].map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id as any)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-all ${activeTab === sec.id ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 font-semibold' : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/[0.02]'}`}
                >
                  {sec.label}
                </button>
              ))}
            </aside>

            {/* Sections Content Column */}
            <main className="flex-1 space-y-12 overflow-x-hidden print-container">
              {/* Overview Section */}
              <section ref={sectionRefs.overview} id="overview" className="scroll-mt-28">
                {report && <OverviewSection overview={report.overview} />}
              </section>

              <hr className="border-white/5" />

              {/* Financials Section */}
              <section ref={sectionRefs.financials} id="financials" className="scroll-mt-28">
                {report && <FinancialsSection financials={report.financialAnalysis} />}
              </section>

              <hr className="border-white/5" />

              {/* Stock Performance Section */}
              <section ref={sectionRefs.stock} id="stock" className="scroll-mt-28">
                {report && <StockPerformance stockPerf={report.stockPerf} history={report.history} />}
              </section>

              <hr className="border-white/5" />

              {/* Competitors Section */}
              <section ref={sectionRefs.competitors} id="competitors" className="scroll-mt-28">
                {report && (
                  <CompetitorsSection
                    targetTicker={report.overview.ticker}
                    targetName={report.overview.name}
                    targetMetrics={{
                      revenue: report.financialAnalysis.revenue,
                      marketCap: report.overview.marketCap,
                      peRatio: report.financialAnalysis.peRatio,
                      profitMargin: report.financialAnalysis.profitMargin,
                      revenueGrowth: report.financialAnalysis.revenueGrowth,
                    }}
                    competitors={report.competitorData}
                    qualitativeSummary={report.aiAnalysis.competitorAnalysisSummary}
                  />
                )}
              </section>

              <hr className="border-white/5" />

              {/* News & Sentiment Section */}
              <section ref={sectionRefs.news} id="news" className="scroll-mt-28">
                {report && (
                  <NewsAnalysis
                    news={report.newsArticles}
                    overallSentiment={report.aiAnalysis.newsSentiment.overall}
                  />
                )}
              </section>

              <hr className="border-white/5" />

              {/* SWOT Section */}
              <section ref={sectionRefs.swot} id="swot" className="scroll-mt-28">
                {report && <SwotAnalysis swot={report.aiAnalysis.swot} />}
              </section>

              <hr className="border-white/5" />

              {/* Risks Section */}
              <section ref={sectionRefs.risks} id="risks" className="scroll-mt-28">
                {report && <RiskAnalysis risks={report.aiAnalysis.risks} />}
              </section>

              <hr className="border-white/5" />

              {/* Recommendation Section */}
              <section ref={sectionRefs.recommendation} id="recommendation" className="scroll-mt-28">
                {report && <RecommendationSection analysis={report.aiAnalysis} />}
              </section>

              <hr className="border-white/5" />

              {/* AI Reasoning Section */}
              <section ref={sectionRefs.reasoning} id="reasoning" className="scroll-mt-28 pb-12">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      AI Reasoning Log
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Audit trail and cognitive analysis breakdown</p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl relative bg-white/[0.01]">
                    <div className="flex items-center gap-2 text-indigo-400 mb-3">
                      <Brain className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white">Chain of Thought</span>
                    </div>
                    <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed text-justify bg-black/40 border border-white/5 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                      {report?.aiAnalysis.aiReasoning}
                    </pre>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
