/** Skip analytics on local/dev hosts so admin metrics stay production-clean. */
export function shouldSkipRadarAnalytics(
  hostname = typeof window === "undefined" ? "" : window.location.hostname
): boolean {
  if (!hostname) return true;

  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".localhost")
  ) {
    return true;
  }

  // Private LAN hosts used for local device testing.
  if (
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
  ) {
    return true;
  }

  return false;
}
