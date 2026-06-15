/**
 * Owner Dashboard Logic
 * Handles viewing and managing bookings across the owner's clinics.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- State ---
    let currentUser = null;
    let allBookings = [];

    // --- DOM Elements ---
    const navLinks = document.getElementById('navLinks');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const bookingsBody = document.getElementById('bookingsBody');
    const profileCard = document.getElementById('profileCard');

    // Stats
    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statApproved = document.getElementById('statApproved');
    const statCompleted = document.getElementById('statCompleted');

    // --- Initialization ---
    async function init() {
        currentUser = await api.getMe();

        if (!currentUser) {
            window.location.href = '/';
            return;
        }

        // Access control: only clinic_owner or admin
        if (currentUser.role !== 'clinic_owner' && currentUser.role !== 'admin') {
            document.getElementById('accessDenied').style.display = 'flex';
            document.querySelector('.dashboard-main').querySelectorAll('.dash-tab').forEach(t => t.style.display = 'none');
            setTimeout(() => {
                if (currentUser.role === 'patient') {
                    window.location.href = '/patient-dashboard';
                } else {
                    window.location.href = '/';
                }
            }, 2000);
            return;
        }

        setupTabNavigation();
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

    // --- Bookings Management ---
    async function loadBookings() {
        bookingsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;"><div class="loader"></div></td></tr>';

        try {
            const response = await api.getOwnerBookings();
            allBookings = response.items || [];

            updateStats();

            if (allBookings.length === 0) {
                bookingsBody.innerHTML = `
                    <tr><td colspan="5" style="text-align:center; padding:2rem; color: var(--text-muted);">
                        <p>No bookings found for your clinics.</p>
                    </td></tr>
                `;
                return;
            }

            renderBookingsTable();
        } catch (error) {
            bookingsBody.innerHTML = '<tr><td colspan="5" style="color: var(--danger); text-align:center; padding:2rem;">Failed to load bookings.</td></tr>';
            console.error(error);
        }
    }

    function updateStats() {
        let pending = 0, approved = 0, completed = 0;
        
        allBookings.forEach(b => {
            if (b.status === 'pending') pending++;
            else if (b.status === 'approved') approved++;
            else if (b.status === 'completed') completed++;
        });

        statTotal.textContent = allBookings.length;
        statPending.textContent = pending;
        statApproved.textContent = approved;
        statCompleted.textContent = completed;
    }

    function renderBookingsTable() {
        bookingsBody.innerHTML = allBookings.map((b) => {
            
            // Patient Info Cell
            const patientInfo = `
                <div style="font-weight:600;">${b.patient_name || `Patient #${b.patient_id}`}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">${b.email || ''}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">${b.phone || ''}</div>
                ${b.notes ? `<div style="font-size:0.85rem; margin-top:0.25rem; font-style:italic;">"${b.notes}"</div>` : ''}
            `;

            // Date Time Cell
            const dateTimeInfo = `
                <div>${b.appointment_date}</div>
                <div style="color:var(--text-muted); font-size:0.9rem;">${b.appointment_time}</div>
            `;

            // Actions Cell
            let actionsHTML = '';
            if (b.status === 'pending') {
                actionsHTML = `
                    <button class="action-btn action-approve" data-id="${b.id}" data-action="approved">Approve</button>
                    <button class="action-btn action-reject" data-id="${b.id}" data-action="rejected">Reject</button>
                `;
            } else if (b.status === 'approved') {
                actionsHTML = `
                    <button class="action-btn action-complete" data-id="${b.id}" data-action="completed">Complete</button>
                    <button class="action-btn action-reject" data-id="${b.id}" data-action="cancelled">Cancel</button>
                `;
            }

            return `
                <tr>
                    <td>${patientInfo}</td>
                    <td><span style="font-weight:500;">${b.service_name || '—'}</span></td>
                    <td>${dateTimeInfo}</td>
                    <td><span class="status-badge status-${b.status}">${b.status}</span></td>
                    <td><div class="action-buttons">${actionsHTML}</div></td>
                </tr>
            `;
        }).join('');
    }

    // Handle action buttons
    bookingsBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const appointmentId = parseInt(btn.getAttribute('data-id'));
        const newStatus = btn.getAttribute('data-action');

        // Optimistic UI update or just disable buttons
        const actionDiv = btn.closest('.action-buttons');
        const originalHTML = actionDiv.innerHTML;
        actionDiv.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">Updating...</span>';

        try {
            await api.updateBookingStatus(appointmentId, newStatus);
            showToast(`Booking marked as ${newStatus}`, 'success');
            
            // Update local state
            const booking = allBookings.find(b => b.id === appointmentId);
            if (booking) booking.status = newStatus;
            
            updateStats();
            renderBookingsTable();
        } catch (error) {
            actionDiv.innerHTML = originalHTML;
            showToast(error.message || `Failed to update status`, 'error');
        }
    });

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
                        <span class="profile-value"><span class="status-badge status-pending" style="color:var(--primary); background:var(--primary-light);">Clinic Owner</span></span>
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

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Boot
    init();
});
