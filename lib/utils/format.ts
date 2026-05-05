// formatBytes 統一在 @heiso-io/bee/lib/helper.ts

/**
 * Format date string to readable format
 * @param date Date string or Date object
 * @param locale Locale string (default: "en-US")
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function readableDate(
  date: string | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, options);
}

export const readableDateTime = (lastLoginAt: Date | null | undefined) => {
  if (!lastLoginAt) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(lastLoginAt));
};

export function generateRandomPassword(length: number = 8): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}
