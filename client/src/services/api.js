import axios from 'axios';

const api = axios.create({
    baseURL: `http://${window.location.hostname}:5000/api`,
});

// Otomatis menempelkan token JWT di setiap request HTTP
api.interceptors.request.use((config) => {
    const session = localStorage.getItem('pos_session');
    if (session) {
        try {
            const { token } = JSON.parse(session);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch { /* abaikan */ }
    }
    return config;
});

// Tangkap error token expired & beri feedback jelas
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (!window.location.pathname.includes('login')) {
                // Token Expired / Ditolak — bersihkan sesi dan redirect
                localStorage.removeItem('pos_session');
                alert('Sesi login sudah habis. Silakan login kembali.');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
