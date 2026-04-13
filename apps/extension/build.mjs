import * as esbuild from "esbuild";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const DEV_TOKEN = process.env.DEV_TOKEN || "";
const watch = process.argv.includes("--watch");

const options = {
  entryPoints: [
    "popup/popup.tsx",
    "content/scraper.ts",
    "background/service-worker.ts",
  ],
  bundle: true,
  outdir: "dist",
  entryNames: "[name]",
  target: "chrome110",
  format: "esm",
  define: {
    __API_BASE__: JSON.stringify(API_BASE),
    __DEV_TOKEN__: JSON.stringify(DEV_TOKEN),
  },
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log(`watching... (API_BASE=${API_BASE}, DEV_TOKEN=${DEV_TOKEN ? "set" : "unset"})`);
} else {
  await esbuild.build(options);
  console.log(`built (API_BASE=${API_BASE}, DEV_TOKEN=${DEV_TOKEN ? "set" : "unset"})`);
}
