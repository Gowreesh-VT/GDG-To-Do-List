// Basic Authentication for To-Do
class AuthManager {
    constructor() {
        // Supabase Configuration
        this.supabaseUrl = 'https://ddkaeobhampkallrmsrf.supabase.co'; 
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRka2Flb2JoYW1wa2FsbHJtc3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MDc4NjUsImV4cCI6MjA2NDA4Mzg2NX0.Ky-wA-m6sMMEcs6HH-4DW4pHxA2FpMeC4kUXmICSE68';
        this.supabase = null;
        
        this.currentUser = null;
        this.initializeAuth();
        this.attachEventListeners();
    }

    async initializeAuth() {
        try {
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            
            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.handleSuccessfulLogin(session.user);
                return;
            }

            // Listen for auth state changes (important for OAuth redirects)
            this.supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    this.handleSuccessfulLogin(session.user);
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.showLoginModal();
                }
            });

            this.showLoginModal();
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.showLoginModal();
        }
    }


    attachEventListeners() {
        // Email Login
        document.getElementById('emailLoginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.loginWithEmail();
        });

        // Google Login
        document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
            this.loginWithGoogle();
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    async loginWithEmail() {
        if (!this.supabase) {
            this.showMessage('Supabase not configured', 'error');
            return;
        }

        const loginBtn = document.getElementById('emailLoginBtn');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.setButtonLoading(loginBtn, true);

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            this.handleSuccessfulLogin(data.user);
            this.hideAllModals();
            // Remove the success alert for smoother transition
            console.log('Login successful!');

        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message || 'Login failed', 'error');
        } finally {
            this.setButtonLoading(loginBtn, false);
        }
    }

    async loginWithGoogle() {
        if (!this.supabase) {
            this.showMessage('Supabase not configured', 'error');
            return;
        }

        const googleBtn = document.getElementById('googleLoginBtn');
        this.setButtonLoading(googleBtn, true);

        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) throw error;
            
        } catch (error) {
            console.error('Google login error:', error);
            this.showMessage(error.message || 'Google login failed', 'error');
            this.setButtonLoading(googleBtn, false);
        }
    }

    async logout() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        
        this.currentUser = null;
        this.showLoginModal();
        this.showMessage('Logged out successfully', 'success');
    }

    // Handle successful login
    handleSuccessfulLogin(user) {
        this.currentUser = user;
        this.updateUserUI();
        this.hideAllModals();
        this.showMainApp();
    }

    // Update user interface
    updateUserUI() {
        const userName = document.getElementById('userName');
        const userInitials = document.getElementById('userInitials');

        if (this.currentUser) {
            const name = this.currentUser.user_metadata?.name || 
                         this.currentUser.email?.split('@')[0] || 
                         'User';
            
            if (userName) userName.textContent = name;
            
            if (userInitials) {
                const initials = name.split(' ')
                    .map(word => word.charAt(0).toUpperCase())
                    .join('')
                    .substring(0, 2);
                userInitials.textContent = initials;
            }
        }
    }

    // UI Helper Methods
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
        this.hideMainApp();
    }

    hideAllModals() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'none';
            loginModal.classList.remove('active');
        }
    }

    showMainApp() {
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.classList.remove('hidden');
        }
    }

    hideMainApp() {
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.add('hidden');
        }
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (typeof button === 'string') {
            button = document.getElementById(button);
        }
        
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.setAttribute('data-original-text', button.textContent);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
        }
    }

    showMessage(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        if (type === 'error') {
            alert('Error: ' + message);
        } else if (type === 'success') {
            alert('Success: ' + message);
        } else {
            alert(message);
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
