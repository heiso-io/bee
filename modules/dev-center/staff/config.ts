/**
 * Cell Staff Configuration
 *
 * NBEE cell（單一部署）的運維人員設定。
 * 屬於 dev-center module 的一部分。
 */

export const STAFF_CONFIG = {
  /**
   * 出廠 staff 名單（這個 cell 的初始運維人員）
   *
   * 透過 /devlogin 登入且 email 在這裡 → session.staff: true
   *   → 可訪問 /dev-center
   *
   * 之後可在 /dev-center/staff 動態新增 / 移除（寫入 DB）
   * - DB 有資料 → 用 DB
   * - DB 空 → fallback 用這份出廠值
   */
  initialStaff: ["pm@heiso.io", "dev@heiso.io"],
};
