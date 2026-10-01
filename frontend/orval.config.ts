import { defineConfig } from "orval";

export default defineConfig({
  erp: {
    input: {
      target: "http://localhost:8000/api/schema/",
    },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated/endpoints.ts",
      schemas: "./lib/api/generated/models",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "./lib/api/mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
});
