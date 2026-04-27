"use server";

import {
  formatArticle,
  formatChangePercent,
  formatMarketCapValue,
  formatPrice,
  getDateRange,
  validateArticle,
} from "@/lib/utils";
import { cache } from "react";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { redirect } from "next/navigation";
import { getWatchlistSymbolsByEmail } from "./watchlist.actions";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const MAX_NEWS_ARTICLES = 6;
const NEWS_CACHE_REVALIDATE_SECONDS = 60 * 5;

type FinnhubNewsArticle = RawNewsArticle;

const ensureApiKey = (): string => {
  if (!FINNHUB_API_KEY) {
    throw new Error("Missing FINNHUB_API_KEY");
  }

  return FINNHUB_API_KEY;
};

const buildFinnhubUrl = (
  path: string,
  params: Record<string, string>,
): string => {
  const searchParams = new URLSearchParams(params);
  return `${FINNHUB_BASE_URL}${path}?${searchParams.toString()}`;
};

const cleanSymbols = (symbols?: string[]): string[] => {
  if (!symbols?.length) return [];

  return Array.from(
    new Set(
      symbols
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => symbol.length > 0),
    ),
  );
};

export const fetchJSON = async <T>(
  url: string,
  revalidateSeconds?: number,
): Promise<T> => {
  const response = await fetch(
    url,
    revalidateSeconds
      ? {
          cache: "force-cache",
          next: { revalidate: revalidateSeconds },
        }
      : { cache: "no-store" },
  );

  if (response.status !== 200) {
    throw new Error(`Finnhub request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

const getGeneralNews = async (): Promise<MarketNewsArticle[]> => {
  const token = ensureApiKey();
  const url = buildFinnhubUrl("/news", { category: "general", token });

  const articles = await fetchJSON<FinnhubNewsArticle[]>(
    url,
    NEWS_CACHE_REVALIDATE_SECONDS,
  );

  if (!Array.isArray(articles) || articles.length === 0) return [];

  const dedupedArticles: FinnhubNewsArticle[] = [];
  const seenIds = new Set<number>();
  const seenUrls = new Set<string>();
  const seenHeadlines = new Set<string>();

  for (const article of articles) {
    if (!validateArticle(article)) continue;

    const articleId = article.id;
    const articleUrl = article.url!;
    const articleHeadline = article.headline!;

    if (seenIds.has(articleId)) continue;
    if (seenUrls.has(articleUrl)) continue;
    if (seenHeadlines.has(articleHeadline)) continue;

    seenIds.add(articleId);
    seenUrls.add(articleUrl);
    seenHeadlines.add(articleHeadline);
    dedupedArticles.push(article);
  }

  return dedupedArticles
    .sort((a, b) => (b.datetime ?? 0) - (a.datetime ?? 0))
    .slice(0, MAX_NEWS_ARTICLES)
    .map((article, index) => formatArticle(article, false, undefined, index))
    .sort((a, b) => b.datetime - a.datetime);
};

const getRoundRobinCompanyNews = async (
  symbols: string[],
): Promise<MarketNewsArticle[]> => {
  if (symbols.length === 0) return [];

  const token = ensureApiKey();
  const { from, to } = getDateRange(5);
  const symbolNewsMap = new Map<string, FinnhubNewsArticle[]>();
  const symbolCursorMap = new Map<string, number>();

  for (const symbol of symbols) {
    // here we are building the proper request URL
    const url = buildFinnhubUrl("/company-news", {
      symbol,
      from,
      to,
      token,
    });

    const articles = await fetchJSON<FinnhubNewsArticle[]>(
      url,
      NEWS_CACHE_REVALIDATE_SECONDS,
    );

    const validArticles = Array.isArray(articles)
      ? articles
          .filter((article) => validateArticle(article))
          .sort((a, b) => (b.datetime ?? 0) - (a.datetime ?? 0))
      : [];

    symbolNewsMap.set(symbol, validArticles);
    symbolCursorMap.set(symbol, 0);
  }

  const selectedNews: MarketNewsArticle[] = [];

  for (let round = 0; round < MAX_NEWS_ARTICLES; round += 1) {
    const symbol = symbols[round % symbols.length];
    const newsForSymbol = symbolNewsMap.get(symbol) ?? [];
    const cursor = symbolCursorMap.get(symbol) ?? 0;
    const article = newsForSymbol[cursor];

    symbolCursorMap.set(symbol, cursor + 1);

    if (!article || !validateArticle(article)) continue;
    selectedNews.push(formatArticle(article, true, symbol, round));
  }

  return selectedNews.sort((a, b) => b.datetime - a.datetime);
};

export const getNews = async (
  symbols?: string[],
): Promise<MarketNewsArticle[]> => {
  const cleanedSymbols = cleanSymbols(symbols);
  if (cleanedSymbols.length === 0) {
    return getGeneralNews();
  }
  try {
    const companyNews = await getRoundRobinCompanyNews(cleanedSymbols);
    if (companyNews.length > 0) {
      return companyNews.slice(0, MAX_NEWS_ARTICLES);
    }
  } catch (error) {
    console.error("Company news fetch failed", error);
  }
  try {
    return await getGeneralNews();
  } catch (error) {
    console.error("General news fetch failed", error);
    throw new Error("Failed to fetch news");
  }
};

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect("/sign-in");

      const userWatchlistSymbols = await getWatchlistSymbolsByEmail(
        session.user.email,
      );

      const token = process.env.FINNHUB_API_KEY;
      if (!token) {
        // If no token, log and return empty to avoid throwing per requirements
        console.error(
          "Error in stock search:",
          new Error("FINNHUB API key is not configured"),
        );
        return [];
      }

      const trimmed = typeof query === "string" ? query.trim() : "";

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
              // Revalidate every hour
              const profile = await fetchJSON<any>(url, 3600);
              return { sym, profile } as { sym: string; profile: any };
            } catch (e) {
              console.error("Error fetching profile2 for", sym, e);
              return { sym, profile: null } as { sym: string; profile: any };
            }
          }),
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const name: string | undefined =
              profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;
            const r: FinnhubSearchResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: "Common Stock",
            };
            // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
            // To keep pipeline simple, attach exchange via closure map stage
            // We'll reconstruct exchange when mapping to final type
            (r as any).__exchange = exchange; // internal only
            return r;
          })
          .filter((x): x is FinnhubSearchResult => Boolean(x));
      } else {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || "").toUpperCase();
          const name = r.description || upper;
          const exchangeFromProfile = (r as any).__exchange as
            | string
            | undefined;
          const exchange = exchangeFromProfile || "US";
          const type = r.type || "Stock";
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: userWatchlistSymbols.includes(
              r.symbol.toUpperCase(),
            ),
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error("Error in stock search:", err);
      return [];
    }
  },
);

// Fetch stock details by symbol (will be used in stocks details page)
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const [quote, profile, financials] = await Promise.all([
      fetchJSON(
        // Price data - no caching for accuracy
        `${FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${FINNHUB_API_KEY}`,
      ),
      fetchJSON(
        // Company info - cache 1hr (rarely changes)
        `${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${FINNHUB_API_KEY}`,
        3600,
      ),
      fetchJSON(
        // Financial metrics (P/E, etc.) - cache 30min
        `${FINNHUB_BASE_URL}/stock/metric?symbol=${cleanSymbol}&metric=all&token=${FINNHUB_API_KEY}`,
        1800,
      ),
    ]);

    // Type cast the responses
    const quoteData = quote as QuoteData;
    const profileData = profile as ProfileData;
    const financialsData = financials as FinancialsData;

    // Check if we got valid quote and profile data
    if (!quoteData?.c || !profileData?.name)
      throw new Error("Invalid stock data received from API");

    const changePercent = quoteData.dp || 0;
    const peRatio = financialsData?.metric?.peNormalizedAnnual || null;

    return {
      symbol: cleanSymbol,
      company: profileData?.name,
      currentPrice: quoteData.c,
      changePercent,
      priceFormatted: formatPrice(quoteData.c),
      changeFormatted: formatChangePercent(changePercent),
      peRatio: peRatio?.toFixed(1) || "—",
      marketCapFormatted: formatMarketCapValue(
        profileData?.marketCapitalization || 0,
      ),
    };
  } catch (error) {
    console.error(`Error fetching details for ${cleanSymbol}:`, error);
    throw new Error("Failed to fetch stock details");
  }
});
