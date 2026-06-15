/**
 * Main Application Logic
 * Handles UI state, DOM manipulation, and user interactions.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- State ---
    let currentUser = null;
    let isLoginMode = true;

    // --- DOM Elements ---
    const navLinks = document.getElementById('navLinks');
    const clinicsGrid = document.getElementById('clinicsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const districtFilter = document.getElementById('districtFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    // Modal Elements
    const authModal = document.getElementById('authModal');
    const authForm = document.getElementById('authForm');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const nameGroup = document.getElementById('nameGroup');
    const roleGroup = document.getElementById('roleGroup');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authSwitchLink = document.getElementById('authSwitchLink');
    const authSwitchText = document.getElementById('authSwitchText');
    const authError = document.getElementById('authError');

    // --- Initialization ---
    async function init() {
        // Try to load user session
        currentUser = await api.getMe();
        
        // If already logged in, redirect to the correct dashboard
        if (currentUser) {
            redirectToDashboard(currentUser);
            return;
        }
        
        updateNavbar();
        loadClinics();
    }

    function redirectToDashboard(user) {
        if (user.role === 'patient') {
            window.location.href = '/patient-dashboard';
        } else if (user.role === 'clinic_owner') {
            window.location.href = '/owner-dashboard';
        }
    }

    // --- UI Updaters ---
    function updateNavbar() {
        if (currentUser) {
            navLinks.innerHTML = `
                <span style="font-weight: 600; color: var(--primary);">Hi, ${currentUser.fullname.split(' ')[0]}</span>
                <button class="btn-login" id="logoutBtn">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        } else {
            navLinks.innerHTML = `
                <button class="btn-login" id="navLoginBtn">Sign in</button>
                <button class="btn-signup" id="navSignupBtn">Create account</button>
            `;
            document.getElementById('navLoginBtn').addEventListener('click', () => openAuthModal(true));
            document.getElementById('navSignupBtn').addEventListener('click', () => openAuthModal(false));
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Data Loading ---
    async function loadClinics(isSearch = false) {
        clinicsGrid.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';

        try {
            const searchTerm = searchInput.value.trim();
            const district = districtFilter.value;
            const service = serviceFilter.value;

            const response = await api.getClinics(
                isSearch ? searchTerm : searchTerm,
                isSearch ? district : district,
                isSearch ? service : service
            );
            
            if (response.items && response.items.length > 0) {
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
            clinicsGrid.innerHTML = `<div style="color: var(--danger); grid-column: 1/-1;">Failed to load clinics. Ensure backend is running.</div>`;
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
                        <button type="button" class="btn-book" data-action="book" data-name="${clinic.clinic_name}">Book Visit</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    // --- Authentication Handlers ---
    function openAuthModal(isLogin) {
        isLoginMode = isLogin;
        authError.textContent = '';
        
        if (isLoginMode) {
            modalTitle.textContent = 'Welcome Back';
            nameGroup.style.display = 'none';
            roleGroup.style.display = 'block';
            document.getElementById('fullname').removeAttribute('required');
            authSubmitBtn.textContent = 'Sign In';
            authSwitchText.textContent = "Don't have an account?";
            authSwitchLink.textContent = 'Sign Up';
        } else {
            modalTitle.textContent = 'Create Account';
            nameGroup.style.display = 'block';
            roleGroup.style.display = 'block';
            document.getElementById('fullname').setAttribute('required', 'true');
            authSubmitBtn.textContent = 'Sign Up';
            authSwitchText.textContent = "Already have an account?";
            authSwitchLink.textContent = 'Sign In';
        }
        
        // Update role label based on mode
        const roleLabel = roleGroup.querySelector('label');
        if (roleLabel) {
            roleLabel.textContent = isLoginMode ? 'Role' : 'I am a...';
        }
        
        authModal.classList.add('active');
    }

    closeModal.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(!isLoginMode);
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.textContent = '';
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Please wait...';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const fullname = document.getElementById('fullname').value;
        const role = document.getElementById('role').value;

        try {
            if (isLoginMode) {
                currentUser = await api.login(email, password, role);
                showToast(`Welcome back, ${currentUser.fullname}!`, 'success');
                authModal.classList.remove('active');
                authForm.reset();
                // Redirect to the appropriate dashboard
                setTimeout(() => redirectToDashboard(currentUser), 500);
            } else {
                await api.register({ email, password, fullname, role });
                // Auto login after register
                currentUser = await api.login(email, password, role);
                showToast('Account created successfully!', 'success');
                authModal.classList.remove('active');
                authForm.reset();
                setTimeout(() => redirectToDashboard(currentUser), 500);
            }
        } catch (error) {
            const message = error?.message || 'Unable to complete the request.';
            authError.textContent = message;
            showToast(message, 'error');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isLoginMode ? 'Sign In' : 'Sign Up';
        }
    });

    function handleLogout() {
        api.setToken(null);
        currentUser = null;
        updateNavbar();
        loadClinics();
        showToast('Logged out successfully');
    }

    // --- Event Listeners ---
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadClinics(true), 400);
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            loadClinics(true);
        }
    });

    searchBtn.addEventListener('click', () => loadClinics(true));
    districtFilter.addEventListener('change', () => loadClinics(true));
    serviceFilter.addEventListener('change', () => loadClinics(true));

    clinicsGrid.addEventListener('click', (event) => {
        const serviceButton = event.target.closest('.service-pill');
        if (serviceButton) {
            const serviceName = serviceButton.getAttribute('data-service');
            searchInput.value = serviceName;
            serviceFilter.value = '';
            loadClinics(true);
            document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const bookButton = event.target.closest('[data-action="book"]');
        if (bookButton) {
            if (!currentUser) {
                openAuthModal(true);
                showToast('Sign in to book a visit or continue browsing clinics.', 'error');
            } else {
                showToast(`Booking for ${bookButton.getAttribute('data-name')} is ready soon.`, 'success');
            }
            return;
        }

        const card = event.target.closest('.clinic-card');
        if (card) {
            showToast('Tap a service pill to filter results, or sign in to book an appointment.', 'success');
        }
    });

    window.handleServiceClick = (serviceName) => {
        searchInput.value = serviceName;
        serviceFilter.value = '';
        loadClinics(true);
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
    };

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Boot
    init();
});
