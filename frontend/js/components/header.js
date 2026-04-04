/* ============================================
   Header — fixed navigation with auth
   ============================================ */

const Header = {
    dropdownOpen: false,

    render() {
        const header = document.getElementById('main-header');
        const user = API.getUser();
        const isAuth = API.isAuthenticated();

        header.innerHTML = `
            <div class="header-inner">
                <a class="header-logo" onclick="App.navigate('#/')">
                    <div class="header-logo-icon">AI</div>
                    <div class="header-logo-text"><span>AI Review</span> Hub</div>
                </a>

                <nav class="header-nav">
                    <a class="header-nav-link ${App.currentRoute === '#/' ? 'active' : ''}" onclick="App.navigate('#/')">
                        Облачные ИИ
                    </a>
                    <a class="header-nav-link ${App.currentRoute === '#/local' ? 'active' : ''}" onclick="App.navigate('#/local')">
                        Локальные ИИ
                    </a>
                    <a class="header-nav-link ${App.currentRoute === '#/about' ? 'active' : ''}" onclick="App.navigate('#/about')">
                        О проекте
                    </a>
                </nav>

                <div class="header-actions">
                    ${isAuth ? this.renderUserMenu(user) : this.renderAuthButtons()}
                </div>
            </div>
        `;

        lucide.createIcons({ nodes: [header] });
        this.bindEvents();
    },

    renderAuthButtons() {
        return `
            <button class="header-auth-btn login" id="header-login-btn">
                Войти
            </button>
            <button class="header-auth-btn register" id="header-register-btn">
                Регистрация
            </button>
        `;
    },

    renderUserMenu(user) {
        const initial = user ? Helpers.getUserInitial(user.nickname) : '?';
        const name = user ? Helpers.escapeHtml(user.nickname) : '';

        return `
            <div class="user-menu">
                <div class="user-menu-trigger" id="user-menu-trigger">
                    <div class="user-avatar">${initial}</div>
                    <span class="user-menu-name">${name}</span>
                    <i data-lucide="chevron-down" class="user-menu-chevron" style="width:16px;height:16px"></i>
                </div>
                <div class="user-dropdown" id="user-dropdown">
                    <button class="user-dropdown-item" onclick="Header.showProfile()">
                        <i data-lucide="user" style="width:16px;height:16px"></i>
                        Мой профиль
                    </button>
                    <div class="user-dropdown-divider"></div>
                    <button class="user-dropdown-item danger" onclick="Header.logout()">
                        <i data-lucide="log-out" style="width:16px;height:16px"></i>
                        Выйти
                    </button>
                </div>
            </div>
        `;
    },

    bindEvents() {
        // Auth buttons
        const loginBtn = document.getElementById('header-login-btn');
        const registerBtn = document.getElementById('header-register-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => AuthModal.open('login'));
        }
        if (registerBtn) {
            registerBtn.addEventListener('click', () => AuthModal.open('register'));
        }

        // User menu toggle
        const trigger = document.getElementById('user-menu-trigger');
        const dropdown = document.getElementById('user-dropdown');

        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dropdownOpen = !this.dropdownOpen;
                dropdown.classList.toggle('open', this.dropdownOpen);
                trigger.classList.toggle('open', this.dropdownOpen);
            });

            document.addEventListener('click', () => {
                if (this.dropdownOpen) {
                    this.dropdownOpen = false;
                    dropdown.classList.remove('open');
                    trigger.classList.remove('open');
                }
            });
        }
    },

    showProfile() {
        const user = API.getUser();
        if (user) {
            ProfilePopup.show(user.id);
        }
        this.dropdownOpen = false;
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.remove('open');
    },

    logout() {
        API.logout();
        this.dropdownOpen = false;
        this.render();
        App.navigate('#/');
        Toast.success('До свидания!', 'Вы вышли из аккаунта');
    },
};
