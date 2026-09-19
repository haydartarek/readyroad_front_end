import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3005);
const backendPort = Number(process.env.PLAYWRIGHT_BACKEND_PORT ?? 8899);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // All cases share one Next server; keep E2E execution deterministic.
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useExternalServer ? undefined : [
    {
      command: "node tests/e2e/mock-backend.mjs",
      url: `http://127.0.0.1:${backendPort}/api/lessons`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npm run build && node -e "const fs=require('fs'); fs.cpSync('.next/static', '.next/standalone/.next/static', { recursive: true, force: true }); fs.cpSync('public', '.next/standalone/public', { recursive: true, force: true })" && node .next/standalone/server.js`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        PLAYWRIGHT_BACKEND_PORT: String(backendPort),
        BACKEND_URL: `http://127.0.0.1:${backendPort}/api`,
        NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${backendPort}/api`,
      },
    },
  ],
});
