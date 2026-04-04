/* ============================================
   ModelPage — model detail page
   ============================================ */

const ModelPage = {
    async render(modelId) {
        const app = document.getElementById('app');
        app.innerHTML = `<div class="container"><div style="text-align:center;padding:64px;color:var(--text-muted)">Загрузка...</div></div>`;

        try {
            const model = await API.getModel(modelId);
            const stats = model.stats || {};
            const initials = Helpers.getInitials(model.name);
            const gradient = Helpers.getModelGradient(model.name);
            const overall = stats.avg_overall || 0;

            const reviewFormHtml = ReviewForm.render(modelId);
            const reviewsHtml = await ReviewList.render(modelId);

            const logoContent = model.logo_url 
                ? `<img src="${model.logo_url}" alt="${model.name} logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                   <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`
                : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;

            app.innerHTML = `
                <div class="container model-detail">
                    <button class="back-btn" onclick="App.navigate('#/')">
                        <i data-lucide="arrow-left"></i> Назад к моделям
                    </button>

                    <div class="model-detail-hero">
                        <div class="model-detail-logo">${logoContent}</div>
                        <div class="model-detail-info">
                            <h1 class="model-detail-name">${Helpers.escapeHtml(model.name)}</h1>
                            <p class="model-detail-description">${Helpers.escapeHtml(model.description)}</p>
                            ${model.website_url ? `
                                <a href="${Helpers.escapeHtml(model.website_url)}" target="_blank" rel="noopener" class="model-detail-link">
                                    <i data-lucide="external-link"></i> Официальный сайт
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
                        <h2 class="section-title">Рейтинги по критериям</h2>
                    </div>
                    <div class="detail-ratings">
                        ${Charts.createBarCharts(stats)}
                    </div>

                    <div class="section-header">
                        <h2 class="section-title">Оставить отзыв</h2>
                    </div>
                    ${reviewFormHtml}

                    <div class="section-header">
                        <h2 class="section-title">Отзывы</h2>
                    </div>
                    <div id="reviews-container">
                        ${reviewsHtml}
                    </div>
                </div>
            `;

            lucide.createIcons({ nodes: [app] });

            // Animate bar fills
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
                        <button class="btn-submit" onclick="App.navigate('#/')" style="margin-top:16px">
                            Вернуться на главную
                        </button>
                    </div>
                </div>
            `;
            lucide.createIcons({ nodes: [app] });
        }
    },
};
