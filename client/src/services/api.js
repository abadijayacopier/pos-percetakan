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

// Opsional: Tangkap error token expired
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (!window.location.pathname.includes('login')) {
                // Jika Token Expired/Ditolak
                localStorage.removeItem('pos_session');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
