/**
 * Bee 部署配置（非敏感值）
 *
 * - storage: S3 + CDN
 * - email:   notify 寄件人
 *
 * 由 next.config.ts 注入 process.env，server / client 透過 process.env 讀。
 * ⚠️ 敏感資訊（API keys、credentials）仍保留在 .env.local。
 */
export const SETTING = {
  storage: {
    s3: {
      region: "ap-northeast-1",
      publicBucket: "nbee-public-tokyo",
      privateBucket: "nbee-private-tokyo",
    },
    cdn: {
      url: "https://nbee-cdn.heiso.io",
    },
  },

  email: {
    notifyEmail: "no-reply@heiso.io",
  },
};
