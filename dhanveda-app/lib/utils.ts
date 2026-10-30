export function sanitise(s: string, maxLen = 120): string {
  return String(s || '')
    .replace(/[<>"'`{}\\]/g, '')
    .substring(0, maxLen)
    .trim()
}

export function safe(v: unknown): string {
  const s = String(v ?? '')
  return s && s !== 'null' && s !== 'undefined' && s !== 'N/A' ? s : 'N/A'
}

export function safeArr<T>(v: unknown): T[] | null {
  return Array.isArray(v) && v.length > 0 ? (v as T[]) : null
}

export function formatINR(n: number): string {
  return n.toLocaleString('en-IN')
}

export function getInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase()
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
