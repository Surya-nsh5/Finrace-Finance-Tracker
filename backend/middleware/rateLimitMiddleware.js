const User = require('../models/User');

// Rate limit constants
const DAILY_INSIGHTS_LIMIT = 10;
const DAILY_BILL_SCANS_LIMIT = 10;

// Helper function to check if a date is from a different day
const isDifferentDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getDate() !== d2.getDate() ||
        d1.getMonth() !== d2.getMonth() ||
        d1.getFullYear() !== d2.getFullYear();
};

// Middleware to check AI Insights rate limit
exports.checkInsightsLimit = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize aiUsage if it doesn't exist
        if (!user.aiUsage) {
            user.aiUsage = {
                insightsCount: 0,
                insightsLastReset: new Date(),
                billScansCount: 0,
                billScansLastReset: new Date()
            };
        }

        const now = new Date();
        const lastReset = user.aiUsage.insightsLastReset || now;

        // Reset count if it's a new day
        if (isDifferentDay(lastReset, now)) {
            user.aiUsage.insightsCount = 0;
            user.aiUsage.insightsLastReset = now;
            await user.save();
        }

        // Check if limit exceeded
        if (user.aiUsage.insightsCount >= DAILY_INSIGHTS_LIMIT) {
            return res.status(429).json({
                message: `Daily AI insights limit reached. You can generate ${DAILY_INSIGHTS_LIMIT} insights per day.`,
                limit: DAILY_INSIGHTS_LIMIT,
                used: user.aiUsage.insightsCount,
                resetTime: new Date(now.setHours(24, 0, 0, 0))
            });
        }

        // Increment count
        user.aiUsage.insightsCount += 1;
        await user.save();

        // Check if this is the last use
        const isLastUse = user.aiUsage.insightsCount === DAILY_INSIGHTS_LIMIT;

        // Attach usage info to request for response
        req.aiUsageInfo = {
            used: user.aiUsage.insightsCount,
            limit: DAILY_INSIGHTS_LIMIT,
            remaining: DAILY_INSIGHTS_LIMIT - user.aiUsage.insightsCount,
            isLastUse: isLastUse
        };

        // Add warning header if this is the last use
        if (isLastUse) {
            res.setHeader('X-Rate-Limit-Warning', 'This is your last AI insight for today. Limit resets at midnight.');
        }

        next();
    } catch (error) {
        console.error('Rate limit check error:', error);
        res.status(500).json({ message: 'Error checking rate limit' });
    }
};

// Middleware to check Bill Scan rate limit
exports.checkBillScanLimit = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize aiUsage if it doesn't exist
        if (!user.aiUsage) {
            user.aiUsage = {
                insightsCount: 0,
                insightsLastReset: new Date(),
                billScansCount: 0,
                billScansLastReset: new Date()
            };
        }

        const now = new Date();
        const lastReset = user.aiUsage.billScansLastReset || now;

        // Reset count if it's a new day
        if (isDifferentDay(lastReset, now)) {
            user.aiUsage.billScansCount = 0;
            user.aiUsage.billScansLastReset = now;
            await user.save();
        }

        // Check if limit exceeded
        if (user.aiUsage.billScansCount >= DAILY_BILL_SCANS_LIMIT) {
            return res.status(429).json({
                message: `Daily bill scan limit reached. You can scan ${DAILY_BILL_SCANS_LIMIT} bills per day.`,
                limit: DAILY_BILL_SCANS_LIMIT,
                used: user.aiUsage.billScansCount,
                resetTime: new Date(now.setHours(24, 0, 0, 0))
            });
        }

        // Increment count
        user.aiUsage.billScansCount += 1;
        await user.save();

        // Check if this is the last use
        const isLastUse = user.aiUsage.billScansCount === DAILY_BILL_SCANS_LIMIT;

        // Attach usage info to request for response
        req.aiUsageInfo = {
            used: user.aiUsage.billScansCount,
            limit: DAILY_BILL_SCANS_LIMIT,
            remaining: DAILY_BILL_SCANS_LIMIT - user.aiUsage.billScansCount,
            isLastUse: isLastUse
        };

        // Add warning header if this is the last use
        if (isLastUse) {
            res.setHeader('X-Rate-Limit-Warning', 'This is your last bill scan for today. Limit resets at midnight.');
        }

        next();
    } catch (error) {
        console.error('Rate limit check error:', error);
        res.status(500).json({ message: 'Error checking rate limit' });
    }
};

// Get current usage stats
exports.getUsageStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const now = new Date();
        const insightsLastReset = user.aiUsage?.insightsLastReset || now;
        const billScansLastReset = user.aiUsage?.billScansLastReset || now;

        // Reset counts if needed
        let insightsCount = user.aiUsage?.insightsCount || 0;
        let billScansCount = user.aiUsage?.billScansCount || 0;

        if (isDifferentDay(insightsLastReset, now)) {
            insightsCount = 0;
        }

        if (isDifferentDay(billScansLastReset, now)) {
            billScansCount = 0;
        }

        res.json({
            insights: {
                used: insightsCount,
                limit: DAILY_INSIGHTS_LIMIT,
                remaining: DAILY_INSIGHTS_LIMIT - insightsCount
            },
            billScans: {
                used: billScansCount,
                limit: DAILY_BILL_SCANS_LIMIT,
                remaining: DAILY_BILL_SCANS_LIMIT - billScansCount
            }
        });
    } catch (error) {
        console.error('Get usage stats error:', error);
        res.status(500).json({ message: 'Error fetching usage stats' });
    }
};
