export type DashboardMenu = {
  group: string;
  name: string;
  path: string;
  icon: string;
  title: string;
  order: number;
};

// CMS 端在 apps/cms/config/menus.ts 提供完整 menu 定義；
// core 不維護 default menu（已移除空殼 DASHBOARD_DEFAULT_MENUS）。
