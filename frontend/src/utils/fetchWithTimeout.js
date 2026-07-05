/**
 * 带 AbortController 超时的 fetch 封装。
 *
 * 用途：
 * - 解决移动端 Safari 在长时间请求下抛出 "Load failed"（无任何 HTTP 响应）的问题，
 *   通过主动超时把错误转化为可控的 NETWORK_TIMEOUT。
 * - 把浏览器原生网络层错误（AbortError / "Load failed" / "Failed to fetch"）统一映射为
 *   NETWORK_TIMEOUT，便于上层做 i18n 友好提示。
 */

const NETWORK_ERROR_MESSAGES = new Set([
  'Load failed', // iOS Safari / macOS Safari
  'Failed to fetch', // Chrome / Edge / Firefox
  'NetworkError when attempting to fetch resource.' // 旧版 Firefox
])

function isNetworkLevelError(err) {
  if (!err) return false
  if (err.name === 'AbortError') return true
  const message = err.message || ''
  if (message === 'NETWORK_TIMEOUT') return true
  return NETWORK_ERROR_MESSAGES.has(message)
}

/**
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} [options]
 * @param {number} [timeoutMs=90000] 超时时间，默认 90s
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 90000) {
  const { timeoutMs: _ignored, ...init } = options
  const effectiveTimeout = typeof options.timeoutMs === 'number' ? options.timeoutMs : timeoutMs

  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), effectiveTimeout)

  try {
    const response = await fetch(url, {
      ...init,
      signal: init.signal || controller.signal
    })
    return response
  } catch (err) {
    if (isNetworkLevelError(err)) {
      throw new Error('NETWORK_TIMEOUT')
    }
    throw err
  } finally {
    clearTimeout(timerId)
  }
}

export default fetchWithTimeout
