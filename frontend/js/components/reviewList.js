/* ============================================
   ReviewList — paginated review feed
   ============================================ */

const ReviewList = {
    currentPage: 1,
    currentModelId: null,

    async render(modelId, page = 1) {
        this.currentModelId = modelId;
        this.currentPage = page;
        try {
            const data = await API.getReviews(modelId, page, 10);
            if (!data.reviews || data.reviews.length === 0) {
                return `<div class="empty-state"><i data-lucide="message-square-off"></i><h3>Пока нет отзывов</h3><p>Станьте первым, кто оставит отзыв!</p></div>`;
            }
            const reviewsHtml = data.reviews.map((r, i) => this.renderItem(r, i)).join('');
            return reviewsHtml + this.renderPagination(data);
        } catch (e) {
            return `<div class="empty-state"><p>Ошибка загрузки отзывов</p></div>`;
        }
    },

    renderItem(review, idx) {
        const a = review.author || {};
        const init = Helpers.getUserInitial(a.nickname || '?');
        const badges = [
            {l:'Код',v:review.score_coding},{l:'Скор.',v:review.score_speed},
            {l:'Цена/Кач.',v:review.score_value},{l:'Контекст',v:review.score_context},
            {l:'Креат.',v:review.score_creativity},{l:'Точн.',v:review.score_accuracy}
        ].map(s=>`<span class="review-score-badge"><span class="label">${s.l}</span><span class="value">${s.v.toFixed(1)}</span></span>`).join('');
        const tags = (review.tags||[]).map(t=>`<span class="review-tag-badge">${Helpers.escapeHtml(t)}</span>`).join('');

        return `<div class="review-item" style="animation-delay:${idx*0.06}s">
            <div class="review-item-header">
                <div class="review-author" onclick="ProfilePopup.show(${a.id})">
                    <div class="user-avatar">${init}</div>
                    <div class="review-author-info">
                        <span class="review-author-name">${Helpers.escapeHtml(a.nickname||'Аноним')}</span>
                        <span class="review-author-role">${Helpers.escapeHtml(a.role||'')}</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                    <span class="review-overall-badge">${review.overall_score.toFixed(1)}</span>
                    <span class="review-date">${Helpers.formatTimeAgo(review.created_at)}</span>
                </div>
            </div>
            <div class="review-scores">${badges}</div>
            <div class="review-text">${Helpers.escapeHtml(review.text)}</div>
            ${tags?`<div class="review-tags-list">${tags}</div>`:''}
            
            <div class="review-votes" style="display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-subtle)">
                <button class="vote-btn ${review.user_vote === 1 ? 'active' : ''}" onclick="ReviewList.handleVote(${review.id}, 1)">
                    <i data-lucide="thumbs-up"></i>
                    <span>${review.likes_count || 0}</span>
                </button>
                <button class="vote-btn ${review.user_vote === -1 ? 'active' : ''}" onclick="ReviewList.handleVote(${review.id}, -1)">
                    <i data-lucide="thumbs-down"></i>
                    <span>${review.dislikes_count || 0}</span>
                </button>
            </div>
        </div>`;
    },

    async handleVote(reviewId, vote) {
        if (!API.isAuthenticated()) {
            AuthModal.open('login');
            Toast.warning('Требуется авторизация', 'Войдите, чтобы оценивать отзывы');
            return;
        }
        
        try {
            // Optimistic UI updates could be done here, but full re-render ensures consistency
            // especially since sorting order might change.
            const btnContainer = document.querySelector(`.review-item button[onclick="ReviewList.handleVote(${reviewId}, ${vote})"]`)?.parentElement;
            if (btnContainer) {
                 btnContainer.style.opacity = '0.5';
            }
            
            await API.voteReview(reviewId, vote);
            await this.goToPage(this.currentPage);
        } catch (e) {
            Toast.error('Ошибка', 'Не удалось сохранить голос');
        }
    },

    renderPagination(data) {
        if (data.pages <= 1) return '';
        let h = '<div class="pagination">';
        h += `<button class="page-btn" ${data.page<=1?'disabled':''} onclick="ReviewList.goToPage(${data.page-1})"><i data-lucide="chevron-left"></i></button>`;
        for (let i=1;i<=data.pages;i++) {
            h += `<button class="page-btn ${i===data.page?'active':''}" onclick="ReviewList.goToPage(${i})">${i}</button>`;
        }
        h += `<button class="page-btn" ${data.page>=data.pages?'disabled':''} onclick="ReviewList.goToPage(${data.page+1})"><i data-lucide="chevron-right"></i></button>`;
        return h + '</div>';
    },

    async goToPage(page) {
        const c = document.getElementById('reviews-container');
        if (!c) return;
        c.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted)">Загрузка...</div>';
        c.innerHTML = await this.render(this.currentModelId, page);
        lucide.createIcons({nodes:[c]});
        c.scrollIntoView({behavior:'smooth',block:'start'});
    },
};
