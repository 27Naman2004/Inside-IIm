import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Using default yahoo-finance2 options. Config defaults can be adjusted via query context.

// OpenAI client will be instantiated dynamically inside the handler when key is present

// Define type interfaces
interface HistoricalPrice {
  date: string;
  close: number;
}

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Step 1: Find Company and resolve Ticker
    const searchRes: any = await yahooFinance.search(companyName, { newsCount: 5 });
    const equityQuotes = searchRes.quotes.filter(
      (q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'MUTUALFUND'
    );

    if (equityQuotes.length === 0) {
      return NextResponse.json({ error: `Could not find a stock symbol for "${companyName}". Please try with a ticker symbol (e.g. AAPL, TSLA).` }, { status: 404 });
    }

    const resolvedQuote = equityQuotes[0];
    const ticker = resolvedQuote.symbol;
    const displayName = resolvedQuote.longname || resolvedQuote.shortname || ticker;

    // Step 2: Fetch Company summary and financials in parallel
    let summary: any = null;
    let financials: any = null;
    let history: HistoricalPrice[] = [];
    let competitorData: any[] = [];
    
    try {
      summary = await yahooFinance.quoteSummary(ticker, {
        modules: [
          'summaryDetail',
          'price',
          'financialData',
          'defaultKeyStatistics',
          'assetProfile',
        ],
      });
    } catch (err) {
      console.error('Error fetching quoteSummary:', err);
      return NextResponse.json({ error: `Error fetching details for ticker ${ticker}. Yahoo Finance might be rate-limiting or the ticker is invalid.` }, { status: 500 });
    }

    // Step 3: Fetch historical stock performance
    // We want the last 5 years to compute returns and draw the chart
    const today = new Date();
    const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
    
    try {
      const historicalRes: any = await yahooFinance.historical(ticker, {
        period1: fiveYearsAgo,
        period2: today,
        interval: '1mo',
      });
      
      history = historicalRes
        .map((h: any) => ({
          date: new Date(h.date).toISOString().slice(0, 7), // YYYY-MM
          close: Number(h.adjClose || h.close),
        }))
        .filter((h: any) => !isNaN(h.close));
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }

    // Format basic overview data
    const profile = summary?.assetProfile || {};
    const price = summary?.price || {};
    const detail = summary?.summaryDetail || {};
    const stats = summary?.defaultKeyStatistics || {};
    const finData = summary?.financialData || {};

    const overview = {
      name: displayName,
      ticker: ticker,
      industry: profile.industry || 'Unknown',
      sector: profile.sector || 'Unknown',
      headquarters: `${profile.city || ''}${profile.city && profile.state ? ', ' : ''}${profile.state || ''}${profile.state && profile.country ? ', ' : ''}${profile.country || 'Unknown'}`,
      ceo: profile.companyOfficers?.[0]?.name || 'N/A',
      founded: profile.founded || 'N/A',
      employees: profile.fullTimeEmployees || null,
      marketCap: price.marketCap || detail.marketCap || null,
      description: profile.longBusinessSummary || 'No description available.',
    };

    // Format financial metrics
    const financialAnalysis = {
      revenue: finData.totalRevenue || null,
      netIncome: stats.netIncomeToCommon || null,
      eps: stats.trailingEps || null,
      peRatio: detail.trailingPE || stats.forwardPE || null,
      debt: finData.totalDebt || null,
      freeCashFlow: finData.freeCashflow || null,
      grossMargin: finData.grossMargins || null,
      operatingMargin: finData.operatingMargins || null,
      profitMargin: finData.profitMargins || stats.profitMargins || null,
      roe: finData.returnOnEquity || null,
      roa: finData.returnOnAssets || null,
      revenueGrowth: finData.revenueGrowth || null,
      earningsGrowth: stats.earningsGrowth || null,
    };

    // Calculate Stock Returns
    let currentPrice = price.regularMarketPrice || finData.currentPrice || null;
    let stockPerf = {
      currentPrice: currentPrice,
      fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: detail.fiftyTwoWeekLow || null,
      oneMonthReturn: null as number | null,
      sixMonthReturn: null as number | null,
      oneYearReturn: null as number | null,
      fiveYearReturn: null as number | null,
    };

    if (history.length > 0 && currentPrice) {
      // Sort history oldest first
      const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
      const latestHistClose = sortedHistory[sortedHistory.length - 1].close;
      const effectiveCurrent = currentPrice || latestHistClose;

      // Function to calculate percentage return
      const getReturn = (pastClose: number) => {
        return Number(((effectiveCurrent - pastClose) / pastClose * 100).toFixed(2));
      };

      // 1 month return (approx 1 index back in monthly data)
      if (sortedHistory.length > 1) {
        stockPerf.oneMonthReturn = getReturn(sortedHistory[sortedHistory.length - 2].close);
      }
      // 6 months return
      if (sortedHistory.length > 6) {
        stockPerf.sixMonthReturn = getReturn(sortedHistory[sortedHistory.length - 7].close);
      }
      // 1 year return
      if (sortedHistory.length > 12) {
        stockPerf.oneYearReturn = getReturn(sortedHistory[sortedHistory.length - 13].close);
      }
      // 5 years return
      if (sortedHistory.length > 0) {
        stockPerf.fiveYearReturn = getReturn(sortedHistory[0].close);
      }
    }

    // Format News: Use Tavily Search API if TAVILY_API_KEY is present, fallback to Yahoo Finance news
    // Format News: Use Tavily Search API if TAVILY_API_KEY is present, fallback to Serper Search, and finally Yahoo Finance news
    let newsArticles: any[] = [];
    const tavilyKey = process.env.TAVILY_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    if (tavilyKey) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `Latest news and updates about ${displayName} (${ticker}) stock and business performance`,
            search_depth: 'advanced',
            max_results: 5,
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData && Array.isArray(tavilyData.results)) {
            newsArticles = tavilyData.results.map((r: any) => {
              let parsedSource = 'Web';
              try {
                parsedSource = new URL(r.url).hostname.replace('www.', '');
              } catch (e) {
                // ignore URL parsing error
              }
              return {
                headline: r.title,
                source: parsedSource,
                date: r.published_date ? new Date(r.published_date).toLocaleDateString() : 'Recent',
                link: r.url,
                summary: r.content || 'No summary available.',
                sentiment: 'Neutral' as 'Positive' | 'Neutral' | 'Negative',
              };
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch news from Tavily:', err);
      }
    }

    if (newsArticles.length === 0 && serperKey) {
      try {
        const serperRes = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `Latest news and updates about ${displayName} (${ticker}) stock and business performance`,
          }),
        });

        if (serperRes.ok) {
          const serperData = await serperRes.json();
          if (serperData && Array.isArray(serperData.organic)) {
            newsArticles = serperData.organic.slice(0, 5).map((r: any) => {
              let parsedSource = 'Web';
              try {
                parsedSource = new URL(r.link).hostname.replace('www.', '');
              } catch (e) {
                // ignore URL parsing error
              }
              return {
                headline: r.title,
                source: parsedSource,
                date: r.date || 'Recent',
                link: r.link,
                summary: r.snippet || 'No summary available.',
                sentiment: 'Neutral' as 'Positive' | 'Neutral' | 'Negative',
              };
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch news from Serper:', err);
      }
    }

    if (newsArticles.length === 0) {
      newsArticles = ((searchRes as any).news || []).map((n: any) => ({
        headline: n.title,
        source: n.publisher || 'Yahoo Finance',
        date: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleDateString() : 'Recent',
        link: n.link,
        summary: n.summary || `Latest market updates and financial news related to ${displayName} (${ticker}).`,
        sentiment: 'Neutral' as 'Positive' | 'Neutral' | 'Negative', // Default, LLM will refine
      }));
    }

    // Step 4: Competitor Lookup and Analysis
    // We will ask the LLM to provide competitor tickers, or use a pre-set map of common stocks to speed up,
    // and fallback to LLM. For robust, real-time results, we define a quick map of major tickers,
    // and for any other ticker, we fall back to finding competitors in the same industry.
    const competitorMap: Record<string, string[]> = {
      AAPL: ['MSFT', 'GOOGL', 'AMZN', 'META'],
      TSLA: ['BYDDY', 'F', 'GM', 'TM'],
      NVDA: ['AMD', 'INTC', 'AVGO', 'QCOM'],
      MSFT: ['AAPL', 'GOOGL', 'AMZN', 'ORCL'],
      AMZN: ['WMT', 'TGT', 'BABA', 'EBAY'],
      // Indian companies
      RELIANCE: ['TCS.NS', 'HDFCBANK.NS', 'INFY.NS'],
      'RELIANCE.NS': ['TCS.NS', 'HDFCBANK.NS', 'INFY.NS'],
      TATAMOTORS: ['M&M.NS', 'MARUTI.NS', 'ASHOKLEY.NS'],
      'TATAMOTORS.NS': ['M&M.NS', 'MARUTI.NS', 'ASHOKLEY.NS'],
    };

    const cleanTicker = ticker.toUpperCase().replace('.NS', '');
    let competitorTickers = competitorMap[ticker] || competitorMap[cleanTicker] || [];

    // If competitor tickers are not in the predefined map, search for others in the same sector/industry or query them
    if (competitorTickers.length === 0) {
      try {
        // Query search endpoint with industry name to discover related companies
        if (profile.industry) {
          const indSearch: any = await yahooFinance.search(profile.industry, { newsCount: 0 });
          competitorTickers = indSearch.quotes
            .filter((q: any) => q.quoteType === 'EQUITY' && q.symbol !== ticker)
            .slice(0, 3)
            .map((q: any) => q.symbol);
        }
      } catch (err) {
        console.error('Failed to auto-discover competitors:', err);
      }
    }

    // Default competitors if search returns nothing
    if (competitorTickers.length === 0) {
      competitorTickers = ['SPY', 'QQQ']; // S&P 500 and Nasdaq indices
    }

    // Fetch competitors financial data in parallel
    const competitorPromises = competitorTickers.map(async (cTicker) => {
      try {
        const compSummary: any = await yahooFinance.quoteSummary(cTicker, {
          modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics'],
        });
        const cPrice = compSummary?.price || {};
        const cDetail = compSummary?.summaryDetail || {};
        const cStats = compSummary?.defaultKeyStatistics || {};
        const cFin = compSummary?.financialData || {};

        return {
          ticker: cTicker,
          name: cPrice.longName || cPrice.shortName || cTicker,
          marketCap: cPrice.marketCap || cDetail.marketCap || 0,
          revenue: cFin.totalRevenue || 0,
          peRatio: cDetail.trailingPE || cStats.forwardPE || 0,
          profitMargin: cFin.profitMargins || cStats.profitMargins || 0,
          growth: cFin.revenueGrowth || 0,
        };
      } catch (err) {
        console.warn(`Could not fetch data for competitor ${cTicker}:`, err);
        return null;
      }
    });

    const compsResolved = await Promise.all(competitorPromises);
    competitorData = compsResolved.filter((c) => c !== null);

    // Step 5: Perform AI Analysis
    let aiReport: any = null;
    const isMockAI = !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY;
    const useGemini = !!process.env.GEMINI_API_KEY;

    if (isMockAI) {
      // Generate highly detailed mock report based on ACTUAL retrieved financial figures
      aiReport = generateMockAIReport(overview, financialAnalysis, stockPerf, newsArticles, competitorData);
    } else if (useGemini) {
      // Call Google Gemini API
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const systemPrompt = `You are a professional lead equity research analyst. Your task is to perform an institutional-grade investment research analysis on the target company.
You must return your analysis strictly as a JSON object matching the requested schema.
Be objective, evidence-driven, and highly analytic. Do not make up numbers. Use the provided financial data, news headlines, and competitor metrics.`;

        const userPrompt = `Analyze the following real-world data for ${overview.name} (${overview.ticker}).

[COMPANY OVERVIEW]
${JSON.stringify(overview, null, 2)}

[FINANCIAL METRICS]
${JSON.stringify(financialAnalysis, null, 2)}

[STOCK PERFORMANCE]
${JSON.stringify(stockPerf, null, 2)}

[COMPETITORS DATA]
${JSON.stringify(competitorData, null, 2)}

[LATEST NEWS]
${JSON.stringify(newsArticles.slice(0, 5), null, 2)}

Please construct:
1. News Sentiment analysis: Return a sentiment ('Positive', 'Neutral', or 'Negative') for each news article, and provide an overall sentiment label.
2. SWOT Analysis: Highlight specific Strengths, Weaknesses, Opportunities, and Threats based on the actual numbers (growth rates, debt levels, margins) and description.
3. Risk Assessment: Score the following risks out of 10 (where 0 is no risk and 10 is catastrophic risk) with a short explanation: Financial Risk, Business Risk, Regulatory Risk, Competition Risk, Market Risk, Technology Risk.
4. Competitor Qualitative Comparison: A brief summary comparing the company's P/E, growth, and margins with competitors.
5. Overall Investment Score (0-100) based on financial health, risks, and growth potential.
6. Final Recommendation: Output exactly one of: 'Strong Buy', 'Buy', 'Hold', 'Avoid', 'Pass'.
7. Detailed Recommendation Summary: Provide an Investment Thesis, Key Advantages, Major Risks, Supporting Evidence, and a Confidence Score (0-100%).

You MUST return a JSON object with this exact typescript structure:
{
  "newsSentiment": {
    "overall": "Positive" | "Neutral" | "Negative",
    "articles": [
      {
        "headline": "...",
        "sentiment": "Positive" | "Neutral" | "Negative"
      }
    ]
  },
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "risks": {
    "financialRisk": { "score": number, "reason": "string" },
    "businessRisk": { "score": number, "reason": "string" },
    "regulatoryRisk": { "score": number, "reason": "string" },
    "competitionRisk": { "score": number, "reason": "string" },
    "marketRisk": { "score": number, "reason": "string" },
    "technologyRisk": { "score": number, "reason": "string" }
  },
  "competitorAnalysisSummary": "string",
  "investmentScore": number,
  "recommendation": "Strong Buy" | "Buy" | "Hold" | "Avoid" | "Pass",
  "recommendationDetails": {
    "investmentThesis": "string",
    "keyAdvantages": ["string"],
    "majorRisks": ["string"],
    "supportingEvidence": "string",
    "confidenceScore": number
  },
  "aiReasoning": "string"
}
Ensure output is ONLY valid JSON.`;

        const promptText = `${systemPrompt}\n\n${userPrompt}`;
        const result = await model.generateContent(promptText);
        const rawContent = result.response.text() || '{}';
        aiReport = JSON.parse(rawContent);

        // Update the sentiments in the news articles based on Gemini response
        if (aiReport.newsSentiment?.articles) {
          const sentimentMap = new Map<string, string>();
          aiReport.newsSentiment.articles.forEach((a: any) => {
            if (a.headline) {
              sentimentMap.set(a.headline.toLowerCase().trim(), a.sentiment);
            }
          });
          newsArticles.forEach((article: any) => {
            const mapped = sentimentMap.get(article.headline.toLowerCase().trim());
            if (mapped) {
              article.sentiment = mapped as any;
            }
          });
        }
      } catch (err) {
        console.error('Failed to run Gemini Analysis, falling back to mock generator:', err);
        aiReport = generateMockAIReport(overview, financialAnalysis, stockPerf, newsArticles, competitorData);
        aiReport.isFallback = true;
      }
    } else {
      // Call OpenAI GPT-4o
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const systemPrompt = `You are a professional lead equity research analyst. Your task is to perform an institutional-grade investment research analysis on the target company.
You must return your analysis strictly as a JSON object matching the requested schema.
Be objective, evidence-driven, and highly analytic. Do not make up numbers. Use the provided financial data, news headlines, and competitor metrics.`;

        const userPrompt = `Analyze the following real-world data for ${overview.name} (${overview.ticker}).

[COMPANY OVERVIEW]
${JSON.stringify(overview, null, 2)}

[FINANCIAL METRICS]
${JSON.stringify(financialAnalysis, null, 2)}

[STOCK PERFORMANCE]
${JSON.stringify(stockPerf, null, 2)}

[COMPETITORS DATA]
${JSON.stringify(competitorData, null, 2)}

[LATEST NEWS]
${JSON.stringify(newsArticles.slice(0, 5), null, 2)}

Please construct:
1. News Sentiment analysis: Return a sentiment ('Positive', 'Neutral', or 'Negative') for each news article, and provide an overall sentiment label.
2. SWOT Analysis: Highlight specific Strengths, Weaknesses, Opportunities, and Threats based on the actual numbers (growth rates, debt levels, margins) and description.
3. Risk Assessment: Score the following risks out of 10 (where 0 is no risk and 10 is catastrophic risk) with a short explanation: Financial Risk, Business Risk, Regulatory Risk, Competition Risk, Market Risk, Technology Risk.
4. Competitor Qualitative Comparison: A brief summary comparing the company's P/E, growth, and margins with competitors.
5. Overall Investment Score (0-100) based on financial health, risks, and growth potential.
6. Final Recommendation: Output exactly one of: 'Strong Buy', 'Buy', 'Hold', 'Avoid', 'Pass'.
7. Detailed Recommendation Summary: Provide an Investment Thesis, Key Advantages, Major Risks, Supporting Evidence, and a Confidence Score (0-100%).

You MUST return a JSON object with this exact typescript structure:
{
  "newsSentiment": {
    "overall": "Positive" | "Neutral" | "Negative",
    "articles": [
      {
        "headline": "...",
        "sentiment": "Positive" | "Neutral" | "Negative"
      }
    ]
  },
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "risks": {
    "financialRisk": { "score": number, "reason": "string" },
    "businessRisk": { "score": number, "reason": "string" },
    "regulatoryRisk": { "score": number, "reason": "string" },
    "competitionRisk": { "score": number, "reason": "string" },
    "marketRisk": { "score": number, "reason": "string" },
    "technologyRisk": { "score": number, "reason": "string" }
  },
  "competitorAnalysisSummary": "string",
  "investmentScore": number,
  "recommendation": "Strong Buy" | "Buy" | "Hold" | "Avoid" | "Pass",
  "recommendationDetails": {
    "investmentThesis": "string",
    "keyAdvantages": ["string"],
    "majorRisks": ["string"],
    "supportingEvidence": "string",
    "confidenceScore": number
  },
  "aiReasoning": "string"
}
Ensure output is ONLY valid JSON. No markdown wrappers.`;

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        });

        const rawContent = aiResponse.choices[0].message?.content || '';
        aiReport = JSON.parse(rawContent);

        // Update the sentiments in the news articles based on LLM response
        if (aiReport.newsSentiment?.articles) {
          const sentimentMap = new Map<string, string>();
          aiReport.newsSentiment.articles.forEach((a: any) => {
            if (a.headline) {
              sentimentMap.set(a.headline.toLowerCase().trim(), a.sentiment);
            }
          });
          newsArticles.forEach((article: any) => {
            const mapped = sentimentMap.get(article.headline.toLowerCase().trim());
            if (mapped) {
              article.sentiment = mapped as any;
            }
          });
        }
      } catch (err) {
        console.error('Failed to run OpenAI Analysis, falling back to mock generator:', err);
        aiReport = generateMockAIReport(overview, financialAnalysis, stockPerf, newsArticles, competitorData);
        aiReport.isFallback = true;
      }
    }

    // Assemble final response
    const finalReport = {
      overview,
      financialAnalysis,
      stockPerf,
      history,
      newsArticles,
      competitorData,
      aiAnalysis: aiReport,
      isMockMode: isMockAI || aiReport.isFallback,
    };

    return NextResponse.json(finalReport);

  } catch (error: any) {
    console.error('Global API route error:', error);
    return NextResponse.json({ error: error?.message || 'An unexpected error occurred during company analysis.' }, { status: 500 });
  }
}

// Simulated/Fallback AI Analysis Engine
function generateMockAIReport(
  overview: any,
  financials: any,
  stockPerf: any,
  news: any[],
  competitors: any[]
) {
  // Compute basic scores based on real numbers
  const revGrowth = financials.revenueGrowth || 0;
  const profMargin = financials.profitMargin || 0;
  const peRatio = financials.peRatio || 15;
  const debt = financials.debt || 0;
  const fcf = financials.freeCashFlow || 0;

  // Rule-based scores
  let finHealthScore = 50;
  if (profMargin > 0.15) finHealthScore += 15;
  if (revGrowth > 0.10) finHealthScore += 15;
  if (fcf > 0) finHealthScore += 10;
  if (debt < (overview.marketCap || 0) * 0.3) finHealthScore += 10;

  const investmentScore = Math.max(10, Math.min(98, Math.round(finHealthScore)));

  let recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid' | 'Pass' = 'Hold';
  if (investmentScore >= 80) recommendation = 'Strong Buy';
  else if (investmentScore >= 65) recommendation = 'Buy';
  else if (investmentScore >= 45) recommendation = 'Hold';
  else if (investmentScore >= 30) recommendation = 'Avoid';
  else recommendation = 'Pass';

  const strengths = [
    `${overview.name} commands a robust position in the ${overview.industry} industry.`,
    financials.profitMargin && financials.profitMargin > 0
      ? `Healthy profitability profile with a net margin of ${(financials.profitMargin * 100).toFixed(2)}%.`
      : `Established operational footprint with significant market capitalization of $${((overview.marketCap || 0) / 1e9).toFixed(2)}B.`,
    financials.freeCashFlow && financials.freeCashFlow > 0
      ? `Strong cash generator, posting positive Free Cash Flow of $${(financials.freeCashFlow / 1e9).toFixed(2)}B.`
      : `High liquid resources and strong financial backing.`,
  ];

  const weaknesses = [
    financials.peRatio && financials.peRatio > 40
      ? `High trailing P/E ratio of ${financials.peRatio.toFixed(2)}x, indicating premium valuation and lower margin of safety.`
      : `Valuation is highly sensitive to macroeconomic shifts and consumer sentiment.`,
    financials.debt && financials.debt > 1e10
      ? `Significant debt load of $${(financials.debt / 1e9).toFixed(2)}B on the balance sheet.`
      : `Subject to high capital expenditure requirements to maintain competitive advantages.`,
  ];

  const opportunities = [
    `Expansion into high-growth global markets and next-generation product/service pipelines.`,
    `Leveraging proprietary technology and artificial intelligence integrations to scale profit margins.`,
    `Strategic acquisitions and partnerships within the ${overview.sector} sector.`,
  ];

  const threats = [
    `Increasing competitive intensity from global operators and nimble startup firms.`,
    `Evolving regulatory compliance mandates and data privacy restrictions globally.`,
    `Supply chain bottlenecks or raw material pricing volatility impacting margins.`,
  ];

  // Assign risk scores
  const risks = {
    financialRisk: {
      score: financials.debt && financials.freeCashFlow && financials.debt > financials.freeCashFlow * 10 ? 7 : 4,
      reason: financials.debt ? `Debt-to-equity and total debt of $${(financials.debt / 1e9).toFixed(2)}B requires continuous cash generation.` : 'Moderately low financial risk with clean leverage.'
    },
    businessRisk: {
      score: 5,
      reason: 'Highly linked to consumer spending, industrial demand cycles, and brand loyalty.'
    },
    regulatoryRisk: {
      score: 6,
      reason: 'Subject to strict anti-trust, data protection, and environmental compliance frameworks.'
    },
    competitionRisk: {
      score: competitors.length > 0 ? 8 : 6,
      reason: `Direct market share battles with major competitors like ${competitors.slice(0, 3).map((c) => c.ticker).join(', ')}.`
    },
    marketRisk: {
      score: 5,
      reason: 'Beta is closely aligned with public equity markets. Exposed to interest rate fluctuations.'
    },
    technologyRisk: {
      score: revGrowth < 0.02 ? 7 : 5,
      reason: 'Must continually invest in R&D to avoid disruption by emerging tech paradigms.'
    }
  };

  // Determine article sentiments mockingly
  const processedNews = news.map((article: any, index: number) => {
    let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
    const text = (article.headline + ' ' + article.summary).toLowerCase();
    if (text.includes('growth') || text.includes('surge') || text.includes('beat') || text.includes('buy') || text.includes('win')) {
      sentiment = 'Positive';
    } else if (text.includes('fall') || text.includes('decline') || text.includes('risk') || text.includes('suit') || text.includes('loss')) {
      sentiment = 'Negative';
    } else {
      sentiment = index % 3 === 0 ? 'Positive' : index % 3 === 1 ? 'Neutral' : 'Negative';
    }
    article.sentiment = sentiment;
    return {
      headline: article.headline,
      sentiment
    };
  });

  const positiveArticles = processedNews.filter((a: any) => a.sentiment === 'Positive').length;
  const negativeArticles = processedNews.filter((a: any) => a.sentiment === 'Negative').length;
  const overallSentiment = positiveArticles > negativeArticles ? 'Positive' : negativeArticles > positiveArticles ? 'Negative' : 'Neutral';

  const compSummaryText = competitors.length > 0
    ? `${overview.name} displays a ${peRatio > 25 ? 'premium valuation' : 'reasonable valuation'} with a P/E of ${peRatio.toFixed(1)}x compared to competitors like ${competitors[0].name} (P/E: ${competitors[0].peRatio ? competitors[0].peRatio.toFixed(1) + 'x' : 'N/A'}). Its growth rate of ${(revGrowth * 100).toFixed(1)}% is ${revGrowth > (competitors[0].growth || 0) ? 'leading' : 'competitive with'} the industry peer group.`
    : `Competitor valuations are highly variable. ${overview.name} commands strong leverage over general market indices (SPY) given its scale and operational moats.`;

  return {
    newsSentiment: {
      overall: overallSentiment,
      articles: processedNews
    },
    swot: {
      strengths,
      weaknesses,
      opportunities,
      threats
    },
    risks,
    competitorAnalysisSummary: compSummaryText,
    investmentScore,
    recommendation,
    recommendationDetails: {
      investmentThesis: `${overview.name} represents a ${recommendation === 'Strong Buy' || recommendation === 'Buy' ? 'compelling' : 'neutral'} long-term investment opportunity. The company exhibits a solid fundamental backbone with a market capitalization of $${((overview.marketCap || 0) / 1e9).toFixed(2)}B, positioned inside the ${overview.sector} sector. Operating margins remain a primary asset, ensuring the company can weather cyclical downturns.`,
      keyAdvantages: [
        `Scale and dominant market share within ${overview.industry}.`,
        `High operational efficiency resulting in robust returns on equity (${financials.roe ? (financials.roe * 100).toFixed(1) + '%' : 'N/A'}).`,
        `Favorable industry growth tailwinds.`
      ],
      majorRisks: [
        `Valuation volatility at current multiples.`,
        `Macroeconomic pressure shifting corporate or consumer spending.`
      ],
      supportingEvidence: `The recommendation is grounded in an analysis of historical 5-year returns (${stockPerf.fiveYearReturn ? stockPerf.fiveYearReturn + '%' : 'N/A'}), strong capital buffers, and its competitive margin profile relative to sector peers.`,
      confidenceScore: Math.round(investmentScore * 0.95)
    },
    aiReasoning: `Step-by-step thinking:\n1. Resolved ticker ${overview.ticker} and fetched profile data.\n2. Analyzed income margins and capital structure. Net income of $${((financials.netIncome || 0) / 1e9).toFixed(2)}B suggests strong profitability.\n3. Evaluated stock trends; calculated 1-month and 1-year changes.\n4. Screened competitor ratios (P/E and Revenue Growth).\n5. Examined news sentiment and parsed risk coefficients.\n6. Synthesized an overall rating of ${investmentScore}/100 and labeled recommendation as '${recommendation}'.`
  };
}
