/* ============================================
   App — SPA router & initialization
   ============================================ */

const App = {
    currentRoute: '#/',
    currentSort: 'rating',
    currentSearch: '',
    modelsCache: null,

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    navigate(hash) {
        window.location.hash = hash;
    },

    handleRoute() {
        const hash = window.location.hash || '#/';
        this.currentRoute = hash;
        Header.render();
        this.renderCurrentRoute();
    },

    renderCurrentRoute() {
        const hash = this.currentRoute;

        if (hash === '#/' || hash === '' || hash === '#') {
            this.renderHomePage();
        } else if (hash.startsWith('#/model/')) {
            const id = parseInt(hash.split('/')[2]);
            if (id) ModelPage.render(id);
        } else if (hash === '#/local') {
            this.renderLocalModelsPage();
        } else if (hash.startsWith('#/local-model/')) {
            const id = parseInt(hash.split('/')[2]);
            if (id) LocalModelPage.render(id);
        } else if (hash === '#/about') {
            this.renderAboutPage();
        } else {
            this.render404();
        }
    },

    async renderHomePage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container">
                <div class="page-hero">
                    <h1>Рейтинг <span class="accent">AI-моделей</span></h1>
                    <p>Честные отзывы от разработчиков, ML-инженеров и пользователей. Оцените модели по 6 критериям.</p>
                </div>
                <div class="controls-bar">
                    <div class="search-wrapper">
                        <i data-lucide="search"></i>
                        <input class="search-input" type="text" id="search-input"
                            placeholder="Поиск модели..." value="${Helpers.escapeHtml(this.currentSearch)}">
                    </div>
                    <div class="sort-group">
                        <button class="sort-btn ${this.currentSort==='rating'?'active':''}" onclick="App.setSort('rating')">По рейтингу</button>
                        <button class="sort-btn ${this.currentSort==='reviews'?'active':''}" onclick="App.setSort('reviews')">По отзывам</button>
                        <button class="sort-btn ${this.currentSort==='name'?'active':''}" onclick="App.setSort('name')">По имени</button>
                    </div>
                </div>
                <div class="models-grid" id="models-grid">
                    ${Helpers.createSkeletonCards(6)}
                </div>
            </div>
        `;
        lucide.createIcons({ nodes: [app] });

        // Bind search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Helpers.debounce((e) => {
                this.currentSearch = e.target.value;
                this.loadModels();
            }, 300));
        }

        await this.loadModels();
    },

    async loadModels() {
        const grid = document.getElementById('models-grid');
        if (!grid) return;

        try {
            const models = await API.getModels(this.currentSort, this.currentSearch);
            this.modelsCache = models;

            if (models.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <i data-lucide="search-x"></i>
                        <h3>Ничего не найдено</h3>
                        <p>Попробуйте изменить запрос поиска</p>
                    </div>
                `;
                lucide.createIcons({ nodes: [grid] });
                return;
            }

            grid.innerHTML = models.map(m => ModelCard.render(m)).join('');
            lucide.createIcons({ nodes: [grid] });
            ModelCard.initCharts(models);
        } catch (error) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <i data-lucide="wifi-off"></i>
                    <h3>Ошибка загрузки</h3>
                    <p>${Helpers.escapeHtml(error.message)}</p>
                </div>
            `;
            lucide.createIcons({ nodes: [grid] });
        }
    },

    setSort(sort) {
        this.currentSort = sort;
        // Update buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim() === {
                'rating': 'По рейтингу',
                'reviews': 'По отзывам',
                'name': 'По имени',
                'downloads': 'По скачиваниям'
            }[sort]);
        });
        
        if (this.currentRoute === '#/local') {
            this.loadLocalModels();
        } else {
            this.loadModels();
        }
    },

    async renderLocalModelsPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container">
                <div class="page-hero">
                    <h1>Локальные <span class="accent">ИИ-модели</span></h1>
                    <p>Открытые модели (Open Weights) до 32B параметров для запуска на личном железе. Оценка оптимизации VRAM и скорости вывода.</p>
                </div>
                <div class="controls-bar">
                    <div class="search-wrapper">
                        <i data-lucide="search"></i>
                        <input class="search-input" type="text" id="local-search-input"
                            placeholder="Поиск по названию или автору..." value="${Helpers.escapeHtml(this.currentSearch)}">
                    </div>
                    <div class="sort-group">
                        <button class="sort-btn ${this.currentSort==='rating'?'active':''}" onclick="App.setSort('rating')">По рейтингу</button>
                        <button class="sort-btn ${this.currentSort==='downloads'?'active':''}" onclick="App.setSort('downloads')">По скачиваниям</button>
                        <button class="sort-btn ${this.currentSort==='reviews'?'active':''}" onclick="App.setSort('reviews')">По отзывам</button>
                    </div>
                </div>
                <div class="models-grid" id="local-models-grid">
                    ${Helpers.createSkeletonCards(6)}
                </div>
            </div>
        `;
        lucide.createIcons({ nodes: [app] });

        // Bind search
        const searchInput = document.getElementById('local-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Helpers.debounce((e) => {
                this.currentSearch = e.target.value;
                this.loadLocalModels();
            }, 300));
        }

        await this.loadLocalModels();
    },

    async loadLocalModels() {
        const grid = document.getElementById('local-models-grid');
        if (!grid) return;

        try {
            const models = await API.getLocalModels(this.currentSort, this.currentSearch);
            // No need to cache locally in this simple implementation

            if (models.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <i data-lucide="search-x"></i>
                        <h3>Ничего не найдено</h3>
                        <p>Попробуйте изменить запрос поиска</p>
                    </div>
                `;
                lucide.createIcons({ nodes: [grid] });
                return;
            }

            grid.innerHTML = models.map(m => LocalModelCard.render(m)).join('');
            lucide.createIcons({ nodes: [grid] });
            LocalModelCard.initCharts(models);
        } catch (error) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <i data-lucide="wifi-off"></i>
                    <h3>Ошибка загрузки</h3>
                    <p>${Helpers.escapeHtml(error.message)}</p>
                </div>
            `;
            lucide.createIcons({ nodes: [grid] });
        }
    },

    renderAboutPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container about-page">
                <div class="page-hero">
                    <h1>О проекте <span class="accent">AI Review Hub</span></h1>
                    <p>Открытая платформа для объективной оценки AI-моделей сообществом</p>
                </div>
                <div class="about-content">
                    <h2>Наша миссия</h2>
                    <p>AI Review Hub — это независимая платформа, где каждый может оставить честный отзыв о современных AI-моделях. Мы верим, что объективные оценки от реальных пользователей помогают сообществу делать правильный выбор.</p>

                    <h2>Как это работает</h2>
                    <div class="about-features">
                        <div class="about-feature">
                            <i data-lucide="user-check"></i>
                            <h3>Идентификация</h3>
                            <p>Каждый рецензент указывает свою роль</p>
                        </div>
                        <div class="about-feature">
                            <i data-lucide="bar-chart-3"></i>
                            <h3>6 критериев</h3>
                            <p>Детальная оценка по ключевым параметрам</p>
                        </div>
                        <div class="about-feature">
                            <i data-lucide="shield-check"></i>
                            <h3>Достоверность</h3>
                            <p>Один отзыв на модель от пользователя</p>
                        </div>
                    </div>

                    <h2>Критерии оценки</h2>
                    <p><strong>Программирование</strong> — качество генерации кода, понимание контекста, исправление ошибок.</p>
                    <p><strong>Скорость</strong> — время ответа и генерации, работа с большими запросами.</p>
                    <p><strong>Цена</strong> — стоимость API, подписки, наличие бесплатного тарифа.</p>
                    <p><strong>Доступность в СНГ</strong> — возможность использования без VPN, поддержка русского языка.</p>
                    <p><strong>Креативность</strong> — генерация идей, творческие задачи, нестандартные решения.</p>
                    <p><strong>Точность фактов</strong> — достоверность информации, минимум галлюцинаций.</p>
                </div>
            </div>
        `;
        lucide.createIcons({ nodes: [app] });
    },

    render404() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container">
                <div class="empty-state" style="padding:80px 24px">
                    <i data-lucide="file-question"></i>
                    <h3>Страница не найдена</h3>
                    <p>Запрашиваемая страница не существует</p>
                    <button class="btn-submit" onclick="App.navigate('#/')" style="margin-top:16px">
                        На главную
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons({ nodes: [app] });
    },
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());
