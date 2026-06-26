import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import {
  LuSparkles,
  LuScanLine,
  LuCheck,
  LuCreditCard,
  LuRefreshCw,
  LuExternalLink,
  LuArrowUpRight,
  LuHistory
} from 'react-icons/lu';

const Subscription = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subData, setSubData] = useState(null);

  // Fetch current plan status and billing history
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.SUBSCRIPTION.GET_PLAN);
      setSubData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Mock checkout redirection completion
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mockSuccess = queryParams.get('mock_checkout_success');
    const plan = queryParams.get('plan');
    const success = queryParams.get('success');

    if (mockSuccess && plan) {
      const activateMock = async () => {
        try {
          const loadingToast = toast.loading(`Activating ${plan} Subscription...`);
          await axiosInstance.post(API_PATHS.STRIPE.MOCK_SUCCESS, { planName: plan });
          toast.dismiss(loadingToast);
          toast.success(`Mock Subscription to ${plan} Plan Activated!`);
          // Clean parameters in URL
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchSubscriptionData();
        } catch (err) {
          console.error(err);
          toast.error('Failed to activate mock subscription');
        }
      };
      activateMock();
    } else if (success) {
      toast.success('Subscription checkout completed successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchSubscriptionData();
    } else {
      fetchSubscriptionData();
    }
  }, [location, fetchSubscriptionData]);

  // Handle Checkout session click
  const handleUpgrade = async (planName) => {
    try {
      setActionLoading(true);
      const res = await axiosInstance.post(API_PATHS.STRIPE.CHECKOUT, { planName });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start checkout session');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Customer Billing Portal redirection
  const handleManageBilling = async () => {
    try {
      setActionLoading(true);
      const res = await axiosInstance.post(API_PATHS.STRIPE.PORTAL);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to open Stripe billing portal');
    } finally {
      setActionLoading(false);
    }
  };



  const currentPlan = subData?.plan || 'Free';
  const insightsPercent = subData ? Math.min(100, (subData.insightsUsed / subData.insightsLimit) * 100) : 0;
  const scansPercent = subData ? Math.min(100, (subData.billScansUsed / subData.billScansLimit) * 100) : 0;

  const planCards = [
    {
      name: 'Basic',
      price: '₹100',
      insights: 15,
      scans: 20,
      color: 'border-white/10 hover:border-[#D4AF37]/50',
      badgeColor: 'bg-white/5 text-white/70',
      btnStyle: 'bg-white/5 border border-white/15 text-white hover:bg-white/10'
    },
    {
      name: 'Pro',
      price: '₹250',
      insights: 25,
      scans: 30,
      color: 'border-[#7B61FF]/30 hover:border-[#7B61FF] shadow-lg shadow-[#7B61FF]/5',
      badgeColor: 'bg-[#7B61FF]/10 text-[#9E8AFF]',
      btnStyle: 'bg-[#7B61FF] text-white hover:bg-[#684EE3]'
    },
    {
      name: 'Premium',
      price: '₹450',
      insights: 35,
      scans: 40,
      color: 'border-[#D4AF37]/30 hover:border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5',
      badgeColor: 'bg-[#D4AF37]/10 text-[#E5C158]',
      btnStyle: 'bg-[#D4AF37] text-black hover:bg-[#B8962E]'
    }
  ];

  return (
    <DashboardLayout activeMenu="Subscription">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Subscription & Billing</h2>
            <p className="text-xs text-[var(--color-text)] opacity-60">Manage subscription tiers, billing invoice logs, and quota limits.</p>
          </div>
          <button
            onClick={fetchSubscriptionData}
            className="self-start md:self-auto p-2 bg-[var(--color-input)] hover:bg-[#D4AF37]/10 border border-[var(--color-border)] text-white hover:text-[#D4AF37] rounded-xl transition cursor-pointer"
            title="Refresh Plan Details"
          >
            <LuRefreshCw size={15} />
          </button>
        </div>

        {/* Current Active Plan Tracker (Only visible if subscribed or has usage) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 card border-[var(--color-border)] flex flex-col justify-between p-6 bg-[#17171F]">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase">Current Subscription</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-white">{currentPlan} Plan</h3>
                {subData?.status === 'active' && (
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 rounded-md">Active</span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text)] opacity-60">
                {currentPlan === 'Free'
                  ? 'Upgrade to Basic, Pro, or Premium plans to unlock premium tools and higher quotas.'
                  : `Your next renewal date is ${moment(subData?.currentPeriodEnd).format('DD MMM YYYY')}.`}
              </p>
            </div>

          </div>

          <div className="lg:col-span-8 card border-[var(--color-border)] p-6 space-y-6">
            <span className="text-[10px] font-bold text-[#7B61FF] tracking-widest uppercase">Monthly Usage Quotas</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* AI Insights Progress */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <LuSparkles size={14} className="text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-white">AI Insights Usage</span>
                  </div>
                  <span className="text-xs font-bold text-white">{subData?.insightsUsed || 0} / {subData?.insightsLimit || 3}</span>
                </div>
                <div className="w-full bg-[var(--color-input)] rounded-full h-2">
                  <div 
                    className="bg-[#D4AF37] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${insightsPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--color-text)] opacity-50">Resets automatically at the start of your billing period.</p>
              </div>

              {/* Bill Scans Progress */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <LuScanLine size={14} className="text-[#7B61FF]" />
                    <span className="text-xs font-semibold text-white">Document Scans Usage</span>
                  </div>
                  <span className="text-xs font-bold text-white">{subData?.billScansUsed || 0} / {subData?.billScansLimit || 5}</span>
                </div>
                <div className="w-full bg-[var(--color-input)] rounded-full h-2">
                  <div 
                    className="bg-[#7B61FF] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${scansPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--color-text)] opacity-50">Resets automatically at the start of your billing period.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="space-y-4 pt-4">
          <div className="text-center space-y-1.5">
            <h4 className="text-xl font-bold text-white">Choose Your Growth Plan</h4>
            <p className="text-xs text-[var(--color-text)] opacity-60">Upgrade or downgrade your membership scale at any time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planCards.map((card) => {
              const isSelected = currentPlan === card.name;
              return (
                <div
                  key={card.name}
                  className={`card border bg-[#17171F] backdrop-blur-md transition-all duration-300 p-6 flex flex-col justify-between h-[360px] relative ${card.color} ${
                    isSelected ? 'ring-2 ring-[#D4AF37]' : ''
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-md">
                      Current Plan
                    </span>
                  )}
                  <div className="space-y-5">
                    <div>
                      <h5 className="text-base font-bold text-white">{card.name} Plan</h5>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-extrabold text-white">{card.price}</span>
                        <span className="text-xs text-[var(--color-text)] opacity-50">/ month</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-[var(--color-text)]">
                      <div className="flex items-center gap-2.5">
                        <LuCheck size={13} className="text-[#D4AF37] flex-shrink-0" />
                        <span>{card.insights} AI Insights / month</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <LuCheck size={13} className="text-[#D4AF37] flex-shrink-0" />
                        <span>{card.scans} Bill scans / month</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <LuCheck size={13} className="text-[#D4AF37] flex-shrink-0" />
                        <span>Premium wealth dashboard access</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <LuCheck size={13} className="text-[#D4AF37] flex-shrink-0" />
                        <span>Limit & usage tracking statistics</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleUpgrade(card.name)}
                      disabled={isSelected || actionLoading}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${card.btnStyle}`}
                    >
                      {isSelected ? 'Current Active Plan' : `Upgrade to ${card.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="card border-[var(--color-border)] overflow-hidden">
          <div className="px-6 py-4 bg-[var(--color-input)] border-b border-[var(--color-border)]/40">
            <h5 className="text-xs font-bold uppercase text-[#D4AF37] tracking-wider">Features Comparison Matrix</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80 border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]/40 text-[10px] uppercase font-black text-white/50 bg-[#17171F]">
                  <th className="px-6 py-3.5">Key Core Benefits</th>
                  <th className="px-6 py-3.5">Basic</th>
                  <th className="px-6 py-3.5">Pro</th>
                  <th className="px-6 py-3.5">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/20 font-semibold bg-[#17171F]/40">
                <tr>
                  <td className="px-6 py-3">Monthly AI Analysis Qty</td>
                  <td className="px-6 py-3 text-white font-bold">15 Insights</td>
                  <td className="px-6 py-3 text-white font-bold text-[#7B61FF]">25 Insights</td>
                  <td className="px-6 py-3 text-white font-bold text-[#D4AF37]">35 Insights</td>
                </tr>
                <tr>
                  <td className="px-6 py-3">Receipt OCR Scans / Month</td>
                  <td className="px-6 py-3 text-white font-bold">20 Bills</td>
                  <td className="px-6 py-3 text-white font-bold text-[#7B61FF]">30 Bills</td>
                  <td className="px-6 py-3 text-white font-bold text-[#D4AF37]">40 Bills</td>
                </tr>
                <tr>
                  <td className="px-6 py-3">Comprehensive Dashboard</td>
                  <td className="px-6 py-3 text-white">Full Access</td>
                  <td className="px-6 py-3 text-white">Full Access</td>
                  <td className="px-6 py-3 text-white">Full Access</td>
                </tr>
                <tr>
                  <td className="px-6 py-3">Customer Billing Portal</td>
                  <td className="px-6 py-3 text-white">Supported (Stripe)</td>
                  <td className="px-6 py-3 text-white">Supported (Stripe)</td>
                  <td className="px-6 py-3 text-white">Supported (Stripe)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice logs / Billing History */}
        <div className="card border-[var(--color-border)] overflow-hidden">
          <div className="px-6 py-4 bg-[var(--color-input)] border-b border-[var(--color-border)]/40 flex items-center gap-2">
            <LuHistory size={14} className="text-[#7B61FF]" />
            <h5 className="text-xs font-bold uppercase text-[#7B61FF] tracking-wider">Invoice Billing Logs</h5>
          </div>

          {!subData?.billingHistory || subData.billingHistory.length === 0 ? (
            <div className="text-center py-8 bg-[#17171F]/40">
              <p className="text-xs text-[var(--color-text)] opacity-40">No past transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#17171F]/20">
              <table className="w-full text-left text-xs text-white/80 border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)]/40 text-[10px] uppercase font-black text-white/50 bg-[#17171F]">
                    <th className="px-6 py-3.5">Invoice date</th>
                    <th className="px-6 py-3.5">Receipt / Invoice reference</th>
                    <th className="px-6 py-3.5">Amount charged</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/20 font-semibold">
                  {subData.billingHistory.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-3 text-white/70">
                        {moment(invoice.invoiceDate).format('DD MMMM YYYY')}
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px] text-white/40">
                        {invoice.stripeInvoiceId}
                      </td>
                      <td className="px-6 py-3 text-white font-bold">
                        ₹{invoice.amount.toLocaleString()} {String(invoice.currency).toUpperCase()}
                      </td>
                      <td className="px-6 py-3">
                        {invoice.status === 'paid' ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 rounded-md">Paid</span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded-md">Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
