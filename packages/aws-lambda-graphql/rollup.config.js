import dts from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { minify, swc } from "rollup-plugin-swc3";
import { defineConfig } from "rollup";

const entry = ({ entryName, isBinEntry }) =>
  defineConfig({
    input: `src/${isBinEntry ? "scripts/" : ""}${entryName}.ts`,
    output: {
      file: `${isBinEntry ? "bin" : "dist"}/${entryName}.mjs`,
      format: "esm",
      banner: isBinEntry ? "#!/usr/bin/env node" : undefined
    },
    external: [/node_modules/],
    plugins: [
      json(),
      nodeResolve({
        exportConditions: ["node"],
        preferBuiltins: true
      }),
      swc(),
      minify({
        module: true,
        ecma: 2022,
        keep_classnames: true,
        mangle: false
      })
    ]
  });

const type = ({ entryName }) =>
  defineConfig({
    input: `src/${entryName}.ts`,
    output: [
      {
        file: `dist/${entryName}.d.ts`,
        format: "es"
      }
    ],
    external: ["stream"],
    plugins: [dts({ tsconfig: "./tsconfig.json" })]
  });

const configs = [entry({ entryName: "index" }), type({ entryName: "index" })];

export default configs;
