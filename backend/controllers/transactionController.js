const xlsx = require('xlsx');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');
const { clearCache } = require('../utils/cache');

// Unified Bulk Upload for Income and Expense
exports.bulkUploadUnified = async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let errorCount = 0;

    try {
        // Read and parse CSV file from memory buffer
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        bufferStream
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim(),
                mapValues: ({ value }) => value.trim()
            }))
            .on('data', (row) => {
                // Expected CSV format: Type (Income/Expense), Category/Source, Amount, Date, Icon (optional)
                const type = row.type || row.Type;
                const icon = row.icon || row.Icon;

                results.push({
                    type: type ? type.toLowerCase() : null,
                    title: row.category || row.Category || row.source || row.Source || row.Title || row.title,
                    amount: parseFloat(row.amount || row.Amount),
                    date: row.date || row.Date,
                    icon: icon && icon !== '' ? icon : (type?.toLowerCase() === 'income' ? '💵' : '💰')
                });
            })
            .on('end', async () => {
                // Process each row
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];

                    try {
                        // Validate required fields
                        if (!row.type || !row.title || !row.amount || !row.date) {
                            errors.push({ row: i + 1, error: 'Missing required fields (Type, Title/Category/Source, Amount, Date)', data: row });
                            errorCount++;
                            continue;
                        }

                        if (row.type === 'income') {
                            const newIncome = new Income({
                                userId,
                                icon: row.icon,
                                source: row.title,
                                amount: row.amount,
                                date: new Date(row.date)
                            });
                            await newIncome.save();
                            successCount++;
                        } else if (row.type === 'expense') {
                            const newExpense = new Expense({
                                userId,
                                icon: row.icon,
                                category: row.title,
                                amount: row.amount,
                                date: new Date(row.date)
                            });
                            await newExpense.save();
                            successCount++;
                        } else {
                            errors.push({ row: i + 1, error: 'Invalid Type. Must be "Income" or "Expense"', data: row });
                            errorCount++;
                        }

                    } catch (error) {
                        errors.push({ row: i + 1, error: error.message, data: row });
                        errorCount++;
                    }
                }

                clearCache(`dashboard_${userId}`);
                // Send response
                res.status(200).json({
                    message: 'Unified CSV upload completed',
                    summary: {
                        total: results.length,
                        success: successCount,
                        failed: errorCount
                    },
                    errors: errors.length > 0 ? errors : undefined
                });
            })
            .on('error', (error) => {
                console.error('CSV Processing Error', error);
                res.status(500).json({ message: 'Error processing CSV file', error: error.message });
            });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
