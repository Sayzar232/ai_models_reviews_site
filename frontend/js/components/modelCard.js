/* ============================================
   ModelCard — grid card component
   ============================================ */

const ModelCard = {
    /**
     * Render a single model card
     * @param {Object} model — model object from API
     * @returns {string} HTML
     */
    render(model) {
        const stats = model.stats || {};
        const initials = Helpers.getInitials(model.name);
        const gradient = Helpers.getModelGradient(model.name);
        const overall = stats.avg_overall || 0;
        const reviewCount = stats.review_count || 0;

        const radarLabels = ['Код', 'Скор.', 'Цена/Кач.', 'Конт.', 'Креат.', 'Точн.'];
        const radarScores = [
            stats.avg_coding || 0,
            stats.avg_speed || 0,
            stats.avg_value || 0,
            stats.avg_context || 0,
            stats.avg_creativity || 0,
            stats.avg_accuracy || 0,
        ];

        const canvasId = `radar-${model.id}`;

        const logoContent = model.logo_url 
            ? `<img src="${model.logo_url}" alt="${model.name} logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`
            : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;

        return `
            <div class="model-card" onclick="App.navigate('#/model/${model.id}')" id="model-card-${model.id}">
                <div class="model-card-header">
                    <div class="model-logo">
                        ${logoContent}
                    </div>
                    <div class="model-card-title-group">
                        <div class="model-card-name">${Helpers.escapeHtml(model.name)}</div>
                        <div class="model-card-desc">${Helpers.escapeHtml(model.description)}</div>
                    </div>
                </div>

                <div class="model-card-rating">
                    ${Charts.createRatingCircle(overall)}
                    <div>
                        <div class="rating-label">Общий рейтинг</div>
                    </div>
                </div>

                <div class="model-card-chart">
                    <canvas id="${canvasId}" width="260" height="260"></canvas>
                </div>

                <div class="model-card-footer">
                    <div class="card-badge">
                        <i data-lucide="message-square"></i>
                        <span class="count">${reviewCount}</span> отзывов
                    </div>
                    <div class="card-badge">
                        <i data-lucide="clock"></i>
                        ${Helpers.formatTimeAgo(model.created_at)}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize radar charts after DOM insertion
     * @param {Object[]} models
     */
    initCharts(models) {
        models.forEach(model => {
            const canvas = document.getElementById(`radar-${model.id}`);
            if (!canvas) return;

            const stats = model.stats || {};
            const scores = [
                stats.avg_coding || 0,
                stats.avg_speed || 0,
                stats.avg_value || 0,
                stats.avg_context || 0,
                stats.avg_creativity || 0,
                stats.avg_accuracy || 0,
            ];
            const labels = ['Код', 'Скор.', 'Цена/Кач.', 'Конт.', 'Креат.', 'Точн.'];

            Charts.drawRadarChart(canvas, scores, labels);
        });
    },
};
