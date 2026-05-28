import { createDefaultEsmPreset } from "ts-jest";

const presetConfig = createDefaultEsmPreset({
  isolatedModules: true,
});

/** @type {import("jest").Config} */
export default {
  ...presetConfig,
  testEnvironment: "node",

  // This helps Jest understand TypeScript source imports like:
  // import x from "./file.js"
  // when the real source file is:
  // file.ts
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};