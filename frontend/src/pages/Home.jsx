import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings as SettingsIcon, RefreshCw, Sparkles, Droplets, Wind, Thermometer, ChevronLeft, ChevronRight, ArrowRight, MapPin, Plus } from 'lucide-react'
import Settings from '../components/Settings'
import { API_BASE, toImageUrl } from '../utils/api'
import { weatherCodeToEmoji } from '../utils/weatherIcon'
const FALLBACK_LOCATION = '上海, 上海市, 中国'

const formatDate = (locale) => {
    const lang = locale?.startsWith('zh')
        ? 'zh-CN'
        : locale?.startsWith('ja')
            ? 'ja-JP'
            : 'en-US'
    return new Date().toLocaleDateString(lang, {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    })
}

export default function Home() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()

    const [weather, setWeather] = useState(null)
    const [wardrobe, setWardrobe] = useState({ tops: [], bottoms: [], shoes: [], accessories: [] })
    const [horoscope, setHoroscope] = useState(null)
    const [horoscopeInferenceLoading, setHoroscopeInferenceLoading] = useState(false)
    const [defaultLocation, setDefaultLocation] = useState(FALLBACK_LOCATION)
    const [weatherLoading, setWeatherLoading] = useState(true)
    const [wardrobeLoading, setWardrobeLoading] = useState(true)
    const [horoscopeLoading, setHoroscopeLoading] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)

    const carouselItems = useMemo(() => ([
        ...wardrobe.tops.map(item => ({ ...item, category: 'top' })),
        ...wardrobe.bottoms.map(item => ({ ...item, category: 'bottom' })),
        ...wardrobe.shoes.map(item => ({ ...item, category: 'shoes' })),
        ...wardrobe.accessories.map(item => ({ ...item, category: 'accessory' }))
    ]), [wardrobe])

    useEffect(() => {
        if (activeIndex < carouselItems.length) return
        setActiveIndex(0)
    }, [carouselItems.length, activeIndex])

    useEffect(() => {
        if (carouselItems.length <= 1) return undefined
        const timer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % carouselItems.length)
        }, 3500)
        return () => clearInterval(timer)
    }, [carouselItems.length])

    const fetchConfiguredLocation = async () => {
        try {
            const response = await fetch(`${API_BASE}/config`)
            if (!response.ok) {
                return FALLBACK_LOCATION
            }
            const data = await response.json()
            return (data.weather_location || '').trim() || FALLBACK_LOCATION
        } catch {
            return FALLBACK_LOCATION
        }
    }

    const fetchHoroscope = async (location, includeInference = false) => {
        const response = await fetch(
            `${API_BASE}/horoscope/daily?location=${encodeURIComponent(location)}&include_inference=${includeInference}`
        )
        if (!response.ok) return null
        return response.json()
    }

    const runHoroscopeInference = async (location) => {
        setHoroscopeInferenceLoading(true)
        try {
            const inferred = await fetchHoroscope(location, true)
            if (inferred) {
                setHoroscope(inferred)
            }
        } catch (error) {
            console.error('Failed to fetch horoscope inference:', error)
        } finally {
            setHoroscopeInferenceLoading(false)
        }
    }

    const fetchDashboard = async (location = defaultLocation) => {
        setWeatherLoading(true)
        setWardrobeLoading(true)
        setHoroscopeLoading(true)

        const weatherTask = (async () => {
            try {
                const weatherRes = await fetch(`${API_BASE}/weather?location=${encodeURIComponent(location)}`)
                if (weatherRes.ok) {
                    setWeather(await weatherRes.json())
                }
            } catch (error) {
                console.error('Failed to fetch weather:', error)
            } finally {
                setWeatherLoading(false)
            }
        })()

        const wardrobeTask = (async () => {
            try {
                const wardrobeRes = await fetch(`${API_BASE}/wardrobe`)
                if (wardrobeRes.ok) {
                    const data = await wardrobeRes.json()
                    setWardrobe({
                        tops: data.tops || [],
                        bottoms: data.bottoms || [],
                        shoes: data.shoes || [],
                        accessories: data.accessories || []
                    })
                }
            } catch (error) {
                console.error('Failed to fetch wardrobe:', error)
            } finally {
                setWardrobeLoading(false)
            }
        })()

        const horoscopeTask = (async () => {
            try {
                const horoscopeData = await fetchHoroscope(location, false)
                if (horoscopeData) {
                    setHoroscope(horoscopeData)
                    const shouldInfer = horoscopeData.llm_status === 'pending'
                    if (horoscopeData.is_configured && shouldInfer) {
                        void runHoroscopeInference(location)
                    } else {
                        setHoroscopeInferenceLoading(false)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch horoscope:', error)
            } finally {
                setHoroscopeLoading(false)
            }
        })()

        await Promise.allSettled([weatherTask, wardrobeTask, horoscopeTask])
    }

    useEffect(() => {
        const initializeDashboard = async () => {
            const location = await fetchConfiguredLocation()
            setDefaultLocation(location)
            await fetchDashboard(location)
        }

        void initializeDashboard()
    }, [])

    const handleSettingsSaved = async () => {
        const location = await fetchConfiguredLocation()
        setDefaultLocation(location)
        await fetchDashboard(location)
    }

    const refreshing = weatherLoading || wardrobeLoading || horoscopeLoading || horoscopeInferenceLoading

    const getCategoryLabel = (category) => {
        if (category === 'top') return t('home.categoryTop')
        if (category === 'bottom') return t('home.categoryBottom')
        if (category === 'shoes') return t('home.categoryShoes')
        return t('home.categoryAccessory')
    }

    const currentItem = carouselItems[activeIndex]

    return (
        <div className="px-5 pb-28 pt-8 md:px-8 md:pb-12 max-w-6xl mx-auto w-full">
            {/* Page header — overline + serif title + icon actions */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <p className="mb-1.5 text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                        {formatDate(i18n.language)}
                    </p>
                    <h1 className="text-3xl">{t('home.today')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-champagne cursor-pointer"
                        onClick={() => fetchDashboard()}
                        title={t('home.refresh')}
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-champagne cursor-pointer"
                        onClick={() => setShowSettings(true)}
                        title={t('settings.title')}
                    >
                        <SettingsIcon size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                {/* Weather card — big serif temperature */}
                <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft md:col-span-5">
                    <div
                        className="absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-15"
                        aria-hidden
                    >
                        {weather ? weatherCodeToEmoji(weather.icon) : '🌤'}
                    </div>
                    <div className="relative flex items-center gap-1.5 text-[var(--muted-foreground)]">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-sm">
                            {weatherLoading ? t('home.loading') : (weather?.location || t('home.unknownLocation'))}
                        </span>
                    </div>

                    {weatherLoading ? (
                        <div className="relative mt-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                            <div className="w-4 h-4 border-2 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
                            {t('home.loading')}
                        </div>
                    ) : (
                        <>
                            <div className="relative mt-4 flex items-end gap-2">
                                <span className="font-serif text-6xl leading-none text-[var(--text-primary)]">
                                    {weather ? `${Math.round(weather.temperature)}°` : '--'}
                                </span>
                                <span className="mb-2 text-[var(--muted-foreground)]">
                                    {weather?.condition || t('home.unknownWeather')}
                                </span>
                            </div>
                            <div className="relative mt-6 grid grid-cols-3 gap-2">
                                <WeatherMetric icon={<Thermometer className="h-4 w-4" />} label={t('home.weatherFeelsLike')} value={weather ? `${Math.round(weather.feelsLike)}°` : '--'} />
                                <WeatherMetric icon={<Droplets className="h-4 w-4" />} label={t('home.weatherHumidity')} value={weather ? `${Math.round(weather.humidity)}%` : '--'} />
                                <WeatherMetric icon={<Wind className="h-4 w-4" />} label={t('home.weatherWind')} value={weather?.windScale || '--'} />
                            </div>
                        </>
                    )}
                </section>

                {/* Wardrobe carousel — cover image with overlay */}
                <section className="md:col-span-7">
                    <div className="h-full rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-serif text-lg">{t('home.carouselTitle')}</h3>
                            <button
                                className="flex items-center gap-1 text-sm text-champagne hover:opacity-70 transition-opacity cursor-pointer"
                                onClick={() => navigate('/wardrobe')}
                            >
                                {t('home.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {wardrobeLoading ? (
                            <div className="flex aspect-[16/10] items-center justify-center rounded-3xl bg-[var(--secondary)]/60">
                                <div className="w-6 h-6 border-2 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
                            </div>
                        ) : carouselItems.length === 0 ? (
                            <button
                                onClick={() => navigate('/entry')}
                                className="flex aspect-[16/10] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--secondary)]/40 text-[var(--muted-foreground)] transition-colors hover:text-champagne cursor-pointer"
                            >
                                <Plus className="mb-2 h-8 w-8" />
                                <span className="text-sm">{t('home.emptyWardrobe')}</span>
                                <span className="mt-1 flex items-center gap-1 text-xs text-champagne">
                                    {t('home.goEntry')} <ArrowRight className="h-3 w-3" />
                                </span>
                            </button>
                        ) : (
                            <div>
                                <div className="relative overflow-hidden rounded-3xl bg-[var(--secondary)]">
                                    {currentItem && (
                                        <div
                                            key={currentItem.id}
                                            className="relative aspect-[16/10] cursor-pointer transition-opacity duration-500"
                                            onClick={() => navigate(`/clothes/${currentItem.id}`)}
                                        >
                                            <img
                                                src={toImageUrl(currentItem.image_url)}
                                                alt={currentItem.item}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs tag-champagne">
                                                        {getCategoryLabel(currentItem.category)}
                                                    </span>
                                                </div>
                                                <p className="font-serif text-xl text-white">{currentItem.item}</p>
                                                {currentItem.description && (
                                                    <p className="mt-0.5 text-sm text-white/80 line-clamp-1">{currentItem.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {carouselItems.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : carouselItems.length - 1))}
                                                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full glass text-[var(--text-primary)] cursor-pointer"
                                                aria-label={t('home.previous')}
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setActiveIndex(prev => (prev < carouselItems.length - 1 ? prev + 1 : 0))}
                                                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full glass text-[var(--text-primary)] cursor-pointer"
                                                aria-label={t('home.next')}
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {carouselItems.length > 1 && (
                                    <div className="mt-4 flex justify-center gap-1.5">
                                        {carouselItems.map((_, idx) => (
                                            <button
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                                    idx === activeIndex ? 'w-6 bg-champagne' : 'w-1.5 bg-[var(--border)]'
                                                }`}
                                                onClick={() => setActiveIndex(idx)}
                                                aria-label={`${t('home.slide')} ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Horoscope card — warm champagne tint */}
                <section className="md:col-span-12">
                    <div className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-rose)_22%,transparent)] text-champagne">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <span className="font-serif text-lg">{t('home.horoscopeTitle')}</span>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                                {horoscope?.zodiac_name || t('home.unknownZodiac')}
                            </span>
                        </div>

                        {horoscopeLoading ? (
                            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                <div className="w-4 h-4 border-2 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
                                {t('home.loading')}
                            </div>
                        ) : (
                            <>
                                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                                    {horoscope?.summary || t('home.horoscopeFallback')}
                                </p>

                                <div className="mt-5 grid grid-cols-3 gap-2">
                                    <HoroscopeCell label={t('home.mood')} value={horoscope?.mood || '--'} />
                                    <HoroscopeCell label={t('home.luckyColor')} value={horoscope?.lucky_color || '--'} />
                                    <HoroscopeCell label={t('home.luckyNumber')} value={horoscope?.lucky_number || '--'} />
                                </div>

                                {horoscope?.suggestion && (
                                    <div className="mt-4 rounded-2xl bg-[color-mix(in_srgb,var(--accent-champagne)_10%,transparent)] p-3">
                                        <p className="text-sm text-[var(--text-primary)]">✨ {horoscope.suggestion}</p>
                                    </div>
                                )}

                                {horoscope?.llm_reasoning && (
                                    <div className="mt-3 rounded-2xl bg-[var(--secondary)]/60 p-3">
                                        <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{t('home.llmReasoningTitle')}</div>
                                        {horoscopeInferenceLoading ? (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                <div className="w-4 h-4 border-2 border-[var(--border)] border-t-champagne rounded-full animate-spin" />
                                                {t('home.llmReasoningLoading')}
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                                                {horoscope.llm_reasoning}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {horoscope && !horoscope.is_configured && (
                                    <button
                                        className="mt-4 w-full rounded-full bg-champagne py-2.5 text-sm text-white shadow-soft hover:opacity-90 cursor-pointer transition-opacity"
                                        onClick={() => setShowSettings(true)}
                                    >
                                        {t('home.setZodiac')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>

            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={handleSettingsSaved}
            />
        </div>
    )
}

function WeatherMetric({ icon, label, value }) {
    return (
        <div className="rounded-2xl bg-[var(--secondary)]/60 p-3 text-center">
            <div className="mb-1 flex justify-center text-champagne">{icon}</div>
            <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className="text-sm text-[var(--text-primary)]">{value}</p>
        </div>
    )
}

function HoroscopeCell({ label, value }) {
    return (
        <div className="rounded-2xl bg-[var(--secondary)]/60 p-3 text-center">
            <p className="mb-1 text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className="truncate text-sm text-[var(--text-primary)]">{value}</p>
        </div>
    )
}
