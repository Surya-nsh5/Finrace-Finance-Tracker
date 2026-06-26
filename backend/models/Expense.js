const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  icon: { type: String },
  category: { type: String, required: true }, //Example: Salary
  amount: { type: Number, required: true }, //Example: 5000
  date: { type: Date, default: Date.now },
}, { timestamps: true });

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);