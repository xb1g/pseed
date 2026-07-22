type ParentAppOriginEnvironment = {
  NODE_ENV?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

const DEVELOPMENT_ORIGIN = "http://localhost:3000";

export function configuredParentAppOrigin(
  environment: ParentAppOriginEnvironment = process.env
): string {
  const configured = (
    environment.NEXT_PUBLIC_SITE_URL ?? environment.NEXT_PUBLIC_APP_URL
  )?.trim();
  if (!configured) {
    if (environment.NODE_ENV === "development") return DEVELOPMENT_ORIGIN;
    throw new Error("A canonical app origin is required for parent email links");
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("The canonical app origin must be a valid HTTP(S) URL");
  }
  const production = environment.NODE_ENV === "production";
  const allowedProtocol = production
    ? parsed.protocol === "https:"
    : parsed.protocol === "https:" || parsed.protocol === "http:";
  if (
    !allowedProtocol ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("The canonical app origin is not an allowed origin");
  }
  return parsed.origin;
}
