import { useNavigate } from 'react-router-dom'
import { useRef, useContext, useState, useEffect } from 'react'
import { FaDollarSign, FaWallet, FaChartLine, FaLock, FaCheck, FaArrowRight } from 'react-icons/fa'

import { UserContext } from '../../context/UserContext'
import Modal from '../../components/layouts/Modal'
import toast from 'react-hot-toast'
import '../../index.css'

/**
 * Landing Page Component:
 * Public-facing entry point of FinRace.
 * Designed with a human-centric focus, interactive sandbox widget, and authentic copywriting.
 */
const Landing = () => {
    const navigate = useNavigate();
    const contactRef = useRef(null);
    const { isAuthenticated } = useContext(UserContext);


    // Interactive Sandbox State
    const [sandboxTransactions, setSandboxTransactions] = useState([
        { id: 1, desc: 'Shake Shack Burger', amount: 15.50, category: 'Food & Drink', emoji: '🍔' },
        { id: 2, desc: 'Uber Ride Home', amount: 12.00, category: 'Transport', emoji: '🚗' },
        { id: 3, desc: 'Movie Ticket', amount: 18.00, category: 'Entertainment', emoji: '🍿' },
    ]);
    const [sandboxInput, setSandboxInput] = useState('');
    const [budgetLimit, setBudgetLimit] = useState(100.00);

    // Calculate interactive sandbox values
    const totalSpent = sandboxTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const progressPercent = Math.min((totalSpent / budgetLimit) * 100, 100);

    // Interactive Quiz State
    const [quizAnswers, setQuizAnswers] = useState({
        q1: null, // Hate spreadsheets?
        q2: null, // Wrong bank tags?
        q3: null, // Care about privacy?
    });

    const handleQuizClick = (question, answer) => {
        setQuizAnswers(prev => ({
            ...prev,
            [question]: answer
        }));
    };

    /**
     * Parse natural language transaction input in sandbox
     */
    const parseTransaction = (text) => {
        // Find amount (e.g. 5.50, $12, or ₹500)
        const amountMatch = text.match(/(?:\$|₹|rs\.?|rupees?)?\s?\d+(?:\.\d{2})?/i);
        const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[^\d.]/g, '')) : 10.00;

        // Extract description
        let desc = text.replace(amountMatch ? amountMatch[0] : '', '').trim();
        desc = desc.replace(/^for\s+/i, ''); // strip leading "for "
        if (!desc) desc = "Random Expense";

        // Categorize based on common keywords
        let category = "General";
        let emoji = "💸";
        const lower = desc.toLowerCase();

        if (lower.includes('coffee') || lower.includes('starbucks') || lower.includes('cafe') || lower.includes('tea') || lower.includes('latte')) {
            category = "Food & Drink";
            emoji = "☕";
        } else if (lower.includes('pizza') || lower.includes('food') || lower.includes('burger') || lower.includes('sushi') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('restaurant') || lower.includes('eat')) {
            category = "Food & Drink";
            emoji = "🍕";
        } else if (lower.includes('uber') || lower.includes('taxi') || lower.includes('ride') || lower.includes('cab') || lower.includes('gas') || lower.includes('car') || lower.includes('train') || lower.includes('bus') || lower.includes('flight')) {
            category = "Transport";
            emoji = "🚗";
        } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('movie') || lower.includes('cinema') || lower.includes('game') || lower.includes('concert') || lower.includes('show') || lower.includes('ticket')) {
            category = "Entertainment";
            emoji = "🍿";
        } else if (lower.includes('rent') || lower.includes('home') || lower.includes('flat') || lower.includes('electricity') || lower.includes('water') || lower.includes('bill') || lower.includes('phone') || lower.includes('wifi')) {
            category = "Bills & Rent";
            emoji = "🏠";
        } else if (lower.includes('gym') || lower.includes('health') || lower.includes('doctor') || lower.includes('med') || lower.includes('pill') || lower.includes('workout')) {
            category = "Health & Gym";
            emoji = "💪";
        }

        // Capitalize first letter of description for neatness
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);

        return { amount, desc, category, emoji };
    };

    const handleAddSandboxTransaction = (e) => {
        e.preventDefault();
        if (!sandboxInput.trim()) return;

        const parsed = parseTransaction(sandboxInput);
        const newTx = {
            id: Date.now(),
            ...parsed
        };

        setSandboxTransactions(prev => [newTx, ...prev]);
        setSandboxInput('');
        toast.success(`Parsed: "${parsed.desc}" (${parsed.emoji}) for ₹${parsed.amount.toFixed(2)}`, {
            icon: '🧠',
            style: {
                borderRadius: '12px',
                background: '#17171F',
                color: '#F8FAFC',
                border: '1px solid rgba(212, 175, 55, 0.25)',
            }
        });
    };

    const resetSandbox = () => {
        setSandboxTransactions([
            { id: 1, desc: 'Shake Shack Burger', amount: 15.50, category: 'Food & Drink', emoji: '🍔' },
            { id: 2, desc: 'Uber Ride Home', amount: 12.00, category: 'Transport', emoji: '🚗' },
            { id: 3, desc: 'Movie Ticket', amount: 18.00, category: 'Entertainment', emoji: '🍿' },
        ]);
        toast('Sandbox reset!', { icon: '🔄' });
    };

    /**
     * Contact Form Handler:
     * Submits user inquiries to Web3Forms API.
     */
    const handleContactSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get('name') || '';
        const loadingToast = toast.loading('Sending message...');

        try {
            const response = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.success) {
                toast.success(`Thanks ${name}! We'll get back to you soon.`, { id: loadingToast });
                form.reset();
            } else {
                toast.error('Failed to send. Please try again.', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Something went wrong.', { id: loadingToast });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
            {/* Navigation Bar */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-6 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img
                        src="https://lh3.googleusercontent.com/d/1sh3I52WFTUbvX-19WI1u400uuiZ9vgS8"
                        alt="FinRace Logo"
                        className="w-10 h-10 transition-transform group-hover:scale-110"
                        loading="eager"
                        fetchPriority="high"
                        referrerPolicy="no-referrer"
                    />
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">FinRace</span>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                    <button onClick={() => navigate('/login')} className="text-sm md:text-base text-[var(--color-text)] opacity-70 hover:opacity-100 transition-opacity font-medium">Login</button>
                    <button onClick={() => navigate('/signUp')} className="text-sm md:text-base px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all active:scale-98">Sign Up</button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center px-6 md:px-12 py-12 md:py-20 relative overflow-hidden">
                {/* Decorative Theme Glows */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-primary/[0.06] blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold/[0.04] blur-[120px] rounded-full pointer-events-none"></div>

                {/* Left Column: Authentic Messaging */}
                <div className="lg:col-span-7 flex flex-col items-start text-left relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Made by FinRace Team</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.08] tracking-tight">
                        Your money, <br />
                        <span className="font-serif-display italic bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-gold)] font-semibold pb-1">
                            finally organized.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--color-text)] opacity-70 mb-8 leading-relaxed max-w-xl font-medium">
                        Most finance apps are either ugly, rigid spreadsheets or noisy, ad-filled bank charts.
                        We built FinRace to be a clean, fast, and completely secure place to understand your cashflow without the headache.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <button onClick={() => navigate('/signUp')} className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl hover:opacity-95 active:scale-98 transition-all text-lg font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group">
                            Start Tracking Free <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                    {/* Handwritten annotation details */}
                    <div className="mt-4 flex items-center gap-3">
                        <span className="font-handwritten text-2xl text-[var(--color-gold)] leading-none select-none opacity-90 transform -rotate-3">
                            ✨ Takes 30 seconds. No credit card, ever.
                        </span>
                    </div>
                </div>

                {/* Right Column: Live Interactive Sandbox UI */}
                <div className="lg:col-span-5 relative z-10 w-full">
                    <div className="sandbox-card sandbox-glow rounded-3xl p-6 border border-white/10 relative overflow-hidden">

                        {/* Title bar */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                                <span className="text-xs text-white/55 font-medium ml-2 tracking-wide font-mono">sandbox_preview.jsx</span>
                            </div>
                            <button onClick={resetSandbox} className="text-[11px] px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-md transition-all font-medium border border-white/5">
                                Reset Demo
                            </button>
                        </div>

                        {/* Balance display */}
                        <div className="mb-5">
                            <span className="text-xs text-white/40 uppercase tracking-widest font-semibold block">Interactive Budget Widget</span>
                            <div className="flex justify-between items-baseline mt-1">
                                <span className="text-3xl font-extrabold tracking-tight">₹{(budgetLimit - totalSpent).toFixed(2)}</span>
                                <span className="text-xs text-white/50 font-medium">remaining this week</span>
                            </div>
                        </div>

                        {/* Budget limit progress bar */}
                        <div className="mb-6 bg-white/5 rounded-full h-3.5 p-0.5 overflow-hidden border border-white/5">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${progressPercent > 90 ? 'bg-red-500' : progressPercent > 65 ? 'bg-yellow-500' : 'bg-primary'
                                    }`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>

                        {/* Smart logging form */}
                        <form onSubmit={handleAddSandboxTransaction} className="mb-6 relative">
                            <input
                                type="text"
                                value={sandboxInput}
                                onChange={(e) => setSandboxInput(e.target.value)}
                                placeholder="Try typing 'Coffee ₹4.50' or 'Uber ₹15'"
                                className="w-full pl-4 pr-24 py-3.5 bg-white/5 focus:bg-white/8 hover:bg-white/7 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl text-sm outline-none transition-all placeholder:text-white/30"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
                            >
                                Log Entry
                            </button>
                        </form>

                        {/* Recent Transactions List with animations */}
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {sandboxTransactions.map((tx) => (
                                <div key={tx.id} className="sandbox-list-item flex items-center justify-between p-3 bg-white/4 hover:bg-white/6 rounded-xl border border-white/5 transition-all duration-150">
                                    <div className="flex items-center gap-3">
                                        <span className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-lg">{tx.emoji}</span>
                                        <div>
                                            <span className="text-sm font-semibold text-white/95 block leading-tight">{tx.desc}</span>
                                            <span className="text-[11px] text-white/40 font-medium tracking-wide uppercase mt-0.5 block">{tx.category}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-white/90">-₹{tx.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-[11px] text-center text-white/35 font-medium mt-4">
                            ✨ Try entering any custom expense. Our parser auto-categorizes instantly.
                        </p>
                    </div>
                </div>
            </main>

            {/* Honest Value Propositions */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-white/5 relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">What makes FinRace feel different</h2>
                <p className="text-base text-white/60 mb-16 max-w-xl">
                    We didn't design FinRace to sell you insurance, show you ads, or harvest your browsing habits. We made it for one job.
                </p>

                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="text-3xl mb-5 flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl text-primary">📊</div>
                        <h3 className="text-xl font-bold mb-3">Clear, intentional views</h3>
                        <p className="text-[var(--color-text)] opacity-70 leading-relaxed text-sm">
                            We don't do flashy, confusing 3D bar graphs or bloated analytics dashboards. You get clean, high-contrast totals and simple lists that reveal exactly where the leak is.
                        </p>
                    </div>
                    <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="text-3xl mb-5 flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl text-primary">🧠</div>
                        <h3 className="text-xl font-bold mb-3">Down-to-earth parsing</h3>
                        <p className="text-[var(--color-text)] opacity-70 leading-relaxed text-sm">
                            No complex manual categorization. Our parser reads natural descriptions (like 'latte', 'taxi', or 'rent') and places them in their respective buckets instantly.
                        </p>
                    </div>
                    <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="text-3xl mb-5 flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl text-primary">🔒</div>
                        <h3 className="text-xl font-bold mb-3">Strictly private by default</h3>
                        <p className="text-[var(--color-text)] opacity-70 leading-relaxed text-sm">
                            We don't link directly to your physical bank passwords or sell transactions to credit card companies. Import statements manually, or log on the go. Your numbers stay private.
                        </p>
                    </div>
                </div>
            </section>

            {/* Interactive Decision Quiz Section */}
            <section className="bg-white/2 border-y border-white/5 py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-center">Is FinRace right for you?</h2>
                    <p className="text-base text-white/50 mb-12 text-center max-w-md mx-auto">
                        Find out in three clicks. No email address required.
                    </p>

                    <div className="space-y-6">
                        {/* Question 1 */}
                        <div className="bg-white/4 p-6 rounded-2xl border border-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="font-semibold text-base text-white/90">1. Do you find spreadsheet templates annoying to maintain on your phone?</h3>
                                <div className="flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleQuizClick('q1', 'yes')}
                                        className={`px-5 py-2 text-xs font-semibold rounded-lg border transition-all ${quizAnswers.q1 === 'yes'
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Yes, absolutely
                                    </button>
                                    <button
                                        onClick={() => handleQuizClick('q1', 'no')}
                                        className={`px-5 py-2 text-xs font-semibold rounded-lg border transition-all ${quizAnswers.q1 === 'no'
                                            ? 'bg-white border-white text-black'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        No, I love Excel
                                    </button>
                                </div>
                            </div>
                            {quizAnswers.q1 && (
                                <div className="mt-4 pt-4 border-t border-white/5 text-sm text-[var(--color-gold)] font-medium animate-slide-down">
                                    {quizAnswers.q1 === 'yes'
                                        ? "💡 We feel you. Cells are too small for fingers. FinRace is built with big interactive buttons specifically optimized for mobile entries."
                                        : "👏 Keep it up! Spreadsheet models are powerful. But if you ever want a quicker way to log details on the go, we're here."}
                                </div>
                            )}
                        </div>

                        {/* Question 2 */}
                        <div className="bg-white/4 p-6 rounded-2xl border border-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="font-semibold text-base text-white/90">2. Are you tired of bank apps categorizing transactions incorrectly?</h3>
                                <div className="flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleQuizClick('q2', 'yes')}
                                        className={`px-5 py-2 text-xs font-semibold rounded-lg border transition-all ${quizAnswers.q2 === 'yes'
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Yes, constantly
                                    </button>
                                    <button
                                        onClick={() => handleQuizClick('q2', 'no')}
                                        className={`px-5 py-2 text-xs font-semibold rounded-lg border transition-all ${quizAnswers.q2 === 'no'
                                            ? 'bg-white border-white text-black'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        No, they work fine
                                    </button>
                                </div>
                            </div>
                            {quizAnswers.q2 && (
                                <div className="mt-4 pt-4 border-t border-white/5 text-sm text-[var(--color-gold)] font-medium animate-slide-down">
                                    {quizAnswers.q2 === 'yes'
                                        ? "☕ Exactly. No, Starbucks is not a 'Utility', bank apps! FinRace lets you tweak categories with one tap and remembers your choice forever."
                                        : "🎯 You're one of the lucky ones! A lot of users see random fees categorized incorrectly, which is why we built a flexible override."}
                                </div>
                            )}
                        </div>

                        {/* Question 3 */}
                        <div className="bg-white/4 p-6 rounded-2xl border border-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="font-semibold text-base text-white/90">3. Is privacy and data-ownership a dealbreaker for you?</h3>
                                <div className="flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleQuizClick('q3', 'yes')}
                                        className={`px-5 py-2 text-xs font-semibold rounded-lg border transition-all ${quizAnswers.q3 === 'yes'
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Yes, 100%
                                    </button>
                                    <button
                                        onClick={() => handleQuizClick('q3', 'no')}
                                        className={`px-5 py-2 text-xs font-semibold rounded-lg border transition-all ${quizAnswers.q3 === 'no'
                                            ? 'bg-white border-white text-black'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }`}
                                    >
                                        Not a priority
                                    </button>
                                </div>
                            </div>
                            {quizAnswers.q3 && (
                                <div className="mt-4 pt-4 border-t border-white/5 text-sm text-[var(--color-gold)] font-medium animate-slide-down">
                                    {quizAnswers.q3 === 'yes'
                                        ? "🔒 Core value. We don't link live bank details, sell tracking patterns, or cross-sell products. Your finance history is completely yours to delete or export anytime."
                                        : "📊 Fair enough. But you'll still appreciate not getting spam emails pitching credit card deals or insurance updates."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Founder's Note (Human Touch Letter) */}
            <section className="max-w-3xl mx-auto px-6 py-24 relative overflow-hidden">
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                    <span className="text-3xl block mb-4">✉️</span>
                    <h3 className="text-xl font-bold mb-4">A Note from the Creators</h3>
                    <div className="space-y-4 text-sm text-white/70 leading-relaxed font-medium">
                        <p>
                            We started building FinRace because we were tired of budgeting applications that treated us like commodities.
                            Every time we opened a financial app, we were greeted with a wall of advertisements, pushy notices to connect
                            our main banking credentials, and automatic labels that made no logical sense.
                        </p>
                        <p>
                            We wanted something that felt like a well-crafted physical planner: private, fast to fill out, and visually beautiful.
                            FinRace is our attempt at that. There are no credit card signups, no bank links unless you explicitly want them,
                            and no data selling. Just a quiet, focused workspace for you and your numbers.
                        </p>
                        <p>
                            Thanks for checking us out. We hope it makes your finances feel a little lighter.
                        </p>
                        <p className="font-handwritten text-2xl text-[var(--color-gold)] pt-4 select-none">
                            — Suryansh and the FinRace Team
                        </p>
                    </div>
                </div>
            </section>

            {/* Support and Inquiries Section */}
            <section ref={contactRef} className="max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Questions? Let's chat</h2>
                <p className="text-base text-white/60 mb-10">We're real humans, not chatbot scripts. Drop a message and we'll reply directly.</p>

                <form onSubmit={handleContactSubmit} className="space-y-6">
                    <input type="hidden" name="access_key" value="b527ab92-6d1d-483d-b973-ec67ff5b67bf" />
                    <input type="hidden" name="redirect" value="false" />

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/85">Name</label>
                            <input name="name" placeholder="Your name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-white/30" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/85">Email</label>
                            <input name="email" type="email" placeholder="you@example.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-white/30" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-white/85">Message</label>
                        <textarea name="message" placeholder="What's on your mind? Suggestions, questions, or just a hello..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary text-sm focus:ring-1 focus:ring-primary/20 h-32 resize-none placeholder:text-white/30" required />
                    </div>

                    <button type="submit" className="w-full px-6 py-4 bg-white text-black rounded-xl hover:bg-gray-100 font-bold text-base transition-all active:scale-98">
                        Send message
                    </button>
                </form>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 mt-12">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img
                            src="https://lh3.googleusercontent.com/d/1sh3I52WFTUbvX-19WI1u400uuiZ9vgS8"
                            alt="FinRace Logo"
                            className="w-8 h-8 transition-transform group-hover:scale-110"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                        <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">FinRace</span>
                    </div>
                    <p className="text-xs text-white/40">© 2026 FinRace. Built by hand with absolute care.</p>
                </div>
            </footer>


        </div>
    )
}

export default Landing;
