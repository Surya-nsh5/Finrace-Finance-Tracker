import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IoMdClose } from "react-icons/io";
import { FaAndroid, FaApple, FaWindows } from "react-icons/fa";

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsStandalone(true);
        }

        const handlePrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handlePrompt);

        // Auto open prompt on landing after 2s regardless of event
        const timer = setTimeout(() => {
            if (location.pathname === '/' && !isStandalone) {
                setIsOpen(true);
            }
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handlePrompt);
            clearTimeout(timer);
        };
    }, [location.pathname, isStandalone]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsOpen(false);
        }
    };

    if (isStandalone || !isOpen || location.pathname !== '/') return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-[calc(100%-48px)] sm:w-72 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-2xl p-4 animate-slide-up transition-all duration-500 overflow-hidden group">
            {/* Subtle Accent Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full pointer-events-none transition-all duration-500"></div>

            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 text-white opacity-20 hover:opacity-100 p-1.5 rounded-full hover:bg-white/5 transition-all z-20"
            >
                <IoMdClose size={16} />
            </button>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[var(--color-input)] rounded-lg flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                        <img
                            src="/favicon.png"
                            alt="FinRace"
                            className="w-7 h-7 object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-white leading-tight truncate">Install FinRace</h3>
                        <div className="flex items-center gap-1.5 opacity-30 mt-0.5">
                            <FaAndroid size={10} />
                            <FaApple size={10} />
                            <FaWindows size={10} />
                        </div>
                    </div>
                </div>

                {deferredPrompt ? (
                    <button
                        onClick={handleInstallClick}
                        className="w-full py-2 bg-white text-black font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] shadow-lg"
                    >
                        Install App Now
                    </button>
                ) : (
                    <div className="py-2 px-3 rounded-lg bg-white/[0.05] border border-white/5 text-white/40 font-bold text-[10px] text-center">
                        ✓ App Ready
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstallPWA;
