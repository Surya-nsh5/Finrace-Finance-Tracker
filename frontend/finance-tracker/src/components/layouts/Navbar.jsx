import React, { useContext } from 'react'
import SideMenu from './SideMenu';
import { HiOutlineMenu, HiOutlineX, HiOutlineDownload } from 'react-icons/hi';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import CharAvatar from '../Cards/CharAvatar';
import Modal from './Modal';
import LogoutConfirm from './LogoutConfirm';

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = React.useState(false);
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [openUserMenu, setOpenUserMenu] = React.useState(false);
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
  return (
    <>
      <div className='landing-nav w-full flex items-center justify-between px-6 py-4 md:px-12 bg-[var(--color-bg)]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-30 shadow-sm border-b border-[var(--color-border)] transition-colors duration-300'>
        {/* Left side: Logo and Menu button */}
        <div className='flex items-center gap-4'>
          <button className='block lg:hidden text-[var(--color-text)]' onClick={() => setOpenSideMenu(!openSideMenu)}>
            {openSideMenu ? (<HiOutlineX className='text-2xl' />) : (<HiOutlineMenu className='text-2xl' />)}
          </button>

          <div className='flex items-center gap-2 cursor-pointer' onClick={() => navigate('/dashboard')}>
            <img src="https://lh3.googleusercontent.com/d/1sh3I52WFTUbvX-19WI1u400uuiZ9vgS8" alt="FinRace" className="w-8 h-8" referrerPolicy="no-referrer" />
            <span className='hidden sm:block text-lg font-bold text-[var(--color-text)] tracking-tight'>FINRACE</span>
          </div>
        </div>

        {/* Right side: show user avatar/name on desktop */}
        <div className='flex items-center gap-4'>
          {user ? (
            <div className='flex items-center gap-3 relative'>
              {/* Install PWA Button - Always visible if not standalone */}
              {!isStandalone && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-xs font-medium group cursor-pointer"
                >
                  <HiOutlineDownload className="text-lg transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">
                    Install App
                  </span>
                </button>
              )}

              <div className="hidden md:flex items-center gap-2">
                <span className='text-sm font-medium text-[var(--color-text)]'>{user.fullName}</span>
              </div>

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
          ) : null}
        </div>
      </div>

      {/* Mobile side menu */}
      {openSideMenu && (
        <div className='fixed inset-0 z-40 lg:hidden'>
          <div className='fixed inset-0 bg-black/50' onClick={() => setOpenSideMenu(false)}></div>
          <div className='fixed top-0 left-0 h-full w-64 bg-[var(--color-bg)] shadow-xl overflow-y-auto border-r border-[var(--color-border)]'>
            <SideMenu activeMenu={activeMenu} />
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar