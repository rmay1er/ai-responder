const startTime = Date.now();
console.log(`Building...`);

await Bun.build({
  entrypoints: ["./aiResponder.ts"],
  target: "bun",
  outdir: "./dist",
  packages: "external",
  format: "esm",
  footer: "//rmay1er created",
});

const endTime = Date.now();
console.log(`Time: ${(endTime - startTime) / 1000} sec\n\n`);

export {};
