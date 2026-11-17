/**
 * Optional Umami analytics bootstrap.
 *
 * Analytics must never prevent the Pricing UI from loading. Vite leaves
 * unresolved HTML placeholders untouched when env values are absent, so the
 * integration is initialized here from import.meta.env and skipped unless
 * both settings are valid.
 */
export function initializeAnalytics(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim();
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID?.trim();

  if (!endpoint || !websiteId) return;
  if (/%VITE_[A-Z0-9_]+%/.test(endpoint) || /%VITE_[A-Z0-9_]+%/.test(websiteId)) return;

  try {
    // Resolve relative endpoints from the origin, never from the current route.
    const baseUrl = new URL(endpoint, window.location.origin);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") return;

    const scriptUrl = new URL("umami", baseUrl.toString().replace(/\/$/, "") + "/");
    if (document.querySelector('script[data-pricing-analytics="umami"]')) return;

    const script = document.createElement("script");
    script.defer = true;
    script.src = scriptUrl.toString();
    script.dataset.websiteId = websiteId;
    script.dataset.pricingAnalytics = "umami";
    document.head.appendChild(script);
  } catch {
    // Invalid optional analytics configuration is intentionally non-fatal.
  }
}
