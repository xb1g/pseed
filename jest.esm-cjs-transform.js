// Jest transform for ESM-only node_modules (@ai-sdk/*, ai, zod).
//
// These packages ship `"type": "module"` with no CommonJS build, and
// next/jest's SWC transformer preserves ESM output (the project's tsconfig
// uses `module: "esnext"`), which Jest's default CommonJS runtime cannot
// `require`. Running them through babel-jest with @babel/preset-env forces a
// CommonJS conversion so the suites that import them can execute.
const babelJest = require("babel-jest").default;

module.exports = babelJest.createTransformer({
  presets: [
    // These packages ship TS source alongside the compiled dist; the import
    // graph reaches both.
    require.resolve("@babel/preset-typescript"),
    [
      require.resolve("@babel/preset-env"),
      {
        targets: { node: "current" },
        modules: "commonjs",
      },
    ],
  ],
  // No project babel config should leak into these node_modules files.
  babelrc: false,
  configFile: false,
});
