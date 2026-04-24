import { defineConfig } from "astro/config";

const customDomainSite = "https://hortsoc.org";
const repository = process.env.GITHUB_REPOSITORY;
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER ?? repository?.split("/")[0];
const repositoryName = repository?.split("/")[1];
const useRepositoryBase = process.env.GITHUB_PAGES_REPO_BASE === "true" && Boolean(repositoryOwner && repositoryName);
const siteBase = useRepositoryBase ? `/${repositoryName}` : "/";

function prefixRootRelativeMarkdownUrls(base) {
  const normalizedBase = !base || base === "/" ? "/" : `/${base.replace(/^\/+|\/+$/g, "")}`;

  return function rehypePrefixRootRelativeMarkdownUrls() {
    return function transformMarkdownTree(tree) {
      visitTree(tree, (node) => {
        if (node.type !== "element" || !node.properties) {
          return;
        }

        for (const key of ["href", "src"]) {
          const value = node.properties[key];
          if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
            continue;
          }

          if (normalizedBase === "/") {
            continue;
          }

          node.properties[key] = value === "/" ? normalizedBase : `${normalizedBase}${value}`;
        }
      });
    };
  };
}

function visitTree(node, visitor) {
  if (!node) {
    return;
  }

  visitor(node);

  if (!node.children) {
    return;
  }

  for (const child of node.children) {
    visitTree(child, visitor);
  }
}

export default defineConfig({
  site: useRepositoryBase ? `https://${repositoryOwner}.github.io` : customDomainSite,
  base: useRepositoryBase ? `/${repositoryName}` : undefined,
  markdown: {
    rehypePlugins: [prefixRootRelativeMarkdownUrls(siteBase)],
  },
  output: "static",
  trailingSlash: "always",
});
