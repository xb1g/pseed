const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/auth",
  "/download",
  "/hackathon",
  "/api/hackathon",
  "/app/beta",
  "/expert-interview",
  "/api/expert-interview",
  "/epic-sprint",
  "/about",
  "/link",
  "/experimental-graphic",
  "/experimental-wall",
  "/business-model-canvas",
  "/radar",
  "/plan",
  "/pay",
  "/api/trials",
  "/api/cron/parent-pathlab-updates",
  "/fireball",
] as const;

export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.endsWith(".md") ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
