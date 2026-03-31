"use server";

import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const MAX_NEWS_ARTICLES = 6;
const NEWS_CACHE_REVALIDATE_SECONDS = 60 * 5;

type FinnhubNewsArticle = RawNewsArticle;

const ensureApiKey = (): string => {
  if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_FINNHUB_API_KEY");
  }

  return NEXT_PUBLIC_FINNHUB_API_KEY;
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
        .filter((symbol) => symbol.length > 0), //changelog
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
  try {
    const cleanedSymbols = cleanSymbols(symbols);
    if (cleanedSymbols.length === 0) {
      return await getGeneralNews();
    }
    // if we have symbols, try to fetch company news per symbol and round-robin select
    const companyNews = await getRoundRobinCompanyNews(cleanedSymbols);
    if (companyNews.length > 0) {
      return companyNews.slice(0, MAX_NEWS_ARTICLES);
    }

    return await getGeneralNews();
  } catch (error) {
    console.error("Error fetching news", error);
    throw new Error("Failed to fetch news");
  }
};
