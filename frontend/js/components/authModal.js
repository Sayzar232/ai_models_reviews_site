/* ============================================
   AuthModal — Login / Register modal
   ============================================ */

const AuthModal = {
    currentTab: 'login',

    open(tab = 'login') {
        this.currentTab = tab;
        this.render();
        document.getElementById('auth-modal-overlay').classList.add('open');
    },

    close() {
        document.getElementById('auth-modal-overlay').classList.remove('open');
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    render() {
        const modal = document.getElementById('auth-modal');
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${this.currentTab === 'login' ? 'Вход' : 'Регистрация'}</h2>
                <button class="modal-close" onclick="AuthModal.close()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="auth-tabs">
                <button class="auth-tab ${this.currentTab === 'login' ? 'active' : ''}"
                    onclick="AuthModal.switchTab('login')">Вход</button>
                <button class="auth-tab ${this.currentTab === 'register' ? 'active' : ''}"
                    onclick="AuthModal.switchTab('register')">Регистрация</button>
            </div>
            <form class="auth-form" id="auth-form" onsubmit="AuthModal.handleSubmit(event)">
                ${this.currentTab === 'login' ? this.renderLoginForm() : this.renderRegisterForm()}
            </form>
        `;
        lucide.createIcons({ nodes: [modal] });
    },

    renderLoginForm() {
        return `
            <div class="form-group">
                <label class="form-label" for="login-email">Email</label>
                <input class="form-input" type="email" id="login-email" placeholder="your@email.com" required>
                <div class="form-error" id="login-email-error"></div>
            </div>
            <div class="form-group">
                <label class="form-label" for="login-password">Пароль</label>
                <input class="form-input" type="password" id="login-password" placeholder="Минимум 8 символов" required>
                <div class="form-error" id="login-password-error"></div>
            </div>
            <button class="form-submit" type="submit" id="auth-submit-btn">
                Войти
            </button>
        `;
    },

    renderRegisterForm() {
        return `
            <div class="form-group">
                <label class="form-label" for="reg-nickname">Никнейм</label>
                <input class="form-input" type="text" id="reg-nickname" placeholder="Ваш никнейм" required minlength="2" maxlength="50">
                <div class="form-error" id="reg-nickname-error"></div>
            </div>
            <div class="form-group">
                <label class="form-label" for="reg-email">Email</label>
                <input class="form-input" type="email" id="reg-email" placeholder="your@email.com" required>
                <div class="form-error" id="reg-email-error"></div>
            </div>
            <div class="form-group">
                <label class="form-label" for="reg-password">Пароль</label>
                <input class="form-input" type="password" id="reg-password" placeholder="Минимум 8 символов" required minlength="8">
                <div class="form-error" id="reg-password-error"></div>
            </div>
            <div class="form-group">
                <label class="form-label" for="reg-password-confirm">Подтверждение пароля</label>
                <input class="form-input" type="password" id="reg-password-confirm" placeholder="Повторите пароль" required>
                <div class="form-error" id="reg-password-confirm-error"></div>
            </div>
            <div class="form-group">
                <label class="form-label" for="reg-role">Роль</label>
                <select class="form-select" id="reg-role">
                    <option value="разработчик">Разработчик</option>
                    <option value="ML-инженер">ML-инженер</option>
                    <option value="вайб-кодер">Вайб-кодер</option>
                    <option value="студент">Студент</option>
                    <option value="обычный пользователь" selected>Обычный пользователь</option>
                    <option value="другое">Другое</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="reg-bio">О себе <span style="color:var(--text-muted)">(опционально)</span></label>
                <textarea class="form-textarea" id="reg-bio" placeholder="Несколько слов о себе..." maxlength="500"></textarea>
            </div>
            <button class="form-submit" type="submit" id="auth-submit-btn">
                Зарегистрироваться
            </button>
        `;
    },

    showError(fieldId, message) {
        const errorEl = document.getElementById(fieldId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    },

    clearErrors() {
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('visible');
            el.textContent = '';
        });
        document.querySelectorAll('.form-input.error').forEach(el => {
            el.classList.remove('error');
        });
    },

    async handleSubmit(e) {
        e.preventDefault();
        this.clearErrors();
        const btn = document.getElementById('auth-submit-btn');
        btn.disabled = true;
        btn.textContent = 'Загрузка...';

        try {
            if (this.currentTab === 'login') {
                await this.handleLogin();
            } else {
                await this.handleRegister();
            }
        } catch (error) {
            Toast.error('Ошибка', error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = this.currentTab === 'login' ? 'Войти' : 'Зарегистрироваться';
            }
        }
    },

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!Helpers.validateEmail(email)) {
            this.showError('login-email-error', 'Некорректный email');
            document.getElementById('login-email').classList.add('error');
            return;
        }

        if (password.length < 8) {
            this.showError('login-password-error', 'Минимум 8 символов');
            document.getElementById('login-password').classList.add('error');
            return;
        }

        await API.login(email, password);
        this.close();
        Header.render();
        Toast.success('Добро пожаловать!', 'Вы успешно вошли в аккаунт');

        // Re-render current page to show review form
        App.renderCurrentRoute();
    },

    async handleRegister() {
        const nickname = document.getElementById('reg-nickname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;
        const role = document.getElementById('reg-role').value;
        const bio = document.getElementById('reg-bio').value.trim();

        let hasError = false;

        if (nickname.length < 2) {
            this.showError('reg-nickname-error', 'Минимум 2 символа');
            hasError = true;
        }

        if (!Helpers.validateEmail(email)) {
            this.showError('reg-email-error', 'Некорректный email');
            hasError = true;
        }

        if (password.length < 8) {
            this.showError('reg-password-error', 'Минимум 8 символов');
            hasError = true;
        }

        if (password !== passwordConfirm) {
            this.showError('reg-password-confirm-error', 'Пароли не совпадают');
            hasError = true;
        }

        if (hasError) return;

        await API.register({
            nickname,
            email,
            password,
            password_confirm: passwordConfirm,
            role,
            bio,
        });

        this.close();
        Header.render();
        Toast.success('Добро пожаловать!', 'Аккаунт успешно создан');
        App.renderCurrentRoute();
    },
};

// Close on overlay click
document.getElementById('auth-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) AuthModal.close();
});
