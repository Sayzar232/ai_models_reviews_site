/* ============================================
   ProfilePopup — user profile popup
   ============================================ */

const ProfilePopup = {
    async show(userId) {
        const overlay = document.getElementById('profile-popup-overlay');
        const popup = document.getElementById('profile-popup');

        popup.innerHTML = `
            <div style="padding:20px;text-align:center;color:var(--text-muted)">
                Загрузка...
            </div>
        `;
        overlay.classList.add('open');

        try {
            const user = await API.getUserProfile(userId);
            const initial = Helpers.getUserInitial(user.nickname);

            popup.innerHTML = `
                <button class="modal-close" onclick="ProfilePopup.close()"
                    style="position:absolute;top:16px;right:16px">
                    <i data-lucide="x"></i>
                </button>
                <div class="profile-popup-avatar">
                    <div class="user-avatar xlarge">${initial}</div>
                </div>
                <div class="profile-popup-name">${Helpers.escapeHtml(user.nickname)}</div>
                <div class="profile-popup-role">${Helpers.escapeHtml(user.role)}</div>
                ${user.bio ? `<div class="profile-popup-bio">${Helpers.escapeHtml(user.bio)}</div>` : ''}
                <div class="profile-popup-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${user.review_count}</div>
                        <div class="profile-stat-label">Отзывов</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${Helpers.formatDate(user.created_at).split(' ').slice(0, 2).join(' ')}</div>
                        <div class="profile-stat-label">На сайте с</div>
                    </div>
                </div>
            `;
            lucide.createIcons({ nodes: [popup] });
        } catch (error) {
            popup.innerHTML = `
                <div style="padding:20px;text-align:center;color:var(--accent-red)">
                    Не удалось загрузить профиль
                </div>
            `;
        }
    },

    close() {
        document.getElementById('profile-popup-overlay').classList.remove('open');
    },
};

// Close on overlay click
document.getElementById('profile-popup-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) ProfilePopup.close();
});
