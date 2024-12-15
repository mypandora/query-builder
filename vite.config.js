import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "./lib/index.js",
      name: "query-builder",
      fileName: (format) => `query-builder.${format}.js`,
    },
    rollupOptions: {
      // 确保外部化处理 Vue 和 Element-UI 相关依赖
      external: ["vue", "element-ui"],
      output: {
        globals: {
          vue: "Vue",
          "element-ui": "ElementUI",
        },
      },
    },
  },
});
