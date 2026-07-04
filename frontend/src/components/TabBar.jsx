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
            <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe lg:hidden">
                <div className="max-w-md mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-around h-16">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = location.pathname === tab.path
                            return (
                                <button
                                    key={tab.path}
                                    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${isActive ? 'text-accent' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                    onClick={() => navigate(tab.path)}
                                >
                                    <Icon size={24} className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.5px]' : ''}`} />
                                    <span className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>

            <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
                <div className="mx-auto w-full max-w-screen-2xl px-6 py-3">
                    <div className="flex items-center gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = location.pathname === tab.path
                            return (
                                <button
                                    key={tab.path}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-accent/10 text-accent'
                                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    onClick={() => navigate(tab.path)}
                                >
                                    <Icon size={16} className={isActive ? 'stroke-[2.4px]' : ''} />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </>
    )
}
