import type { SavePostConfig } from "@/components/posts/edit/post-edit";

export const PagesConfig: SavePostConfig = {
  header: {
    aiTools: false,
  },
  tabs: {
    edit: true,
    info: true,
    seo: true,
    jsonId: false,
  },
  info: {
    title: true,
    slug: true,
    excerpt: true,
    categoriesMode: "single",
    menus: true,
    featured: false,
  },
  editor: {
    showMobile: true,
    showTemplateButtons: false,
  },
  translate: false,
};
