const e = process.env;

const config = {
  site: {
    name:         e.NEXT_PUBLIC_SITE_NAME         ?? "Bee",
    title:        e.NEXT_PUBLIC_SITE_TITLE        ?? "Bee",
    base_url:     "/",
    favicon:      e.NEXT_PUBLIC_FAVICON           ?? "/assets/svg/favicon.svg",
    slogan:       e.NEXT_PUBLIC_SITE_SLOGAN       ?? "",
    description:  e.NEXT_PUBLIC_SITE_DESCRIPTION  ?? "",
    organization: e.NEXT_PUBLIC_ORGANIZATION      ?? "Heiso",
    logo: {
      url:   e.NEXT_PUBLIC_LOGO_URL               ?? "/images/logo.png",
      title: e.NEXT_PUBLIC_SITE_NAME              ?? "Bee",
    },
    ogImage:   e.NEXT_PUBLIC_OG_IMAGE             ?? "/assets/svg/og-image.svg",
    copyright: e.NEXT_PUBLIC_COPYRIGHT            ?? "© Heiso. All rights reserved.",
  },

  settings: {
    pagination: 3,
    summary_length: 200,
    blog_folder: "content/blog",
  },

  params: {
    tag_manager_id:      e.NEXT_PUBLIC_GTM_ID              ?? "",
    contact_form_action: e.NEXT_PUBLIC_CONTACT_FORM_ACTION ?? "#",
    copyright:           e.NEXT_PUBLIC_COPYRIGHT           ?? "© Heiso. All rights reserved.",
  },

  metadata: {
    meta_author:      e.NEXT_PUBLIC_META_AUTHOR      ?? "",
    meta_image:       e.NEXT_PUBLIC_OG_IMAGE         ?? "/assets/svg/og-image.svg",
    meta_description: e.NEXT_PUBLIC_SITE_DESCRIPTION ?? "",
  },

  auth: {
    account: {
      base_url: "/portal/account",

      menu: [
        {
          name: "My Account",
          items: [
            {
              name: "General",
              meta: {
                url: "/preferences",
                icon: "UserPen",
                title: "Settings",
              },
            },
            {
              name: "Authentication",
              meta: {
                url: "/authentication",
                icon: "Key",
                title: "Authentication",
              },
            },
          ],
        },
      ],
    },
  },
};

export * from "./settings";

export default config;

