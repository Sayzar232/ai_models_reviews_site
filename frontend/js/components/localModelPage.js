/* ============================================
   LocalModelPage — detail page for local models
   ============================================ */

const LocalModelPage = {
    async render(modelId) {
        const app = document.getElementById('app');
        app.innerHTML = `<div class="container"><div style="text-align:center;padding:64px;color:var(--text-muted)">Загрузка...</div></div>`;

        try {
            const model = await API.getLocalModel(modelId);
            const stats = model.stats || {};
            const initials = Helpers.getInitials(model.name);
            const gradient = Helpers.getModelGradient(model.name);
            const overall = stats.avg_overall || 0;

            const reviewFormHtml = LocalReviewForm.render(modelId);
            const reviewsHtml = await LocalReviewList.render(modelId);
            
            let desc = model.description;
            if (!desc && model.author) desc = `Локальная модель ${model.name} от ${model.author}.`;

            let logoContent = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;
            if (model.logo_url) {
                logoContent = `<img src="${model.logo_url}" alt="${model.name} logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;
            } else if (model.author) {
                const hfLogo = `https://huggingface.co/avatars/${model.author}.svg`;
                logoContent = `<img src="${hfLogo}" alt="${model.name} logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;
            }

            // Create bar charts with local criteria
            const criteria = [
                { key: 'coding', label: 'Программирование', icon: 'code-2' },
                { key: 'speed', label: 'Скорость вывода', icon: 'zap' },
                { key: 'vram', label: 'Оптимизация VRAM / Запуск', icon: 'cpu' },
                { key: 'context', label: 'Работа с контекстом', icon: 'layers' },
                { key: 'creativity', label: 'Креативность', icon: 'sparkles' },
                { key: 'accuracy', label: 'Точность фактов', icon: 'target' },
            ];

            const barChartsHtml = criteria.map(c => {
                const val = stats[`avg_${c.key}`] || 0;
                const pct = (val / 10) * 100;
                const color = Helpers.getRatingColor(val);

                return `
                    <div class="rating-bar-group">
                        <div class="rating-bar-label">
                            <span class="rating-bar-name">
                                <i data-lucide="${c.icon}"></i>
                                ${c.label}
                            </span>
                            <span class="rating-bar-value">${val.toFixed(1)}</span>
                        </div>
                        <div class="rating-bar-track">
                            <div class="rating-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${color},${color}dd)"></div>
                        </div>
                    </div>
                `;
            }).join('');

            app.innerHTML = `
                <div class="container model-detail">
                    <button class="back-btn" onclick="App.navigate('#/local')">
                        <i data-lucide="arrow-left"></i> Назад к локальным моделям
                    </button>

                    <div class="model-detail-hero">
                        <div class="model-detail-logo">${logoContent}</div>
                        <div class="model-detail-info">
                            <h1 class="model-detail-name">${Helpers.escapeHtml(model.name)}</h1>
                            <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px">
                                ${model.parameters_approx > 0 ? model.parameters_approx + 'B ' : ''} 
                                <span style="margin: 0 8px">•</span> 
                                ${(model.downloads || 0).toLocaleString('ru-RU')} скачиваний
                            </div>
                            <p class="model-detail-description">${Helpers.escapeHtml(desc)}</p>
                            ${model.website_url ? `
                                <a href="${Helpers.escapeHtml(model.website_url)}" target="_blank" rel="noopener" class="model-detail-link">
                                    <i data-lucide="external-link"></i> Страница на HuggingFace
                                </a>
                            ` : ''}
                        </div>
                        <div class="model-detail-stats-card">
                            ${Charts.createRatingCircle(overall, 96)}
                            <div style="margin-top:8px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600">
                                Общий рейтинг
                            </div>
                            <div style="margin-top:4px;font-size:13px;color:var(--text-secondary)">
                                ${stats.review_count || 0} отзывов
                            </div>
                        </div>
                    </div>

                    <div class="section-header">
                        <h2 class="section-title">Рейтинг для локального запуска</h2>
                    </div>
                    <div class="detail-ratings">
                        ${barChartsHtml}
                    </div>

                    <div class="section-header">
                        <h2 class="section-title">Оставить отзыв</h2>
                    </div>
                    ${reviewFormHtml}

                    <div class="section-header">
                        <h2 class="section-title">Отзывы</h2>
                    </div>
                    <div id="local-reviews-container">
                        ${reviewsHtml}
                    </div>
                </div>
            `;

            lucide.createIcons({ nodes: [app] });

            setTimeout(() => {
                app.querySelectorAll('.rating-bar-fill').forEach(bar => {
                    bar.style.width = bar.style.width;
                });
            }, 50);

        } catch (error) {
            app.innerHTML = `
                <div class="container">
                    <div class="empty-state" style="padding:80px 24px">
                        <i data-lucide="alert-circle"></i>
                        <h3>Модель не найдена</h3>
                        <p>${Helpers.escapeHtml(error.message)}</p>
                        <button class="btn-submit" onclick="App.navigate('#/local')" style="margin-top:16px">
                            К списку
                        </button>
                    </div>
                </div>
            `;
            lucide.createIcons({ nodes: [app] });
        }
    },
};
