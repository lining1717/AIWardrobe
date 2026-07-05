import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, RefreshCw } from 'lucide-react'

import { API_BASE, toImageUrl } from '../utils/api'

export default function ClothesDetail() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams()
    const [item, setItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [personImageFile, setPersonImageFile] = useState(null)
    const [personImagePreview, setPersonImagePreview] = useState('')
    const [tryOnResultUrl, setTryOnResultUrl] = useState('')
    const [tryOnLoading, setTryOnLoading] = useState(false)
    const [tryOnError, setTryOnError] = useState('')

    useEffect(() => {
        fetchClothesDetail()
    }, [id])

    const fetchClothesDetail = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(`${API_BASE}/clothes/${id}`)
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'NOT_FOUND' : 'FETCH_FAILED')
            }
            const data = await response.json()
            setItem(data)
        } catch (err) {
            setItem(null)
            setError(err.message || 'FETCH_FAILED')
        } finally {
            setLoading(false)
        }
    }

    const renderTags = (values, tone = 'champagne') => {
        if (!Array.isArray(values) || values.length === 0) {
            return <span className="text-sm text-[var(--muted-foreground)]">{t('clothesDetail.empty')}</span>
        }
        return (
            <div className="flex flex-wrap gap-1.5">
                {values.map(value => (
                    <span key={value} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs tag-${tone}`}>
                        {value}
                    </span>
                ))}
            </div>
        )
    }

    const handlePersonImageChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setPersonImageFile(file)
        setTryOnResultUrl('')
        setTryOnError('')

        const nextPreview = URL.createObjectURL(file)
        if (personImagePreview) {
            URL.revokeObjectURL(personImagePreview)
        }
        setPersonImagePreview(nextPreview)
    }

    const handleTryOn = async () => {
        if (!personImageFile || !item) {
            setTryOnError(t('clothesDetail.tryOnNeedPersonImage'))
            return
        }

        setTryOnLoading(true)
        setTryOnError('')
        try {
            const formData = new FormData()
            formData.append('person_image', personImageFile)
            formData.append('garment_id', String(item.id))
            formData.append('category', item.category || 'top')

            const response = await fetch(`${API_BASE}/tryon`, {
                method: 'POST',
                body: formData
            })

            const data = await response.json().catch(() => ({}))
            if (!response.ok || !data.result_image_url) {
                throw new Error(data.detail || t('clothesDetail.tryOnFailed'))
            }

            setTryOnResultUrl(toImageUrl(data.result_image_url))
        } catch (err) {
            setTryOnError(err.message || t('clothesDetail.tryOnFailed'))
        } finally {
            setTryOnLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
                <p className="mt-4 text-sm text-[var(--muted-foreground)]">{t('clothesDetail.loading')}</p>
            </div>
        )
    }

    if (!item || error) {
        return (
            <div className="px-5 pt-8 max-w-6xl mx-auto w-full">
                <header className="mb-6">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft hover:-translate-y-0.5 hover:text-champagne transition-all cursor-pointer"
                        onClick={() => navigate('/wardrobe')}
                    >
                        <ArrowLeft size={20} />
                    </button>
                </header>
                <div className="rounded-[1.75rem] bg-[var(--bg-card)] p-8 text-center shadow-soft space-y-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                        {error === 'NOT_FOUND' ? t('clothesDetail.notFound') : t('clothesDetail.loadFailed')}
                    </p>
                    <button className="btn-secondary mx-auto" onClick={fetchClothesDetail}>
                        <RefreshCw size={16} />
                        {t('clothesDetail.retry')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="pb-28 md:pb-12 animate-fade-in max-w-6xl mx-auto w-full px-5 md:px-8 pt-8">
            <header className="mb-6 flex items-center gap-3">
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft hover:-translate-y-0.5 hover:text-champagne transition-all cursor-pointer"
                    onClick={() => navigate('/wardrobe')}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-serif text-2xl">{t('clothesDetail.title')}</h1>
            </header>

            <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0">
                <article className="overflow-hidden rounded-[1.75rem] bg-[var(--bg-card)] shadow-soft lg:col-span-5">
                    <div className="aspect-square bg-[var(--secondary)] p-8 flex items-center justify-center">
                        <img
                            src={toImageUrl(item.image_url)}
                            alt={item.item}
                            className="w-full h-full object-contain drop-shadow-md"
                        />
                    </div>
                    <div className="p-5 border-t border-[var(--border)]">
                        <h2 className="font-serif text-xl text-[var(--text-primary)]">{item.item}</h2>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">{item.category}</p>
                    </div>
                </article>

                <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft space-y-5 lg:col-span-7">
                    <DetailField label={t('clothesDetail.description')}>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.description || t('clothesDetail.empty')}</p>
                    </DetailField>

                    <DetailField label={t('clothesDetail.color')}>
                        <p className="text-sm text-[var(--text-secondary)]">{item.color_semantics || t('clothesDetail.empty')}</p>
                    </DetailField>

                    <DetailField label={t('clothesDetail.style')}>
                        {renderTags(item.style_semantics, 'champagne')}
                    </DetailField>

                    <DetailField label={t('clothesDetail.season')}>
                        {renderTags(item.season_semantics, 'sage')}
                    </DetailField>

                    <DetailField label={t('clothesDetail.usage')}>
                        {renderTags(item.usage_semantics, 'rose')}
                    </DetailField>
                </section>

                <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft space-y-4 lg:col-span-12">
                    <div>
                        <h3 className="font-serif text-lg">{t('clothesDetail.tryOnTitle')}</h3>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('clothesDetail.tryOnHint')}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="btn-secondary inline-flex cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={handlePersonImageChange} />
                            {t('clothesDetail.tryOnUpload')}
                        </label>
                        {personImagePreview && (
                            <img src={personImagePreview} alt="person preview" className="w-full max-h-80 object-contain rounded-2xl border border-[var(--border)] bg-[var(--secondary)]" />
                        )}
                    </div>

                    <div>
                        <button className="btn-primary" onClick={handleTryOn} disabled={tryOnLoading}>
                            {tryOnLoading ? t('clothesDetail.tryOnGenerating') : t('clothesDetail.tryOnGenerate')}
                        </button>
                    </div>

                    {tryOnError && (
                        <p className="text-sm text-clay">{tryOnError}</p>
                    )}

                    {tryOnResultUrl && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-[var(--muted-foreground)]">{t('clothesDetail.tryOnResult')}</h4>
                            <img src={tryOnResultUrl} alt="try on result" className="w-full max-h-[28rem] object-contain rounded-2xl border border-[var(--border)] bg-[var(--secondary)]" />
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

function DetailField({ label, children }) {
    return (
        <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-2">{label}</h3>
            <div>{children}</div>
        </div>
    )
}
