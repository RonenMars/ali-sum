import * as esbuild from "esbuild";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
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
  },
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log(`watching... (API_BASE=${API_BASE})`);
} else {
  await esbuild.build(options);
  console.log(`built (API_BASE=${API_BASE})`);
}
