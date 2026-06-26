const xlsx = require('xlsx');
const Income = require('../models/Income');
const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;
    if (!source || !amount || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const newIncome = new Income({
      userId,
      icon,
      source,
      amount,
      date: new Date(date)
    });

    await newIncome.save();
    res.status(200).json({ message: 'Income added successfully', income: newIncome });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get Income Source
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({ userId }).sort({ date: -1 }).lean();
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Income Source
exports.deleteIncome = async (req, res) => {
  const userId = req.user.id;
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId });

    if (!income) {
      return res.status(404).json({ message: "Income not found or unauthorized" });
    }

    res.json({ message: "Income deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete All Income for a User
exports.deleteAllIncome = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await Income.deleteMany({ userId });

    res.json({
      message: "All income records deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download Income Source
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({ userId: userId }).sort({ date: -1 }).lean();

    if (income.length === 0) {
      return res.status(404).json({ message: "No income data found" });
    }

    const data = income.map(item => ({
      Source: item.source,
      Amount: item.amount,
      Date: new Date(item.date).toLocaleDateString(),
      Icon: item.icon || ''
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Income");

    // Generate buffer instead of writing to file
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="income_details.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Bulk Upload Income from CSV
exports.bulkUploadIncome = async (req, res) => {
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
        // Expected CSV format: source, amount, date, icon (optional)
        const icon = row.icon || row.Icon;
        results.push({
          source: row.source || row.Source,
          amount: parseFloat(row.amount || row.Amount),
          date: row.date || row.Date,
          icon: icon && icon !== '' ? icon : '💵'
        });
      })
      .on('end', async () => {
        // Process each row
        for (let i = 0; i < results.length; i++) {
          const row = results[i];

          try {
            // Validate required fields
            if (!row.source || !row.amount || !row.date) {
              errors.push({ row: i + 1, error: 'Missing required fields', data: row });
              errorCount++;
              continue;
            }

            // Create income
            const newIncome = new Income({
              userId,
              icon: row.icon,
              source: row.source,
              amount: row.amount,
              date: new Date(row.date)
            });

            await newIncome.save();
            successCount++;
          } catch (error) {
            errors.push({ row: i + 1, error: error.message, data: row });
            errorCount++;
          }
        }

        // Delete uploaded file after processing
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
        // Error handling
        res.status(500).json({ message: 'Error processing CSV file', error: error.message });
      });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
