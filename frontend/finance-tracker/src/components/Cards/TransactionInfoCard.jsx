import React from 'react'
import {
    LuUtensils,
    LuTrendingUp,
    LuTrendingDown,
    LuTrash2,
} from "react-icons/lu";

const TransactionInfoCard = React.memo(({ title, icon, date, amount, type, hideDeleteBtn, onDelete, deleteButtonRef }) => {
    const getAmountStyles = () =>
        type === 'income' ? 'text-income' : 'text-expense';

    const handleDelete = (e) => {
        e.stopPropagation();
        if (typeof onDelete === 'function') onDelete();
    };

    return (
        <div className='flex items-center gap-3 sm:gap-4 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:bg-[var(--color-input)] cursor-pointer group border border-transparent hover:border-[var(--color-border)]'>
            {/* Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl text-[var(--color-text)] bg-[var(--color-input)] rounded-xl flex-shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-sm">
                {icon ? (
                    icon.startsWith('http') || icon.startsWith('/') ? (
                        <img src={icon} alt={title} className='w-5 h-5 sm:w-6 sm:h-6' />
                    ) : (
                        <span className="text-2xl sm:text-2xl">{icon}</span>
                    )
                ) : (
                    <LuUtensils className="text-lg sm:text-xl" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                {/* Title and Date */}
                <div className="min-w-0 flex-1">
                    <p className='text-sm sm:text-base text-[var(--color-text)] font-semibold truncate mb-0.5'>{title}</p>
                    <p className="text-xs sm:text-xs text-[var(--color-text)] opacity-50">{date}</p>
                </div>

                {/* Amount and Delete Button Stacked */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {/* Amount with Trend Icon */}
                    <div className={`flex items-center gap-1.5 ${getAmountStyles()}`}>
                        <h6 className="text-sm sm:text-base font-bold whitespace-nowrap">
                            {type === "income" ? "+" : "-"}₹{amount.toLocaleString()}
                        </h6>
                        {type === "income" ? (
                            <LuTrendingUp className="text-sm sm:text-base flex-shrink-0" />
                        ) : (
                            <LuTrendingDown className="text-sm sm:text-base flex-shrink-0" />
                        )}
                    </div>

                    {/* Delete Button Below */}
                    {!hideDeleteBtn && (
                        <button
                            ref={deleteButtonRef}
                            className='text-[var(--color-text)] opacity-40 hover:opacity-100 hover:text-red-500 transition-all duration-200 cursor-pointer'
                            onClick={handleDelete}
                            aria-label="Delete transaction"
                        >
                            <LuTrash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
});

TransactionInfoCard.displayName = "TransactionInfoCard";

export default TransactionInfoCard;