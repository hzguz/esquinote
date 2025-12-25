import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Login, LayoutDashboard, GridDots, User, ShieldCheck, Bulb } from 'tabler-icons-react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

// Logo SVG component
const LogoIcon: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.377 3.49c-1.862-.31-3.718.62-4.456 2.095-.428.857-.691 1.624-.728 2.361-.035.71.138 1.444.67 2.252.644.854 1.199 1.913 1.608 3.346a.75.75 0 11-1.442.412c-.353-1.236-.82-2.135-1.372-2.865l-.008-.01c-.53-.698-1.14-1.242-1.807-1.778a50.724 50.724 0 00-.667-.524C9.024 7.884 7.71 6.863 6.471 5.16c-.59.287-1.248.798-1.806 1.454-.665.78-1.097 1.66-1.158 2.446.246.36.685.61 1.246.715.643.12 1.278.015 1.633-.182a.75.75 0 11.728 1.311c-.723.402-1.728.516-2.637.346-.916-.172-1.898-.667-2.398-1.666L2 9.427V9.25c0-1.323.678-2.615 1.523-3.607.7-.824 1.59-1.528 2.477-1.917V2.75a.75.75 0 111.5 0v1.27c1.154 1.67 2.363 2.612 3.568 3.551.207.162.415.323.621.489.001-.063.003-.126.006-.188.052-1.034.414-2.017.884-2.958 1.06-2.118 3.594-3.313 6.044-2.904 1.225.204 2.329.795 3.125 1.748C22.546 4.713 23 5.988 23 7.5c0 1.496-.913 3.255-2.688 3.652.838 1.699 1.438 3.768 1.181 5.697-.269 2.017-1.04 3.615-2.582 4.675C17.409 22.558 15.288 23 12.5 23H4.75a.75.75 0 010-1.5h2.322c-.58-.701-.998-1.578-1.223-2.471-.327-1.3-.297-2.786.265-4.131-.92.091-1.985-.02-3.126-.445a.75.75 0 11.524-1.406c1.964.733 3.428.266 4.045-.19.068-.06.137-.12.208-.18a.745.745 0 01.861-.076.746.746 0 01.32.368.752.752 0 01-.173.819c-.077.076-.16.15-.252.221-1.322 1.234-1.62 3.055-1.218 4.654.438 1.737 1.574 2.833 2.69 2.837H12.5c2.674 0 4.429-.433 5.56-1.212 1.094-.752 1.715-1.904 1.946-3.637.236-1.768-.445-3.845-1.407-5.529a.576.576 0 01-.012-.02 3.557 3.557 0 01-1.553-.94c-.556-.565-.89-1.243-1.012-1.73a.75.75 0 011.456-.364c.057.231.26.67.626 1.043.35.357.822.623 1.443.623 1.172 0 1.953-1.058 1.953-2.234 0-1.205-.357-2.127-.903-2.78-.547-.654-1.318-1.08-2.22-1.23z" />
    </svg>
);

type ViewMode = 'free' | 'grid';

interface HeaderProps {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    isAdmin: boolean;
    isMobile: boolean;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    currentStroke: number;
    spyTarget: { id: string; name: string } | null;
    setSpyTarget: (target: { id: string; name: string } | null) => void;
    onOpenDataModal: () => void;
    onOpenAdminPanel: () => void;
    lang: Language;
    readingFilterIntensity: number;
    setReadingFilterIntensity: (value: number) => void;
}

const Header: React.FC<HeaderProps> = ({
    user,
    userProfile,
    isAdmin,
    isMobile,
    viewMode,
    setViewMode,
    currentStroke,
    spyTarget,
    setSpyTarget,
    onOpenDataModal,
    onOpenAdminPanel,
    lang,
    readingFilterIntensity,
    setReadingFilterIntensity,
}) => {
    const t = TRANSLATIONS[lang];
    const [logoText, setLogoText] = React.useState("esquinote");
    const [isRunningAway, setIsRunningAway] = React.useState(false);
    const [showFilterSlider, setShowFilterSlider] = React.useState(false);
    const runTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLogoEnter = () => {
        setLogoText("esquizonote");
        runTimerRef.current = setTimeout(() => {
            setIsRunningAway(true);
        }, 1000);
    };

    const handleLogoLeave = () => {
        setLogoText("esquinote");
        if (runTimerRef.current) clearTimeout(runTimerRef.current);
        setIsRunningAway(false);
    };

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (runTimerRef.current) clearTimeout(runTimerRef.current);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-16 shadow-sm z-[40000] flex items-center justify-between px-6 border-b pointer-events-auto transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-color)' }}>
            <div
                className="flex items-center gap-2 md:gap-3 cursor-default"
                onMouseEnter={handleLogoEnter}
                onMouseLeave={handleLogoLeave}
            >
                <motion.span
                    className="text-white relative z-10"
                    animate={
                        isRunningAway
                            ? { x: [0, 6, -300], opacity: [1, 1, 0], rotate: [0, 15, -25], scale: [1, 0.9, 1] }
                            : { x: 0, opacity: 1, rotate: 0, scale: 1 }
                    }
                    transition={{
                        duration: isRunningAway ? 0.6 : 1.2,
                        times: isRunningAway ? [0, 0.25, 1] : undefined,
                        ease: isRunningAway ? "easeInOut" : "circOut",
                    }}
                >
                    <LogoIcon size={isMobile ? 18 : 24} />
                </motion.span>

                <AnimatePresence mode="wait">
                    <motion.h1
                        key={logoText}
                        initial={{ opacity: 0, y: 5 }}
                        animate={
                            logoText === "esquizonote"
                                ? {
                                    opacity: 1,
                                    y: 0,
                                    x: [0, -2, 2, -1, 1, 0, -3, 3, 0],
                                    rotate: [0, -1, 1, -2, 2, 0],
                                }
                                : { opacity: 1, y: 0 }
                        }
                        exit={{ opacity: 0, y: -5 }}
                        transition={
                            logoText === "esquizonote"
                                ? {
                                    duration: 0.2,
                                    x: { repeat: Infinity, duration: 0.3, ease: "linear" },
                                    rotate: { repeat: Infinity, duration: 0.2, ease: "linear" },
                                }
                                : { duration: 0.2 }
                        }
                        className="text-lg md:text-xl font-bold text-white lowercase"
                    >
                        {logoText}
                    </motion.h1>
                </AnimatePresence>

                {spyTarget && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-2 shadow-lg border border-red-400"
                    >
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="max-w-[80px] md:max-w-[120px] truncate">
                            {t.spyMode} {spyTarget.name}
                        </span>
                        <button onClick={() => setSpyTarget(null)} className="ml-1 hover:text-red-200">
                            <X size={12} />
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
                {/* Container unificado: Modos + Filtro de leitura */}
                <div className="flex items-center gap-1 mr-2">
                    {!isMobile && (
                        <div className="flex items-center bg-black/10 rounded-full p-1">
                            <button
                                onClick={() => setViewMode('free')}
                                className={`p-2 rounded-full transition-all ${viewMode === 'free' ? 'bg-white text-primary shadow-sm' : 'text-white/50 hover:text-white'
                                    }`}
                                title="Modo Livre"
                            >
                                <LayoutDashboard size={20} strokeWidth={currentStroke} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-white/50 hover:text-white'
                                    }`}
                                title="Modo Grid"
                            >
                                <GridDots size={20} strokeWidth={currentStroke} />
                            </button>
                        </div>
                    )}

                    {/* Filtro de leitura */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilterSlider(!showFilterSlider)}
                            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${readingFilterIntensity > 0 ? 'bg-yellow-400/30 text-yellow-300' : 'bg-black/10 text-white/60 hover:text-white/90 hover:bg-black/20'}`}
                            title={t.readingFilter}
                        >
                            <Bulb
                                size={18}
                                strokeWidth={currentStroke}
                                fill={readingFilterIntensity > 0 ? 'currentColor' : 'none'}
                            />
                        </button>
                        <AnimatePresence>
                            {showFilterSlider && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="overflow-hidden"
                                >
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={readingFilterIntensity}
                                        onChange={(e) => setReadingFilterIntensity(Number(e.target.value))}
                                        className="w-16 md:w-20 h-1.5 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                                        style={{
                                            background: `linear-gradient(to right, rgba(250, 204, 21, 0.8) 0%, rgba(250, 204, 21, 0.8) ${readingFilterIntensity * 2}%, rgba(255,255,255,0.2) ${readingFilterIntensity * 2}%, rgba(255,255,255,0.2) 100%)`
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {isAdmin && (
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: "#333" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenAdminPanel}
                        className="p-2 md:p-2.5 bg-black text-green-400 rounded-full transition-colors flex items-center justify-center shadow-sm relative mr-1 border border-green-900"
                        title={t.adminConsole}
                    >
                        <ShieldCheck size={20} strokeWidth={currentStroke} />
                    </motion.button>
                )}

                {user ? (
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(249, 250, 251, 1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenDataModal}
                        className="p-2 md:p-2.5 bg-white text-primary rounded-full transition-colors flex items-center justify-center shadow-sm relative hover:bg-gray-50"
                        title={t.myProfile}
                    >
                        {userProfile?.matchStatus === 'pending_received' && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        )}
                        <User size={20} strokeWidth={currentStroke} />
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenDataModal}
                        className="px-4 py-2 text-primary bg-white rounded-full font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm lowercase hover:bg-gray-50 transition-colors"
                    >
                        <Login size={18} strokeWidth={currentStroke} />
                        <span className="inline leading-none pt-[1px]">{t.signIn}</span>
                    </motion.button>
                )}
            </div>
        </header>
    );
};

export default Header;
