export function withBase(path, base = "/") {
  if (!path || !path.startsWith("/")) {
    return path;
  }

  if (path === "/") {
    return base;
  }

  const normalizedBase = normalizeBase(base);
  return normalizedBase === "/" ? path : `${normalizedBase}${path}`;
}

export function withoutBase(path, base = "/") {
  if (!path?.startsWith("/")) {
    return path;
  }

  const normalizedBase = normalizeBase(base);
  if (normalizedBase === "/" || path === normalizedBase) {
    return path === normalizedBase ? "/" : path;
  }

  if (path.startsWith(`${normalizedBase}/`)) {
    return path.slice(normalizedBase.length);
  }

  return path;
}

function normalizeBase(base = "/") {
  if (!base || base === "/") {
    return "/";
  }

  return `/${base.replace(/^\/+|\/+$/g, "")}`;
}
