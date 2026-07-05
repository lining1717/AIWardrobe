import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Sparkles, RefreshCw, Mic, MicOff, MapPin, RotateCcw, ShoppingBag, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useRecommendation } from '../contexts/RecommendationContext'

import { toImageUrl } from '../utils/api'

export default function Recommendation() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const {
        loading,
        error,
        weather,
        horoscope,
        temperatureRule,
        recommendation,
        outfitSummary,
        selectionReasons,
        suggestedTop,
        suggestedBottom,
        suggestedShoes,
        suggestedAccessories,
        purchaseSuggestions,
        goalRaw,
        goalNormalized,
        mode,
        selectedCity,
        fetchRecommendation
    } = useRecommendation()

    const [displayedRecommendation, setDisplayedRecommendation] = useState('')
    const [goalInput, setGoalInput] = useState('')
    const [selectedMode, setSelectedMode] = useState('balanced')
    const [isListening, setIsListening] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(false)
    const [speechError, setSpeechError] = useState('')
    const recognitionRef = useRef(null)

    useEffect(() => {
        if (!recommendation) {
            setDisplayedRecommendation('')
            return
        }

        const chars = Array.from(recommendation)
        const step = 4
        let index = 0
        setDisplayedRecommendation('')

        const timer = setInterval(() => {
            if (index < chars.length) {
                index = Math.min(index + step, chars.length)
                setDisplayedRecommendation(chars.slice(0, index).join(''))
            } else {
                clearInterval(timer)
            }
        }, 45)

        return () => clearInterval(timer)
    }, [recommendation])

    useEffect(() => {
        if (mode) {
            setSelectedMode(mode)
        }
    }, [mode])

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            setSpeechSupported(false)
            return
        }
        setSpeechSupported(true)

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
            const transcript = event.results?.[0]?.[0]?.transcript || ''
            if (transcript.trim()) {
                setGoalInput(transcript.trim())
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.onerror = (event) => {
            if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
                setSpeechError(t('recommendation.voicePermissionDenied'))
            } else if (event?.error === 'no-speech') {
                setSpeechError(t('recommendation.voiceNoSpeech'))
            } else {
                setSpeechError(t('recommendation.voiceError'))
            }
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            try {
                recognition.stop()
            } catch {
                // noop
            }
            recognitionRef.current = null
        }
    }, [t])

    const speechLocale = () => {
        if (i18n.language.startsWith('ja')) {
            return 'ja-JP'
        }
        if (i18n.language.startsWith('en')) {
            return 'en-US'
        }
        return 'zh-CN'
    }

    const toggleListening = () => {
        if (loading) {
            return
        }
        const recognition = recognitionRef.current
        if (!recognition || !speechSupported) {
            setSpeechError(t('recommendation.voiceUnsupported'))
            return
        }

        if (isListening) {
            recognition.stop()
            return
        }

        setSpeechError('')
        recognition.lang = speechLocale()
        try {
            recognition.start()
            setIsListening(true)
        } catch {
            setSpeechError(t('recommendation.voiceError'))
            setIsListening(false)
        }
    }

    const refreshRecommendation = () => {
        if (loading) {
            return
        }
        void fetchRecommendation(selectedCity.id, selectedCity.name, goalInput, selectedMode)
    }

    const generateRecommendation = () => {
        if (loading) {
            return
        }
        void fetchRecommendation(selectedCity.id, selectedCity.name, goalInput, selectedMode)
    }

    const getWeatherIcon = (icon) => {
        const iconMap = {
            '100': '☀️', '101': '☁️', '102': '⛅', '103': '⛅', '104': '☁️',
            '150': '🌙', '300': '🌦️', '301': '⛈️', '302': '⛈️', '303': '⛈️',
            '304': '🌨️', '305': '🌧️', '306': '🌧️', '307': '🌧️', '308': '🌧️',
            '309': '🌦️', '310': '⛈️', '311': '⛈️', '312': '⛈️', '313': '🌨️',
            '314': '🌧️', '315': '🌧️', '316': '🌧️', '317': '⛈️', '318': '⛈️',
            '399': '🌧️', '400': '🌨️', '401': '🌨️', '402': '❄️', '403': '❄️',
            '404': '🌨️', '405': '🌨️', '406': '🌨️', '407': '❄️', '408': '🌨️',
            '409': '❄️', '410': '❄️', '499': '❄️', '500': '🌫️', '501': '🌫️',
            '502': '🌫️', '503': '🌪️', '504': '🌪️', '507': '🌪️', '508': '🌪️',
            '509': '🌫️', '510': '🌫️', '511': '🌫️', '512': '🌫️', '513': '🌫️',
            '514': '🌫️', '515': '🌫️'
        }
        return iconMap[icon] || '🌤️'
    }

    const renderClothingCard = (item, label, reason) => {
        if (!item) {
            return null
        }
        const reasonText = reason || t('recommendation.reasonFallback')
        return (
            <div className="overflow-hidden rounded-[1.5rem] bg-[var(--bg-card)] shadow-soft transition-all duration-300 hover:-translate-y-1">
                <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--secondary)]/50">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.18em]">{label}</span>
                </div>
                <div className="aspect-square bg-[var(--secondary)]/40 p-4 border-b border-[var(--border)] relative overflow-hidden">
                    {item.image_url ? (
                        <img
                            src={toImageUrl(item.image_url)}
                            alt={item.item}
                            className="w-full h-full object-contain drop-shadow-sm"
                        />
                    ) : (
                        <div className="w-full h-full rounded-2xl bg-[var(--secondary)]" />
                    )}
                </div>
                <div className="p-4">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{item.item}</div>
                    {item.description && (
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{item.description}</div>
                    )}
                    <div className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">{reasonText}</div>
                </div>
            </div>
        )
    }

    const modes = [
        { key: 'balanced', label: t('recommendation.mode.balanced'), desc: t('recommendation.modeHint.balanced') },
        { key: 'goal_first', label: t('recommendation.mode.goal_first'), desc: t('recommendation.modeHint.goal_first') },
        { key: 'wardrobe_first', label: t('recommendation.mode.wardrobe_first'), desc: t('recommendation.modeHint.wardrobe_first') }
    ]

    return (
        <div className="flex flex-col pt-8 pb-28 md:pb-12 relative max-w-5xl mx-auto w-full px-5 md:px-8">
            {!weather && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-champagne)_20%,transparent)] text-champagne">
                        <Sparkles size={28} />
                    </div>
                    <h1 className="font-serif text-3xl mb-2">{t('recommendation.getTitle')}</h1>
                    <p className="text-[var(--muted-foreground)] text-sm mb-8 leading-relaxed max-w-sm">{t('recommendation.description')}</p>

                    <div className="w-full max-w-md space-y-4 text-left">
                        <div>
                            <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.18em] mb-2">
                                {t('recommendation.modeLabel')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {modes.map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        className={`rounded-[1.25rem] border p-4 text-left transition-all duration-300 ${
                                            selectedMode === option.key
                                                ? 'border-[var(--accent)]/50 bg-[var(--bg-card)] shadow-soft'
                                                : 'border-[var(--border)] bg-[var(--bg-card)]/50 hover:border-[var(--accent)]/30'
                                        }`}
                                        disabled={loading}
                                        onClick={() => setSelectedMode(option.key)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
                                            {selectedMode === option.key && <Check className="h-3.5 w-3.5 text-champagne" />}
                                        </div>
                                        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{option.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.18em] mb-2">
                                {t('recommendation.goalLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full rounded-full border border-[var(--border)] bg-[var(--input-background)] py-3 pl-5 pr-14 outline-none focus:border-[var(--accent)]/50 text-sm text-[var(--text-primary)] placeholder:text-[var(--muted-foreground)]"
                                    value={goalInput}
                                    onChange={(event) => setGoalInput(event.target.value)}
                                    placeholder={t('recommendation.goalPlaceholder')}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--secondary)] text-champagne hover:opacity-80 transition-opacity"
                                    onClick={toggleListening}
                                    disabled={!speechSupported || loading}
                                    title={speechSupported
                                        ? (isListening ? t('recommendation.voiceStop') : t('recommendation.voiceStart'))
                                        : t('recommendation.voiceUnsupported')}
                                >
                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                            </div>
                            <div className="mt-2 text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                                {!speechSupported
                                    ? t('recommendation.voiceUnsupported')
                                    : loading
                                        ? t('recommendation.voiceBusy')
                                        : (isListening ? t('recommendation.voiceListening') : t('recommendation.goalHint'))}
                            </div>
                            {speechError && (
                                <div className="mt-1 text-[11px] text-clay leading-relaxed">
                                    {speechError}
                                </div>
                            )}
                        </div>

                        <button
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-champagne py-3.5 text-white shadow-soft-lg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                            onClick={generateRecommendation}
                            disabled={loading}
                        >
                            <Sparkles size={18} />
                            <span className="font-medium tracking-wide">{t('recommendation.generate')}</span>
                        </button>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                            <MapPin className="h-3 w-3" />
                            {t('recommendation.currentLocation')}: {selectedCity.name}
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                    <div className="relative mb-6 h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-champagne animate-spin" />
                        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[var(--accent-rose)] animate-spin" style={{ animationDirection: 'reverse' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 animate-pulse text-champagne" />
                        </div>
                    </div>
                    <h2 className="font-serif text-lg">{t('recommendation.aiLoading')}</h2>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('recommendation.description')}</p>
                </div>
            )}

            {!loading && weather && (
                <div className="flex-1 space-y-5 animate-fade-in">
                    {/* Page header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Your look today</p>
                            <h1 className="font-serif text-3xl">{t('recommendation.title')}</h1>
                        </div>
                        <button
                            className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-4 py-2 text-sm shadow-soft hover:-translate-y-0.5 transition-all cursor-pointer"
                            onClick={refreshRecommendation}
                            title={t('recommendation.regenerate')}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {t('recommendation.regenerate')}
                        </button>
                    </div>

                    {error && (
                        <div className="rounded-[1.5rem] border border-[color-mix(in_srgb,var(--accent-clay)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-clay)_8%,var(--bg-card))] p-4 text-xs text-clay">
                            {error}
                        </div>
                    )}

                    {/* Weather hero — champagne→rose gradient */}
                    <div
                        className="relative overflow-hidden rounded-[1.75rem] p-6 text-white shadow-soft-lg"
                        style={{ background: 'linear-gradient(135deg, #b99872, #d9a7a2)' }}
                    >
                        <div className="absolute -right-6 -top-10 select-none text-[10rem] leading-none opacity-20" aria-hidden>
                            {getWeatherIcon(weather.icon)}
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-1.5 text-white/85">
                                <MapPin className="h-3.5 w-3.5" /> {weather.location || selectedCity.name} · {weather.condition}
                            </div>
                            <div className="mt-2 font-serif text-6xl leading-none">{Math.round(weather.temperature)}°</div>
                            <div className="mt-4 flex gap-6 text-sm text-white/85">
                                <span>{t('recommendation.feelsLike')} {Math.round(weather.feelsLike)}°</span>
                                <span>{t('recommendation.humidity')} {weather.humidity}%</span>
                                <span>{t('recommendation.wind')} {weather.windScale}{t('recommendation.windLevel')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Horoscope grid */}
                    {horoscope && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <HoroscopeStat label={t('recommendation.horoscopeSign')} value={horoscope.zodiac_name || t('home.unknownZodiac')} />
                            <HoroscopeStat label={t('recommendation.mood')} value={horoscope.mood} />
                            <HoroscopeStat label={t('recommendation.luckyColor')} value={horoscope.lucky_color} />
                            <HoroscopeStat label={t('recommendation.luckyNumber')} value={horoscope.lucky_number} />
                            <div className="col-span-2 sm:col-span-4 rounded-[1.5rem] bg-[var(--bg-card)] p-4 shadow-soft">
                                <p className="mb-1 text-xs text-[var(--muted-foreground)]">{t('recommendation.horoscopeSummary')}</p>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{horoscope.summary}</p>
                            </div>
                        </div>
                    )}

                    {/* Goal + temperature rule */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {temperatureRule && (
                            <div className="rounded-[1.5rem] bg-[var(--bg-card)] p-5 shadow-soft">
                                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{t('recommendation.temperatureRule')}</p>
                                <p className="text-[var(--text-primary)]">{temperatureRule.label}</p>
                                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{temperatureRule.advice}</p>
                                {temperatureRule.allowed_seasons?.length > 0 && (
                                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">{t('recommendation.allowedSeasons')}: {temperatureRule.allowed_seasons.join(' / ')}</p>
                                )}
                            </div>
                        )}
                        {(goalRaw || goalNormalized) && (
                            <div className="rounded-[1.5rem] bg-[var(--bg-card)] p-5 shadow-soft">
                                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{t('recommendation.goalUsed')}</p>
                                <p className="text-[var(--text-primary)]">{goalRaw || goalNormalized}</p>
                                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{modes.find(m => m.key === selectedMode)?.label}</p>
                            </div>
                        )}
                    </div>

                    {/* AI text with typewriter */}
                    <div>
                        <div className="flex items-center justify-between pl-1 mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-champagne" />
                                <h3 className="font-serif text-lg">{t('recommendation.aiTitle')}</h3>
                            </div>
                        </div>
                        <div className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft">
                            <div className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed font-serif tracking-wide">
                                <ReactMarkdown>{displayedRecommendation}</ReactMarkdown>
                                {displayedRecommendation.length < recommendation.length && (
                                    <span className="inline-block w-1.5 h-4 ml-1 bg-champagne/70 animate-pulse align-middle rounded-sm" />
                                )}
                            </div>
                        </div>
                    </div>

                    {outfitSummary && (
                        <div className="rounded-[1.5rem] bg-[color-mix(in_srgb,var(--accent-champagne)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent-champagne)_25%,transparent)] p-4 text-sm text-[var(--text-primary)]">
                            <span className="font-semibold text-champagne">{t('recommendation.outfitSummary')}:</span> {outfitSummary}
                        </div>
                    )}

                    {/* Suggested combo */}
                    {(suggestedTop || suggestedBottom || suggestedShoes) && (
                        <div className="space-y-4 pt-1">
                            <h3 className="font-serif text-lg pl-1">{t('recommendation.suggestedCombo')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {renderClothingCard(suggestedTop, t('recommendation.topWear'), selectionReasons?.top)}
                                {renderClothingCard(suggestedBottom, t('recommendation.bottomWear'), selectionReasons?.bottom)}
                                {renderClothingCard(suggestedShoes, t('recommendation.shoesWear'), selectionReasons?.shoes)}
                            </div>
                        </div>
                    )}

                    {/* Accessories */}
                    {suggestedAccessories.length > 0 && (
                        <div className="rounded-[1.75rem] bg-[var(--bg-card)] p-6 shadow-soft space-y-3">
                            <h3 className="font-serif text-lg mb-2">{t('recommendation.accessories')}</h3>
                            {suggestedAccessories.map((accessory, index) => (
                                <div key={`${accessory.name}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl bg-[var(--secondary)]/50 p-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{accessory.name}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">{accessory.reason}</p>
                                        {accessory.item?.image_url && (
                                            <div className="mt-3 h-20 bg-[var(--secondary)] rounded-xl p-2 inline-block">
                                                <img
                                                    src={toImageUrl(accessory.item.image_url)}
                                                    alt={accessory.name}
                                                    className="h-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs ${
                                        accessory.from_wardrobe ? 'tag-sage' : 'tag-clay'
                                    }`}>
                                        {accessory.from_wardrobe ? t('recommendation.fromWardrobe') : t('recommendation.needBuy')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Purchase suggestions */}
                    {purchaseSuggestions.length > 0 && (
                        <div className="rounded-[1.75rem] border border-[color-mix(in_srgb,var(--accent-clay)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-clay)_8%,var(--bg-card))] p-6 shadow-soft space-y-3">
                            <div className="flex items-center gap-2 text-clay mb-2">
                                <ShoppingBag className="h-4 w-4" />
                                <span className="text-sm font-medium">{t('recommendation.purchaseFallback')}</span>
                            </div>
                            {purchaseSuggestions.map((suggestion, index) => (
                                <div key={`${suggestion.category}-${index}`}>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{suggestion.title}</p>
                                    <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">{suggestion.reason}</p>
                                    {suggestion.keywords?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {suggestion.keywords.map(k => (
                                                <span key={k} className="inline-flex items-center rounded-full px-2.5 py-1 text-xs tag-clay">{k}</span>
                                            ))}
                                        </div>
                                    )}
                                    {suggestion.horoscope_hint && (
                                        <p className="mt-2 text-xs text-champagne">✨ {suggestion.horoscope_hint}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                        <button className="btn-secondary" onClick={refreshRecommendation}>
                            <RefreshCw size={15} />
                            {t('recommendation.regenerate')}
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/outfit')}>
                            <Sparkles size={15} />
                            {t('recommendation.goOutfit')}
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/wardrobe')}>
                            <Sparkles size={15} />
                            {t('recommendation.goWardrobe')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function HoroscopeStat({ label, value }) {
    return (
        <div className="rounded-2xl bg-[var(--bg-card)] p-4 text-center shadow-soft">
            <p className="mb-1 text-xs text-[var(--muted-foreground)]">{label}</p>
            <p className="truncate text-sm text-[var(--text-primary)]">{value || '--'}</p>
        </div>
    )
}
