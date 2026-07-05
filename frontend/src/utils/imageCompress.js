/**
 * 客户端图片压缩工具
 *
 * 上传前用 canvas 把图片压到最大边 maxEdge、JPEG 质量 quality，
 * 用于避免手机相机原图（3-8MB）上传过慢、跨网关超时（iOS Safari "Load failed"）。
 *
 * 任何环节失败都 fallback 返回原文件，绝不阻塞上传流程。
 */

const DEFAULT_OPTIONS = {
  maxEdge: 1600,
  quality: 0.85
}

/**
 * 判断是否为浏览器无法原生解码的格式（HEIC/HEIF）。
 * iOS 通过 <input capture> 拍照时一般已自动转 JPEG，但仍兜底。
 */
function isUnsupportedType(file) {
  const type = (file?.type || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || type === ''
}

/**
 * 把文件解码为 ImageBitmap / HTMLImageElement。
 * 优先使用 createImageBitmap（性能更好），不可用时降级到 Image + createObjectURL。
 */
async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch (err) {
      // 落到下面的 Image 兜底
      console.warn('createImageBitmap failed, fallback to <img>:', err)
    }
  }

  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/**
 * 把 ImageBitmap / HTMLImageElement 绘制到 canvas 并输出 JPEG Blob。
 */
async function drawAndEncode(source, maxEdge, quality) {
  const width = source.width
  const height = source.height
  if (!width || !height) {
    throw new Error('invalid image dimensions')
  }

  // 长边超过 maxEdge 才缩放，否则保持原尺寸只重编码
  const longest = Math.max(width, height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  let canvas
  if (typeof OffscreenCanvas === 'function') {
    canvas = new OffscreenCanvas(targetWidth, targetHeight)
  } else {
    canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('canvas 2d context unavailable')
  }
  // 白底，避免透明 PNG 转 JPEG 后背景变黑
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

  // OffscreenCanvas 用 convertToBlob；普通 canvas 用 toBlob
  if (typeof canvas.convertToBlob === 'function') {
    return await canvas.convertToBlob({ type: 'image/jpeg', quality })
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('toBlob returned null'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * 把原文件名扩展名替换为 .jpg
 */
function toJpegFilename(originalName) {
  if (!originalName) return 'upload.jpg'
  const dotIndex = originalName.lastIndexOf('.')
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName
  return `${base}.jpg`
}

/**
 * 压缩图片。
 *
 * @param {File} file 原始图片文件
 * @param {{ maxEdge?: number, quality?: number }} [options]
 * @returns {Promise<File>} 压缩后的 File 对象（JPEG）；任何环节失败则返回原文件
 */
export async function compressImage(file, options = {}) {
  const { maxEdge, quality } = { ...DEFAULT_OPTIONS, ...options }

  if (!file || typeof file === 'string') {
    return file
  }

  // 只处理图片
  if (!file.type || !file.type.startsWith('image/')) {
    return file
  }

  // 浏览器无法原生解码的格式（HEIC/HEIF）：返回原文件交由后端兜底
  if (isUnsupportedType(file)) {
    return file
  }

  try {
    const source = await decodeImage(file)
    const blob = await drawAndEncode(source, maxEdge, quality)
    if (!blob) {
      return file
    }
    return new File([blob], toJpegFilename(file.name), { type: 'image/jpeg' })
  } catch (err) {
    console.warn('compressImage failed, returning original file:', err)
    return file
  }
}

export default compressImage
