/* ============================================
   Toast — notification system
   ============================================ */

const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
    },

    /**
     * Show a toast notification
     * @param {'success'|'error'|'warning'} type
     * @param {string} title
     * @param {string} message
     * @param {number} duration — ms
     */
    show(type, title, message, duration = 4000) {
        if (!this.container) this.init();

        const iconMap = {
            success: 'check-circle-2',
            error: 'alert-circle',
            warning: 'alert-triangle',
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${Helpers.escapeHtml(title)}</div>
                <div class="toast-message">${Helpers.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="Toast.remove(this.closest('.toast'))">
                <i data-lucide="x"></i>
            </button>
        `;

        this.container.appendChild(toast);
        lucide.createIcons({ nodes: [toast] });

        // Auto remove
        setTimeout(() => this.remove(toast), duration);
    },

    remove(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    },

    success(title, message) {
        this.show('success', title, message);
    },

    error(title, message) {
        this.show('error', title, message);
    },

    warning(title, message) {
        this.show('warning', title, message);
    },
};
