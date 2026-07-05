import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Trash2, PackageOpen } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import Settings from '../components/Settings'
import { API_BASE, toImageUrl } from '../utils/api'

export default function Wardrobe() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [], accessories: [] })
    const [loading, setLoading] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [filters, setFilters] = useState({
        search: '',
        seasons: [],
        styles: []
    })

    useEffect(() => {
        const controller = new AbortController()
        void fetchWardrobe(controller.signal)
        return () => controller.abort()
    }, [])

    const fetchWardrobe = useCallback(async (signal) => {
        try {
            const response = await fetch(`${API_BASE}/wardrobe`, { signal })
            if (response.ok) {
                const data = await response.json()
                setWardrobe({
                    tops: data.tops || [],
                    bottoms: data.bottoms || [],
                    shoes: data.shoes || [],
                    accessories: data.accessories || []
                })
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Failed to fetch wardrobe:', error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [])

    const handleDelete = async (id) => {
        if (!confirm(t('wardrobe.deleteConfirm'))) return

        const previousWardrobe = wardrobe
        setWardrobe(prev => ({
            tops: prev.tops.filter(item => item.id !== id),
            bottoms: prev.bottoms.filter(item => item.id !== id),
            shoes: prev.shoes.filter(item => item.id !== id),
            accessories: prev.accessories.filter(item => item.id !== id)
        }))

        try {
            const response = await fetch(`${API_BASE}/clothes/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) {
                setWardrobe(previousWardrobe)
            }
        } catch (error) {
            setWardrobe(previousWardrobe)
            console.error('Delete error:', error)
        }
    }

    const handleSearch = useCallback((text) => {
        setFilters(prev => ({ ...prev, search: text }))
    }, [])

    const handleFilterChange = useCallback(({ seasons, styles }) => {
        setFilters(prev => ({ ...prev, seasons, styles }))
    }, [])

    const sections = useMemo(() => {
        const filterItems = (items) => {
            return items.filter(item => {
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase()
                    const matchesText =
                        item.item.toLowerCase().includes(searchLower) ||
                        (item.description && item.description.toLowerCase().includes(searchLower))
                    if (!matchesText) return false
                }
                if (filters.seasons.length > 0) {
                    const hasSeason = item.season_semantics?.some(s => filters.seasons.includes(s))
                    if (!hasSeason) return false
                }
                if (filters.styles.length > 0) {
                    const hasStyle = item.style_semantics?.some(s => filters.styles.includes(s))
                    if (!hasStyle) return false
                }
                return true
            })
        }

        return [
            { title: t('wardrobe.tops'), emoji: '上衣', items: filterItems(wardrobe.tops) },
            { title: t('wardrobe.bottoms'), emoji: '下装', items: filterItems(wardrobe.bottoms) },
            { title: t('wardrobe.shoes'), emoji: '鞋履', items: filterItems(wardrobe.shoes) },
            { title: t('wardrobe.accessories'), emoji: '配饰', items: filterItems(wardrobe.accessories) }
        ].filter(s => s.items.length > 0)
    }, [filters.search, filters.seasons, filters.styles, t, wardrobe])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
            <p className="mt-4 text-[var(--muted-foreground)] text-sm">{t('wardrobe.loading')}</p>
        </div>
    )

    return (
        <div className="animate-fade-in pb-28 md:pb-12">
            {/* Sticky glass filter header */}
            <div className="sticky top-0 z-30">
                <FilterBar onSearch={handleSearch} onFilterChange={handleFilterChange} onOpenSettings={() => setShowSettings(true)} />
            </div>

            <div className="mx-auto max-w-6xl px-5 pt-6 md:px-8">
                {/* Page header */}
                <div className="mb-6">
                    <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">My Collection</p>
                    <h1 className="text-3xl">{t('wardrobe.title')}</h1>
                </div>

                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center text-[var(--muted-foreground)]">
                        <PackageOpen className="mb-3 h-10 w-10" />
                        <p>{t('wardrobe.noMatch')}</p>
                        <p className="mt-1 text-sm">试着调整筛选条件</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {sections.map(section => (
                            <section key={section.title} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-serif text-xl">{section.title}</h2>
                                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--secondary)] px-2 text-xs text-[var(--muted-foreground)]">
                                        {section.items.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {section.items.map(item => (
                                        <div
                                            key={item.id}
                                            className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] bg-[var(--bg-card)] shadow-soft transition-all duration-300 hover:-translate-y-1.5"
                                            onClick={() => navigate(`/clothes/${item.id}`)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault()
                                                    navigate(`/clothes/${item.id}`)
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--secondary)]">
                                                <img
                                                    src={toImageUrl(item.image_url)}
                                                    alt={item.item}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <button
                                                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full glass text-[var(--text-primary)] opacity-0 transition-opacity duration-300 hover:text-clay group-hover:opacity-100 cursor-pointer"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        handleDelete(item.id)
                                                    }}
                                                    title={t('wardrobe.delete')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-2 p-4">
                                                <p className="truncate text-[var(--text-primary)] text-sm">{item.item}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.color_semantics && (
                                                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs tag-champagne">
                                                            {item.color_semantics}
                                                        </span>
                                                    )}
                                                    {item.style_semantics?.slice(0, 1).map(s => (
                                                        <span key={s} className="inline-flex items-center rounded-full px-2.5 py-1 text-xs tag-rose">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={() => {}}
            />
        </div>
    )
}
