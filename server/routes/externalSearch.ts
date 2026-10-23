import { Router, Request, Response } from 'express';

const router = Router();

// In-memory cache to protect rate limits and SerpApi quota
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

router.get('/', async (req: Request, res: Response) => {
  try {
    const rawQuery = req.query.q as string;
    if (!rawQuery || !rawQuery.trim()) {
      return res.status(400).json({
        error: { code: 'INVALID_QUERY', message: 'Enter a valid product search query.' },
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
      // Graceful fallback conforming to PRD and API_SPEC.md
      const fallbackResponse = {
        source: 'external_serp',
        isDemoExternal: true,
        notice:
          'SERPAPI_KEY is not configured on server; returning simulated comparative web results.',
        disclaimer:
          'External results do not represent local store availability, stock, or in-store prices in Kochi.',
        products: [
          {
            title: `${query} (Online Marketplace Price)`,
            price: '₹225',
            merchant: 'Amazon India',
            link: 'https://www.amazon.in',
            thumbnail: null,
          },
          {
            title: `${query} Standard Pack`,
            price: '₹210',
            merchant: 'Flipkart Supermart',
            link: 'https://www.flipkart.com',
            thumbnail: null,
          },
          {
            title: `${query} 1kg Value Pack`,
            price: '₹199',
            merchant: 'JioMart Online',
            link: 'https://www.jiomart.com',
            thumbnail: null,
          },
        ],
      };

      cache.set(cacheKey, { data: fallbackResponse, timestamp: Date.now() });
      return res.status(200).json(fallbackResponse);
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

    const upstreamRes = await fetch(serpUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return res.status(502).json({
        error: { code: 'UPSTREAM_SERP_ERROR', message: 'External search provider returned an error.' },
      });
    }

    const json = await upstreamRes.json();
    const shoppingResults = json.shopping_results || [];

    const normalizedProducts = shoppingResults.slice(0, 8).map((p: any) => ({
      title: p.title || query,
      price: p.price || 'Price on request',
      merchant: p.source || 'Online Retailer',
      link: p.link || 'https://google.com/shopping',
      thumbnail: p.thumbnail || null,
    }));

    const responsePayload = {
      source: 'external_serp',
      disclaimer:
        'External results do not represent local store availability, stock, or in-store prices in Kochi.',
      products: normalizedProducts,
    };

    cache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });
    return res.status(200).json(responsePayload);
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'EXTERNAL_SEARCH_FAILED', message: err.message || 'Search failed.' },
    });
  }
});

export default router;
