import { useEffect } from 'react';

/**
 * Custom hook to handle keyboard shortcuts for the POS system.
 * @param {Object} shortcuts - A mapping of key codes to callback functions.
 * Example: { 'F1': () => openPhotocopy(), 'F10': () => proceedToPayment() }
 */
const useKeyboardShortcuts = (shortcuts) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const callback = shortcuts[event.key];

            if (callback) {
                // Prevent default browser behavior for system keys (F1, F3, F5, etc.)
                // Note: Some browser shortcuts might still override this (e.g., F11, F12).
                if (event.key.startsWith('F') || event.key === 'Escape') {
                    event.preventDefault();
                }
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
};

export default useKeyboardShortcuts;
