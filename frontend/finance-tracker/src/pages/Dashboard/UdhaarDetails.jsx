import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import Modal from '../../components/layouts/Modal';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import Input from '../../components/Inputs/Input';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import {
  LuArrowLeft,
  LuPhone,
  LuMail,
  LuMapPin,
  LuPlus,
  LuTrash2,
  LuDownload,
  LuFileText,
  LuClock,
  LuCalendar,
  LuCheck,
  LuPencil,
  LuHistory,
  LuPrinter
} from 'react-icons/lu';

const UdhaarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core borrower details
  // Core borrower details
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remindersList, setRemindersList] = useState([]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-[#EF4444] hover:bg-[#D32F2F]',
    onConfirm: null
  });

  const showConfirm = (title, message, onConfirm, options = {}) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: options.confirmText || 'Confirm',
      confirmColor: options.confirmColor || 'bg-[#EF4444] hover:bg-[#D32F2F]',
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Modals controllers
  const [openEditLoanModal, setOpenEditLoanModal] = useState(false);
  const [openAddRepaymentModal, setOpenAddRepaymentModal] = useState(false);
  const [openEditRepaymentModal, setOpenEditRepaymentModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [receiptRepayment, setReceiptRepayment] = useState(null);

  // Form states: Update Borrower details
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editInterest, setEditInterest] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editFrequency, setEditFrequency] = useState('One Time');
  const [editStatus, setEditStatus] = useState('Pending');
  const [editEmailReminder, setEditEmailReminder] = useState(() => {
    const saved = localStorage.getItem(`reminder_email_${id}`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [editPushReminder, setEditPushReminder] = useState(() => {
    const saved = localStorage.getItem(`reminder_push_${id}`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [editInAppReminder, setEditInAppReminder] = useState(() => {
    const saved = localStorage.getItem(`reminder_inapp_${id}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Form states: Log Repayment
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(moment().format('YYYY-MM-DD'));
  const [payNotes, setPayNotes] = useState('');
  const [payMode, setPayMode] = useState('Cash');

  // Form states: Edit Repayment
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [editPayMode, setEditPayMode] = useState('Cash');

  // Fetch borrower data
  const fetchLoanDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.UDHAAR.GET_BY_ID(id));
      if (response.data) {
        const data = response.data;
        const activeL = data.loans.find(l => l.status !== 'Paid') || data.loans[0];

        // Construct compatible unified loan object
        const unified = {
          ...data.borrower,
          borrowerName: data.borrower.fullName,
          borrowerMobile: data.borrower.phone,
          borrowerEmail: data.borrower.email || '',
          borrowerAddress: data.borrower.address || '',
          borrowerPhoto: data.borrower.profilePhoto || '',
          borrowerNotes: data.borrower.notes || '',
          amount: activeL ? activeL.amountGiven : 0,
          dueDate: activeL ? activeL.dueDate : null,
          interestRate: activeL ? activeL.interestRate : null,
          purpose: activeL ? activeL.purpose : '',
          frequency: activeL ? activeL.paymentFrequency : 'One Time',
          status: activeL ? activeL.status : 'Pending',
          documents: activeL ? activeL.documents : [],
          auditLog: activeL ? activeL.auditLog : [],
          repayments: data.payments.map(p => ({
            _id: p._id,
            amount: p.amount,
            date: p.paymentDate,
            paymentMode: p.paymentMethod,
            notes: p.remarks,
            receiptNumber: p.receiptNumber
          })),
          _activeLoanId: activeL ? activeL._id : null
        };

        setLoan(unified);
        setRemindersList(data.reminders || []);

        // Prepopulate edit forms
        setEditName(data.borrower.fullName || '');
        setEditMobile(data.borrower.phone || '');
        setEditEmail(data.borrower.email || '');
        setEditAddress(data.borrower.address || '');
        setEditPhoto(data.borrower.profilePhoto || '');
        setEditNotes(data.borrower.notes || '');
        setEditAmount(activeL ? activeL.amountGiven : '');
        setEditDueDate(activeL && activeL.dueDate ? moment(activeL.dueDate).format('YYYY-MM-DD') : '');
        setEditInterest(activeL ? activeL.interestRate : '');
        setEditPurpose(activeL ? activeL.purpose : '');
        setEditFrequency(activeL ? activeL.paymentFrequency : 'One Time');
        setEditStatus(activeL ? activeL.status : 'Pending');
      }
    } catch (error) {
      console.error('Error fetching loan details:', error);
      toast.error('Failed to load borrower record');
      navigate('/udhaar');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  // Handle Profile photo upload conversion to Base64
  const handlePhotoUpload = (file) => {
    if (!file) {
      setEditPhoto('');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Document attachment change logic via Borrower PUT route
  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const newDoc = { name: file.name, url: reader.result };
        const updatedDocs = [...(loan.documents || []), newDoc];

        await axiosInstance.put(API_PATHS.UDHAAR.UPDATE(id), {
          documents: updatedDocs
        });
        toast.success('Document uploaded successfully');
        fetchLoanDetails();
      } catch (error) {
        console.error(error);
        toast.error('Document upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocDelete = (docId) => {
    showConfirm(
      'Delete Document',
      'Are you sure you want to delete this supporting document? This action cannot be undone.',
      async () => {
        try {
          const updatedDocs = loan.documents.filter(doc => doc._id !== docId);
          await axiosInstance.put(API_PATHS.UDHAAR.UPDATE(id), {
            documents: updatedDocs
          });
          toast.success('Document deleted');
          fetchLoanDetails();
        } catch (error) {
          console.error(error);
          toast.error('Document deletion failed');
        }
      }
    );
  };

  // Submit edit borrower profile details
  const handleUpdateLoan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: editName,
        phone: editMobile,
        email: editEmail,
        address: editAddress,
        profilePhoto: editPhoto,
        notes: editNotes,
        amountGiven: Number(editAmount),
        dueDate: editDueDate,
        interestRate: editInterest ? Number(editInterest) : undefined,
        purpose: editPurpose,
        paymentFrequency: editFrequency,
        status: editStatus
      };

      await axiosInstance.put(API_PATHS.UDHAAR.UPDATE(id), payload);
      toast.success('Details updated successfully');
      fetchLoanDetails();
      setOpenEditLoanModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Update failed');
    }
  };

  // Delete Udhaar borrower record (Cascade Deletion)
  const handleDeleteLoan = () => {
    showConfirm(
      'Delete Borrower Profile',
      `Are you sure you want to delete the borrower ledger record for ${loan?.borrowerName}? This will permanently delete their profile, active loans, payments, and scheduled reminders.`,
      async () => {
        try {
          await axiosInstance.delete(API_PATHS.UDHAAR.DELETE(id));
          toast.success('Ledger record removed');
          navigate('/udhaar');
        } catch (error) {
          console.error(error);
          toast.error('Deletion failed');
        }
      }
    );
  };

  // Log repayment payment
  const handleAddRepayment = async (e) => {
    e.preventDefault();
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      toast.error('Please input a valid payment amount');
      return;
    }

    try {
      await axiosInstance.post(API_PATHS.UDHAAR.ADD_PAYMENT, {
        borrowerId: id,
        loanId: loan._activeLoanId,
        amount: Number(payAmount),
        paymentDate: payDate,
        remarks: payNotes,
        paymentMethod: payMode
      });
      toast.success('Repayment payment recorded');
      fetchLoanDetails();
      setOpenAddRepaymentModal(false);
      setPayAmount('');
      setPayNotes('');
      setPayMode('Cash');
    } catch (error) {
      console.error(error);
      toast.error('Recording repayment failed');
    }
  };

  // Settle entire remaining balance
  const handleFullSettle = () => {
    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const remaining = loan.amount - totalPaid;
    if (remaining <= 0) {
      toast.error('This loan is already fully settled');
      return;
    }

    showConfirm(
      'Settle Loan Balance',
      `Record a final payment of ₹${remaining.toLocaleString()} to mark this loan as fully settled?`,
      async () => {
        try {
          await axiosInstance.post(API_PATHS.UDHAAR.ADD_PAYMENT, {
            borrowerId: id,
            loanId: loan._activeLoanId,
            amount: remaining,
            paymentDate: moment().format('YYYY-MM-DD'),
            remarks: 'Full settlement repayment',
            paymentMethod: 'Cash'
          });
          toast.success('Loan fully settled!');
          fetchLoanDetails();
        } catch (error) {
          console.error(error);
          toast.error('Settling loan failed');
        }
      },
      { confirmText: 'Settle Loan', confirmColor: 'bg-[#22C55E] hover:bg-[#1E9E4B]' }
    );
  };

  // Prepare edit repayment form
  const handleOpenEditRepayment = (rep) => {
    setSelectedRepayment(rep);
    setEditPayAmount(rep.amount);
    setEditPayDate(moment(rep.date).format('YYYY-MM-DD'));
    setEditPayNotes(rep.notes || '');
    setEditPayMode(rep.paymentMode || 'Cash');
    setOpenEditRepaymentModal(true);
  };

  // Submit edited repayment
  const handleEditRepayment = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.UDHAAR.EDIT_PAYMENT(selectedRepayment._id),
        {
          amount: Number(editPayAmount),
          paymentDate: editPayDate,
          remarks: editPayNotes,
          paymentMethod: editPayMode
        }
      );
      toast.success('Repayment updated successfully');
      fetchLoanDetails();
      setOpenEditRepaymentModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update repayment');
    }
  };

  // Delete repayment item
  const handleDeleteRepayment = (repaymentId) => {
    showConfirm(
      'Delete Repayment Record',
      'Are you sure you want to delete this repayment record? This will adjust the borrower\'s remaining balance.',
      async () => {
        try {
          await axiosInstance.delete(API_PATHS.UDHAAR.DELETE_PAYMENT(repaymentId));
          toast.success('Repayment record deleted');
          fetchLoanDetails();
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete repayment');
        }
      }
    );
  };

  // Open receipt preview modal
  const handleViewReceipt = (rep) => {
    setReceiptRepayment(rep);
    setOpenReceiptModal(true);
  };

  // Print single receipt via child window
  const handlePrintReceipt = (rep) => {
    const printWindow = window.open('', '_blank');
    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const balance = loan.amount - totalPaid;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt-${rep.receiptNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; background-color: #fff; color: #111; }
            .receipt-box { border: 2px solid #D4AF37; padding: 25px; max-width: 450px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .logo { text-align: center; font-size: 20px; font-weight: 800; color: #D4AF37; letter-spacing: 2px; }
            .subtitle { text-align: center; font-size: 10px; color: #777; text-transform: uppercase; margin-bottom: 25px; font-weight: bold; }
            .item { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; border-bottom: 1px solid #f9f9f9; padding-bottom: 6px; }
            .label { font-weight: bold; color: #555; }
            .value { font-weight: 600; text-align: right; }
            .footer { border-top: 1px solid #f1f1f1; padding-top: 15px; margin-top: 25px; text-align: center; font-size: 10px; color: #aaa; }
            .amount { font-size: 22px; font-weight: 800; color: #22C55E; }
            @media print {
              body { padding: 0; }
              .receipt-box { border: 2px solid #D4AF37; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="logo">FINRACE</div>
            <div class="subtitle">Official Repayment Receipt</div>
            
            <div class="item" style="margin-bottom: 20px;">
              <span class="label">Receipt ID</span>
              <span class="value" style="font-family: monospace;">${rep.receiptNumber}</span>
            </div>
            <div class="item">
              <span class="label">Borrower Name</span>
              <span class="value">${loan.borrowerName}</span>
            </div>
            <div class="item">
              <span class="label">Mobile Number</span>
              <span class="value">${loan.borrowerMobile}</span>
            </div>
            <div class="item">
              <span class="label">Date Recorded</span>
              <span class="value">${new Date(rep.date).toLocaleDateString()}</span>
            </div>
            <div class="item">
              <span class="label">Payment Mode</span>
              <span class="value">${rep.paymentMode}</span>
            </div>
            <div class="item" style="margin-top: 15px; border-bottom: none;">
              <span class="label">Amount Paid</span>
              <span class="value amount">₹${rep.amount.toLocaleString()}</span>
            </div>
            <div class="item" style="margin-top: 10px; border-top: 1px dashed #D4AF37; padding-top: 12px; border-bottom: none;">
              <span class="label">Remaining Balance</span>
              <span class="value" style="color: #D4AF37; font-weight: 800;">₹${balance.toLocaleString()}</span>
            </div>
            
            <div class="footer">
              Thank you for your repayment. System generated receipt.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Computations
  const calculations = useMemo(() => {
    if (!loan) return { totalPaid: 0, remaining: 0, percentPaid: 0, isPaid: false, isOverdue: false };

    const totalPaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const remaining = loan.amount - totalPaid;
    const percentPaid = Math.min((totalPaid / loan.amount) * 100, 100);

    const isPaid = loan.status === 'Paid' || remaining <= 0;
    const isOverdue = !isPaid && moment(loan.dueDate).isBefore(moment().startOf('day'));

    return { totalPaid, remaining, percentPaid, isPaid, isOverdue };
  }, [loan]);

  // Combined timeline (repayments + audit logs sorted by date)
  const timelineEvents = useMemo(() => {
    if (!loan) return [];

    const repayments = loan.repayments.map(r => ({
      id: r._id,
      date: r.date,
      type: 'repayment',
      title: 'Repayment Received',
      desc: `₹${r.amount.toLocaleString()} paid via ${r.paymentMode}`,
      notes: r.notes,
      iconColor: 'bg-[#22C55E]',
      ref: r
    }));

    const auditLogs = loan.auditLog.map(l => ({
      id: l._id,
      date: l.timestamp,
      type: 'audit',
      title: l.action,
      desc: l.details,
      iconColor: 'bg-primary'
    }));

    return [...repayments, ...auditLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [loan]);

  // Calculate notifications schedule based on loan due dates
  const notificationSchedule = useMemo(() => {
    if (!loan || remindersList.length === 0) return [];

    const isSettled = calculations.isPaid;

    const labelMap = {
      '7_days_before': '7 Days Prior Alert',
      '3_days_before': '3 Days Prior Alert',
      'on_due_date': 'Due Date Alert',
      'overdue': 'Overdue Alert'
    };

    return remindersList.map(item => {
      let status = 'Scheduled'; // Scheduled, Sent, Deactivated

      if (isSettled) {
        status = 'Deactivated';
      } else if (item.notificationSent) {
        status = 'Sent';
      }

      return {
        label: labelMap[item.reminderType] || item.reminderType,
        date: moment(item.reminderDate).format('DD MMM YYYY'),
        status
      };
    });
  }, [loan, remindersList, calculations.isPaid]);

  if (loading && !loan) {
    return (
      <DashboardLayout activeMenu="Udhaar">
        <div className="space-y-6 animate-pulse">
          <div className="w-24 h-4 bg-white/5 rounded-full mb-6"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="card lg:col-span-4 min-h-[250px] bg-white/5 border border-white/10"></div>
            <div className="card lg:col-span-8 min-h-[250px] bg-white/5 border border-white/10"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card min-h-[150px] bg-white/5 border border-white/10"></div>
            <div className="card min-h-[150px] bg-white/5 border border-white/10"></div>
            <div className="card min-h-[150px] bg-white/5 border border-white/10"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!loan) return null;

  return (
    <DashboardLayout activeMenu="Udhaar">
      <div className="transition-page transition-colors duration-300 space-y-6">
        {/* Back Link */}
        <button
          onClick={() => navigate('/udhaar')}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)] opacity-60 hover:opacity-100 hover:text-[#D4AF37] transition cursor-pointer"
        >
          <LuArrowLeft size={14} />
          <span>Back to ledger</span>
        </button>

        {/* Profile Card & Stats Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Card */}
          <div className="card lg:col-span-4 flex flex-col justify-between border-[var(--color-border)]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {loan.borrowerPhoto ? (
                  <img
                    src={loan.borrowerPhoto}
                    alt={loan.borrowerName}
                    className="w-16 h-16 rounded-full object-cover bg-slate-800 border border-[var(--color-border)]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[var(--color-input)] border border-[var(--color-border)] flex items-center justify-center text-xl font-bold text-[#D4AF37]">
                    {loan.borrowerName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-extrabold text-white">{loan.borrowerName}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    Borrower Profile
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--color-border)]/50 text-xs text-[var(--color-text)] font-semibold">
                <p className="flex items-center gap-2 text-white/80">
                  <LuPhone size={14} className="text-[#D4AF37]" />
                  <span>{loan.borrowerMobile}</span>
                </p>
                {loan.borrowerEmail && (
                  <p className="flex items-center gap-2 text-white/80">
                    <LuMail size={14} className="text-[#D4AF37]" />
                    <span>{loan.borrowerEmail}</span>
                  </p>
                )}
                {loan.borrowerAddress && (
                  <p className="flex items-center gap-2 text-white/80">
                    <LuMapPin size={14} className="text-[#D4AF37]" />
                    <span>{loan.borrowerAddress}</span>
                  </p>
                )}
              </div>

              {loan.borrowerNotes && (
                <div className="bg-[var(--color-input)]/40 p-3 rounded-xl border border-[var(--color-border)]/20">
                  <p className="text-[10px] uppercase text-[var(--color-text)] opacity-40 font-bold mb-1">Notes</p>
                  <p className="text-xs text-[var(--color-text)] opacity-80 leading-relaxed font-semibold">
                    {loan.borrowerNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-[var(--color-border)]/50 mt-4">
              <button
                onClick={() => setOpenEditLoanModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-input)] hover:bg-[#D4AF37]/10 border border-[var(--color-border)] text-white hover:text-[#D4AF37] font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <LuPencil size={13} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleDeleteLoan}
                className="p-2 hover:bg-[#EF4444]/10 border border-[var(--color-border)] hover:border-[#EF4444]/30 text-white/60 hover:text-[#EF4444] rounded-xl transition cursor-pointer"
                title="Delete Borrower Ledger"
              >
                <LuTrash2 size={15} />
              </button>
            </div>
          </div>

          {/* Stats tracker */}
          <div className="card lg:col-span-8 flex flex-col justify-between border-[var(--color-border)]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Lending Capital Status</h3>
                  <p className="text-xs text-[var(--color-text)] opacity-60">Lent summary parameters and timeline dues.</p>
                </div>

                <div className="flex items-center gap-2">
                  {calculations.isPaid ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 rounded-lg">
                      Settle / Paid
                    </span>
                  ) : calculations.isOverdue ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded-lg animate-pulse">
                      Overdue
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-lg">
                      Pending Recovery
                    </span>
                  )}
                </div>
              </div>

              {/* Capital counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-[var(--color-input)] border border-[var(--color-border)]/50 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text)] opacity-40 font-bold mb-1">
                    Amount Lent
                  </p>
                  <h4 className="text-2xl font-extrabold text-white">₹{loan.amount.toLocaleString()}</h4>
                  {loan.interestRate && (
                    <p className="text-[10px] text-[#D4AF37] mt-1 font-semibold">@{loan.interestRate}% Interest P.A.</p>
                  )}
                </div>
                <div className="p-4 bg-[var(--color-input)] border border-[var(--color-border)]/50 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text)] opacity-40 font-bold mb-1">
                    Amount Paid
                  </p>
                  <h4 className="text-2xl font-extrabold text-[#22C55E]">₹{calculations.totalPaid.toLocaleString()}</h4>
                  <p className="text-[10px] text-[var(--color-text)] opacity-50 mt-1 font-medium">
                    From {loan.repayments.length} repayment transactions
                  </p>
                </div>
                <div className="p-4 bg-[var(--color-input)] border border-[var(--color-border)]/50 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text)] opacity-40 font-bold mb-1">
                    Outstanding Balance
                  </p>
                  <h4 className={`text-2xl font-extrabold ${calculations.remaining > 0 ? (calculations.isOverdue ? 'text-[#EF4444]' : 'text-[#D4AF37]') : 'text-[#22C55E]'}`}>
                    ₹{calculations.remaining.toLocaleString()}
                  </h4>
                  <p className="text-[10px] text-[var(--color-text)] opacity-50 mt-1 font-medium">
                    {calculations.isPaid ? 'Settled' : `Final Due: ${moment(loan.dueDate).format('DD MMM YYYY')}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Repayments Progress indicator */}
            <div className="space-y-1.5 pt-4 border-t border-[var(--color-border)]/50 mt-auto">
              <div className="flex justify-between items-center text-xs text-[var(--color-text)] opacity-60 font-semibold">
                <span className="flex items-center gap-1">
                  <LuClock size={13} />
                  {calculations.isPaid ? 'Lending Settled' : calculations.isOverdue ? `Overdue by ${moment().diff(loan.dueDate, 'days')} days` : `Due in ${moment(loan.dueDate).diff(moment(), 'days')} days`}
                </span>
                <span>{calculations.percentPaid.toFixed(1)}% Recovered</span>
              </div>
              <div className="w-full bg-[var(--color-input)] h-3 rounded-full overflow-hidden border border-[var(--color-border)]/20 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${calculations.isPaid ? 'bg-[#22C55E]' : calculations.isOverdue ? 'bg-[#EF4444]' : 'bg-[#D4AF37]'
                    }`}
                  style={{ width: `${calculations.percentPaid}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower layout split: Left (Timeline & payments) - Right (Documents & Reminders) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Repayments Ledger & Timeline logs */}
          <div className="lg:col-span-8 space-y-6">
            {/* Repayments Action header */}
            <div className="card border-[var(--color-border)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Repayments History</h3>
                  <p className="text-xs text-[var(--color-text)] opacity-60">Log and manage payments received.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenAddRepaymentModal(true)}
                    disabled={calculations.isPaid}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow transition cursor-pointer ${calculations.isPaid
                        ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                        : 'bg-[#D4AF37] hover:bg-[#B8962E] text-black'
                      }`}
                  >
                    <LuPlus size={14} />
                    <span>Record Payment</span>
                  </button>
                  <button
                    onClick={handleFullSettle}
                    disabled={calculations.isPaid}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${calculations.isPaid
                        ? 'border-white/5 text-white/20 cursor-not-allowed'
                        : 'border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/10 bg-[#22C55E]/5'
                      }`}
                  >
                    <LuCheck size={14} />
                    <span>Settle Balance</span>
                  </button>
                </div>
              </div>

              {/* Repayments List table */}
              {loan.repayments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-[var(--color-text)] opacity-40">No repayment transactions logged</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[var(--color-text)] min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]/30 text-white/40 uppercase tracking-wider font-bold">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5">Mode</th>
                        <th className="py-2.5">Receipt ID</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]/20 font-semibold">
                      {loan.repayments.map(rep => (
                        <tr key={rep._id} className="hover:bg-[var(--color-input)]/20 transition">
                          <td className="py-3 text-white/70">{new Date(rep.date).toLocaleDateString()}</td>
                          <td className="py-3 text-[#22C55E] font-bold">₹{rep.amount.toLocaleString()}</td>
                          <td className="py-3 text-white/80">{rep.paymentMode}</td>
                          <td className="py-3 text-white/50 font-mono text-[10px]">{rep.receiptNumber}</td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => handleViewReceipt(rep)}
                              className="px-2 py-1 bg-[var(--color-input)] border border-[var(--color-border)] hover:border-[#D4AF37]/30 text-white rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-[10px]"
                            >
                              <LuFileText size={10} />
                              <span>Receipt</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditRepayment(rep)}
                              className="p-1 hover:text-[#D4AF37] text-white/50 cursor-pointer inline-flex"
                              title="Edit Transaction"
                            >
                              <LuPencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteRepayment(rep._id)}
                              className="p-1 hover:text-[#EF4444] text-white/50 cursor-pointer inline-flex"
                              title="Delete Transaction"
                            >
                              <LuTrash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unified Audit and Payment logs Timeline */}
            <div className="card border-[var(--color-border)]">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <LuHistory size={16} className="text-[#D4AF37]" />
                <span>Audit & Ledger Timeline</span>
              </h3>

              <div className="relative border-l-2 border-[var(--color-border)]/40 ml-2.5 pl-6 space-y-5 py-2">
                {timelineEvents.map((event, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline bullet icon */}
                    <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-card)] ${event.iconColor}`}></div>

                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1">
                      <h4 className="text-xs font-bold text-white leading-tight">{event.title}</h4>
                      <span className="text-[10px] text-[var(--color-text)] opacity-40 font-medium whitespace-nowrap">
                        {moment(event.date).format('DD MMM YYYY, hh:mm A')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text)] opacity-60 mt-1 leading-relaxed font-semibold">
                      {event.desc}
                    </p>
                    {event.notes && (
                      <p className="text-[10px] text-[var(--color-text)] opacity-40 italic mt-0.5 font-medium">
                        Notes: "{event.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Alerts & Attachments details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Smart reminder configuration schedule */}
            <div className="card border-[var(--color-border)]">
              <h3 className="text-base font-bold text-white mb-4">Smart Reminders</h3>

              {/* Configuration channel checklist */}
              <div className="space-y-2.5 border-b border-[var(--color-border)]/40 pb-4 mb-4">
                <p className="text-[10px] uppercase text-[var(--color-text)] opacity-40 font-bold mb-2">Enabled Channels</p>
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  <label className="flex items-center gap-2 cursor-pointer text-white/80">
                    <input
                      type="checkbox"
                      checked={editEmailReminder}
                      onChange={(e) => {
                        setEditEmailReminder(e.target.checked);
                        localStorage.setItem(`reminder_email_${id}`, JSON.stringify(e.target.checked));
                      }}
                      className="accent-[#D4AF37]"
                    />
                    <span>Email Alerts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white/80">
                    <input
                      type="checkbox"
                      checked={editPushReminder}
                      onChange={(e) => {
                        setEditPushReminder(e.target.checked);
                        localStorage.setItem(`reminder_push_${id}`, JSON.stringify(e.target.checked));
                      }}
                      className="accent-[#D4AF37]"
                    />
                    <span>Push Alerts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white/80">
                    <input
                      type="checkbox"
                      checked={editInAppReminder}
                      onChange={(e) => {
                        setEditInAppReminder(e.target.checked);
                        localStorage.setItem(`reminder_inapp_${id}`, JSON.stringify(e.target.checked));
                      }}
                      className="accent-[#D4AF37]"
                    />
                    <span>In-App Alerts</span>
                  </label>
                </div>
              </div>

              {/* Reminders list schedule */}
              <div className="space-y-3.5">
                <p className="text-[10px] uppercase text-[var(--color-text)] opacity-40 font-bold mb-2">Notification Milestones</p>
                {notificationSchedule.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs p-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-white">{milestone.label}</p>
                      <p className="text-[10px] text-[var(--color-text)] opacity-50 font-medium mt-0.5">
                        Target Date: {milestone.date}
                      </p>
                    </div>

                    {milestone.status === 'Sent' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 rounded-md">
                        Sent
                      </span>
                    ) : milestone.status === 'Deactivated' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 text-white/30 border border-white/5 rounded-md">
                        Inactive
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Document receipt uploads */}
            <div className="card border-[var(--color-border)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)]/40 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Lending Documents</h3>
                  <p className="text-xs text-[var(--color-text)] opacity-60">Supporting bills and receipt files.</p>
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    id="docDetailUpload"
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="docDetailUpload"
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-input)] border border-[var(--color-border)] hover:border-[#D4AF37]/30 text-white rounded-lg transition cursor-pointer text-xs font-bold"
                  >
                    <LuPlus size={13} />
                    <span>Upload</span>
                  </label>
                </div>
              </div>

              {/* Uploaded documents lists */}
              {loan.documents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-[var(--color-text)] opacity-40">No uploaded files attached</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {loan.documents.map(doc => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <LuFileText size={16} className="text-[#D4AF37] shrink-0" />
                        <span className="text-xs text-white truncate max-w-[150px] font-bold" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="p-1 hover:text-[#D4AF37] text-white/50 cursor-pointer inline-flex"
                          title="Download File"
                        >
                          <LuDownload size={13} />
                        </a>
                        <button
                          onClick={() => handleDocDelete(doc._id)}
                          className="p-1 hover:text-[#EF4444] text-white/50 cursor-pointer inline-flex"
                          title="Delete File"
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== MODAL: EDIT UDHAAR ==================== */}
        <Modal
          isOpen={openEditLoanModal}
          onClose={() => setOpenEditLoanModal(false)}
          title="Update Lending Parameters"
        >
          <form onSubmit={handleUpdateLoan} className="space-y-5 text-left max-h-[80vh] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider border-b border-[var(--color-border)]/50 pb-1.5 mb-3">
              1. Person Details
            </h4>

            <ProfilePhotoSelector image={editPhoto} setImage={handlePhotoUpload} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Input
                label="Mobile Number *"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <Input
                label="Physical Address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Notes about Person</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full min-h-[70px] bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
              />
            </div>

            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider border-b border-[var(--color-border)]/50 pb-1.5 mb-3 pt-2">
              2. Loan Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount Lent (₹) *"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Due Date *</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Interest Rate %"
                type="number"
                value={editInterest}
                onChange={(e) => setEditInterest(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Frequency</label>
                <select
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
                >
                  <option value="One Time">One Time</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Manual Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Fully Paid</option>
                </select>
              </div>
            </div>

            <Input
              label="Purpose of Borrowing"
              value={editPurpose}
              onChange={(e) => setEditPurpose(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]/50">
              <button
                type="button"
                onClick={() => setOpenEditLoanModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white border border-[var(--color-border)] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#D4AF37] hover:bg-[#B8962E] text-black rounded-xl shadow transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODAL: ADD REPAYMENT ==================== */}
        <Modal
          isOpen={openAddRepaymentModal}
          onClose={() => setOpenAddRepaymentModal(false)}
          title="Record Repayment Payment"
        >
          <form onSubmit={handleAddRepayment} className="space-y-5 text-left">
            <p className="text-xs text-[var(--color-text)] opacity-60">
              Outstanding debt amount for this loan: <span className="text-[#D4AF37] font-bold">₹{calculations.remaining.toLocaleString()}</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Repayment Amount (₹) *"
                type="number"
                placeholder="e.g. 15000"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Payment Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Payment Mode</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value)}
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Transaction Notes</label>
              <textarea
                placeholder="e.g. First installment, paid via GPay"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full min-h-[70px] bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]/50">
              <button
                type="button"
                onClick={() => setOpenAddRepaymentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white border border-[var(--color-border)] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#D4AF37] hover:bg-[#B8962E] text-black rounded-xl shadow transition cursor-pointer"
              >
                Record Repayment
              </button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODAL: EDIT REPAYMENT ==================== */}
        <Modal
          isOpen={openEditRepaymentModal}
          onClose={() => setOpenEditRepaymentModal(false)}
          title="Edit Repayment Transaction"
        >
          <form onSubmit={handleEditRepayment} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Repayment Amount (₹) *"
                type="number"
                value={editPayAmount}
                onChange={(e) => setEditPayAmount(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Payment Date *</label>
                <input
                  type="date"
                  value={editPayDate}
                  onChange={(e) => setEditPayDate(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Payment Mode</label>
              <select
                value={editPayMode}
                onChange={(e) => setEditPayMode(e.target.value)}
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl px-3.5 py-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">Transaction Notes</label>
              <textarea
                value={editPayNotes}
                onChange={(e) => setEditPayNotes(e.target.value)}
                className="w-full min-h-[70px] bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text)] outline-none focus:border-[#D4AF37] transition"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]/50">
              <button
                type="button"
                onClick={() => setOpenEditRepaymentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white border border-[var(--color-border)] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#D4AF37] hover:bg-[#B8962E] text-black rounded-xl shadow transition cursor-pointer"
              >
                Save Repayment
              </button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODAL: RECEIPT OVERLAY ==================== */}
        <Modal
          isOpen={openReceiptModal}
          onClose={() => setOpenReceiptModal(false)}
          title="Repayment Transaction Receipt"
        >
          {receiptRepayment && (
            <div className="space-y-6 text-left">
              {/* Receipt Layout Box */}
              <div className="p-5 border-2 border-[#D4AF37]/60 bg-[var(--color-input)] rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--color-border)]/50 pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-[#D4AF37] tracking-wider">FINRACE</h4>
                    <p className="text-[9px] text-[var(--color-text)] opacity-50 uppercase tracking-widest mt-0.5">
                      Transaction Record
                    </p>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">{receiptRepayment.receiptNumber}</span>
                </div>

                <div className="space-y-2.5 text-xs text-[var(--color-text)] font-semibold">
                  <div className="flex justify-between">
                    <span className="opacity-50">Borrower Name</span>
                    <span className="text-white">{loan.borrowerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Mobile Number</span>
                    <span className="text-white">{loan.borrowerMobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Date Received</span>
                    <span className="text-white">{new Date(receiptRepayment.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Payment Mode</span>
                    <span className="text-white">{receiptRepayment.paymentMode}</span>
                  </div>
                  {receiptRepayment.notes && (
                    <div className="flex justify-between">
                      <span className="opacity-50">Notes</span>
                      <span className="text-white truncate max-w-[200px]">{receiptRepayment.notes}</span>
                    </div>
                  )}

                  <div className="border-t border-[var(--color-border)]/40 pt-3 flex justify-between items-baseline">
                    <span className="opacity-50 font-bold">Amount Paid</span>
                    <span className="text-xl font-black text-[#22C55E]">
                      ₹{receiptRepayment.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-[#D4AF37]/40 pt-3 flex justify-between items-baseline">
                    <span className="opacity-50 font-bold">Lending Balance Outstanding</span>
                    <span className="text-sm font-extrabold text-[#D4AF37]">
                      ₹{calculations.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setOpenReceiptModal(false)}
                  className="flex-1 px-4 py-3 border border-[var(--color-border)] hover:bg-white/5 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close Receipt
                </button>
                <button
                  onClick={() => handlePrintReceipt(receiptRepayment)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37] hover:bg-[#B8962E] text-black text-xs font-bold rounded-xl shadow transition cursor-pointer"
                >
                  <LuPrinter size={14} />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ==================== CONFIRMATION MODAL ==================== */}
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
        >
          <div className="space-y-6 text-left">
            <p className="text-sm text-[var(--color-text)] opacity-80 leading-relaxed font-semibold">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-3 border border-[var(--color-border)] hover:bg-white/5 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-3 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default UdhaarDetails;
