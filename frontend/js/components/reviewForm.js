/* ============================================
   ReviewForm — review submission form
   ============================================ */

const ReviewForm = {
    selectedTags: [],

    render(modelId) {
        if (!API.isAuthenticated()) {
            return `
                <div class="review-login-prompt">
                    <p>Чтобы оставить отзыв, войдите в аккаунт или зарегистрируйтесь</p>
                    <button class="btn-submit" onclick="AuthModal.open('login')">
                        <i data-lucide="log-in"></i>
                        Войти
                    </button>
                </div>
            `;
        }

        this.selectedTags = [];

        const sliders = [
            { key: 'coding', label: 'Программирование', icon: 'code-2' },
            { key: 'speed', label: 'Скорость', icon: 'zap' },
            { key: 'price', label: 'Цена', icon: 'wallet' },
            { key: 'availability', label: 'Доступность в СНГ', icon: 'globe' },
            { key: 'creativity', label: 'Креативность', icon: 'sparkles' },
            { key: 'accuracy', label: 'Точность фактов', icon: 'target' },
        ];

        const slidersHtml = sliders.map(s => `
            <div class="slider-group">
                <div class="slider-label">
                    <span class="slider-label-text">
                        <i data-lucide="${s.icon}" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px"></i>
                        ${s.label}
                    </span>
                    <span class="slider-label-value" id="slider-val-${s.key}">5.0</span>
                </div>
                <input type="range" id="slider-${s.key}" min="0" max="10" step="0.5" value="5"
                    oninput="ReviewForm.updateSliderValue('${s.key}', this.value)">
            </div>
        `).join('');

        const tags = ['Использую в работе', 'Тестировал', 'Попробовал разово'];
        const tagsHtml = tags.map(t => `
            <button type="button" class="review-tag" onclick="ReviewForm.toggleTag(this, '${t}')">${t}</button>
        `).join('');

        return `
            <div class="review-form-card">
                <div class="review-form-title">
                    <i data-lucide="edit-3"></i>
                    Оставить отзыв
                </div>
                <form id="review-form" onsubmit="ReviewForm.handleSubmit(event, ${modelId})">
                    <div class="review-sliders">
                        ${slidersHtml}
                    </div>
                    <textarea class="review-textarea" id="review-text"
                        placeholder="Поделитесь своим опытом использования модели (минимум 50 символов)..."
                        oninput="ReviewForm.updateCharCount()"></textarea>
                    <div class="review-char-count" id="review-char-count">0 / 50 мин.</div>

                    <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary)">
                        Опыт использования
                    </div>
                    <div class="review-tags">
                        ${tagsHtml}
                    </div>

                    <button class="btn-submit" type="submit" id="review-submit-btn">
                        <i data-lucide="send"></i>
                        Отправить отзыв
                    </button>
                </form>
            </div>
        `;
    },

    updateSliderValue(key, value) {
        const el = document.getElementById(`slider-val-${key}`);
        if (el) el.textContent = parseFloat(value).toFixed(1);
    },

    updateCharCount() {
        const textarea = document.getElementById('review-text');
        const counter = document.getElementById('review-char-count');
        if (!textarea || !counter) return;

        const len = textarea.value.length;
        counter.textContent = `${len} / 50 мин.`;
        counter.classList.toggle('error', len > 0 && len < 50);
    },

    toggleTag(btn, tag) {
        const idx = this.selectedTags.indexOf(tag);
        if (idx === -1) {
            this.selectedTags.push(tag);
            btn.classList.add('selected');
        } else {
            this.selectedTags.splice(idx, 1);
            btn.classList.remove('selected');
        }
    },

    async handleSubmit(e, modelId) {
        e.preventDefault();

        const text = document.getElementById('review-text').value.trim();
        if (text.length < 50) {
            Toast.warning('Короткий отзыв', 'Минимальная длина отзыва — 50 символов');
            return;
        }

        const getSliderVal = (key) => parseFloat(document.getElementById(`slider-${key}`).value);

        const data = {
            overall_score: parseFloat(((
                getSliderVal('coding') +
                getSliderVal('speed') +
                getSliderVal('price') +
                getSliderVal('availability') +
                getSliderVal('creativity') +
                getSliderVal('accuracy')
            ) / 6).toFixed(1)),
            score_coding: getSliderVal('coding'),
            score_speed: getSliderVal('speed'),
            score_price: getSliderVal('price'),
            score_availability: getSliderVal('availability'),
            score_creativity: getSliderVal('creativity'),
            score_accuracy: getSliderVal('accuracy'),
            text,
            tags: this.selectedTags,
        };

        const btn = document.getElementById('review-submit-btn');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" style="width:18px;height:18px"></i> Отправка...';

        try {
            await API.postReview(modelId, data);
            Toast.success('Отзыв отправлен!', 'Спасибо за ваш вклад в сообщество');

            // Reload the model page
            App.renderCurrentRoute();
        } catch (error) {
            Toast.error('Ошибка', error.message);
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="send"></i> Отправить отзыв';
            lucide.createIcons({ nodes: [btn] });
        }
    },
};
