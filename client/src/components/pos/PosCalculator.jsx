import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PosCalculator({ isOpen, onClose }) {
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = useCallback((digit) => {
        if (waitingForOperand) {
            setDisplay(String(digit));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(digit) : display + digit);
        }
    }, [display, waitingForOperand]);

    const inputDot = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes('.')) setDisplay(display + '.');
    }, [display, waitingForOperand]);

    const calculate = (a, b, op) => {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '×': return a * b;
            case '÷': return b !== 0 ? a / b : 0;
            default: return b;
        }
    };

    const handleOperator = useCallback((nextOp) => {
        const current = parseFloat(display);
        if (prevValue !== null && !waitingForOperand) {
            const result = calculate(prevValue, current, operator);
            setDisplay(String(result));
            setPrevValue(result);
        } else {
            setPrevValue(current);
        }
        setOperator(nextOp);
        setWaitingForOperand(true);
    }, [display, prevValue, operator, waitingForOperand]);

    const handleEquals = useCallback(() => {
        if (prevValue === null || operator === null) return;
        const current = parseFloat(display);
        const result = calculate(prevValue, current, operator);
        setDisplay(String(result));
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(true);
    }, [display, prevValue, operator]);

    const handleClear = () => {
        setDisplay('0');
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const handlePercent = () => {
        const val = parseFloat(display) / 100;
        setDisplay(String(val));
    };

    const handleBackspace = () => {
        setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    };

    const formatDisplay = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '0';
        if (val.endsWith('.')) return Number(num).toLocaleString('id-ID') + '.';
        if (Number.isInteger(num) && !val.includes('.')) return num.toLocaleString('id-ID');
        return num.toLocaleString('id-ID', { maximumFractionDigits: 8 });
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            const key = e.key;

            if (/\d/.test(key)) {
                inputDigit(parseInt(key, 10));
            } else if (key === '.' || key === ',') {
                inputDot();
            } else if (key === '+' || key === '-') {
                handleOperator(key);
            } else if (key === '*' || key === 'x' || key === 'X') {
                handleOperator('×');
            } else if (key === '/') {
                e.preventDefault(); // Mencegah quick search di browser
                handleOperator('÷');
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault(); // Mencegah form submission
                handleEquals();
            } else if (key === 'Backspace') {
                handleBackspace();
            } else if (key === 'Escape') {
                onClose();
            } else if (key === 'c' || key === 'C') {
                handleClear();
            } else if (key === '%') {
                handlePercent();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, inputDigit, inputDot, handleOperator, handleEquals, handleBackspace, onClose]);

    if (!isOpen) return null;

    const btnBase = "font-black text-lg rounded-2xl transition-all active:scale-90 flex items-center justify-center";
    const btnNum = `${btnBase} bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-700`;
    const btnOp = `${btnBase} bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-sm border border-blue-100 dark:border-blue-800`;
    const btnEq = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 col-span-1`;
    const btnFunc = `${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm`;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-[340px] bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-2 border-white dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined text-xl">calculate</span>
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Kalkulator</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Display */}
                <div className="mx-5 mb-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {prevValue !== null && operator && (
                        <div className="text-right text-xs font-bold text-slate-400 mb-1 tracking-wide">
                            {Number(prevValue).toLocaleString('id-ID')} {operator}
                        </div>
                    )}
                    <div className="text-right text-4xl font-black text-slate-900 dark:text-white tracking-tighter overflow-x-auto no-scrollbar">
                        {formatDisplay(display)}
                    </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-2.5 p-5 pt-0">
                    <button onClick={handleClear} className={btnFunc}>AC</button>
                    <button onClick={handleBackspace} className={btnFunc}>
                        <span className="material-symbols-outlined text-lg">backspace</span>
                    </button>
                    <button onClick={handlePercent} className={btnFunc}>%</button>
                    <button onClick={() => handleOperator('÷')} className={`${btnOp} ${operator === '÷' && waitingForOperand ? 'ring-2 ring-blue-500' : ''}`}>÷</button>

                    {[7,8,9].map(n => <button key={n} onClick={() => inputDigit(n)} className={`${btnNum} h-14`}>{n}</button>)}
                    <button onClick={() => handleOperator('×')} className={`${btnOp} ${operator === '×' && waitingForOperand ? 'ring-2 ring-blue-500' : ''}`}>×</button>

                    {[4,5,6].map(n => <button key={n} onClick={() => inputDigit(n)} className={`${btnNum} h-14`}>{n}</button>)}
                    <button onClick={() => handleOperator('-')} className={`${btnOp} ${operator === '-' && waitingForOperand ? 'ring-2 ring-blue-500' : ''}`}>−</button>

                    {[1,2,3].map(n => <button key={n} onClick={() => inputDigit(n)} className={`${btnNum} h-14`}>{n}</button>)}
                    <button onClick={() => handleOperator('+')} className={`${btnOp} ${operator === '+' && waitingForOperand ? 'ring-2 ring-blue-500' : ''}`}>+</button>

                    <button onClick={() => inputDigit(0)} className={`${btnNum} h-14 col-span-2`}>0</button>
                    <button onClick={inputDot} className={`${btnNum} h-14`}>.</button>
                    <button onClick={handleEquals} className={`${btnEq} h-14`}>=</button>
                </div>
            </div>
        </div>
    );
}
