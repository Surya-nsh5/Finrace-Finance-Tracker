import React, { useState, useEffect, useRef } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../layouts/EmojiPickerPopup";
import {
    LuTrendingUp,
    LuTrendingDown,
    LuUpload,
    LuX,
    LuImage,
    LuScan,
} from "react-icons/lu";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-hot-toast";

const UnifiedTransactionForm = ({ onAddTransaction, submitHandlerRef }) => {
    const [transactionType, setTransactionType] = useState("expense"); // 'income' or 'expense'
    const [transaction, setTransaction] = useState({
        title: "",
        amount: "",
        date: "",
        icon: "",
        image: null,
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const transactionRef = useRef(transaction);
    const typeRef = useRef(transactionType);

    // Keep refs in sync
    useEffect(() => {
        transactionRef.current = transaction;
        typeRef.current = transactionType;
    }, [transaction, transactionType]);

    const handleChange = (key, value) =>
        setTransaction({ ...transaction, [key]: value });

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setTransaction({ ...transaction, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const scanBillImage = async () => {
        if (!transaction.image) {
            toast.error("Please upload a bill image first");
            return;
        }

        setScanning(true);
        try {
            const formData = new FormData();
            formData.append("bill", transaction.image);

            const response = await axiosInstance.post(API_PATHS.BILL.SCAN, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data && response.data.data) {
                const { amount, category, date } = response.data.data;

                setTransaction((prev) => ({
                    ...prev,
                    amount: amount != null ? String(amount) : "",
                    title: category || "",
                    date: date || "",
                }));

                toast.success("Bill scanned successfully!");
            } else {
                toast.error("No data extracted from bill");
            }
        } catch (error) {
            console.error("Error scanning bill:", error);
            toast.error(error.response?.data?.message || "Failed to scan bill");
        } finally {
            setScanning(false);
        }
    };

    const removeImage = () => {
        setTransaction({ ...transaction, image: null });
        setImagePreview(null);
    };

    useEffect(() => {
        if (submitHandlerRef) {
            submitHandlerRef.current = () => {
                onAddTransaction({
                    type: typeRef.current,
                    ...transactionRef.current,
                });
                // Reset form
                setTransaction({
                    title: "",
                    amount: "",
                    date: "",
                    icon: "",
                    image: null,
                });
                setImagePreview(null);
                setTransactionType("expense");
            };
        }
    }, [submitHandlerRef, onAddTransaction]);

    return (
        <div className="animate-fade-in">
            {/* Transaction Type Selector */}
            <div className="mb-6 animate-scale-in">
                <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-3">
                    Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setTransactionType("income")}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${transactionType === "income"
                            ? "bg-income text-white"
                            : "bg-[var(--color-input)] text-[var(--color-text)] opacity-70 hover:opacity-100 border border-[var(--color-border)]"
                            }`}
                    >
                        <LuTrendingUp className="text-xl" />
                        <span>Income</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTransactionType("expense")}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${transactionType === "expense"
                            ? "bg-expense text-white"
                            : "bg-[var(--color-input)] text-[var(--color-text)] opacity-70 hover:opacity-100 border border-[var(--color-border)]"
                            }`}
                    >
                        <LuTrendingDown className="text-xl" />
                        <span>Expense</span>
                    </button>
                </div>
            </div>

            {/* Icon Picker Section */}
            <div className="mb-3 sm:mb-4 animate-scale-in" style={{ animationDelay: "50ms" }}>
                <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-2">
                    Choose Icon
                </label>
                <EmojiPickerPopup
                    icon={transaction.icon}
                    onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
                />
            </div>

            {/* Form Fields */}
            <div className="space-y-3 sm:space-y-4">
                <div className="animate-slide-in-left" style={{ animationDelay: "100ms" }}>
                    <Input
                        value={transaction.title}
                        onChange={({ target }) => handleChange("title", target.value)}
                        label={transactionType === "income" ? "Income Source" : "Expense Category"}
                        placeholder={
                            transactionType === "income"
                                ? "e.g., Salary, Freelance, Business"
                                : "e.g., Rent, Groceries, Transport"
                        }
                        type="text"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="animate-slide-in-left" style={{ animationDelay: "150ms" }}>
                        <Input
                            value={transaction.amount}
                            onChange={({ target }) => handleChange("amount", target.value)}
                            label="Amount (₹)"
                            placeholder="Enter amount"
                            type="number"
                        />
                    </div>

                    <div className="animate-slide-in-right" style={{ animationDelay: "200ms" }}>
                        <Input
                            value={transaction.date}
                            onChange={({ target }) => handleChange("date", target.value)}
                            label="Date"
                            placeholder=""
                            type="date"
                        />
                    </div>
                </div>

                {/* Image Upload Section - For Both Income and Expense */}
                <div className="animate-fade-in" style={{ animationDelay: "250ms" }}>
                    <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-2">
                        Upload Receipt/Image (Optional)
                    </label>

                    {!imagePreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer bg-[var(--color-input)] hover:bg-[var(--color-border)] transition-all duration-150 hover:border-primary">
                            <div className="flex flex-col items-center justify-center pt-3 pb-3 sm:pt-5 sm:pb-6">
                                <LuUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-[var(--color-text)] opacity-40" />
                                <p className="mb-1 text-xs sm:text-sm text-[var(--color-text)] opacity-60 text-center px-2">
                                    <span className="font-semibold">Click to upload</span>
                                    <span className="hidden sm:inline"> or drag and drop</span>
                                </p>
                                <p className="text-xs text-[var(--color-text)] opacity-40">
                                    PNG, JPG, JPEG (MAX. 5MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </label>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            <div className="relative w-full h-36 sm:h-48 border-2 border-[var(--color-border)] rounded-xl overflow-hidden group will-change-transform">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover will-change-transform"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-100 opacity-0 group-hover:opacity-100 will-change-opacity"
                                >
                                    <LuX className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-100 will-change-opacity">
                                    <p className="text-white text-sm flex items-center gap-2">
                                        <LuImage className="w-4 h-4" />
                                        {transaction.image?.name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={scanBillImage}
                                disabled={scanning}
                                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm sm:text-base font-medium rounded-lg hover:opacity-90 transition-all duration-100 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <LuScan
                                    className={`w-4 h-4 ${scanning ? "animate-pulse" : ""}`}
                                />
                                <span>
                                    {scanning ? "Scanning..." : "Scan Bill with AI"}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedTransactionForm;
