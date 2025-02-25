import { cn } from "@workspace/ui/lib/utils";

export { cn };

export function fixNumber(num: number): string {
  return num >= 1000000
    ? `${(num / 1000000).toFixed(1)}M`
    : num >= 1000
    ? `${(num / 1000).toFixed(1)}K`
    : num.toString();
}


export function convertSecondsToHMS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${(hours > 0 && minutes > 0 && secs > 0) ? hours + ":" : ""}${(minutes > 0 && secs > 0 ) ? String(minutes).padStart(2, '0'): ""}:${String(secs).padStart(2, '0')}`;
}