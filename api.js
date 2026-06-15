/**
 * API Integration Layer
 * Handles all HTTP requests to the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    formatErrorMessage(detail) {
        if (!detail) return 'An unexpected error occurred.';

        if (typeof detail === 'string') {
            return detail;
        }

        if (Array.isArray(detail)) {
            return detail
                .map(item => {
                    if (typeof item === 'string') return item;
                    if (item?.msg) return item.msg;
                    if (item?.loc) return item.loc.join(' > ');
                    return JSON.stringify(item);
                })
                .join(' · ');
        }

        if (typeof detail === 'object') {
            if (detail.msg) return detail.msg;
            if (detail.detail) {
                return this.formatErrorMessage(detail.detail);
            }
            return JSON.stringify(detail);
        }

        return String(detail);
    }

    // Set JWT token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    // Base fetch wrapper
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Remove Content-Type if FormData is used
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = this.formatErrorMessage(data.detail || data);
            throw new Error(message);
        }

        return data;
    }

    // --- Authentication Endpoints ---

    async login(email, password, role = null) {
        const body = { email, password };
        if (role) body.role = role;

        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        this.setToken(data.access_token);
        return await this.getMe();
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return data;
    }

    async getMe() {
        if (!this.token) return null;
        try {
            const profile = await this.request('/auth/profile');
            return profile;
        } catch (e) {
            this.setToken(null);
            return null;
        }
    }

    // --- Clinic Endpoints ---

    async getClinics(search = '', district = '', service = '', skip = 0, limit = 12) {
        let url = `/search?skip=${skip}&limit=${limit}`;
        if (search) url += `&name=${encodeURIComponent(search)}`;
        if (district) url += `&district=${encodeURIComponent(district)}`;
        if (service) url += `&service=${encodeURIComponent(service)}`;
        
        return await this.request(url);
    }

    async getClinicDetails(clinicId) {
        return await this.request(`/clinics/${clinicId}`);
    }

    // --- Appointment / Booking Endpoints ---

    async createBooking(bookingData) {
        return await this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async getMyBookings(page = 1, size = 50) {
        return await this.request(`/appointments?page=${page}&size=${size}`);
    }

    async getOwnerBookings(page = 1, size = 100) {
        return await this.request(`/appointments?page=${page}&size=${size}`);
    }

    async updateBookingStatus(appointmentId, status) {
        return await this.request(`/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
}

// Export a singleton instance
const api = new ApiService();
