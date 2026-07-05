import { useNavigate, useLocation } from 'react-router-dom'
import { House, PlusCircle, Search, User, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TabBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation()

    const tabs = [
        { path: '/', icon: House, label: t('tabs.home') },
        { path: '/entry', icon: PlusCircle, label: t('tabs.entry') },
        { path: '/wardrobe', icon: Search, label: t('tabs.wardrobe') },
        { path: '/outfit', icon: User, label: t('tabs.outfit') },
        { path: '/recommendation', icon: Sparkles, label: t('tabs.recommendation') }
    ]

    return (
        <>
            {/* Mobile bottom tab bar — glass + champagne active pill */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe lg:hidden">
                <div className="glass border-t border-[var(--border)]">
                    <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = location.pathname === tab.path
                            return (
                                <button
                                    key={tab.path}
                                    className="relative flex flex-1 flex-col items-center gap-1 py-1.5"
                                    onClick={() => navigate(tab.path)}
                                >
                                    <span
                                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                                            isActive
                                                ? 'bg-champagne text-white shadow-soft'
                                                : 'text-[var(--muted-foreground)]'
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </span>
                                    <span
                                        className={`text-[10px] transition-colors ${
                                            isActive ? 'text-[var(--text-primary)]' : 'text-[var(--muted-foreground)]'
                                        }`}
                                    >
                                        {tab.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Desktop top nav — glass + champagne logo + pill highlight */}
            <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50">
                <div className="glass border-b border-[var(--border)]">
                    <div className="mx-auto w-full max-w-screen-2xl px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-champagne">
                                    <Sparkles size={18} />
                                </span>
                                <span className="font-serif text-lg tracking-wide">AIWardrobe</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon
                                    const isActive = location.pathname === tab.path
                                    return (
                                        <button
                                            key={tab.path}
                                            className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                                                isActive
                                                    ? 'text-[var(--text-primary)]'
                                                    : 'text-[var(--muted-foreground)] hover:text-[var(--text-primary)]'
                                            }`}
                                            onClick={() => navigate(tab.path)}
                                        >
                                            {isActive && (
                                                <span className="absolute inset-0 rounded-full bg-[var(--secondary)]" />
                                            )}
                                            <span className="relative flex items-center gap-1.5">
                                                <Icon size={16} />
                                                {tab.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="w-9" />
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}
