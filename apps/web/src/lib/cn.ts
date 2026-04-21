/** Minimal classname joiner — avoids pulling in clsx for simple cases */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
