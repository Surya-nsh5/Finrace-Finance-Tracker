const xlsx = require('xlsx');
const Expense = require('../models/Expense');
const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');
const { clearCache } = require('../utils/cache');

// Add Expense Source
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;
    if (!category || !amount || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category,
      amount,
      date: new Date(date)
    });

    await newExpense.save();
    clearCache(`dashboard_${userId}`);
    res.status(200).json({ message: 'Expense added successfully', expense: newExpense });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get Expense Source
exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId })
      .select('-__v -updatedAt') // Keep Projection for optimization
      .sort({ date: -1 })
      .lean();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Expense Source
exports.deleteExpense = async (req, res) => {
  const userId = req.user.id;
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    clearCache(`dashboard_${userId}`);
    res.json({ message: "Expense deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete All Expenses for a User
exports.deleteAllExpense = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await Expense.deleteMany({ userId });

    clearCache(`dashboard_${userId}`);
    res.json({
      message: "All expense records deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download Expense Source
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId: userId }).sort({ date: -1 }).lean();

    if (expense.length === 0) {
      return res.status(404).json({ message: "No expense data found" });
    }

    const data = expense.map(item => ({
      Category: item.category,
      Amount: item.amount,
      Date: new Date(item.date).toLocaleDateString(),
      Icon: item.icon || ''
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Expenses");

    // Generate buffer instead of writing to file
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="expense_details.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Bulk Upload Expenses from CSV
exports.bulkUploadExpenses = async (req, res) => {
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
        // Expected CSV format: category, amount, date, icon (optional)
        const icon = row.icon || row.Icon;
        results.push({
          category: row.category || row.Category,
          amount: parseFloat(row.amount || row.Amount),
          date: row.date || row.Date,
          icon: icon && icon !== '' ? icon : '💰'
        });
      })
      .on('end', async () => {
        // Process each row
        for (let i = 0; i < results.length; i++) {
          const row = results[i];

          try {
            // Validate required fields
            if (!row.category || !row.amount || !row.date) {
              errors.push({ row: i + 1, error: 'Missing required fields', data: row });
              errorCount++;
              continue;
            }

            // Create expense
            const newExpense = new Expense({
              userId,
              icon: row.icon,
              category: row.category,
              amount: row.amount,
              date: new Date(row.date)
            });

            await newExpense.save();
            successCount++;
          } catch (error) {
            errors.push({ row: i + 1, error: error.message, data: row });
            errorCount++;
          }
        }

        clearCache(`dashboard_${userId}`);
        // Send response
        res.status(200).json({
          message: 'CSV upload completed',
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
