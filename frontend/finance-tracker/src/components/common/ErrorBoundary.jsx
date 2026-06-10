import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 transition-colors duration-300">
                    <div className="card p-8 max-w-md w-full text-center">
                        <div className="mb-4 text-red-500">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Something went wrong</h1>
                        <p className="text-[var(--color-text)] opacity-70 mb-6">We're sorry, but an unexpected error occurred. Please try refreshing the page.</p>
 
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-8 text-left bg-[var(--color-input)] border border-[var(--color-border)] p-4 rounded overflow-auto max-h-60 text-xs text-red-400 font-mono">
                                <p>{this.state.error.toString()}</p>
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
