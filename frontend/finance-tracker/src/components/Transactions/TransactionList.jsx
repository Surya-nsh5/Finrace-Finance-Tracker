import React, { useState } from "react";
import moment from "moment";
import {
    LuTrendingUp,
    LuTrendingDown,
    LuTrash2,
    LuImage,
    LuRefreshCw,
    LuCheck,
    LuX,
} from "react-icons/lu";
import Modal from "../layouts/Modal";

const TransactionItem = React.memo(({ transaction, onImageClick, onDeleteConfirm, isDeleting, setDeletingId }) => (
    <div
        className="group flex items-center gap-4 p-4 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-input)] transition-all duration-200 cursor-default border border-transparent hover:border-[var(--color-border)] shadow-sm"
    >
        {/* Left: Main Icon */}
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl flex-shrink-0 text-[var(--color-text)] bg-[var(--color-input)] shadow-sm transition-transform duration-200 group-hover:scale-105`}>
            {transaction.icon ? (
                transaction.icon.startsWith("http") ? (
                    <img
                        src={transaction.icon}
                        alt="icon"
                        className="w-full h-full rounded-xl object-cover"
                    />
                ) : (
                    <span>{transaction.icon}</span>
                )
            ) : (
                transaction.category ? (
                    <span className="capitalize">{transaction.category[0]}</span>
                ) : (
                    <span className="capitalize">{transaction.title[0]}</span>
                )
            )}
        </div>

        {/* Middle & Right: Details and Actions */}
        <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-4 min-w-0">
            {/* Details (Title and Date) */}
            <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-bold text-[var(--color-text)] leading-tight truncate">
                    {transaction.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-[var(--color-text)] opacity-50 font-medium">
                        {moment(transaction.date).format("DD MMM YYYY")}
                    </span>
                    {transaction.image && (
                        <button
                            onClick={() => onImageClick(transaction.image)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="View Receipt"
                        >
                            <LuImage size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Actions Row - Stacked on Mobile/Tablet, Inline on lg+ */}
            <div className="flex items-center justify-between lg:justify-end gap-4 mt-1.5 lg:mt-0">
                {/* Action Side (Trash/Confirm) */}
                <div className="flex items-center lg:order-2">
                    {isDeleting ? (
                        <div className="flex items-center gap-1.5 bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)] shadow-sm animate-fade-in">
                            <button
                                onClick={() => {
                                    onDeleteConfirm(transaction._id, transaction.type);
                                    setDeletingId(null);
                                }}
                                className="p-1.5 bg-income/10 text-income hover:bg-income/20 rounded-md transition"
                                title="Confirm Delete"
                            >
                                <LuCheck size={14} />
                            </button>
                            <button
                                onClick={() => setDeletingId(null)}
                                className="p-1.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 rounded-md transition"
                                title="Cancel"
                            >
                                <LuX size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setDeletingId(transaction._id)}
                            className="text-[var(--color-text)] opacity-40 hover:opacity-100 hover:text-red-500 transition-all duration-200 cursor-pointer p-1"
                            title="Delete"
                        >
                            <LuTrash2 size={18} />
                        </button>
                    )}
                </div>

                {/* Amount Display */}
                <div className={`flex items-center gap-1.5 font-extrabold text-sm sm:text-base lg:order-1 ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    <span className="whitespace-nowrap">
                        {transaction.type === 'income' ? '+' : '-'}₹{Number(transaction.amount).toLocaleString()}
                    </span>
                    {transaction.type === 'income' ? (
                        <LuTrendingUp className="text-sm sm:text-base" />
                    ) : (
                        <LuTrendingDown className="text-sm sm:text-base" />
                    )}
                </div>
            </div>
        </div>
    </div>
));

TransactionItem.displayName = "TransactionItem";

const TransactionList = React.memo(({ transactions, loading, onDelete, onRefresh }) => {
    const [imageModal, setImageModal] = useState({ open: false, url: "" });
    const [deletingId, setDeletingId] = useState(null); // Track which transaction is being deleted

    const handleImageClick = React.useCallback((imageUrl) => {
        setImageModal({ open: true, url: imageUrl });
    }, []);

    const handleDeleteConfirm = React.useCallback((id, type) => {
        onDelete(id, type);
    }, [onDelete]);

    if (loading) {
        return (
            <div className="card">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mb-4"></div>
                    <p className="text-[var(--color-text)] opacity-60">Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="card">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <LuRefreshCw className="text-primary text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                        No transactions yet
                    </h3>
                    <p className="text-[var(--color-text)] opacity-60 text-center max-w-md">
                        Start by adding your first transaction using the button above
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--color-text)]">
                        Recent Transactions
                    </h2>
                    <button
                        onClick={onRefresh}
                        className="p-2 hover:bg-[var(--color-input)] rounded-lg transition"
                        title="Refresh"
                    >
                        <LuRefreshCw className="text-[var(--color-text)] opacity-60" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {transactions.map((transaction) => (
                        <TransactionItem
                            key={transaction._id}
                            transaction={transaction}
                            onImageClick={handleImageClick}
                            onDeleteConfirm={handleDeleteConfirm}
                            isDeleting={deletingId === transaction._id}
                            setDeletingId={setDeletingId}
                        />
                    ))}
                </div>
            </div>

            {/* Image Modal */}
            <Modal
                isOpen={imageModal.open}
                onClose={() => setImageModal({ open: false, url: "" })}
                title="Receipt Image"
            >
                <div className="flex items-center justify-center">
                    <img
                        src={imageModal.url}
                        alt="Receipt"
                        className="max-w-full max-h-[70vh] rounded-lg"
                        loading="lazy"
                    />
                </div>
            </Modal>
        </>
    );
});

TransactionList.displayName = "TransactionList";

export default TransactionList;
