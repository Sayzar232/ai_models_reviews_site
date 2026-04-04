/* ============================================
   Helpers — utility functions
   ============================================ */

const Helpers = {
    /**
     * Format ISO date to readable Russian format
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    },

    /**
     * Format date as "time ago"
     */
    formatTimeAgo(isoString) {
        const now = new Date();
        const date = new Date(isoString);
        const seconds = Math.floor((now - date) / 1000);

        const intervals = [
            { label: 'г.', seconds: 31536000 },
            { label: 'мес.', seconds: 2592000 },
            { label: 'нед.', seconds: 604800 },
            { label: 'дн.', seconds: 86400 },
            { label: 'ч.', seconds: 3600 },
            { label: 'мин.', seconds: 60 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label} назад`;
            }
        }
        return 'только что';
    },

    /**
     * Validate email format
     */
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Debounce function calls
     */
    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    /**
     * Get color for rating value (0-10)
     */
    getRatingColor(value) {
        if (value >= 8) return '#34d399';
        if (value >= 6) return '#f5a623';
        if (value >= 4) return '#fbbf24';
        return '#ef4444';
    },

    /**
     * Get gradient for model logo based on name
     */
    getModelGradient(name) {
        const gradients = {
            'chatgpt': 'linear-gradient(135deg, #10a37f, #1a7f5a)',
            'gpt': 'linear-gradient(135deg, #10a37f, #1a7f5a)',
            'claude': 'linear-gradient(135deg, #d4a574, #c4916a)',
            'gemini': 'linear-gradient(135deg, #4285f4, #34a853)',
            'grok': 'linear-gradient(135deg, #1d9bf0, #0d8bd9)',
            'mistral': 'linear-gradient(135deg, #ff7000, #ff4500)',
            'llama': 'linear-gradient(135deg, #764abc, #5a3d8e)',
            'deepseek': 'linear-gradient(135deg, #4a9eff, #2563eb)',
            'qwen': 'linear-gradient(135deg, #6366f1, #4f46e5)',
        };
        const key = Object.keys(gradients).find(k => name.toLowerCase().includes(k));
        return gradients[key] || 'linear-gradient(135deg, #f5a623, #e09520)';
    },

    /**
     * Get initials for SVG avatar
     */
    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(/[\s()/]+/).filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    },

    /**
     * Get user avatar initial
     */
    getUserInitial(nickname) {
        return nickname ? nickname[0].toUpperCase() : '?';
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Create skeleton loader cards
     */
    createSkeletonCards(count = 6) {
        return Array.from({ length: count }, () =>
            `<div class="model-card skeleton-card"><div class="skeleton" style="width:100%;height:100%;border-radius:var(--radius-lg)"></div></div>`
        ).join('');
    },

    /**
     * Criteria labels mapping
     */
    criteriaLabels: {
        coding: 'Программирование',
        speed: 'Скорость',
        price: 'Цена',
        availability: 'Доступность в СНГ',
        creativity: 'Креативность',
        accuracy: 'Точность фактов',
    },

    /**
     * Criteria icons mapping (Lucide icon names)
     */
    criteriaIcons: {
        coding: 'code-2',
        speed: 'zap',
        price: 'wallet',
        availability: 'globe',
        creativity: 'sparkles',
        accuracy: 'target',
    },
};
