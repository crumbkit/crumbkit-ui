import { defineConfig } from "vitest/config";

// The core modules' tests run in Node with no DOM, as the modules do. The
// React hooks' tests run in jsdom with Testing Library (APP-6).
const shared = {
  restoreMocks: true,
  unstubGlobals: true,
  // A failed test is never retried (BASE-12).
  retry: 0,
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          ...shared,
          name: "core",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          ...shared,
          name: "react",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
