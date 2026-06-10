import React, { useContext } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import UserProvider, { UserContext } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
// Lazy load pages
const Login = lazy(() => import("./pages/Auth/Login"));
const SignUp = lazy(() => import("./pages/Auth/SignUp"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Transactions = lazy(() => import("./pages/Dashboard/Transactions"));
const AIInsights = lazy(() => import("./pages/Dashboard/AIInsights"));
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Settings = lazy(() => import("./pages/Dashboard/Settings"));

// Loading component while checking auth
const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] transition-colors duration-300">
    <div className="text-center animate-fade-in">
      <div className="relative inline-block w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <img src="https://lh3.googleusercontent.com/d/1sh3I52WFTUbvX-19WI1u400uuiZ9vgS8" alt="FinRace" className="w-full h-full object-contain opacity-50" referrerPolicy="no-referrer" />
        </div>
      </div>
      <p className="text-[var(--color-text)] opacity-60 font-medium tracking-wide animate-pulse">
        Initializing FinRace...
      </p>
    </div>
  </div>
);

// App content that uses UserContext
const AppContent = () => {
  const { isAuthChecking } = useContext(UserContext);

  // Show loading screen while checking authentication
  if (isAuthChecking) {
    return <AuthLoadingScreen />;
  }

  return (
    <div>
      <Router>
        <Suspense fallback={<AuthLoadingScreen />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" exact element={<Login />} />
            <Route path="/signUp" exact element={<SignUp />} />
            <Route path="/dashboard" exact element={<Home />} />
            <Route path="/transactions" exact element={<Transactions />} />
            <Route path="/ai-insights" exact element={<AIInsights />} />
            <Route path="/settings" exact element={<Settings />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
};

const App = () => {
  return (
    <UserProvider>
      <ThemeProvider>
        <AppContent />
        <Toaster
          toastOptions={{
            className: "",
            style: {
              fontSize: "13px",
            },
          }}
        />
      </ThemeProvider>
    </UserProvider>
  );
};

export default App;
