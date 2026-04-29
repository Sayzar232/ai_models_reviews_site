/* ============================================
   LocalModelCard — grid card component for local models
   ============================================ */

const LocalModelCard = {
    render(model) {
        const stats = model.stats || {};
        const initials = Helpers.getInitials(model.name);
        const gradient = Helpers.getModelGradient(model.name);
        const overall = stats.avg_overall || 0;
        const reviewCount = stats.review_count || 0;

        const canvasId = `radar-local-${model.id}`;

        let logoContent = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;
        if (model.logo_url) {
            logoContent = `<img src="${model.logo_url}" alt="${model.name} logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;
        } else if (model.author) {
            // fallback generic hf avatar
            const hfLogo = `https://huggingface.co/avatars/${model.author}.svg`;
            logoContent = `<img src="${hfLogo}" alt="${model.name} logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:${gradient}">${initials}</div>`;
        }

        let displayAuthor = model.author;
        let displayName = model.name;
        
        if (displayName && displayName.includes('/')) {
            const parts = displayName.split('/');
            displayAuthor = parts[0];
            displayName = parts.slice(1).join('/');
        } else if (displayName && displayName.includes(': ')) {
            const parts = displayName.split(': ');
            displayAuthor = parts[0];
            displayName = parts.slice(1).join(': ');
        }

        let desc = model.description;
        if (!desc && displayAuthor) desc = `Модель от ${displayAuthor}`;

        return `
            <div class="model-card" onclick="App.navigate('#/local-model/${model.id}')" id="local-model-card-${model.id}">
                <div class="model-card-header">
                    <div class="model-logo">
                        ${logoContent}
                    </div>
                    <div class="model-card-title-group">
                        <div class="model-card-name">${Helpers.escapeHtml(displayName)}</div>
                        <div class="model-card-desc">${Helpers.escapeHtml(desc)}</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                            <i data-lucide="user" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px"></i>
                            ${Helpers.escapeHtml(displayAuthor || 'Неизвестно')}
                            <span style="margin: 0 4px">•</span>
                            <i data-lucide="layers" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px"></i>
                            ${model.parameters_approx > 0 ? model.parameters_approx + 'B' : '?'} 
                        </div>
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
                </div>
            </div>
        `;
    },

    initCharts(models) {
        models.forEach(model => {
            const canvas = document.getElementById(`radar-local-${model.id}`);
            if (!canvas) return;

            const stats = model.stats || {};
            const scores = [
                stats.avg_coding || 0,
                stats.avg_speed || 0,
                stats.avg_reasoning || 0,
                stats.avg_context || 0,
                stats.avg_instruction || 0,
                stats.avg_accuracy || 0,
            ];
            const labels = ['Код', 'Скор.', 'Логика', 'Конт.', 'Инстр.', 'Точн.'];

            Charts.drawRadarChart(canvas, scores, labels);
        });
    },
};
