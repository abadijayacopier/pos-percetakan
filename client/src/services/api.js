import axios from 'axios';

const api = axios.create({
    baseURL: `http://${window.location.hostname}:5001/api`,
});

// Otomatis menempelkan token JWT di setiap request HTTP
api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token'); // Fallback token lama
    const session = localStorage.getItem('pos_session');

    if (session) {
        try {
            const parsed = JSON.parse(session);
            if (parsed && parsed.token) {
                token = parsed.token;
            }
        } catch { /* abaikan jika parse gagal */ }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Tangkap error token & beri feedback jelas
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const configUrl = error.config?.url || '';
        const responseUrl = error.request?.responseURL || '';

        // Skip jika request berasal dari endpoint /auth/ (login, register, dll)
        // Gunakan KEDUA sumber URL agar lebih andal
        const isAuthEndpoint =
            configUrl.includes('/auth/') ||
            configUrl.includes('auth/login') ||
            responseUrl.includes('/auth/');

        // Skip jika endpoint publik (tidak butuh auth)
        const isPublicEndpoint =
            configUrl.includes('fotocopy-prices') ||
            configUrl.includes('public') ||
            configUrl.includes('landing');

        if (status === 401 && !isAuthEndpoint && !isPublicEndpoint) {
            // Token expired / tidak valid — hanya logout jika BUKAN dari proses login
            console.warn('[api] Token expired, melakukan logout otomatis. URL:', configUrl);
            localStorage.removeItem('pos_session');
            alert('Sesi login sudah habis. Silakan login kembali.');
            window.location.href = '/';
        }

        // 403 = Role tidak cukup → JANGAN logout, komponen tangani sendiri
        return Promise.reject(error);
    }
);


export default api;
