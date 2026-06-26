import React, { useMemo } from 'react'
import { LuPlus } from "react-icons/lu";
import { prepareExpenseLineChartData } from '../../utils/helper';
import CustomLineChart from '../Charts/CustomLineChart';

const ExpenseOverview = React.memo(({ chartData, transactions, onAddExpense, addButtonRef, dateRange, setDateRange }) => {

    return <div className="card">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
                 <h5 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--color-text)] mb-1 transition-colors duration-200 hover:text-primary">
                    Expense Overview ({dateRange === 'all' ? 'Lifetime' : `Last ${dateRange} Days`})
                </h5>
                <p className="text-xs sm:text-sm text-[var(--color-text)] opacity-60 line-clamp-2">
                    Track your spending trends over time and analyze your expenses.
                </p>
            </div>

            {/* Date Range Selector */}
            {setDateRange && (
                <div className="flex bg-[var(--color-input)] p-1 rounded-lg flex-shrink-0">
                    {['30', '90', '365', 'all'].map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === range
                                ? 'bg-primary text-white shadow'
                                : 'text-[var(--color-text)] opacity-70 hover:opacity-100'
                                }`}
                        >
                            {range === 'all' ? 'Lifetime' : `${range} Days`}
                        </button>
                    ))}
                </div>
            )}

            <button ref={addButtonRef} className="add-btn add-btn-fill whitespace-nowrap flex-shrink-0 w-full sm:w-auto" onClick={onAddExpense}>
                <LuPlus className='text-base sm:text-lg' />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add Expense</span>
            </button>
        </div>

        <div className="mt-4 sm:mt-6">
            <CustomLineChart key={dateRange} data={chartData || []} />
        </div>
    </div>
});

ExpenseOverview.displayName = 'ExpenseOverview';

export default ExpenseOverview