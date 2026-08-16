const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  // moduleDirectories: ['node_modules', '<rootDir>/'],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` or files with extension `.test.tsx` etc.
  // testMatch: [
  //   "**/__tests__/**/*.?([mc])[jt]s?(x)",
  //   "**/?(*.)+(spec|test).?([mc])[jt]s?(x)"
  // ],

  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  // Git worktrees are independent checkouts — running their suites from this
  // root resolves `@/` imports against the wrong tree, so they always fail.
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/.worktrees/",
    // Written against node:test, not Jest. Run with: node --test
    "<rootDir>/lib/projectseed/__tests__/me-summary.test.ts",
    // Live-Postgres RLS integration suite. It is designed to FAIL (not skip)
    // when the DB is unreachable, so it must not run in the default CI pass.
    // Run it intentionally against a real database with:
    //   SUPABASE_DB_URL=... npx jest lib/supabase/__tests__/lobby-rls.test.ts
    "<rootDir>/lib/supabase/__tests__/lobby-rls.test.ts",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
