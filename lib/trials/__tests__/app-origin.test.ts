import { configuredParentAppOrigin } from "../app-origin";

test("uses the configured canonical site origin instead of a request host", () => {
  expect(configuredParentAppOrigin({
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://passionseed.org",
    NEXT_PUBLIC_APP_URL: "https://ignored.example",
  })).toBe("https://passionseed.org");
});

test.each([
  {},
  { NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" },
  { NEXT_PUBLIC_SITE_URL: "https://user:pass@passionseed.org" },
  { NEXT_PUBLIC_SITE_URL: "https://passionseed.org/untrusted-path" },
  { NEXT_PUBLIC_SITE_URL: "http://passionseed.org" },
])("fails closed for missing or unsafe production origin: %p", (overrides) => {
  expect(() => configuredParentAppOrigin({
    NODE_ENV: "production",
    ...overrides,
  })).toThrow("canonical app origin");
});

test("allows a local HTTP origin only in development", () => {
  expect(configuredParentAppOrigin({ NODE_ENV: "development" })).toBe(
    "http://localhost:3000"
  );
  expect(configuredParentAppOrigin({
    NODE_ENV: "development",
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
  })).toBe("http://127.0.0.1:3000");
});
