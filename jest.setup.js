import '@testing-library/jest-dom';

// jsdom does not expose these Node globals; some imports (postal-mime via
// resend, radar admin schema fixtures) expect them at module load time.
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// The Kimi provider throws at getModel() time when the key is unset; the
// model-registry suite expects construction to succeed (no network calls).
if (!process.env.KIMI_API_KEY) {
  process.env.KIMI_API_KEY = 'test-kimi-api-key';
}
