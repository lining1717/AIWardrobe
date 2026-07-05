// 开发环境（本地）走 http://localhost:8000；生产环境（Render 等）走同源 https
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
export const API_ORIGIN = isDev
  ? `http://${window.location.hostname}:8000`
  : window.location.origin
export const API_BASE = `${API_ORIGIN}/api`

export function toImageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${normalized}`
}
