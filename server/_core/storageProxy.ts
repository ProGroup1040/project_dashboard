import express, { type Express } from "express";
import { ENV } from "./env";
import { getStorageDirectory } from "./storagePaths";

/**
 * Serve local files at the legacy /manus-storage URL so existing frontend
 * references continue to work. New uploads never depend on the Manus proxy.
 *
 * If Forge credentials are explicitly configured, missing local files can
 * still fall back to the old provider during a gradual migration.
 */
export function registerStorageProxy(app: Express) {
  app.use(
    "/manus-storage",
    express.static(getStorageDirectory(), {
      fallthrough: true,
      dotfiles: "deny",
      index: false,
      maxAge: "1d",
    })
  );

  app.get("/manus-storage/*", async (req: any, res: any) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Optional legacy read-through only; local uploads do not use Forge.
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("File not found in local storage");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] legacy Forge read failed: ${forgeResp.status} ${body}`);
        res.status(502).send("Legacy storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from legacy storage backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] legacy read-through failed:", err);
      res.status(502).send("Legacy storage proxy error");
    }
  });
}
