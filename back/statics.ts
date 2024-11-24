import staticPlugin from "@elysiajs/static";
import Elysia from "elysia";
import { resolve } from "path";
import { fileURLToPath } from "url";

export function initiateStatics(app: Elysia) {
  const frontUrl = fileURLToPath(new URL("./front", import.meta.url));

  if (Bun.env.NODE_ENV == "production") {
    app.use(staticPlugin({ assets: resolve(frontUrl, "./assets"), prefix: '/assets' }));
    app.get("/", () => Bun.file(resolve(frontUrl, "./index.html")));
  }
}
