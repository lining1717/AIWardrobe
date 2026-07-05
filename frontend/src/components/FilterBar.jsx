import { useEffect, useState } from 'react'
import { Search, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function FilterBar({ onSearch, onFilterChange, onOpenSettings }) {
    const { t } = useTranslation()
    const [searchText, setSearchText] = useState('')
    const [selectedSeasons, setSelectedSeasons] = useState([])
    const [selectedStyles, setSelectedStyles] = useState([])

    const SEASONS = [
        { key: 'spring', label: t('filter.spring') },
        { key: 'summer', label: t('filter.summer') },
        { key: 'autumn', label: t('filter.autumn') },
        { key: 'winter', label: t('filter.winter') }
    ]

    const STYLES = [
        { key: 'casual', label: t('filter.casual') },
        { key: 'formal', label: t('filter.formal') },
        { key: 'sport', label: t('filter.sport') },
        { key: 'business', label: t('filter.business') },
        { key: 'vintage', label: t('filter.vintage') },
        { key: 'minimal', label: t('filter.minimal') },
        { key: 'daily', label: t('filter.daily') },
        { key: 'commute', label: t('filter.commute') }
    ]

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(searchText)
        }, 200)

        return () => clearTimeout(timer)
    }, [searchText, onSearch])

    const toggleSeason = (season) => {
        const newSeasons = selectedSeasons.includes(season)
            ? selectedSeasons.filter(s => s !== season)
            : [...selectedSeasons, season]

        setSelectedSeasons(newSeasons)
        onFilterChange({ seasons: newSeasons, styles: selectedStyles })
    }

    const toggleStyle = (style) => {
        const newStyles = selectedStyles.includes(style)
            ? selectedStyles.filter(s => s !== style)
            : [...selectedStyles, style]

        setSelectedStyles(newStyles)
        onFilterChange({ seasons: selectedSeasons, styles: newStyles })
    }

    const pillClass = (active) =>
        `shrink-0 rounded-full px-4 py-1.5 text-sm transition-all duration-300 border ${
            active
                ? 'bg-champagne text-white border-transparent shadow-soft'
                : 'bg-[var(--bg-card)]/60 text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]'
        }`

    return (
        <div className="glass border-b border-[var(--border)] py-4 space-y-4 top-0">
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                    <input
                        type="text"
                        placeholder={t('wardrobe.searchPlaceholder')}
                        className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)]/70 py-2.5 pl-11 pr-4 outline-none transition-colors focus:border-[var(--accent)]/50 text-sm text-[var(--text-primary)] placeholder:text-[var(--muted-foreground)]"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                {onOpenSettings && (
                    <button
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-champagne cursor-pointer"
                        onClick={onOpenSettings}
                        title={t('settings.title')}
                    >
                        <Settings size={18} />
                    </button>
                )}
            </div>

            <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] whitespace-nowrap uppercase tracking-[0.18em]">{t('filter.season')}</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {SEASONS.map(season => (
                            <button
                                key={season.key}
                                className={pillClass(selectedSeasons.includes(season.label))}
                                onClick={() => toggleSeason(season.label)}
                            >
                                {season.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] whitespace-nowrap uppercase tracking-[0.18em]">{t('filter.style')}</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {STYLES.map(style => (
                            <button
                                key={style.key}
                                className={pillClass(selectedStyles.includes(style.label))}
                                onClick={() => toggleStyle(style.label)}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
