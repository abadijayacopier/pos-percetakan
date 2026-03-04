import { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span>{t.type === 'success' ? <FiCheckCircle /> : t.type === 'error' ? <FiXCircle /> : t.type === 'warning' ? <FiAlertTriangle /> : <FiInfo />}</span>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
