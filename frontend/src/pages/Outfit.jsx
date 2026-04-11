import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'

import { API_BASE, toImageUrl } from '../utils/api'

const CATEGORY_META = {
    tops: { key: 'tops', labelKey: 'outfit.top' },
    bottoms: { key: 'bottoms', labelKey: 'outfit.bottom' },
    shoes: { key: 'shoes', labelKey: 'outfit.shoes' }
}

export default function Outfit() {
    const { t } = useTranslation()
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [], accessories: [] })
    const [loading, setLoading] = useState(true)
    const [filterSeason, setFilterSeason] = useState('all')
    const [activeCategory, setActiveCategory] = useState('tops')

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

    const activeItems = getItemsByCategory(activeCategory)
    const activeIndex = currentIndices[activeCategory] || 0

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-700 border-t-accent rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="bg-[var(--bg-primary)] px-3 sm:px-4 lg:px-0 pt-3 pb-2 flex flex-col max-w-6xl mx-auto w-full">
            <header className="shrink-0 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[22px] font-serif font-bold tracking-tight text-[var(--text-primary)]">{t('outfit.title')}</h2>
                    <button
                        className="btn-icon bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg shadow-sm"
                        onClick={shuffleOutfit}
                        title={t('outfit.shuffle')}
                    >
                        <Shuffle size={18} className="group-active:-rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                    {seasonFilters.map(s => (
                        <button
                            key={s.key}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                                filterSeason === s.key
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            onClick={() => setFilterSeason(s.key)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid gap-3 lg:grid-cols-12">
                <section className="card lg:col-span-8 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60">
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wide">Look Preview</div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t(`outfit.${activeCategory === 'tops' ? 'top' : activeCategory === 'bottoms' ? 'bottom' : 'shoes'}`)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="btn-icon border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-40"
                                onClick={() => shiftCategory(activeCategory, 'prev')}
                                disabled={activeItems.length <= 1}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs text-zinc-500 min-w-[3.5rem] text-center">
                                {activeItems.length ? `${activeIndex + 1} / ${activeItems.length}` : '--'}
                            </span>
                            <button
                                className="btn-icon border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-40"
                                onClick={() => shiftCategory(activeCategory, 'next')}
                                disabled={activeItems.length <= 1}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="p-3 sm:p-4 grid gap-2 bg-zinc-50/40 dark:bg-zinc-900/30">
                        {['tops', 'bottoms', 'shoes'].map((category) => {
                            const item = getCurrentItem(category)
                            const isActive = activeCategory === category
                            return (
                                <button
                                    key={category}
                                    className={`w-full border rounded-xl transition-colors text-left ${isActive
                                        ? 'border-accent bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                                        }`}
                                    onClick={() => setActiveCategory(category)}
                                    type="button"
                                >
                                    {!item ? (
                                        <div className="h-24 flex items-center justify-center text-xs text-zinc-400">
                                            {t('outfit.noItems', { label: t(CATEGORY_META[category].labelKey) })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-[72px_1fr] gap-3 p-2.5 items-center">
                                            <div className="h-[72px] rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1.5 flex items-center justify-center">
                                                <img
                                                    src={toImageUrl(item.image_url)}
                                                    alt={item.item}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] text-zinc-500 uppercase tracking-wide">{t(CATEGORY_META[category].labelKey)}</div>
                                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.item}</div>
                                                {item.description && (
                                                    <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </section>

                <aside className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-2">
                    {['tops', 'bottoms', 'shoes'].map((category) => {
                        const item = getCurrentItem(category)
                        const isActive = activeCategory === category
                        return (
                            <button
                                key={category}
                                className={`card p-2.5 text-left transition-all ${isActive ? 'ring-2 ring-accent border-accent' : ''}`}
                                onClick={() => setActiveCategory(category)}
                                type="button"
                            >
                                <div className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wide truncate">{t(CATEGORY_META[category].labelKey)}</div>
                                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 h-24 lg:h-28 p-2 flex items-center justify-center">
                                    {item ? (
                                        <img
                                            src={toImageUrl(item.image_url)}
                                            alt={item.item}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-zinc-400 text-center">{t('outfit.noItems', { label: t(CATEGORY_META[category].labelKey) })}</span>
                                    )}
                                </div>
                                {item && <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 truncate">{item.item}</div>}
                            </button>
                        )
                    })}
                </aside>
            </div>
        </div>
    )
}
