/* ============================================
   App — SPA router & initialization
   ============================================ */

const App = {
    currentRoute: '#/',
    currentSort: 'rating',
    currentSearch: '',
    modelsCache: null,
    
    // Pagination
    currentPage: 1,
    isLoading: false,
    hasMore: true,
    limit: 10,
    observer: null,

    resetPagination() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
    },

    initObserver(loadFn) {
        if (this.observer) this.observer.disconnect();
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.isLoading && this.hasMore) {
                loadFn();
            }
        }, { rootMargin: '150px' });
    },

    observeSentinel(container) {
        let sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.height = '20px';
            container.parentNode.appendChild(sentinel);
        }
        this.observer.observe(sentinel);
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this._startMouseParallax();
        this.handleRoute();
    },

    _startMouseParallax() {
        // Целевые координаты курсора (нормализованы: -1..+1 от центра)
        let targetX = 0;
        let targetY = 0;
        // Текущие интерполированные значения
        let currentX = 0;
        let currentY = 0;
        const ease = 0.04;      // плавность (меньше = медленнее)
        const strength = 80;    // максимальный сдвиг в пикселях

        window.addEventListener('mousemove', (e) => {
            // -1..+1 относительно центра экрана
            targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
            targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        const tick = () => {
            currentX += (targetX - currentX) * ease;
            currentY += (targetY - currentY) * ease;

            // Сетка уходит в ОБРАТНУЮ сторону от курсора
            const offsetX = (-currentX * strength).toFixed(2);
            const offsetY = (-currentY * strength).toFixed(2);

            document.body.style.setProperty('--grid-x', `${offsetX}px`);
            document.body.style.setProperty('--grid-y', `${offsetY}px`);
            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
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
                this.resetPagination();
                const grid = document.getElementById('models-grid');
                if (grid) grid.innerHTML = Helpers.createSkeletonCards(6);
                this.loadModels();
            }, 300));
        }

        this.resetPagination();
        await this.loadModels();
        this.initObserver(() => this.loadModels());
        this.observeSentinel(document.getElementById('models-grid'));
    },

    async loadModels() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;

        const grid = document.getElementById('models-grid');
        if (!grid) {
            this.isLoading = false;
            return;
        }

        try {
            const models = await API.getModels(this.currentSort, this.currentSearch, this.currentPage, this.limit);
            
            if (this.currentPage === 1) {
                grid.innerHTML = '';
            }

            if (models.length < this.limit) {
                this.hasMore = false;
            }

            if (models.length === 0 && this.currentPage === 1) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <i data-lucide="search-x"></i>
                        <h3>Ничего не найдено</h3>
                        <p>Попробуйте изменить запрос поиска</p>
                    </div>
                `;
                lucide.createIcons({ nodes: [grid] });
                this.isLoading = false;
                return;
            }

            const html = models.map(m => ModelCard.render(m)).join('');
            grid.insertAdjacentHTML('beforeend', html);
            lucide.createIcons({ nodes: [grid] });
            ModelCard.initCharts(models);
            
            this.currentPage++;
        } catch (error) {
            if (this.currentPage === 1) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <i data-lucide="wifi-off"></i>
                        <h3>Ошибка загрузки</h3>
                        <p>${Helpers.escapeHtml(error.message)}</p>
                    </div>
                `;
                lucide.createIcons({ nodes: [grid] });
            }
        }
        
        this.isLoading = false;
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
        
        this.resetPagination();
        const gridId = this.currentRoute === '#/local' ? 'local-models-grid' : 'models-grid';
        const grid = document.getElementById(gridId);
        if (grid) grid.innerHTML = Helpers.createSkeletonCards(6);

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
                    <p>Открытые модели (Open Weights) до 32B параметров для запуска на личном железе. Оценка логики, следования инструкциям и скорости вывода.</p>
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
                this.resetPagination();
                const grid = document.getElementById('local-models-grid');
                if (grid) grid.innerHTML = Helpers.createSkeletonCards(6);
                this.loadLocalModels();
            }, 300));
        }

        this.resetPagination();
        await this.loadLocalModels();
        this.initObserver(() => this.loadLocalModels());
        this.observeSentinel(document.getElementById('local-models-grid'));
    },

    async loadLocalModels() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;

        const grid = document.getElementById('local-models-grid');
        if (!grid) {
            this.isLoading = false;
            return;
        }

        try {
            const models = await API.getLocalModels(this.currentSort, this.currentSearch, this.currentPage, this.limit);

            if (this.currentPage === 1) {
                grid.innerHTML = '';
            }

            if (models.length < this.limit) {
                this.hasMore = false;
            }

            if (models.length === 0 && this.currentPage === 1) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <i data-lucide="search-x"></i>
                        <h3>Ничего не найдено</h3>
                        <p>Попробуйте изменить запрос поиска</p>
                    </div>
                `;
                lucide.createIcons({ nodes: [grid] });
                this.isLoading = false;
                return;
            }

            const html = models.map(m => LocalModelCard.render(m)).join('');
            grid.insertAdjacentHTML('beforeend', html);
            lucide.createIcons({ nodes: [grid] });
            LocalModelCard.initCharts(models);

            this.currentPage++;
        } catch (error) {
            if (this.currentPage === 1) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <i data-lucide="wifi-off"></i>
                        <h3>Ошибка загрузки</h3>
                        <p>${Helpers.escapeHtml(error.message)}</p>
                    </div>
                `;
                lucide.createIcons({ nodes: [grid] });
            }
        }

        this.isLoading = false;
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
