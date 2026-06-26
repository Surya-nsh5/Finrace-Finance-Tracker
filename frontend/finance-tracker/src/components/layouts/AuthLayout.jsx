import React from "react";
import { Link } from "react-router-dom";

const AuthLayout = ({ children, showRight = true }) => {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] transition-colors duration-200">
      <div className="w-full md:w-[60vw] px-6 md:px-12 py-8 flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <img src="/favicon.png" alt="FinRace" className="w-10 h-10" />
          <span className="text-xl font-semibold text-[var(--color-text)]">FinRace</span>
        </Link>
        {children}
      </div>

      {showRight && (
        <div className="hidden md:block w-[40vw] relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 z-10"></div>
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/007/447/957/small_2x/businessman-working-with-laptop-and-smartphone-virtual-dashboard-analyzing-finance-sales-data-and-economic-growth-graph-chart-photo.jpg"
            alt="FinRace Hero"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};

export default AuthLayout;