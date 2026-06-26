const Borrower = require('../models/Borrower');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const Reminder = require('../models/Reminder');
const xlsx = require('xlsx');
const { checkAndDispatchReminders } = require('../services/reminderScheduler');

// Create Borrower along with initial Loan & Reminders
exports.createBorrower = async (req, res) => {
  const userId = req.user.id;

  try {
    const {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      occupation,
      profilePhoto,
      notes,
      amountGiven,
      dateGiven,
      dueDate,
      purpose,
      interestRate,
      paymentFrequency,
      status,
      documents
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ message: 'Full name and mobile number are required' });
    }

    // 1. Save Borrower details
    const newBorrower = new Borrower({
      userId,
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      occupation,
      profilePhoto,
      notes
    });

    const savedBorrower = await newBorrower.save();

    let savedLoan = null;
    let preReminders = [];

    // 2. If Loan info is provided, create Loan
    if (amountGiven && dateGiven && dueDate) {
      const initialStatus = status || 'Pending';
      const initialAmountGiven = Number(amountGiven);

      const newLoan = new Loan({
        userId,
        borrowerId: savedBorrower._id,
        amountGiven: initialAmountGiven,
        amountPaid: 0,
        remainingBalance: initialAmountGiven,
        purpose: purpose || 'General',
        interestRate: interestRate ? Number(interestRate) : undefined,
        dateGiven: new Date(dateGiven),
        dueDate: new Date(dueDate),
        paymentFrequency: paymentFrequency || 'One Time',
        status: initialStatus,
        documents: documents || [],
        auditLog: [{
          action: 'Loan Created',
          details: `Lent principal of ₹${initialAmountGiven.toLocaleString()} on ${new Date(dateGiven).toLocaleDateString()}. Final due date set for ${new Date(dueDate).toLocaleDateString()}.`
        }]
      });

      savedLoan = await newLoan.save();

      // 3. Pre-populate 4 database reminders
      const dueMoment = new Date(dueDate);

      const reminderMilestones = [
        { type: '7_days_before', date: new Date(new Date(dueDate).setDate(dueMoment.getDate() - 7)) },
        { type: '3_days_before', date: new Date(new Date(dueDate).setDate(dueMoment.getDate() - 3)) },
        { type: 'on_due_date', date: new Date(dueDate) },
        { type: 'overdue', date: new Date(new Date(dueDate).setDate(dueMoment.getDate() + 1)) }
      ];

      for (const m of reminderMilestones) {
        const reminder = new Reminder({
          userId,
          borrowerId: savedBorrower._id,
          reminderDate: m.date,
          reminderType: m.type,
          notificationSent: false
        });
        const savedRem = await reminder.save();
        preReminders.push(savedRem);
      }
    }

    // Dispatch check immediately for any due milestones
    checkAndDispatchReminders().catch(err => console.error('[SCHEDULER ERR] Immediate check trigger failed:', err));

    res.status(201).json({
      message: 'Borrower created successfully',
      borrower: savedBorrower,
      loan: savedLoan,
      reminders: preReminders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Retrieve all borrowers combined with active loans and payment totals
exports.getBorrowerList = async (req, res) => {
  const userId = req.user.id;
  const today = new Date();

  try {
    const borrowers = await Borrower.find({ userId }).sort({ createdAt: -1 }).lean();
    const borrowerIds = borrowers.map(b => b._id);

    const [loans, payments] = await Promise.all([
      Loan.find({ userId, borrowerId: { $in: borrowerIds } }).lean(),
      Payment.find({ userId, borrowerId: { $in: borrowerIds } }).lean()
    ]);

    // Combined aggregation mapping
    const combined = [];
    const backgroundUpdates = [];
    
    for (const b of borrowers) {
      const bLoans = loans.filter(l => l.borrowerId.toString() === b._id.toString());
      const bPayments = payments.filter(p => p.borrowerId.toString() === b._id.toString());

      // Dynamically audit and mark overdue status on the fly
      for (const l of bLoans) {
        const overdue = l.status !== 'Paid' && new Date(l.dueDate) < today;
        if (overdue && l.status !== 'Overdue') {
          l.status = 'Overdue';
          // Save back to db quietly in the background
          backgroundUpdates.push(Loan.updateOne({ _id: l._id }, { $set: { status: 'Overdue' } }));
        }
      }

      combined.push({
        ...b,
        loans: bLoans,
        payments: bPayments
      });
    }

    // Execute background updates without blocking response
    if (backgroundUpdates.length > 0) {
      Promise.all(backgroundUpdates).catch(err => console.error('Error updating overdue statuses:', err));
    }

    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single borrower details, loans, payments list, and notifications schedule
exports.getBorrowerById = async (req, res) => {
  const userId = req.user.id;
  const today = new Date();

  try {
    const borrower = await Borrower.findOne({ _id: req.params.id, userId }).lean();
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower details not found' });
    }

    const [loans, payments, reminders] = await Promise.all([
      Loan.find({ borrowerId: req.params.id, userId }).lean(),
      Payment.find({ borrowerId: req.params.id, userId }).sort({ paymentDate: -1 }).lean(),
      Reminder.find({ borrowerId: req.params.id, userId }).sort({ reminderDate: 1 }).lean()
    ]);

    // Dynamically check and adjust status of pending loans in list
    const backgroundUpdates = [];
    for (const l of loans) {
      const overdue = l.status !== 'Paid' && new Date(l.dueDate) < today;
      if (overdue && l.status !== 'Overdue') {
        l.status = 'Overdue';
        backgroundUpdates.push(Loan.updateOne({ _id: l._id }, { $set: { status: 'Overdue' } }));
      }
    }

    if (backgroundUpdates.length > 0) {
      Promise.all(backgroundUpdates).catch(err => console.error('Error updating overdue statuses:', err));
    }

    res.json({
      borrower,
      loans,
      payments,
      reminders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Borrower Profile and active Loan details
exports.updateBorrower = async (req, res) => {
  const userId = req.user.id;

  try {
    const borrower = await Borrower.findOne({ _id: req.params.id, userId });
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower details not found' });
    }

    const {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      occupation,
      profilePhoto,
      notes,
      amountGiven,
      dueDate,
      purpose,
      interestRate,
      paymentFrequency,
      status,
      documents
    } = req.body;

    // Update Borrower Profile fields
    if (fullName !== undefined) borrower.fullName = fullName;
    if (phone !== undefined) borrower.phone = phone;
    if (email !== undefined) borrower.email = email;
    if (address !== undefined) borrower.address = address;
    if (city !== undefined) borrower.city = city;
    if (state !== undefined) borrower.state = state;
    if (pincode !== undefined) borrower.pincode = pincode;
    if (occupation !== undefined) borrower.occupation = occupation;
    if (profilePhoto !== undefined) borrower.profilePhoto = profilePhoto;
    if (notes !== undefined) borrower.notes = notes;

    await borrower.save();

    // Update the active Loan details
    const activeLoan = await Loan.findOne({ borrowerId: borrower._id, userId });
    if (activeLoan) {
      let changes = [];

      if (amountGiven !== undefined && Number(amountGiven) !== activeLoan.amountGiven) {
        changes.push(`Amount adjusted from ₹${activeLoan.amountGiven} to ₹${amountGiven}`);
        activeLoan.amountGiven = Number(amountGiven);
        activeLoan.remainingBalance = activeLoan.amountGiven - activeLoan.amountPaid;

        // Auto transition status
        if (activeLoan.remainingBalance <= 0) {
          activeLoan.status = 'Paid';
        } else if (activeLoan.amountPaid > 0) {
          activeLoan.status = 'Partially Paid';
        } else {
          activeLoan.status = 'Pending';
        }
      }

      if (dueDate !== undefined && new Date(dueDate).getTime() !== new Date(activeLoan.dueDate).getTime()) {
        changes.push(`Due Date updated to ${new Date(dueDate).toLocaleDateString()}`);
        activeLoan.dueDate = new Date(dueDate);

        // Delete existing scheduled reminders and generate new alerts schedule
        await Reminder.deleteMany({ borrowerId: borrower._id, userId });
        const dueMoment = new Date(dueDate);
        const reminderMilestones = [
          { type: '7_days_before', date: new Date(new Date(dueDate).setDate(dueMoment.getDate() - 7)) },
          { type: '3_days_before', date: new Date(new Date(dueDate).setDate(dueMoment.getDate() - 3)) },
          { type: 'on_due_date', date: new Date(dueDate) },
          { type: 'overdue', date: new Date(new Date(dueDate).setDate(dueMoment.getDate() + 1)) }
        ];

        for (const m of reminderMilestones) {
          const reminder = new Reminder({
            userId,
            borrowerId: borrower._id,
            reminderDate: m.date,
            reminderType: m.type,
            notificationSent: false
          });
          await reminder.save();
        }
      }

      if (purpose !== undefined) activeLoan.purpose = purpose;
      if (interestRate !== undefined) activeLoan.interestRate = interestRate ? Number(interestRate) : undefined;
      if (paymentFrequency !== undefined) activeLoan.paymentFrequency = paymentFrequency;
      if (status !== undefined) activeLoan.status = status;
      if (documents !== undefined) activeLoan.documents = documents;

      if (changes.length > 0) {
        activeLoan.auditLog.push({
          action: 'Parameters Adjusted',
          details: changes.join(', ') + '.'
        });
      }

      await activeLoan.save();
    }

    // Dispatch check immediately for any updated due milestones
    checkAndDispatchReminders().catch(err => console.error('[SCHEDULER ERR] Immediate check trigger failed:', err));

    res.json({ message: 'Borrower and Loan parameters updated successfully', borrower });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Borrower + Loans + Payments + Reminders (Cascade Delete)
exports.deleteBorrower = async (req, res) => {
  const userId = req.user.id;

  try {
    const borrower = await Borrower.findOneAndDelete({ _id: req.params.id, userId });
    if (!borrower) {
      return res.status(404).json({ message: 'Borrower record not found' });
    }

    // Cascade deletes
    await Loan.deleteMany({ borrowerId: req.params.id, userId });
    await Payment.deleteMany({ borrowerId: req.params.id, userId });
    await Reminder.deleteMany({ borrowerId: req.params.id, userId });

    res.json({ message: 'Borrower and associated loans, payments, and reminders removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Record payment repayment
exports.addPayment = async (req, res) => {
  const userId = req.user.id;

  try {
    const { borrowerId, loanId, amount, paymentDate, paymentMethod, remarks } = req.body;

    if (!borrowerId || !loanId || !amount || !paymentDate) {
      return res.status(400).json({ message: 'Please provide all required transaction fields' });
    }

    const loan = await Loan.findOne({ _id: loanId, borrowerId, userId });
    if (!loan) {
      return res.status(404).json({ message: 'Associated loan parameter not found' });
    }

    // Generate unique receipt number
    const rand = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${Date.now()}-${rand}`;

    const newPayment = new Payment({
      userId,
      borrowerId,
      loanId,
      amount: Number(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod: paymentMethod || 'Cash',
      remarks: remarks || '',
      receiptNumber
    });

    const savedPayment = await newPayment.save();

    // Recalculate loan totals
    const allPayments = await Payment.find({ loanId, userId }).lean();
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    loan.amountPaid = totalPaid;
    loan.remainingBalance = loan.amountGiven - totalPaid;

    const prevStatus = loan.status;

    if (loan.remainingBalance <= 0) {
      loan.status = 'Paid';
    } else {
      loan.status = 'Partially Paid';
    }

    loan.auditLog.push({
      action: 'Repayment Received',
      details: `Repayment payment of ₹${Number(amount).toLocaleString()} received via ${paymentMethod}. Receipt ID: ${receiptNumber}. Status updated from ${prevStatus} to ${loan.status}.`
    });

    await loan.save();

    res.status(201).json({
      message: 'Repayment payment recorded successfully',
      payment: savedPayment,
      loan
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Payment
exports.updatePayment = async (req, res) => {
  const userId = req.user.id;

  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, userId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const { amount, paymentDate, paymentMethod, remarks } = req.body;
    const oldAmount = payment.amount;

    if (amount !== undefined) payment.amount = Number(amount);
    if (paymentDate !== undefined) payment.paymentDate = new Date(paymentDate);
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (remarks !== undefined) payment.remarks = remarks;

    await payment.save();

    // Recalculate loan totals
    const loan = await Loan.findOne({ _id: payment.loanId, userId });
    if (loan) {
      const allPayments = await Payment.find({ loanId: loan._id, userId }).lean();
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      loan.amountPaid = totalPaid;
      loan.remainingBalance = loan.amountGiven - totalPaid;

      if (loan.remainingBalance <= 0) {
        loan.status = 'Paid';
      } else if (totalPaid > 0) {
        loan.status = 'Partially Paid';
      } else {
        loan.status = 'Pending';
      }

      loan.auditLog.push({
        action: 'Payment Record Updated',
        details: `Receipt ID ${payment.receiptNumber} modified. Adjusted transaction amount from ₹${oldAmount} to ₹${payment.amount}.`
      });

      await loan.save();
    }

    res.json({ message: 'Payment adjusted successfully', payment, loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
  const userId = req.user.id;

  try {
    const payment = await Payment.findOneAndDelete({ _id: req.params.paymentId, userId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const loan = await Loan.findOne({ _id: payment.loanId, userId });
    if (loan) {
      const allPayments = await Payment.find({ loanId: loan._id, userId }).lean();
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      loan.amountPaid = totalPaid;
      loan.remainingBalance = loan.amountGiven - totalPaid;

      if (loan.remainingBalance <= 0) {
        loan.status = 'Paid';
      } else if (totalPaid > 0) {
        loan.status = 'Partially Paid';
      } else {
        loan.status = 'Pending';
      }

      loan.auditLog.push({
        action: 'Payment Deleted',
        details: `Repayment (Receipt ID: ${payment.receiptNumber}) of ₹${payment.amount} removed.`
      });

      await loan.save();
    }

    res.json({ message: 'Repayment deleted successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch list of reminders for user
exports.getReminders = async (req, res) => {
  const userId = req.user.id;

  try {
    const list = await Reminder.find({ userId }).sort({ reminderDate: 1 }).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update scheduled reminder trigger status
exports.updateReminder = async (req, res) => {
  const userId = req.user.id;

  try {
    const rem = await Reminder.findOneAndUpdate(
      { _id: req.params.reminderId, userId },
      { $set: { notificationSent: req.body.notificationSent } },
      { new: true }
    );
    if (!rem) {
      return res.status(404).json({ message: 'Reminder setting not found' });
    }
    res.json({ message: 'Reminder status updated', reminder: rem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete reminder setting
exports.deleteReminder = async (req, res) => {
  const userId = req.user.id;

  try {
    const rem = await Reminder.findOneAndDelete({ _id: req.params.reminderId, userId });
    if (!rem) {
      return res.status(404).json({ message: 'Reminder record not found' });
    }
    res.json({ message: 'Reminder record removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Excel summary export
exports.exportExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const borrowers = await Borrower.find({ userId }).lean();
    const loans = await Loan.find({ userId }).lean();

    if (borrowers.length === 0) {
      return res.status(404).json({ message: 'No records available to export' });
    }

    const data = borrowers.map(b => {
      const activeL = loans.find(l => l.borrowerId.toString() === b._id.toString());
      return {
        'Borrower Name': b.fullName,
        'Mobile Number': b.phone,
        'Email Address': b.email || 'N/A',
        'Occupation': b.occupation || 'N/A',
        'Address': `${b.address || ''}, ${b.city || ''}, ${b.state || ''} ${b.pincode || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '') || 'N/A',
        'Amount Lent (₹)': activeL ? activeL.amountGiven : 0,
        'Total Recovered (₹)': activeL ? activeL.amountPaid : 0,
        'Remaining Balance (₹)': activeL ? activeL.remainingBalance : 0,
        'Due Date': activeL ? new Date(activeL.dueDate).toLocaleDateString() : 'N/A',
        'Lending Status': activeL ? activeL.status : 'N/A',
        'Purpose of Loan': activeL ? activeL.purpose : 'N/A'
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, 'Borrowers List');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="udhaar_lenders_excel.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CSV summary export
exports.exportCSV = async (req, res) => {
  const userId = req.user.id;

  try {
    const borrowers = await Borrower.find({ userId }).lean();
    const loans = await Loan.find({ userId }).lean();

    if (borrowers.length === 0) {
      return res.status(404).json({ message: 'No records available to export' });
    }

    const headers = 'Borrower Name,Phone,Email,Amount Lent,Total Recovered,Remaining Balance,Due Date,Status,Purpose\n';
    const rows = borrowers.map(b => {
      const activeL = loans.find(l => l.borrowerId.toString() === b._id.toString());
      return `"${b.fullName}","${b.phone}","${b.email || ''}",${activeL ? activeL.amountGiven : 0},${activeL ? activeL.amountPaid : 0},${activeL ? activeL.remainingBalance : 0},"${activeL ? new Date(activeL.dueDate).toLocaleDateString() : ''}","${activeL ? activeL.status : ''}","${activeL ? activeL.purpose : ''}"`;
    }).join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename="udhaar_lenders_csv.csv"');
    res.type('text/csv');
    res.send(headers + rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Full Backup JSON
exports.exportBackup = async (req, res) => {
  const userId = req.user.id;

  try {
    const borrowers = await Borrower.find({ userId }).lean();
    const loans = await Loan.find({ userId }).lean();
    const payments = await Payment.find({ userId }).lean();
    const reminders = await Reminder.find({ userId }).lean();

    res.setHeader('Content-Disposition', 'attachment; filename="udhaar_database_backup.json"');
    res.type('application/json');
    res.json({
      borrowers,
      loans,
      payments,
      reminders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Full Restore JSON
exports.restoreBackup = async (req, res) => {
  const userId = req.user.id;

  try {
    const { borrowers, loans, payments, reminders } = req.body;

    if (!borrowers || !Array.isArray(borrowers)) {
      return res.status(400).json({ message: 'Invalid restore package structure' });
    }

    // Clean existing user records first for full clean database recovery
    await Borrower.deleteMany({ userId });
    await Loan.deleteMany({ userId });
    await Payment.deleteMany({ userId });
    await Reminder.deleteMany({ userId });

    // ID mapping dictionary to preserve database foreign key relationships
    const borrowerIdMap = {};
    const loanIdMap = {};

    // 1. Restore Borrowers
    for (const b of borrowers) {
      const oldId = b._id;
      const borrower = new Borrower({
        userId,
        fullName: b.fullName,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city,
        state: b.state,
        pincode: b.pincode,
        occupation: b.occupation,
        profilePhoto: b.profilePhoto,
        notes: b.notes
      });
      const savedB = await borrower.save();
      borrowerIdMap[oldId] = savedB._id;
    }

    // 2. Restore Loans
    if (loans && Array.isArray(loans)) {
      for (const l of loans) {
        const oldId = l._id;
        const newBorrowerId = borrowerIdMap[l.borrowerId];

        if (newBorrowerId) {
          const loan = new Loan({
            userId,
            borrowerId: newBorrowerId,
            amountGiven: Number(l.amountGiven),
            amountPaid: Number(l.amountPaid || 0),
            remainingBalance: Number(l.remainingBalance),
            purpose: l.purpose,
            interestRate: l.interestRate,
            dateGiven: new Date(l.dateGiven),
            dueDate: new Date(l.dueDate),
            paymentFrequency: l.paymentFrequency,
            status: l.status,
            documents: l.documents || [],
            auditLog: l.auditLog || []
          });
          const savedL = await loan.save();
          loanIdMap[oldId] = savedL._id;
        }
      }
    }

    // 3. Restore Payments
    if (payments && Array.isArray(payments)) {
      for (const p of payments) {
        const newBorrowerId = borrowerIdMap[p.borrowerId];
        const newLoanId = loanIdMap[p.loanId];

        if (newBorrowerId && newLoanId) {
          const payment = new Payment({
            userId,
            borrowerId: newBorrowerId,
            loanId: newLoanId,
            amount: Number(p.amount),
            paymentDate: new Date(p.paymentDate),
            paymentMethod: p.paymentMethod,
            remarks: p.remarks,
            receiptNumber: p.receiptNumber
          });
          await payment.save();
        }
      }
    }

    // 4. Restore Reminders
    if (reminders && Array.isArray(reminders)) {
      for (const r of reminders) {
        const newBorrowerId = borrowerIdMap[r.borrowerId];

        if (newBorrowerId) {
          const reminder = new Reminder({
            userId,
            borrowerId: newBorrowerId,
            reminderDate: new Date(r.reminderDate),
            reminderType: r.reminderType,
            notificationSent: !!r.notificationSent
          });
          await reminder.save();
        }
      }
    }

    res.json({ message: 'Lending portfolio restored successfully from backup package' });
  } catch (error) {
    res.status(500).json({ message: 'Server restore error', error: error.message });
  }
};
