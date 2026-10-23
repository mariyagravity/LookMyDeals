import { Router, Request, Response } from 'express';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();

// In-memory cache to protect rate limits and SerpApi quota
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

router.get('/', createRateLimiter(20, 60_000), async (req: Request, res: Response) => {
  try {
    const rawQuery = req.query.q;
    if (typeof rawQuery !== 'string' || !rawQuery.trim() || rawQuery.length > 120) {
      return res.status(400).json({
        error: { code: 'INVALID_QUERY', message: 'Enter a search query of 1 to 120 characters.' },
      });
    }

    const query = rawQuery.trim().slice(0, 120);
    const cacheKey = query.toLowerCase();

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json(cached.data);
    }

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: { code: 'SERP_NOT_CONFIGURED', message: 'External search is not configured on the server.' },
      });
    }

    // Call SerpApi if key is configured
    const serpUrl = new URL('https://serpapi.com/search.json');
    serpUrl.searchParams.set('engine', 'google_shopping');
    serpUrl.searchParams.set('q', query);
    serpUrl.searchParams.set('location', 'Kochi, Kerala, India');
    serpUrl.searchParams.set('gl', 'in');
    serpUrl.searchParams.set('hl', 'en');
    serpUrl.searchParams.set('api_key', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout per lmd-backend

    let upstreamRes: globalThis.Response;
    try {
      upstreamRes = await fetch(serpUrl.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamRes.ok) {
      return res.status(502).json({
        error: { code: 'UPSTREAM_SERP_ERROR', message: 'External search provider returned an error.' },
      });
    }

    const json = await upstreamRes.json();
    const shoppingResults = json.shopping_results || [];

    const normalizedProducts = shoppingResults
      .filter((product: any) => product && typeof product.title === 'string' && product.title.trim())
      .slice(0, 8)
      .map((product: any) => {
        let link: string | null = null;
        if (typeof product.link === 'string') {
          try {
            const parsedLink = new URL(product.link);
            if (parsedLink.protocol === 'https:' || parsedLink.protocol === 'http:') link = parsedLink.toString();
          } catch {
            link = null;
          }
        }

        return {
          title: product.title.trim().slice(0, 300),
          price: typeof product.price === 'string' ? product.price.slice(0, 80) : 'Price unavailable',
          merchant: typeof product.source === 'string' ? product.source.slice(0, 120) : 'Merchant unavailable',
          link,
          thumbnail: typeof product.thumbnail === 'string' ? product.thumbnail : null,
        };
      });

    const responsePayload = {
      source: 'external_serp',
      disclaimer:
        'External results do not represent local store availability, stock, or in-store prices in Kochi.',
      products: normalizedProducts,
    };

    cache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });
    return res.status(200).json(responsePayload);
  } catch {
    return res.status(502).json({
      error: { code: 'EXTERNAL_SEARCH_FAILED', message: 'External search failed. Please try again.' },
    });
  }
});

export default router;
