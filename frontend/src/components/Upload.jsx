import { useEffect, useRef, useState } from 'react'
import { Upload as UploadIcon, Camera, Image as ImageIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpload } from '../contexts/UploadContext'
import { compressImage } from '../utils/imageCompress'

const NETWORK_ERROR_PATTERNS = ['NETWORK_TIMEOUT', 'Load failed', 'Failed to fetch']

function isNetworkError(message) {
    if (!message) return false
    return NETWORK_ERROR_PATTERNS.includes(message)
}

export default function Upload({ onUploadSuccess }) {
    const { t } = useTranslation()
    const {
        isUploading,
        progress,
        statusKey,
        current,
        total,
        completedSingleItem,
        batchResult,
        lastError,
        uploadFiles,
        consumeCompletedSingleItem,
        consumeBatchResult,
        consumeLastError
    } = useUpload()
    const [isDragging, setIsDragging] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    const status = statusKey
        ? (total > 1 && current > 0 ? `${t(statusKey)} (${current}/${total})` : t(statusKey))
        : ''

    useEffect(() => {
        if (!completedSingleItem) return
        onUploadSuccess?.(completedSingleItem)
        consumeCompletedSingleItem()
    }, [completedSingleItem, onUploadSuccess, consumeCompletedSingleItem])

    useEffect(() => {
        if (!batchResult) return
        alert(t('upload.batchResult', batchResult))
        consumeBatchResult()
    }, [batchResult, t, consumeBatchResult])

    useEffect(() => {
        if (!lastError) return
        const translatedError = lastError === 'INVALID_IMAGE_TYPE'
            ? t('upload.selectImage')
            : isNetworkError(lastError)
                ? t('upload.networkError')
                : lastError
        alert(`${t('upload.uploadFailed')}: ${translatedError}`)
        consumeLastError()
    }, [lastError, t, consumeLastError])

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            void uploadFiles(Array.from(files))
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleCameraClick = () => {
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            cameraInputRef.current?.click()
        } else {
            startCamera()
        }
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setShowCamera(true)
        } catch (err) {
            console.error('Camera error:', err)
            alert(t('upload.cameraError'))
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setShowCamera(false)
    }

    const capturePhoto = () => {
        if (!videoRef.current) return

        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoRef.current, 0, 0)

        canvas.toBlob(async (blob) => {
            if (!blob) return
            const rawFile = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
            // 复用 compressImage 统一压缩，避免桌面端 webcam 全尺寸上传
            const file = await compressImage(rawFile)
            void uploadFiles([file])
            stopCamera()
        }, 'image/jpeg', 0.9)
    }

    const handleFileChange = (e) => {
        const files = e.target.files
        if (files && files.length > 0) {
            void uploadFiles(Array.from(files))
        }
        e.target.value = ''
    }

    if (showCamera) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <div className="flex-1 relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="h-32 bg-black pb-safe flex items-center justify-around px-8">
                    <button className="p-4 text-white hover:text-red-400 transition-colors" onClick={stopCamera}>
                        <X size={28} />
                    </button>
                    <button className="w-16 h-16 rounded-full bg-white border-4 border-[var(--border)] active:scale-95 transition-transform" onClick={capturePhoto}></button>
                    <div className="w-14"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div
                className={`relative overflow-hidden rounded-[1.75rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] ${
                    isDragging
                        ? 'border-champagne bg-[color-mix(in_srgb,var(--accent-champagne)_8%,transparent)] scale-[1.01]'
                        : 'border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--secondary)]/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ minHeight: '300px' }}
            >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-champagne)_16%,transparent)] text-champagne">
                    <UploadIcon size={26} />
                </div>

                <h3 className="font-serif text-lg text-[var(--text-primary)] mb-1">{t('upload.title')}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-8 text-center">{t('upload.subtitle')}<br />{t('upload.subtitleAI')}</p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    <button className="flex-1 btn-primary" onClick={handleCameraClick}>
                        <Camera size={18} />
                        {t('upload.camera')}
                    </button>
                    <button className="flex-1 btn-secondary" onClick={handleUploadClick}>
                        <ImageIcon size={18} />
                        {t('upload.album')}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {isUploading && (
                <div className="mt-6 space-y-2 animate-fade-in">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-[var(--text-secondary)]">{status}</span>
                        <span className="text-champagne">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--secondary)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-champagne transition-all duration-300 relative top-0 left-0 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
