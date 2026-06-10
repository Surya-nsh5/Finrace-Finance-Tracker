import moment from 'moment';
import React, { useMemo, useCallback } from 'react'
import { LuArrowRight } from 'react-icons/lu';
import TransactionInfoCard from '../Cards/TransactionInfoCard';
import Skeleton from '../common/Skeleton';


const RecentTransactions = React.memo(({ transactions, onSeeMore, loading = false }) => {
  // Memoize recent transactions to prevent unnecessary re-renders
  const recentTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return transactions.slice(0, 5);
  }, [transactions]);

  const handleSeeMore = useCallback(() => {
    onSeeMore?.();
  }, [onSeeMore]);

  if (loading) {
    return (
      <div className='card h-full flex flex-col'>
        <div className="flex items-start justify-between mb-4 sm:mb-6 flex-shrink-0">
          <Skeleton width="150px" height="24px" />
          <Skeleton width="60px" height="20px" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="circular" width="48px" height="48px" />
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height="16px" />
                <Skeleton width="40%" height="12px" />
              </div>
              <Skeleton width="80px" height="20px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='card h-full flex flex-col'>
      <div className="flex items-start justify-between mb-4 sm:mb-6 flex-shrink-0">
        <h5 className="text-base sm:text-lg font-bold text-[var(--color-text)] transition-colors duration-200 hover:text-primary">Recent Transactions</h5>
        <button
          className="text-xs sm:text-sm text-[var(--color-text)] opacity-70 hover:opacity-100 hover:text-primary font-medium flex items-center gap-1 transition-all duration-200 hover:gap-2 flex-shrink-0"
          onClick={handleSeeMore}
        >
          <span className="hidden xs:inline">See All</span>
          <span className="xs:hidden">All</span>
          <LuArrowRight className="text-sm sm:text-base" />
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3 flex-1">
        {recentTransactions.map((item, index) => (
          <div
            key={item._id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <TransactionInfoCard
              title={item.type === 'expense' ? item.category : item.source}
              icon={item.icon}
              date={moment(item.date).format('Do MMM YYYY')}
              amount={item.amount}
              type={item.type}
              hideDeleteBtn
            />
          </div>
        ))}
      </div>
    </div>
  );
});

RecentTransactions.displayName = 'RecentTransactions';

export default RecentTransactions