import express, { type Express } from "express";
import { getStorageDirectory } from "./storagePaths";

/**
 * Serve uploaded files from persistent local storage using the legacy URL
 * prefix so existing application components do not need a URL migration.
 * This route has no Manus/Forge fallback by design.
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

  app.get("/manus-storage/*", (_req, res) => {
    res.status(404).send("File not found in local Pricing storage");
  });
}
