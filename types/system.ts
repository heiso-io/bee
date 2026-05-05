import { Permission } from "./permission";

export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  permission?: Permission; // Permission control
}

export interface Menu {
  [key: string]: MenuItem;
}

export interface Settings {
  [key: string]: unknown;
}

export interface SiteBasic {
  name: string;
  title: string;
  baseUrl: string;
  domain: string;
  keywords: string;
  description: string;
}

export interface SiteBranding {
  organization: string;
  slogan: string;
  copyright: string;
}

export interface SiteAssets {
  logo: string;
  favicon: string;
  ogImage: string;
}

export interface PortalSetting {
  basic: Partial<SiteBasic>;
  branding: Partial<SiteBranding>;
  assets: Partial<SiteAssets>;
  deployment?: {
    vercel_project_id?: string;
    revalidate_secret?: string;
    preview_secret?: string;
  };
  system_oauth?: string;
}
