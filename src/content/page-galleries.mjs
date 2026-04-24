import schoolsLiaison from "./page-gallery-sections/schools-liaison.json" with { type: "json" };
import treePlanting from "./page-gallery-sections/tree-planting.json" with { type: "json" };

export const pageGalleries = {
  [schoolsLiaison.host_page]: schoolsLiaison.sections,
  [treePlanting.host_page]: treePlanting.sections,
};

export function getPageGallerySections(path) {
  return pageGalleries[path] ?? [];
}
