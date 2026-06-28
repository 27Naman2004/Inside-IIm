export interface CompanyOverview {
  name: string;
  ticker: string;
  industry: string;
  sector: string;
  headquarters: string;
  ceo: string;
  founded: string | number;
  employees: number | null;
  marketCap: number | null;
  description: string;
}

export interface FinancialAnalysis {
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  peRatio: number | null;
  debt: number | null;
  freeCashFlow: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  roe: number | null;
  roa: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
}

export interface StockPerf {
  currentPrice: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  oneMonthReturn: number | null;
  sixMonthReturn: number | null;
  oneYearReturn: number | null;
  fiveYearReturn: number | null;
}

export interface HistoricalPrice {
  date: string;
  close: number;
}

export interface NewsArticle {
  headline: string;
  source: string;
  date: string;
  link?: string;
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface CompetitorData {
  ticker: string;
  name: string;
  marketCap: number;
  revenue: number;
  peRatio: number;
  profitMargin: number;
  growth: number;
}

export interface RiskItem {
  score: number;
  reason: string;
}

export interface Risks {
  financialRisk: RiskItem;
  businessRisk: RiskItem;
  regulatoryRisk: RiskItem;
  competitionRisk: RiskItem;
  marketRisk: RiskItem;
  technologyRisk: RiskItem;
}

export interface RecommendationDetails {
  investmentThesis: string;
  keyAdvantages: string[];
  majorRisks: string[];
  supportingEvidence: string;
  confidenceScore: number;
}

export interface AIAnalysis {
  newsSentiment: {
    overall: 'Positive' | 'Neutral' | 'Negative';
    articles: { headline: string; sentiment: 'Positive' | 'Neutral' | 'Negative' }[];
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  risks: Risks;
  competitorAnalysisSummary: string;
  investmentScore: number;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid' | 'Pass';
  recommendationDetails: RecommendationDetails;
  aiReasoning: string;
}

export interface InvestmentReport {
  overview: CompanyOverview;
  financialAnalysis: FinancialAnalysis;
  stockPerf: StockPerf;
  history: HistoricalPrice[];
  newsArticles: NewsArticle[];
  competitorData: CompetitorData[];
  aiAnalysis: AIAnalysis;
  isMockMode?: boolean;
}
