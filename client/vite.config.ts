import { defineConfig, loadEnv } from "vite";

// VITE_BASE: set to "/<repo>/" when building for GitHub Pages, which serves the
// site from a sub-path. Defaults to "/" for the classroom LAN / nginx deployment,
// matching Vite's own default so existing builds are unchanged.
// loadEnv reads both the shell environment (CI) and client/.env* files.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    base: env.VITE_BASE || "/"
  };
});
