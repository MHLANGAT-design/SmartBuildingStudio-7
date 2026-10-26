/**
 * Converts a raw byte count into a clean, localized engineering metric.
 */
export function formatByteCapacity(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Transforms an ISO date string into a relative human-readable timestamp frame.
 * Examples: "Just now", "25m ago", "3h ago", "Yesterday"
 */
export function computeRelativeAgeString(dateParam: string | Date): string {
  const date = typeof dateParam === "string" ? new Date(dateParam) : dateParam;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return "Just now"; // Account for slight server clock variance

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Formats a metric number with thousands separators for crisp datagrid readouts.
 */
export function formatNumericCounter(value: number): string {
  return new Intl.NumberFormat().format(value);
}
