import React, { useContext } from 'react';
import { SIDE_MENU_DATA } from '../../utils/data';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import CharAvatar from '../Cards/CharAvatar';
import Modal from './Modal';
import LogoutConfirm from './LogoutConfirm';
import { HiOutlineDownload } from 'react-icons/hi';

const SideMenu = ({ activeMenu }) => {
    const { user, clearUser } = useContext(UserContext);
    const navigate = useNavigate();

    const [openLogoutModal, setOpenLogoutModal] = React.useState(false);
    const [openInstallModal, setOpenInstallModal] = React.useState(false);
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);
    const [isStandalone, setIsStandalone] = React.useState(false);

    React.useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsStandalone(true);
        }

        const handlePrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handlePrompt);
        return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            setOpenInstallModal(true);
        }
    };

    const handleClick = (route) => {
        const normalized = String(route || '').toLowerCase();

        if (normalized === "logout" || normalized === "/logout") {
            setOpenLogoutModal(true);
            return;
        }

        navigate(route);
    };

    return (
        <div className="w-full h-full bg-[var(--color-card)] border-r border-[var(--color-border)] p-5 flex flex-col overflow-y-auto transition-colors duration-300">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <img src="https://lh3.googleusercontent.com/d/1sh3I52WFTUbvX-19WI1u400uuiZ9vgS8" alt="FinRace Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
                <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">FINRACE</h1>
            </div>

            {/* User Profile Section */}
            <div className="flex flex-col items-center gap-3 mb-6">
                {user?.profileImageUrl ? (
                    <img
                        src={user?.profileImageUrl || ""}
                        alt="Profile Image"
                        className='w-16 h-16 bg-slate-400 rounded-full object-cover'
                    />
                ) : (
                    <CharAvatar
                        fullName={user?.fullName}
                        width="w-16"
                        height="h-16"
                        style="text-lg"
                    />
                )}
                <h5 className="text-[var(--color-text)] font-bold text-lg text-center">
                    {user?.fullName || "Mike William"}
                </h5>
            </div>

            {/* Navigation Menu */}
            <div className="flex flex-col gap-2 flex-1">
                {SIDE_MENU_DATA.map((item, index) => (
                    <button
                        key={`menu_${index}`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeMenu === item.label
                            ? "bg-primary text-white"
                            : "text-[var(--color-text)] hover:bg-[var(--color-input)] hover:text-primary opacity-80 hover:opacity-100"
                            }`}
                        onClick={() => handleClick(item.path)}
                    >
                        <item.icon className="text-xl" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Download App Section (Always at Bottom) */}
            {!isStandalone && (
                <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 border border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 cursor-pointer"
                        onClick={handleInstallClick}
                    >
                        <HiOutlineDownload className="text-xl" />
                        <span>Download App</span>
                    </button>
                </div>
            )}

            <Modal isOpen={openLogoutModal} onClose={() => setOpenLogoutModal(false)} title="Logout">
                <LogoutConfirm
                    onCancel={() => setOpenLogoutModal(false)}
                    onLogout={() => {
                        clearUser();
                        setOpenLogoutModal(false);
                        navigate('/');
                    }}
                />
            </Modal>

            <Modal isOpen={openInstallModal} onClose={() => setOpenInstallModal(false)} title="Install FinRace App">
                <div className="space-y-4 text-left">
                    <p className="text-sm text-[var(--color-text)] opacity-80">
                        To install FinRace as an app on your device, follow these instructions:
                    </p>
                    
                    <div className="space-y-3">
                        <div className="p-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg">
                            <p className="text-sm font-bold text-primary mb-1">Android (Chrome)</p>
                            <p className="text-xs text-[var(--color-text)] opacity-70">
                                Tap the menu button (three dots) in the top-right corner of Chrome, then select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg">
                            <p className="text-sm font-bold text-[#D4AF37] mb-1">iOS (Safari)</p>
                            <p className="text-xs text-[var(--color-text)] opacity-70">
                                Tap the <strong>Share</strong> button (arrow icon at the bottom of the screen), scroll down, and select <strong>Add to Home Screen</strong>.
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg">
                            <p className="text-sm font-bold text-primary mb-1">Desktop (Chrome/Edge)</p>
                            <p className="text-xs text-[var(--color-text)] opacity-70">
                                Click the install icon (a monitor with a down arrow) on the right side of the address bar at the top of your browser.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => setOpenInstallModal(false)}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition text-sm font-semibold cursor-pointer"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SideMenu