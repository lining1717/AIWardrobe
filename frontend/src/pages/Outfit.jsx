import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'

import { API_BASE, toImageUrl } from '../utils/api'

const CATEGORIES = [
    { key: 'tops', labelKey: 'outfit.top' },
    { key: 'bottoms', labelKey: 'outfit.bottom' },
    { key: 'shoes', labelKey: 'outfit.shoes' }
]

export default function Outfit() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [], accessories: [] })
    const [loading, setLoading] = useState(true)
    const [filterSeason, setFilterSeason] = useState('all')

    const [currentIndices, setCurrentIndices] = useState({
        tops: 0,
        bottoms: 0,
        shoes: 0
    })

    useEffect(() => {
        const controller = new AbortController()
        void fetchWardrobe(controller.signal)
        return () => controller.abort()
    }, [])

    const fetchWardrobe = async (signal) => {
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
                console.error(error)
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }

    const seasonKeywordMap = {
        '春': ['春', 'spring'],
        '夏': ['夏', 'summer'],
        '秋': ['秋', 'autumn', 'fall'],
        '冬': ['冬', 'winter']
    }

    const filterBySeason = (items, category) => {
        if (filterSeason === 'all') return items

        const matched = items.filter(item => {
            const seasons = Array.isArray(item.season_semantics) ? item.season_semantics : []
            if (seasons.length === 0) {
                return category === 'shoes'
            }

            const keywords = seasonKeywordMap[filterSeason] || [filterSeason]
            return seasons.some(season => {
                const normalized = String(season || '').toLowerCase()
                return keywords.some(keyword => normalized.includes(keyword.toLowerCase()))
            })
        })

        if (category === 'shoes' && matched.length === 0 && items.length > 0) {
            return items
        }
        return matched
    }

    const tops = filterBySeason(wardrobe.tops, 'tops')
    const bottoms = filterBySeason(wardrobe.bottoms, 'bottoms')
    const shoes = filterBySeason(wardrobe.shoes, 'shoes')

    useEffect(() => {
        setCurrentIndices(prev => ({
            tops: tops.length > 0 ? Math.min(prev.tops, tops.length - 1) : 0,
            bottoms: bottoms.length > 0 ? Math.min(prev.bottoms, bottoms.length - 1) : 0,
            shoes: shoes.length > 0 ? Math.min(prev.shoes, shoes.length - 1) : 0
        }))
    }, [tops.length, bottoms.length, shoes.length])

    const getItemsByCategory = (category) => {
        if (category === 'tops') return tops
        if (category === 'bottoms') return bottoms
        return shoes
    }

    const getCurrentItem = (category) => {
        const items = getItemsByCategory(category)
        if (!items.length) return null
        return items[currentIndices[category]] || items[0]
    }

    const shiftCategory = (category, direction) => {
        const items = getItemsByCategory(category)
        if (items.length <= 1) return

        setCurrentIndices(prev => {
            const currentIndex = prev[category]
            const nextIndex = direction === 'prev'
                ? (currentIndex > 0 ? currentIndex - 1 : items.length - 1)
                : (currentIndex < items.length - 1 ? currentIndex + 1 : 0)
            return { ...prev, [category]: nextIndex }
        })
    }

    const shuffleOutfit = () => {
        setCurrentIndices({
            tops: tops.length > 0 ? Math.floor(Math.random() * tops.length) : 0,
            bottoms: bottoms.length > 0 ? Math.floor(Math.random() * bottoms.length) : 0,
            shoes: shoes.length > 0 ? Math.floor(Math.random() * shoes.length) : 0
        })
    }

    const seasonFilters = [
        { key: 'all', label: t('outfit.allSeasons') },
        { key: '春', label: t('filter.spring') },
        { key: '夏', label: t('filter.summer') },
        { key: '秋', label: t('filter.autumn') },
        { key: '冬', label: t('filter.winter') }
    ]

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
        </div>
    )

    const topItem = getCurrentItem('tops')
    const bottomItem = getCurrentItem('bottoms')
    const shoesItem = getCurrentItem('shoes')

    return (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 pt-8 pb-28 md:pb-12">
            <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <p className="mb-1.5 text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Mix & Match</p>
                        <h1 className="font-serif text-3xl">{t('outfit.title')}</h1>
                    </div>
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-champagne cursor-pointer"
                        onClick={shuffleOutfit}
                        title={t('outfit.shuffle')}
                    >
                        <Shuffle size={18} />
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
                    {seasonFilters.map(s => (
                        <button
                            key={s.key}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300 border ${
                                filterSeason === s.key
                                    ? 'bg-champagne text-white border-transparent shadow-soft'
                                    : 'bg-[var(--bg-card)]/60 text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]'
                            }`}
                            onClick={() => setFilterSeason(s.key)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                {/* Preview stack */}
                <section className="rounded-[1.75rem] bg-[var(--bg-card)] p-5 shadow-soft lg:col-span-7">
                    <div className="rounded-3xl border border-[var(--border)] bg-[var(--secondary)]/40 overflow-hidden p-3">
                        <div className="h-[44vh] min-h-[340px] max-h-[560px] grid grid-rows-[44%_34%_22%] gap-2">
                            <OutfitSlot item={topItem} emptyLabel={t('outfit.noItems', { label: t('outfit.top') })} onClick={() => topItem && navigate(`/clothes/${topItem.id}`)} />
                            <OutfitSlot item={bottomItem} emptyLabel={t('outfit.noItems', { label: t('outfit.bottom') })} onClick={() => bottomItem && navigate(`/clothes/${bottomItem.id}`)} />
                            <OutfitSlot item={shoesItem} emptyLabel={t('outfit.noItems', { label: t('outfit.shoes') })} onClick={() => shoesItem && navigate(`/clothes/${shoesItem.id}`)} />
                        </div>
                    </div>
                </section>

                {/* Category pickers */}
                <aside className="lg:col-span-5 grid grid-cols-1 gap-3">
                    {CATEGORIES.map((category) => {
                        const items = getItemsByCategory(category.key)
                        const item = getCurrentItem(category.key)
                        const currentIndex = currentIndices[category.key] || 0
                        return (
                            <article key={category.key} className="rounded-[1.5rem] bg-[var(--bg-card)] p-4 shadow-soft">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-[0.18em]">{t(category.labelKey)}</div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] disabled:opacity-40 hover:text-champagne transition-colors cursor-pointer"
                                            onClick={() => shiftCategory(category.key, 'prev')}
                                            disabled={items.length <= 1}
                                            type="button"
                                        >
                                            <ChevronLeft size={15} />
                                        </button>
                                        <span className="text-xs text-[var(--muted-foreground)] min-w-[3rem] text-center">
                                            {items.length ? `${currentIndex + 1}/${items.length}` : '--'}
                                        </span>
                                        <button
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] disabled:opacity-40 hover:text-champagne transition-colors cursor-pointer"
                                            onClick={() => shiftCategory(category.key, 'next')}
                                            disabled={items.length <= 1}
                                            type="button"
                                        >
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="w-full rounded-2xl bg-[var(--secondary)]/60 h-40 lg:h-44 p-3 flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                                    onClick={() => item && navigate(`/clothes/${item.id}`)}
                                    type="button"
                                    disabled={!item}
                                >
                                    {item ? (
                                        <img
                                            src={toImageUrl(item.image_url)}
                                            alt={item.item}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-[var(--muted-foreground)] text-center">{t('outfit.noItems', { label: t(category.labelKey) })}</span>
                                    )}
                                </button>
                            </article>
                        )
                    })}
                </aside>
            </div>
        </div>
    )
}

function OutfitSlot({ item, emptyLabel, onClick }) {
    return (
        <div
            className="rounded-2xl bg-[var(--secondary)] p-2 flex items-center justify-center cursor-pointer hover:bg-[var(--secondary)]/70 transition-colors"
            onClick={onClick}
        >
            {item ? (
                <img src={toImageUrl(item.image_url)} alt={item.item} className="w-full h-full object-contain" />
            ) : (
                <span className="text-xs text-[var(--muted-foreground)]">{emptyLabel}</span>
            )}
        </div>
    )
}
