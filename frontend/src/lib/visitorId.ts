const VISITOR_ID_KEY = 'lmd.visitor.v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns a pseudonymous browser ID for demo brochure visit deduplication. */
export function getOrCreateVisitorId(): string | null {
  try {
    const current = localStorage.getItem(VISITOR_ID_KEY);
    if (current && UUID_PATTERN.test(current)) return current;
    const visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch {
    // Do not record a new visitor on every reload when persistent storage is unavailable.
    return null;
  }
}
