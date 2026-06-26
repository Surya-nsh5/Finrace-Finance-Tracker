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
// Permanent fix for Vercel deployment chunk loading errors (Failed to fetch dynamically imported module)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume this is a new deployment on Vercel, force refresh to get latest JS chunks
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });

// Lazy load pages with retry mechanism
const Login = lazyWithRetry(() => import("./pages/Auth/Login"));
const SignUp = lazyWithRetry(() => import("./pages/Auth/SignUp"));
const Home = lazyWithRetry(() => import("./pages/Dashboard/Home"));
const Transactions = lazyWithRetry(() => import("./pages/Dashboard/Transactions"));
const AIInsights = lazyWithRetry(() => import("./pages/Dashboard/AIInsights"));
const Landing = lazyWithRetry(() => import("./pages/Landing/Landing"));
const Settings = lazyWithRetry(() => import("./pages/Dashboard/Settings"));
const UdhaarHome = lazyWithRetry(() => import("./pages/Dashboard/UdhaarHome"));
const AddBorrower = lazyWithRetry(() => import("./pages/Dashboard/AddBorrower"));
const UdhaarDetails = lazyWithRetry(() => import("./pages/Dashboard/UdhaarDetails"));
const Subscription = lazyWithRetry(() => import("./pages/Dashboard/Subscription"));

// Loading component while checking auth
const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] transition-colors duration-300">
    <div className="text-center animate-fade-in">
      <div className="relative inline-block w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <img src="/favicon.png" alt="FinRace" className="w-full h-full object-contain opacity-50" />
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
  const { isAuthChecking, isAuthenticated } = useContext(UserContext);

  // Show loading screen while checking authentication
  if (isAuthChecking) {
    return <AuthLoadingScreen />;
  }

  return (
    <div>
      <Router>
        <Suspense fallback={<AuthLoadingScreen />}>
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
            <Route path="/login" exact element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signUp" exact element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp />} />
            <Route path="/dashboard" exact element={<Home />} />
            <Route path="/transactions" exact element={<Transactions />} />
            <Route path="/udhaar" exact element={<UdhaarHome />} />
            <Route path="/udhaar/add-borrower" exact element={<AddBorrower />} />
            <Route path="/udhaar/:id" exact element={<UdhaarDetails />} />
            <Route path="/ai-insights" exact element={<AIInsights />} />
            <Route path="/settings" exact element={<Settings />} />
            <Route path="/subscription" exact element={<Subscription />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
};

import { SpeedInsights } from "@vercel/speed-insights/react";

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
        <SpeedInsights />
      </ThemeProvider>
    </UserProvider>
  );
};

export default App;
