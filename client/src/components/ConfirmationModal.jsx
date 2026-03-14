import React from 'react';

/**
 * ConfirmationModal - A premium reusable confirmation modal.
 * 
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Called when modal is canceled/closed
 * @param {function} onConfirm - Called when user confirms action
 * @param {string} title - Modal title
 * @param {string} message - Description message
 * @param {string} confirmText - Label for confirm button
 * @param {string} cancelText - Label for cancel button
 * @param {string} type - 'danger', 'info', or 'warning' for different color schemes
 */
export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin?',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'danger'
}) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: 'bg-red-50 dark:bg-red-900/10',
            icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none',
            outline: 'border-red-100 dark:border-red-900/20'
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
            btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 dark:shadow-none',
            outline: 'border-amber-100 dark:border-amber-900/20'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            btn: 'bg-primary hover:bg-primary-dark text-white shadow-primary/20 dark:shadow-none',
            outline: 'border-blue-100 dark:border-blue-900/20'
        }
    };

    const config = colors[type] || colors.info;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-md mx-auto z-50 animate-in zoom-in-95 fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                    {/* Header Decoration */}
                    <div className={`h-2 w-full ${config.btn.split(' ')[0]}`}></div>

                    <div className="p-8">
                        <div className="flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${config.icon}`}>
                                <span className="material-symbols-outlined text-3xl">
                                    {type === 'danger' ? 'logout' : type === 'warning' ? 'warning' : 'info'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {message}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${config.btn}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
