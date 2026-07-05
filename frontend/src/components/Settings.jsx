import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Globe, Sparkles, MapPin } from 'lucide-react'
import { API_BASE } from '../utils/api'

const LANGUAGES = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' }
]

const ZODIAC_SIGNS = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces'
]

const DEFAULT_LOCATION = '上海, 上海市, 中国'
const LOCATION_ID_REGEX = /^\d{9}$/
const COORDINATE_LOCATION_REGEX = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/
const LOCATION_PART_SEPARATOR_REGEX = /[，,]+/
const LOCATION_PRESETS = [
    '上海, 上海市, 中国',
    '北京, 北京市, 中国',
    '南京, 江苏, 中国',
    '杭州, 浙江, 中国',
    '广州, 广东, 中国',
    '深圳, 广东, 中国'
]

const formatLocationCandidate = (city) => {
    const name = (city?.name || '').trim()
    const state = (city?.adm1 || city?.adm2 || '').trim()
    const country = (city?.country || '').trim()
    if (!name || !state || !country) return null

    const value = `${name}, ${state}, ${country}`
    const labelParts = [city.name]
    if (city.adm2 && city.adm2 !== city.name) labelParts.push(city.adm2)
    if (city.adm1 && city.adm1 !== city.adm2 && city.adm1 !== city.name) labelParts.push(city.adm1)
    if (city.country) labelParts.push(city.country)

    return {
        value,
        label: labelParts.filter(Boolean).join(' · ')
    }
}

const isCompleteLocationInput = (location) => {
    const raw = (location || '').trim()
    if (!raw) return false
    if (LOCATION_ID_REGEX.test(raw) || COORDINATE_LOCATION_REGEX.test(raw)) return true

    const parts = raw
        .split(LOCATION_PART_SEPARATOR_REGEX)
        .map(part => part.trim())
        .filter(Boolean)

    return parts.length >= 3
}

const Settings = ({ isOpen, onClose, onSave }) => {
    const { t, i18n } = useTranslation()
    const { theme, toggleTheme } = useTheme()
    const [config, setConfig] = useState({
        api_base: 'https://api.openai.com/v1',
        api_key: '',
        model: 'gpt-4o',
        removebg_api_key: '',
        bg_removal_method: 'local',
        tryon_provider: 'disabled',
        tryon_api_url: '',
        tryon_api_key: '',
        tryon_model: '',
        weather_location: DEFAULT_LOCATION,
        zodiac_sign: ''
    })
    const [models, setModels] = useState([])
    const [loading, setLoading] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState(null)
    const [hasExistingKey, setHasExistingKey] = useState(false)
    const [hasRemoveBgKey, setHasRemoveBgKey] = useState(false)
    const [hasTryonApiKey, setHasTryonApiKey] = useState(false)
    const [showModelSelect, setShowModelSelect] = useState(false)
    const [locationSuggestions, setLocationSuggestions] = useState([])
    const [searchingLocations, setSearchingLocations] = useState(false)
    const [showLocationDropdown, setShowLocationDropdown] = useState(false)
    const [installingRembg, setInstallingRembg] = useState(false)
    const locationPickerRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            const controller = new AbortController()
            void fetchConfig(controller.signal)
            document.body.style.overflow = 'hidden'
            return () => {
                controller.abort()
                document.body.style.overflow = ''
            }
        }

        document.body.style.overflow = ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    useEffect(() => {
        if (!showLocationDropdown) {
            return
        }

        const handleOutsidePointerDown = (event) => {
            if (locationPickerRef.current && !locationPickerRef.current.contains(event.target)) {
                setShowLocationDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleOutsidePointerDown)
        return () => {
            document.removeEventListener('mousedown', handleOutsidePointerDown)
        }
    }, [showLocationDropdown])

    useEffect(() => {
        if (!showLocationDropdown) {
            return
        }

        const query = (config.weather_location || '').trim()
        const filteredPresets = LOCATION_PRESETS
            .filter(location => !query || location.toLowerCase().includes(query.toLowerCase()))
            .map(location => ({ value: location, label: location }))

        const controller = new AbortController()
        const timer = setTimeout(async () => {
            if (!query) {
                setLocationSuggestions(filteredPresets)
                setSearchingLocations(false)
                return
            }

            setSearchingLocations(true)
            try {
                const response = await fetch(`${API_BASE}/cities?query=${encodeURIComponent(query)}&limit=10`, {
                    signal: controller.signal
                })
                if (!response.ok) {
                    setLocationSuggestions(filteredPresets)
                    return
                }
                const cities = await response.json()
                const cityOptions = (cities || [])
                    .map(formatLocationCandidate)
                    .filter(Boolean)

                const deduped = []
                const seen = new Set()
                for (const item of [...filteredPresets, ...cityOptions]) {
                    if (seen.has(item.value)) continue
                    seen.add(item.value)
                    deduped.push(item)
                }
                setLocationSuggestions(deduped)
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Failed to search city suggestions:', error)
                    setLocationSuggestions(filteredPresets)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearchingLocations(false)
                }
            }
        }, 250)

        return () => {
            controller.abort()
            clearTimeout(timer)
        }
    }, [config.weather_location, showLocationDropdown])

    const fetchConfig = async (signal) => {
        try {
            const response = await fetch(`${API_BASE}/config`, { signal })
            if (response.ok) {
                const data = await response.json()
                setConfig(prev => ({
                    ...prev,
                    api_base: data.api_base || 'https://api.openai.com/v1',
                    model: data.model || 'gpt-4o',
                    bg_removal_method: data.bg_removal_method || 'local',
                    tryon_provider: data.tryon_provider || 'disabled',
                    tryon_api_url: data.tryon_api_url || '',
                    tryon_model: data.tryon_model || '',
                    weather_location: data.weather_location || DEFAULT_LOCATION,
                    zodiac_sign: data.zodiac_sign || ''
                }))
                setHasExistingKey(data.has_api_key)
                setHasRemoveBgKey(data.has_removebg_key)
                setHasTryonApiKey(data.has_tryon_api_key)
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Failed to fetch config:', error)
            }
        }
    }

    const fetchModels = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/models`)
            if (response.ok) {
                const data = await response.json()
                setModels(data.models || [])
                if (data.models && data.models.length > 0) {
                    setShowModelSelect(true)
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTestConnection = async () => {
        setTesting(true)
        setTestResult(null)

        const saveSuccess = await handleSave(false)
        if (!saveSuccess) {
            setTesting(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE}/test-connection`, {
                method: 'POST'
            })
            const data = await response.json()
            setTestResult(data)

            if (data.success) {
                fetchModels()
            }
        } catch {
            setTestResult({
                success: false,
                message: t('settings.testFailed')
            })
        } finally {
            setTesting(false)
        }
    }

    const handleInstallRembg = async () => {
        setInstallingRembg(true)
        try {
            const response = await fetch(`${API_BASE}/install-rembg`, {
                method: 'POST'
            })
            const data = await response.json().catch(() => ({}))
            setTestResult({
                success: Boolean(data.success),
                message: data.message || (data.success ? t('settings.installRembgSuccess') : t('settings.installRembgFailed'))
            })
        } catch {
            setTestResult({
                success: false,
                message: t('settings.installRembgFailed')
            })
        } finally {
            setInstallingRembg(false)
        }
    }

    const handleSave = async (closeAfter = true) => {
        try {
            const normalizedLocation = (config.weather_location || '').trim() || DEFAULT_LOCATION
            if (!isCompleteLocationInput(normalizedLocation)) {
                setTestResult({
                    success: false,
                    message: t('settings.defaultCityFormatError')
                })
                return false
            }

            const payload = {
                api_base: config.api_base,
                model: config.model,
                bg_removal_method: config.bg_removal_method,
                tryon_provider: config.tryon_provider,
                tryon_api_url: config.tryon_api_url,
                tryon_model: config.tryon_model,
                weather_location: normalizedLocation,
                zodiac_sign: config.zodiac_sign
            }

            if (config.api_key) {
                payload.api_key = config.api_key
            }
            if (config.removebg_api_key) {
                payload.removebg_api_key = config.removebg_api_key
            }
            if (config.tryon_api_key) {
                payload.tryon_api_key = config.tryon_api_key
            }

            const response = await fetch(`${API_BASE}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                if (closeAfter) {
                    onSave && onSave()
                    onClose()
                }
                return true
            }
            const errorPayload = await response.json().catch(() => ({}))
            setTestResult({
                success: false,
                message: errorPayload.detail || t('settings.defaultCityFormatError')
            })
            return false
        } catch (error) {
            console.error('Failed to save config:', error)
            return false
        }
    }

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div
                className="bg-[var(--bg-primary)] w-full max-w-lg rounded-t-[1.75rem] sm:rounded-[1.75rem] max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-soft-lg animate-[slideUp_0.3s_ease-out] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-card)] px-6">
                    <h2 className="text-xl font-serif font-bold text-[var(--text-primary)] tracking-tight">{t('settings.title')}</h2>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent-champagne)] hover:text-white transition-all duration-200 hover:-translate-y-0.5" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* App Settings Section */}
                    <div className="space-y-4">
                        <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--muted-foreground)]">{t('settings.appSection')}</div>

                        {/* Language Switcher */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                <Globe size={16} className="text-champagne" />
                                {t('settings.language')}
                            </label>
                            <div className="flex gap-2">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                                            i18n.language === lang.code || (i18n.language.startsWith(lang.code))
                                                ? 'bg-champagne text-white shadow-soft'
                                                : 'bg-[var(--secondary)] text-[var(--text-secondary)] hover:opacity-80'
                                        }`}
                                        onClick={() => changeLanguage(lang.code)}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Switcher */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                {theme === 'dark' ? <Moon size={16} className="text-champagne" /> : <Sun size={16} className="text-champagne" />}
                                {t('settings.theme')}
                            </label>
                            <div className="flex gap-2">
                                <button
                                    className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                        theme === 'light'
                                            ? 'bg-champagne text-white shadow-soft'
                                            : 'bg-[var(--secondary)] text-[var(--text-secondary)] hover:opacity-80'
                                    }`}
                                    onClick={() => theme !== 'light' && toggleTheme()}
                                >
                                    <Sun size={14} />
                                    {t('settings.themeLight')}
                                </button>
                                <button
                                    className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                        theme === 'dark'
                                            ? 'bg-champagne text-white shadow-soft'
                                            : 'bg-[var(--secondary)] text-[var(--text-secondary)] hover:opacity-80'
                                    }`}
                                    onClick={() => theme !== 'dark' && toggleTheme()}
                                >
                                    <Moon size={14} />
                                    {t('settings.themeDark')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                <Sparkles size={16} className="text-champagne" />
                                {t('settings.zodiac')}
                            </label>
                            <select
                                className="input-field appearance-none"
                                value={config.zodiac_sign}
                                onChange={e => setConfig(prev => ({ ...prev, zodiac_sign: e.target.value }))}
                            >
                                <option value="">{t('settings.zodiacPlaceholder')}</option>
                                {ZODIAC_SIGNS.map(sign => (
                                    <option key={sign} value={sign}>
                                        {t(`settings.zodiacOptions.${sign}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                                <MapPin size={16} className="text-champagne" />
                                {t('settings.defaultCity')}
                            </label>
                            <div className="relative" ref={locationPickerRef}>
                                <input
                                    type="text"
                                    className="input-field pr-10"
                                    value={config.weather_location}
                                    onFocus={() => setShowLocationDropdown(true)}
                                    onChange={e => {
                                        setConfig(prev => ({ ...prev, weather_location: e.target.value }))
                                        setShowLocationDropdown(true)
                                        if (testResult?.success === false) {
                                            setTestResult(null)
                                        }
                                    }}
                                    placeholder={t('settings.defaultCityPlaceholder')}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-[var(--muted-foreground)] hover:text-[var(--text-primary)] transition-colors"
                                    onClick={() => setShowLocationDropdown(open => !open)}
                                    aria-label={t('settings.defaultCity')}
                                >
                                    ▾
                                </button>

                                {showLocationDropdown && (
                                    <div className="absolute z-40 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-soft-lg">
                                        {locationSuggestions.length > 0 ? (
                                            locationSuggestions.map(option => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--secondary)] transition-colors"
                                                    onMouseDown={(event) => {
                                                        event.preventDefault()
                                                        setConfig(prev => ({ ...prev, weather_location: option.value }))
                                                        setShowLocationDropdown(false)
                                                        if (testResult?.success === false) {
                                                            setTestResult(null)
                                                        }
                                                    }}
                                                >
                                                    {option.label}
                                                </button>
                                            ))
                                        ) : searchingLocations ? (
                                            <div className="px-3 py-2.5 text-sm text-[var(--muted-foreground)]">{t('recommendation.searching')}</div>
                                        ) : (
                                            <div className="px-3 py-2.5 text-sm text-[var(--muted-foreground)]">{t('recommendation.noCity')}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border)] w-full" />

                    {/* LLM Section */}
                    <div className="space-y-4">
                        <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--muted-foreground)]">{t('settings.llmSection')}</div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                                {t('settings.apiBaseLabel')}
                                <span className="text-[var(--muted-foreground)] font-normal">{t('settings.apiBaseHint')}</span>
                            </label>
                            <input
                                type="url"
                                className="input-field"
                                value={config.api_base}
                                onChange={e => setConfig(prev => ({ ...prev, api_base: e.target.value }))}
                                placeholder="https://api.openai.com/v1"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                                {t('settings.apiKeyLabel')}
                                {hasExistingKey && !config.api_key && (
                                    <span className="tag-sage font-normal text-[11px] px-2 py-0.5 rounded-full">{t('settings.configured')}</span>
                                )}
                            </label>
                            <input
                                type="password"
                                className="input-field font-mono"
                                value={config.api_key}
                                onChange={e => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                                placeholder={hasExistingKey ? `••••••••（${t('settings.keepEmpty')}）` : "sk-..."}
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                                {t('settings.model')}
                                {loading && <span className="text-[var(--muted-foreground)] font-normal animate-pulse text-xs">{t('settings.fetching')}</span>}
                            </label>
                            <div className="flex gap-2 relative">
                                {models.length > 0 && showModelSelect ? (
                                    <div className="relative flex-1">
                                        <select
                                            className="input-field appearance-none"
                                            value={config.model}
                                            onChange={e => {
                                                if (e.target.value === '__custom__') {
                                                    setShowModelSelect(false)
                                                } else {
                                                    setConfig(prev => ({ ...prev, model: e.target.value }))
                                                }
                                            }}
                                        >
                                            {!models.find(m => m.id === config.model) && config.model && (
                                                <option value={config.model}>{config.model}</option>
                                            )}
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                            <option value="__custom__">⚙️ {t('settings.manualInput')}</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={config.model}
                                            onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                                            placeholder="gpt-4o"
                                            list="model-list"
                                        />
                                        {models.length > 0 && (
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--text-primary)] rounded-full transition-colors"
                                                onClick={() => setShowModelSelect(true)}
                                                title={t('settings.switchToList')}
                                            >
                                                📋
                                            </button>
                                        )}
                                    </div>
                                )}
                                <button className="btn-secondary px-3 shrink-0" onClick={fetchModels} disabled={loading}>
                                    {t('settings.fetch')}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                className={`w-full py-2.5 rounded-full border flex items-center justify-center gap-2 font-medium transition-all duration-200 ${
                                    testResult?.success ? 'border-[color-mix(in_srgb,var(--accent-sage)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-sage)_10%,transparent)] text-[#6f7d68]' :
                                    testResult?.success === false ? 'border-[color-mix(in_srgb,var(--accent-clay)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-clay)_10%,transparent)] text-[var(--accent-clay)]' :
                                    'border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:opacity-80'
                                }`}
                                onClick={handleTestConnection}
                                disabled={testing}
                            >
                                {testing ? <span className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></span> : '🔗'}
                                {testing ? t('settings.testing') : testResult ? testResult.message : t('settings.testConnection')}
                            </button>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs text-[var(--muted-foreground)] mb-2 font-medium">{t('settings.presets')}</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {[
                                    { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o' },
                                    { name: 'Anthropic', base: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
                                    { name: 'Google', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash-exp' },
                                    { name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                                ].map(p => (
                                    <button
                                        key={p.name}
                                        className="py-1.5 px-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 transition-all duration-200"
                                        onClick={() => setConfig(prev => ({ ...prev, api_base: p.base, model: p.model }))}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--muted-foreground)]">{t('settings.tryOnSection')}</div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('settings.tryOnProvider')}</label>
                                <select
                                    className="input-field appearance-none"
                                    value={config.tryon_provider}
                                    onChange={e => setConfig(prev => ({ ...prev, tryon_provider: e.target.value }))}
                                >
                                    <option value="disabled">{t('settings.tryOnDisabled')}</option>
                                    <option value="custom">{t('settings.tryOnCustom')}</option>
                                </select>
                            </div>

                            {config.tryon_provider === 'custom' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">{t('settings.tryOnApiUrl')}</label>
                                        <input
                                            type="url"
                                            className="input-field"
                                            value={config.tryon_api_url}
                                            onChange={e => setConfig(prev => ({ ...prev, tryon_api_url: e.target.value }))}
                                            placeholder={t('settings.tryOnApiUrlPlaceholder')}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                                            {t('settings.tryOnApiKey')}
                                            {hasTryonApiKey && !config.tryon_api_key && (
                                                <span className="tag-sage font-normal text-[11px] px-2 py-0.5 rounded-full">{t('settings.configured')}</span>
                                            )}
                                        </label>
                                        <input
                                            type="password"
                                            className="input-field font-mono"
                                            value={config.tryon_api_key}
                                            onChange={e => setConfig(prev => ({ ...prev, tryon_api_key: e.target.value }))}
                                            placeholder={hasTryonApiKey ? `••••••••（${t('settings.keepEmpty')}）` : 'Bearer token'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">{t('settings.tryOnModel')}</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={config.tryon_model}
                                            onChange={e => setConfig(prev => ({ ...prev, tryon_model: e.target.value }))}
                                            placeholder={t('settings.tryOnModelPlaceholder')}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border)] w-full" />

                    {/* Image Processing Section */}
                    <div className="space-y-4">
                        <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--muted-foreground)]">{t('settings.imageSection')}</div>

                        <div className="flex flex-col gap-3">
                            <label className={`flex gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${config.bg_removal_method === 'local' ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent-champagne)_8%,transparent)] shadow-soft' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40'}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="local"
                                    className="mt-1 accent-[var(--accent)]"
                                    checked={config.bg_removal_method === 'local'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-[var(--text-primary)] text-sm">{t('settings.localRembg')}</span>
                                    <span className="text-xs text-[var(--muted-foreground)] mt-0.5">{t('settings.localRembgDesc')}</span>
                                    <span className="text-[11px] text-[var(--muted-foreground)] mt-1">{t('settings.localRembgOptional')}</span>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn-secondary !py-1.5 !px-2 text-xs"
                                            onClick={handleInstallRembg}
                                            disabled={installingRembg}
                                        >
                                            {installingRembg ? t('settings.installingRembg') : t('settings.installRembg')}
                                        </button>
                                        <code className="inline-block rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">{t('settings.localRembgInstall')}</code>
                                    </div>
                                </div>
                            </label>

                            <label className={`flex gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${config.bg_removal_method === 'removebg' ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent-champagne)_8%,transparent)] shadow-soft' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40'}`}>
                                <input
                                    type="radio"
                                    name="bg_removal_method"
                                    value="removebg"
                                    className="mt-1 accent-[var(--accent)]"
                                    checked={config.bg_removal_method === 'removebg'}
                                    onChange={e => setConfig(prev => ({ ...prev, bg_removal_method: e.target.value }))}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium text-[var(--text-primary)] text-sm flex items-center gap-2">
                                        remove.bg API
                                        <span className="px-1.5 py-0.5 rounded-full tag-clay text-[10px] font-bold">PRO</span>
                                    </span>
                                    <span className="text-xs text-[var(--muted-foreground)] mt-0.5">{t('settings.removebgDesc')}</span>
                                </div>
                            </label>
                        </div>

                        {config.bg_removal_method === 'removebg' && (
                            <div className="animate-fade-in space-y-2 mt-4">
                                <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                                    remove.bg API Key
                                    {hasRemoveBgKey && !config.removebg_api_key && (
                                        <span className="tag-sage font-normal text-[11px] px-2 py-0.5 rounded-full">{t('settings.configured')}</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    className="input-field font-mono"
                                    value={config.removebg_api_key}
                                    onChange={e => setConfig(prev => ({ ...prev, removebg_api_key: e.target.value }))}
                                    placeholder={hasRemoveBgKey ? `••••••••（${t('settings.keepEmpty')}）` : t('settings.removebgKeyPlaceholder')}
                                />
                                <div className="text-xs flex justify-end">
                                    <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-champagne hover:underline">
                                        {t('settings.getKey')}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pb-4" />
                </div>

                <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-card)] flex gap-3 pb-safe">
                    <button className="flex-1 py-3 rounded-full font-medium bg-[var(--secondary)] text-[var(--text-secondary)] hover:opacity-80 transition-all duration-200" onClick={onClose}>
                        {t('settings.cancel')}
                    </button>
                    <button className="flex-[2] py-3 rounded-full font-medium bg-champagne text-white shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200" onClick={() => handleSave(true)}>
                        {t('settings.saveSettings')}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default Settings
