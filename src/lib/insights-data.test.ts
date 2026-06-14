import { describe, it, expect } from "vitest";
import { ARTICLES, ARTICLE_SLUGS, getArticle } from "./insights-data";

describe("insights-data", () => {
  it("exposes all seven articles with unique slugs", () => {
    expect(ARTICLES).toHaveLength(7);
    expect(new Set(ARTICLE_SLUGS).size).toBe(7);
    expect(ARTICLE_SLUGS).toEqual(ARTICLES.map((a) => a.slug));
  });
  it("every article has an author and a non-empty body", () => {
    for (const a of ARTICLES) {
      expect(a.author.name.length).toBeGreaterThan(0);
      expect(a.author.role.length).toBeGreaterThan(0);
      expect(a.body.length).toBeGreaterThan(0);
      for (const s of a.body) expect(s.paragraphs.length).toBeGreaterThan(0);
    }
  });
  it("has exactly one featured article", () => {
    expect(ARTICLES.filter((a) => a.featured)).toHaveLength(1);
  });
  it("getArticle resolves a valid slug and returns undefined for unknown", () => {
    expect(getArticle(ARTICLES[0].slug)?.title).toBe(ARTICLES[0].title);
    expect(getArticle("does-not-exist")).toBeUndefined();
  });
});
