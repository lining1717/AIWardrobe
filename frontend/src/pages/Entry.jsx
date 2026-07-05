import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Upload from '../components/Upload'
import Settings from '../components/Settings'
import { Save, ArrowLeft, Tag, Palette, Layers, CloudSun, FileText, Shirt, Settings as SettingsIcon, Sparkles } from 'lucide-react'

import { API_BASE, toImageUrl } from '../utils/api'

export default function Entry() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [editingItem, setEditingItem] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [formData, setFormData] = useState({
        item: '',
        category: 'top',
        description: '',
        color_semantics: '',
        style_semantics: '',
        season_semantics: '',
        usage_semantics: ''
    })

    const handleUploadSuccess = (item) => {
        setEditingItem(item)
        setFormData({
            item: item.item,
            category: item.category,
            description: item.description || '',
            color_semantics: item.color_semantics || '',
            style_semantics: item.style_semantics?.join(', ') || '',
            season_semantics: item.season_semantics?.join(', ') || '',
            usage_semantics: item.usage_semantics?.join(', ') || ''
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const payload = {
                ...formData,
                style_semantics: formData.style_semantics.split(/[,，]\s*/).filter(Boolean),
                season_semantics: formData.season_semantics.split(/[,，]\s*/).filter(Boolean),
                usage_semantics: formData.usage_semantics.split(/[,，]\s*/).filter(Boolean),
                image_filename: editingItem.image_url.split('/').pop()
            }

            const response = await fetch(`${API_BASE}/clothes/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const event = new CustomEvent('show-toast', {
                    detail: { type: 'success', message: t('entry.saveSuccess') }
                })
                window.dispatchEvent(event)
                setEditingItem(null)
            } else {
                throw new Error('Save failed')
            }
        } catch (error) {
            console.error('Save error:', error)
            const event = new CustomEvent('show-toast', {
                detail: { type: 'error', message: t('entry.saveFailed') }
            })
            window.dispatchEvent(event)
        } finally {
            setLoading(false)
        }
    }

    if (editingItem) {
        return (
            <div className="flex flex-col animate-fade-in relative z-20 min-h-screen">
                <header className="glass-header px-5 py-4 flex items-center justify-between">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-champagne cursor-pointer"
                        onClick={() => setEditingItem(null)}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-serif text-xl">{t('entry.editTitle')}</h2>
                    <button
                        className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                            loading
                                ? 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                                : 'bg-champagne text-white shadow-soft hover:opacity-90'
                        }`}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? <span className="w-4 h-4 border-2 border-[var(--border)] border-t-champagne rounded-full animate-spin" /> : <Save size={18} />}
                        <span>{loading ? t('entry.saving') : t('entry.save')}</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto pb-28 px-5 pt-6 space-y-6 max-w-3xl mx-auto w-full">
                    <div className="w-full aspect-square bg-[var(--secondary)] rounded-[1.75rem] overflow-hidden shadow-soft p-8 flex flex-col items-center justify-center">
                        <img
                            src={toImageUrl(editingItem.image_url)}
                            alt="Preview"
                            className="w-full h-full object-contain drop-shadow-md"
                        />
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft space-y-4">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{t('entry.basicInfo')}</h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                    <Tag className="text-champagne" size={16} /> {t('entry.name')}
                                </label>
                                <input
                                    type="text"
                                    name="item"
                                    value={formData.item}
                                    onChange={handleChange}
                                    placeholder={t('entry.namePlaceholder')}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                    <Shirt className="text-champagne" size={16} /> {t('entry.category')}
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input-field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23b99872%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_14px_center] bg-no-repeat pr-10"
                                >
                                    <option value="top">{t('entry.categoryTop')}</option>
                                    <option value="bottom">{t('entry.categoryBottom')}</option>
                                    <option value="shoes">{t('entry.categoryShoes')}</option>
                                    <option value="accessory">{t('entry.categoryAccessory')}</option>
                                </select>
                            </div>
                        </section>

                        <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft space-y-4">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{t('entry.features')}</h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                    <Palette className="text-champagne" size={16} /> {t('entry.color')}
                                </label>
                                <input
                                    type="text"
                                    name="color_semantics"
                                    value={formData.color_semantics}
                                    onChange={handleChange}
                                    placeholder={t('entry.colorPlaceholder')}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                    <Layers className="text-champagne" size={16} /> {t('entry.style')}
                                </label>
                                <input
                                    type="text"
                                    name="style_semantics"
                                    value={formData.style_semantics}
                                    onChange={handleChange}
                                    placeholder={t('entry.stylePlaceholder')}
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                    <CloudSun className="text-champagne" size={16} /> {t('entry.season')}
                                </label>
                                <input
                                    type="text"
                                    name="season_semantics"
                                    value={formData.season_semantics}
                                    onChange={handleChange}
                                    placeholder={t('entry.seasonPlaceholder')}
                                    className="input-field"
                                />
                            </div>
                        </section>

                        <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft space-y-4">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)] flex items-center gap-1.5">
                                <FileText className="text-champagne" size={16} /> {t('entry.description')}
                            </h3>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="input-field resize-none"
                                placeholder={t('entry.descriptionPlaceholder')}
                            />
                        </section>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-5 pb-28 pt-8 md:px-8 md:pb-12 max-w-6xl mx-auto w-full flex flex-col">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <p className="mb-1.5 text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Add Piece</p>
                    <h1 className="text-3xl">{t('entry.title')}</h1>
                </div>
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-champagne cursor-pointer"
                    onClick={() => setShowSettings(true)}
                    title={t('settings.title')}
                >
                    <SettingsIcon size={18} />
                </button>
            </div>

            <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft mb-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{t('entry.heroTag')}</p>
                        <h2 className="mt-1 font-serif text-xl">{t('entry.heroTitle')}</h2>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">{t('entry.heroSubtitle')}</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-champagne)_16%,transparent)] text-champagne">
                        <Sparkles size={18} />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button className="btn-secondary" onClick={() => navigate('/wardrobe')}>
                        <Shirt size={16} />
                        {t('entry.goWardrobe')}
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/recommendation')}>
                        <Sparkles size={16} />
                        {t('entry.goRecommendation')}
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-[var(--secondary)]/60 px-2 py-2.5">
                        <div className="text-[10px] text-champagne font-serif">01</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{t('entry.stepUpload')}</div>
                    </div>
                    <div className="rounded-2xl bg-[var(--secondary)]/60 px-2 py-2.5">
                        <div className="text-[10px] text-champagne font-serif">02</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{t('entry.stepEdit')}</div>
                    </div>
                    <div className="rounded-2xl bg-[var(--secondary)]/60 px-2 py-2.5">
                        <div className="text-[10px] text-champagne font-serif">03</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{t('entry.stepRecommend')}</div>
                    </div>
                </div>
            </section>

            <div className="flex-1">
                <Upload onUploadSuccess={handleUploadSuccess} />
            </div>

            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={() => {
                }}
            />
        </div>
    )
}
