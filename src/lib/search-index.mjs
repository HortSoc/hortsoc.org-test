import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { blogPostsByPath } from "../content/blog-posts.mjs";
import { sitePages } from "../content/site-pages.mjs";

const contentDirectory = path.resolve(process.cwd(), "src/content/pages");

export const searchDocuments = buildSearchDocuments();

export function getSearchDocument(pathname) {
  return searchDocuments.find((document) => document.path === pathname) ?? null;
}

function buildSearchDocuments() {
  const markdownFiles = readdirSync(contentDirectory).filter((entry) => entry.endsWith(".md")).sort();
  const migratedDocuments = markdownFiles
    .map((fileName) => {
      const absolutePath = path.join(contentDirectory, fileName);
      const source = readFileSync(absolutePath, "utf8");
      const parsed = parseMarkdownFile(source);
      if (parsed.frontmatter.status === "draft") {
        return null;
      }

      const fileSlug = path.basename(fileName, path.extname(fileName));
      const route =
        parsed.frontmatter.path ??
        blogPostPathFromDateAndSlug({ date: parsed.frontmatter.date, slug: fileSlug }) ??
        (parsed.frontmatter.status === "published" ? `/${slugify(fileSlug)}/` : null);

      if (!route) {
        return null;
      }

      const sitePage = sitePages.find((page) => page.path === route);
      const blogPost = blogPostsByPath.get(route);
      const cleanBody = cleanSearchText(parsed.body);
      const keywords = [
        sitePage?.title,
        blogPost?.categories?.join(" "),
        route.startsWith("/gallery/") ? "gallery photos annual show plant sale" : null,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        title: parsed.frontmatter.title ?? sitePage?.title ?? route,
        path: route,
        kind: blogPost ? "blog_post" : route === "/blog/" ? "blog_index" : "page",
        body: cleanBody,
        excerpt: cleanBody.slice(0, 220).trim(),
        keywords: cleanSearchText(keywords),
      };
    })
    .filter(Boolean);

  return migratedDocuments.sort((left, right) => left.title.localeCompare(right.title));
}

function blogPostPathFromDateAndSlug({ date, slug }) {
  if (!date || !slug) {
    return null;
  }

  const dateParts = date.slice(0, 10).split("-");
  if (dateParts.length !== 3 || dateParts.some((part) => !part)) {
    return null;
  }

  const [year, month, day] = dateParts;
  return `/${year}/${month}/${day}/${slugify(slug)}/`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMarkdownFile(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: source };
  }

  const [, frontmatterBlock, body] = match;
  const frontmatter = {};

  frontmatterBlock.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    frontmatter[key] = value;
  });

  return { frontmatter, body };
}

function cleanSearchText(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
