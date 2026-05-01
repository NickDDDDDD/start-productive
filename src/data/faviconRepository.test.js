import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./boardRepository";
import {
  findCachedFaviconByBrand,
  getCachedFavicon,
  isExpired,
  putCachedFavicon,
} from "./faviconRepository";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("faviconRepository", () => {
  it("stores and loads favicon cache records", async () => {
    await putCachedFavicon({
      key: "example.com",
      url: "chrome://favicon/example",
      host: "example.com",
      brand: "example",
      exp: Date.now() + 1000,
    });

    await expect(getCachedFavicon("example.com")).resolves.toMatchObject({
      key: "example.com",
      url: "chrome://favicon/example",
      brand: "example",
    });
  });

  it("finds brand fallback records and detects expiry", async () => {
    const expired = { exp: Date.now() - 1 };
    expect(isExpired(expired)).toBe(true);

    await putCachedFavicon({
      key: "docs.example.com",
      url: "chrome://favicon/docs",
      host: "docs.example.com",
      brand: "example",
      exp: Date.now() + 1000,
    });

    await expect(findCachedFaviconByBrand("example")).resolves.toMatchObject({
      key: "docs.example.com",
    });
  });
});
