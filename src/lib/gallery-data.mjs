import galleryPage from "../content/gallery/gallery-page.json" with { type: "json" };
import annualShow2021 from "../content/gallery-events/annual-show-2021.json" with { type: "json" };
import annualShow2022 from "../content/gallery-events/annual-show-2022.json" with { type: "json" };
import annualShow2023 from "../content/gallery-events/annual-show-2023.json" with { type: "json" };
import annualShow2024 from "../content/gallery-events/annual-show-2024.json" with { type: "json" };
import plantSale2021 from "../content/gallery-events/plant-sale-2021.json" with { type: "json" };

const galleryEventsBySlug = new Map([
  [annualShow2021.slug, annualShow2021],
  [annualShow2022.slug, annualShow2022],
  [annualShow2023.slug, annualShow2023],
  [annualShow2024.slug, annualShow2024],
  [plantSale2021.slug, plantSale2021],
]);

export const gallerySections = galleryPage.event_slugs
  .map((slug) => galleryEventsBySlug.get(slug))
  .filter(Boolean);

export const galleryCollections = [
  {
    ...galleryPage,
    sections: gallerySections,
  },
];

export function getGalleryCollectionForPath(path) {
  return galleryCollections.find((collection) => collection.path === path) ?? null;
}

export function getGalleryCollectionsForPath(path) {
  return galleryCollections.filter((collection) => collection.path === path);
}

export function getGallerySectionForPath(path) {
  return gallerySections.find((section) => section.path === path) ?? null;
}
