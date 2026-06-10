import React from "react";
import { Link } from "react-router-dom";

const AuthLayout = ({ children, showRight = true }) => {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] transition-colors duration-200">
      <div className="w-full md:w-[60vw] px-6 md:px-12 py-8 flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <img src="https://lh3.googleusercontent.com/d/1sh3I52WFTUbvX-19WI1u400uuiZ9vgS8" alt="FinRace" className="w-10 h-10" referrerPolicy="no-referrer" />
          <span className="text-xl font-semibold text-[var(--color-text)]">FinRace</span>
        </Link>
        {children}
      </div>

      {showRight && (
        <div className="hidden md:block w-[40vw] relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 z-10"></div>
          <img
            src="https://lh3.googleusercontent.com/d/1B_rIJzSn0Z9T6jILBwSOo1FflQQvr2ad"
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