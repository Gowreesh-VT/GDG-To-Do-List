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

    // Enhanced To-Do List Logic
    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const todoDate = document.getElementById('todoDate');
    const todoList = document.getElementById('todoList');
    const filterAll = document.getElementById('filterAll');
    const filterActive = document.getElementById('filterActive');
    const filterCompleted = document.getElementById('filterCompleted');
    const clearCompleted = document.getElementById('clearCompleted');
    let todos = [];
    let filter = 'all';

    function renderTodos() {
        todoList.innerHTML = '';
        let filtered = todos;
        if (filter === 'active') filtered = todos.filter(t => !t.completed);
        if (filter === 'completed') filtered = todos.filter(t => t.completed);
        filtered.forEach((todo, idx) => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.className = 'todo-checkbox';
            checkbox.addEventListener('change', () => {
                todo.completed = !todo.completed;
                renderTodos();
            });
            li.appendChild(checkbox);

            // Task text (editable)
            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = todo.text;
            span.contentEditable = true;
            span.spellcheck = false;
            span.addEventListener('blur', () => {
                todo.text = span.textContent.trim();
                renderTodos();
            });
            li.appendChild(span);

            // Due date
            if (todo.date) {
                const dateLabel = document.createElement('span');
                dateLabel.className = 'todo-date-label';
                dateLabel.textContent = todo.date;
                li.appendChild(dateLabel);
            }

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'todo-delete';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.addEventListener('click', () => {
                todos.splice(todos.indexOf(todo), 1);
                renderTodos();
            });
            li.appendChild(delBtn);

            todoList.appendChild(li);
        });
    }

    todoForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = todoInput.value.trim();
        const dateValue = todoDate.value;
        if (value) {
            todos.push({ text: value, completed: false, date: dateValue });
            todoInput.value = '';
            todoDate.value = '';
            renderTodos();
        }
    });

    filterAll?.addEventListener('click', () => {
        filter = 'all';
        setActiveFilter();
        renderTodos();
    });
    filterActive?.addEventListener('click', () => {
        filter = 'active';
        setActiveFilter();
        renderTodos();
    });
    filterCompleted?.addEventListener('click', () => {
        filter = 'completed';
        setActiveFilter();
        renderTodos();
    });
    clearCompleted?.addEventListener('click', () => {
        todos = todos.filter(t => !t.completed);
        renderTodos();
    });

    function setActiveFilter() {
        [filterAll, filterActive, filterCompleted].forEach(btn => btn?.classList.remove('active'));
        if (filter === 'all') filterAll?.classList.add('active');
        if (filter === 'active') filterActive?.classList.add('active');
        if (filter === 'completed') filterCompleted?.classList.add('active');
    }

    // Initial render
    setActiveFilter();
    renderTodos();
});
