export function money(value, currency = 'USD') { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); }
export function safePreviewUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } }
