import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/tasks.test.ts"], environment: "node" },
});
