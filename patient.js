/**
 * Patient Dashboard Logic
 * Handles clinic search, booking, viewing appointments, and profile.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- State ---
    let currentUser = null;
    let currentClinicId = null;
    let currentClinicName = '';
    let clinicsCache = [];

    // --- DOM Elements ---
    const navLinks = document.getElementById('navLinks');
    const clinicsGrid = document.getElementById('clinicsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const districtFilter = document.getElementById('districtFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const bookingsBody = document.getElementById('bookingsBody');
    const profileCard = document.getElementById('profileCard');

    // Booking Modal
    const bookingModal = document.getElementById('bookingModal');
    const bookingForm = document.getElementById('bookingForm');
    const closeBookingModal = document.getElementById('closeBookingModal');
    const bookingModalTitle = document.getElementById('bookingModalTitle');
    const bookingError = document.getElementById('bookingError');
    const bookingSubmitBtn = document.getElementById('bookingSubmitBtn');

    // --- Initialization ---
    async function init() {
        currentUser = await api.getMe();

        if (!currentUser) {
            window.location.href = '/';
            return;
        }

        // Access control: only patients
        if (currentUser.role !== 'patient') {
            document.getElementById('accessDenied').style.display = 'flex';
            document.querySelector('.dashboard-main').querySelectorAll('.dash-tab').forEach(t => t.style.display = 'none');
            setTimeout(() => {
                if (currentUser.role === 'clinic_owner') {
                    window.location.href = '/owner-dashboard';
                } else {
                    window.location.href = '/';
                }
            }, 2000);
            return;
        }

        // Set min date to today for booking
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookDate').setAttribute('min', today);

        // Pre-fill user info in booking form
        document.getElementById('bookPatientName').value = currentUser.fullname || '';
        document.getElementById('bookEmail').value = currentUser.email || '';
        document.getElementById('bookPhone').value = currentUser.phone || '';

        setupTabNavigation();
        loadClinics();
        loadBookings();
        renderProfile();
    }

    // --- Tab Navigation ---
    function setupTabNavigation() {
        const navBtns = document.querySelectorAll('.dash-nav-btn[data-tab]');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all
                navBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));

                // Activate clicked
                btn.classList.add('active');
                const tabId = `tab-${btn.getAttribute('data-tab')}`;
                document.getElementById(tabId).classList.add('active');

                // Refresh data on tab switch
                if (btn.getAttribute('data-tab') === 'bookings') {
                    loadBookings();
                }
            });
        });
    }

    // --- Toast ---
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Clinic Search ---
    async function loadClinics() {
        clinicsGrid.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';

        try {
            const searchTerm = searchInput.value.trim();
            const district = districtFilter.value;
            const service = serviceFilter.value;

            const response = await api.getClinics(searchTerm, district, service);

            if (response.items && response.items.length > 0) {
                clinicsCache = response.items;
                renderClinics(response.items);
            } else {
                clinicsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem; opacity: 0.5;">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <h3>No clinics found</h3>
                        <p>Try adjusting your search criteria</p>
                    </div>
                `;
            }
        } catch (error) {
            clinicsGrid.innerHTML = `<div style="color: var(--danger); grid-column: 1/-1;">Failed to load clinics.</div>`;
            console.error(error);
        }
    }

    function renderClinics(clinics) {
        clinicsGrid.innerHTML = clinics.map(clinic => `
            <article class="clinic-card" tabindex="0" aria-label="${clinic.clinic_name} clinic card">
                <div class="card-img">
                    ${clinic.logo_url
                        ? `<img src="${clinic.logo_url}" alt="${clinic.clinic_name}">`
                        : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
                    }
                    <div class="badge">${clinic.district || 'Available'}</div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${clinic.clinic_name}</h3>
                    <div class="card-meta">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${clinic.city || 'City available'}
                    </div>
                    <div class="card-services">
                        ${clinic.services && clinic.services.length > 0
                            ? clinic.services.map(s => `<button type="button" class="service-pill" data-service="${s.service_name}">${s.service_name}</button>`).join('')
                            : '<button type="button" class="service-pill" data-service="General Checkup">General Checkup</button>'
                        }
                    </div>
                    <p class="card-desc">${clinic.description || 'Premium healthcare services tailored to your needs.'}</p>
                    <div class="card-footer">
                        <div class="rating">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            ${clinic.average_rating ? clinic.average_rating.toFixed(1) : 'New'}
                        </div>
                        <button type="button" class="btn-book" data-action="book" data-clinic-id="${clinic.id}" data-name="${clinic.clinic_name}" data-services='${JSON.stringify((clinic.services || []).map(s => s.service_name))}'>Book Visit</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    // --- Booking Modal ---
    clinicsGrid.addEventListener('click', (event) => {
        const serviceButton = event.target.closest('.service-pill');
        if (serviceButton) {
            const serviceName = serviceButton.getAttribute('data-service');
            searchInput.value = serviceName;
            serviceFilter.value = '';
            loadClinics();
            return;
        }

        const bookButton = event.target.closest('[data-action="book"]');
        if (bookButton) {
            openBookingModal(bookButton);
            return;
        }
    });

    function openBookingModal(btn) {
        currentClinicId = parseInt(btn.getAttribute('data-clinic-id'));
        currentClinicName = btn.getAttribute('data-name');
        bookingModalTitle.textContent = `Book Visit — ${currentClinicName}`;
        bookingError.textContent = '';

        // Populate service dropdown
        const serviceSelect = document.getElementById('bookService');
        let services = [];
        try {
            services = JSON.parse(btn.getAttribute('data-services') || '[]');
        } catch (e) {
            services = [];
        }

        serviceSelect.innerHTML = '<option value="">Select a service...</option>';
        if (services.length > 0) {
            services.forEach(s => {
                serviceSelect.innerHTML += `<option value="${s}">${s}</option>`;
            });
        } else {
            serviceSelect.innerHTML += '<option value="General Checkup">General Checkup</option>';
        }

        // Pre-fill user info
        document.getElementById('bookPatientName').value = currentUser.fullname || '';
        document.getElementById('bookEmail').value = currentUser.email || '';
        document.getElementById('bookPhone').value = currentUser.phone || '';

        bookingModal.classList.add('active');
    }

    closeBookingModal.addEventListener('click', () => {
        bookingModal.classList.remove('active');
    });

    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.classList.remove('active');
        }
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        bookingError.textContent = '';
        bookingSubmitBtn.disabled = true;
        bookingSubmitBtn.textContent = 'Submitting...';

        const dateVal = document.getElementById('bookDate').value;
        const timeVal = document.getElementById('bookTime').value;

        const bookingData = {
            clinic_id: currentClinicId,
            appointment_date: dateVal,
            appointment_time: timeVal + ':00',
            patient_name: document.getElementById('bookPatientName').value.trim(),
            email: document.getElementById('bookEmail').value.trim(),
            phone: document.getElementById('bookPhone').value.trim(),
            service_name: document.getElementById('bookService').value,
            notes: document.getElementById('bookNotes').value.trim() || null,
        };

        try {
            await api.createBooking(bookingData);
            showToast('Booking submitted successfully! Status: Pending', 'success');
            bookingModal.classList.remove('active');
            bookingForm.reset();
            loadBookings();

            // Switch to bookings tab
            document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="bookings"]').classList.add('active');
            document.getElementById('tab-bookings').classList.add('active');
        } catch (error) {
            const msg = error?.message || 'Failed to submit booking.';
            bookingError.textContent = msg;
            showToast(msg, 'error');
        } finally {
            bookingSubmitBtn.disabled = false;
            bookingSubmitBtn.textContent = 'Submit Booking';
        }
    });

    // --- My Bookings ---
    async function loadBookings() {
        bookingsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;"><div class="loader"></div></td></tr>';

        try {
            const response = await api.getMyBookings();
            const bookings = response.items || [];

            if (bookings.length === 0) {
                bookingsBody.innerHTML = `
                    <tr><td colspan="7" style="text-align:center; padding:2rem; color: var(--text-muted);">
                        <p>No bookings yet. Search for a clinic and book your first visit!</p>
                    </td></tr>
                `;
                return;
            }

            bookingsBody.innerHTML = bookings.map((b, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${b.service_name || '—'}</td>
                    <td>Clinic #${b.clinic_id}</td>
                    <td>${b.appointment_date}</td>
                    <td>${b.appointment_time}</td>
                    <td><span class="status-badge status-${b.status}">${b.status}</span></td>
                    <td>${b.notes || '—'}</td>
                </tr>
            `).join('');
        } catch (error) {
            bookingsBody.innerHTML = '<tr><td colspan="7" style="color: var(--danger); text-align:center; padding:2rem;">Failed to load bookings.</td></tr>';
            console.error(error);
        }
    }

    // --- Profile ---
    function renderProfile() {
        if (!currentUser) return;
        profileCard.innerHTML = `
            <div class="profile-info-grid">
                <div class="profile-avatar">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="profile-details">
                    <div class="profile-field">
                        <span class="profile-label">Full Name</span>
                        <span class="profile-value">${currentUser.fullname}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Email</span>
                        <span class="profile-value">${currentUser.email}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Phone</span>
                        <span class="profile-value">${currentUser.phone || 'Not set'}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Role</span>
                        <span class="profile-value"><span class="status-badge status-approved">Patient</span></span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Member Since</span>
                        <span class="profile-value">${new Date(currentUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Logout ---
    document.getElementById('logoutBtn').addEventListener('click', () => {
        api.setToken(null);
        window.location.href = '/';
    });

    // --- Search Event Listeners ---
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadClinics(), 400);
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            loadClinics();
        }
    });

    searchBtn.addEventListener('click', () => loadClinics());
    districtFilter.addEventListener('change', () => loadClinics());
    serviceFilter.addEventListener('change', () => loadClinics());

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Boot
    init();
});
