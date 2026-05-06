import { defineCollection, z } from "astro:content";

const runtimeAssetPath = z.string().regex(/^\/media\/.+/);
const runtimeOrRemoteImage = z.union([z.string().url(), runtimeAssetPath]);
const externalOrInternalUrl = z.union([z.string().url(), z.string().regex(/^\//)]);

const annualShowResource = z.object({
  year: z.string().optional(),
  label: z.string(),
  file: runtimeAssetPath.optional(),
  url: externalOrInternalUrl.optional(),
  note: z.string().optional(),
});

const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    path: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
    source_url: z.string().url().optional(),
    migration_status: z.enum(["migrated", "placeholder", "pending_policy", "cms-created"]).optional(),
    notes: z.string().optional(),
    annual_show: z.object({
      date_text: z.string().optional(),
      theme: z.string().optional(),
      gallery_notice: z.string().optional(),
      gallery_url: externalOrInternalUrl.optional(),
      competition: z.object({
        heading: z.string().optional(),
        schedule: annualShowResource.optional(),
        entry_form: annualShowResource.optional(),
        notes_for_exhibitors: annualShowResource.optional(),
      }).optional(),
      stallholders: z.object({
        heading: z.string().optional(),
        intro: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        letter: annualShowResource.optional(),
        application: annualShowResource.optional(),
      }).optional(),
    }).optional(),
  }),
});

const blogCategories = defineCollection({
  schema: z.object({
    name: z.string(),
    label: z.string(),
    description: z.string().optional(),
  }),
});

const galleryItem = z.object({
  wordpress_id: z.number().int().positive().optional(),
  title: z.string(),
  image_url: runtimeOrRemoteImage,
  image_path: z.string(),
  legacy_attachment_url: z.string().url(),
  legacy_attachment_path: z.string(),
  caption: z.string().nullable(),
  notes: z.string(),
});

const galleryGroup = z.object({
  slug: z.string(),
  title: z.string(),
  source_type: z.enum(["jetpack_tiled_gallery", "wordpress_shortcode_gallery", "wordpress_page_gallery"]),
  gallery_type: z.string().optional(),
  source_block_index: z.number().int().positive().optional(),
  notes: z.string(),
  items: z.array(galleryItem),
});

const gallerySection = z.object({
  slug: z.string(),
  title: z.string(),
  path: z.string(),
  source_url: z.string().url(),
  summary: z.string(),
  notes: z.string(),
  groups: z.array(galleryGroup),
});

const galleryLanding = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    path: z.string(),
    source_url: z.string().url(),
    notes: z.string(),
    migration_status: z.enum(["sample_scaffold", "migrated"]),
    event_slugs: z.array(z.string()).nonempty(),
  }),
});

const galleryEvents = defineCollection({
  type: "data",
  schema: gallerySection,
});

const pageGallerySections = defineCollection({
  type: "data",
  schema: z.object({
    host_page: z.string(),
    sections: z.array(gallerySection),
  }),
});

export const collections = {
  "blog-categories": blogCategories,
  gallery: galleryLanding,
  "gallery-events": galleryEvents,
  "page-gallery-sections": pageGallerySections,
  pages,
};
