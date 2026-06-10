import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import Navbar from './Navbar';
import SideMenu from './SideMenu';

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);
  const isDev = import.meta.env.DEV;
  const showContent = !!user || isDev; // In dev, allow rendering even if user is missing

  return (
    <div className='min-h-screen bg-[var(--color-bg)] transition-colors duration-300'>
      {/* Navbar only visible on mobile - fixed at top */}
      <div className='lg:hidden'>
        <Navbar activeMenu={activeMenu} />
      </div>

      {showContent && (
        <div className='flex h-screen overflow-hidden'>
          {/* Sidebar - fixed on large screens */}
          <div className='hidden lg:block w-64 flex-shrink-0'>
            <SideMenu activeMenu={activeMenu} />
          </div>

          {/* Main Content Area - scrollable with padding for mobile navbar */}
          <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-6 pb-4 sm:pb-6 lg:pb-6 pt-24 lg:pt-6 bg-[var(--color-bg)] transition-colors duration-300'>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;