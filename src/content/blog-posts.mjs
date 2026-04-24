import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const blogPostFrontmatters = loadBlogPostFrontmatters();

export const blogPosts = blogPostFrontmatters
  .map((frontmatter) => normalizeBlogPost(frontmatter))
  .filter(Boolean)
  .sort((left, right) => right.dateObject - left.dateObject);

export const blogPostsByPath = new Map(blogPosts.map((post) => [post.path, post]));

export const blogCategories = Array.from(
  blogPosts.reduce((categories, post) => {
    post.categories.forEach((category) => {
      categories.set(category, (categories.get(category) ?? 0) + 1);
    });
    return categories;
  }, new Map()),
  ([name, count]) => ({ name, count }),
).sort((left, right) => left.name.localeCompare(right.name));

export const blogArchives = Array.from(
  blogPosts.reduce((archives, post) => {
    archives.set(post.archiveKey, (archives.get(post.archiveKey) ?? 0) + 1);
    return archives;
  }, new Map()),
  ([key, count]) => ({
    key,
    count,
    label: formatArchiveLabel(key),
  }),
).sort((left, right) => right.key.localeCompare(left.key));

export const blogCategoryFilters = blogCategories.map((category) => ({
  ...category,
  slug: slugify(category.name),
  path: `/blog/category/${slugify(category.name)}/`,
}));

export const blogArchiveFilters = blogArchives.map((archive) => ({
  ...archive,
  slug: archive.key,
  path: `/blog/archive/${archive.key}/`,
}));

export function getBlogPost(path) {
  return blogPostsByPath.get(path) ?? null;
}

export function isBlogPostPath(path) {
  return blogPostsByPath.has(path);
}

export function getRecentBlogPosts(limit = 5) {
  return blogPosts.slice(0, limit);
}

export function getBlogSidebarData({ recentPostLimit = 5 } = {}) {
  return {
    categories: blogCategoryFilters,
    recentPosts: getRecentBlogPosts(recentPostLimit),
    archives: blogArchiveFilters,
  };
}

export function getBlogPostsByCategory(categoryName) {
  return blogPosts.filter((post) => post.categories.includes(categoryName));
}

export function getBlogPostsByArchive(archiveKey) {
  return blogPosts.filter((post) => post.archiveKey === archiveKey);
}

export function getBlogCategoryFilter(slug) {
  return blogCategoryFilters.find((category) => category.slug === slug) ?? null;
}

export function getBlogArchiveFilter(slug) {
  return blogArchiveFilters.find((archive) => archive.slug === slug) ?? null;
}

export function formatBlogDate(dateInput) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(typeof dateInput === "string" ? new Date(dateInput) : dateInput);
}

function formatArchiveLabel(key) {
  const [year, month] = key.split("-");
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${year}-${month}-01T00:00:00Z`));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBlogPost(frontmatter = {}) {
  if (!frontmatter.date) {
    return null;
  }

  const dateObject = new Date(frontmatter.date);
  if (Number.isNaN(dateObject.valueOf())) {
    return null;
  }

  const derivedPath = deriveBlogPostPath({
    date: frontmatter.date,
    slug: frontmatter.slug ?? frontmatter._fileSlug ?? slugify(frontmatter.title ?? ""),
  });
  const categories = Array.isArray(frontmatter.categories)
    ? frontmatter.categories.filter(Boolean)
    : [];
  const featuredImage = normalizeFeaturedImage(frontmatter.featuredImage);

  return {
    title: frontmatter.title,
    path: frontmatter.path ?? derivedPath,
    date: frontmatter.date,
    categories,
    excerpt: frontmatter.excerpt ?? "",
    featuredImage,
    dateObject,
    archiveKey: frontmatter.date.slice(0, 7),
  };
}

function deriveBlogPostPath({ date, slug }) {
  const [year, month, day] = date.slice(0, 10).split("-");
  return `/${year}/${month}/${day}/${slugify(slug)}/`;
}

function normalizeFeaturedImage(featuredImage) {
  if (!featuredImage?.src) {
    return null;
  }

  return {
    src: featuredImage.src,
    alt: featuredImage.alt ?? "",
  };
}

function loadBlogPostFrontmatters() {
  if (typeof import.meta.glob === "function") {
    return Object.entries(import.meta.glob("./pages/*.md", { eager: true })).map(([filePath, module]) => ({
      ...module.frontmatter,
      _fileSlug: filePathToSlug(filePath),
    }));
  }

  return loadBlogPostFrontmattersFromFs();
}

function loadBlogPostFrontmattersFromFs() {
  const contentDirectory = path.resolve(process.cwd(), "src/content/pages");

  return readdirSync(contentDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      source: readFileSync(path.join(contentDirectory, fileName), "utf8"),
      fileSlug: filePathToSlug(fileName),
    }))
    .map(({ source, fileSlug }) => {
      const frontmatter = parseFrontmatter(source);
      return frontmatter ? { ...frontmatter, _fileSlug: fileSlug } : null;
    })
    .filter(Boolean);
}

function filePathToSlug(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);

  if (!match) {
    return null;
  }

  const lines = match[1].split("\n");
  const frontmatter = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim()) {
      continue;
    }

    const scalarMatch = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
    if (scalarMatch) {
      frontmatter[scalarMatch[1]] = unquote(scalarMatch[2]);
      continue;
    }

    const blockMatch = line.match(/^([A-Za-z0-9_]+):\s*$/);
    if (!blockMatch) {
      continue;
    }

    const key = blockMatch[1];
    const childLines = [];
    let cursor = index + 1;

    while (cursor < lines.length && /^\s+/.test(lines[cursor])) {
      childLines.push(lines[cursor]);
      cursor += 1;
    }

    if (childLines.every((childLine) => childLine.trim().startsWith("- "))) {
      frontmatter[key] = childLines.map((childLine) => unquote(childLine.trim().slice(2)));
    } else {
      const objectValue = {};
      childLines.forEach((childLine) => {
        const childMatch = childLine.match(/^\s+([A-Za-z0-9_]+):\s*(.+)$/);
        if (!childMatch) {
          return;
        }
        objectValue[childMatch[1]] = unquote(childMatch[2]);
      });
      frontmatter[key] = objectValue;
    }

    index = cursor - 1;
  }

  return frontmatter;
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, "");
}
