export function flashParam(message: string, type: "success" | "error" = "success"): string {
  return `?flash=${encodeURIComponent(JSON.stringify({ message, type }))}`;
}
