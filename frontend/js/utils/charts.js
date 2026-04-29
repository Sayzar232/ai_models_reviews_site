/* ============================================
   Charts — Canvas radar chart & CSS bar charts
   ============================================ */

const Charts = {
    /**
     * Draw a radar chart on a canvas element
     * @param {HTMLCanvasElement} canvas
     * @param {number[]} scores — array of 6 scores (0-10)
     * @param {string[]} labels — array of 6 labels
     */
    drawRadarChart(canvas, scores, labels) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 260;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const maxRadius = size / 2 - 36;
        const levels = 5;
        const angleStep = (Math.PI * 2) / scores.length;
        const startAngle = -Math.PI / 2;

        ctx.clearRect(0, 0, size, size);

        // Draw grid
        for (let level = 1; level <= levels; level++) {
            const r = (maxRadius / levels) * level;
            ctx.beginPath();
            for (let i = 0; i <= scores.length; i++) {
                const angle = startAngle + angleStep * i;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axes
        for (let i = 0; i < scores.length; i++) {
            const angle = startAngle + angleStep * i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw data polygon
        ctx.beginPath();
        for (let i = 0; i <= scores.length; i++) {
            const idx = i % scores.length;
            const angle = startAngle + angleStep * idx;
            const r = (scores[idx] / 10) * maxRadius;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Fill
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
        gradient.addColorStop(0, 'rgba(245, 166, 35, 0.25)');
        gradient.addColorStop(1, 'rgba(74, 158, 255, 0.08)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = 'rgba(245, 166, 35, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw dots
        for (let i = 0; i < scores.length; i++) {
            const angle = startAngle + angleStep * i;
            const r = (scores[i] / 10) * maxRadius;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#f5a623';
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 166, 35, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw labels
        ctx.font = '500 11px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < labels.length; i++) {
            const angle = startAngle + angleStep * i;
            const labelR = maxRadius + 24;
            let x = cx + Math.cos(angle) * labelR;
            let y = cy + Math.sin(angle) * labelR;

            ctx.fillStyle = '#9090a8';
            ctx.fillText(labels[i], x, y);
        }
    },

    /**
     * Create HTML for bar chart ratings
     * @param {Object} stats — { avg_coding, avg_speed, ... }
     * @returns {string} HTML
     */
    createBarCharts(stats) {
        const criteria = [
            { key: 'coding', label: 'Программирование', icon: 'code-2' },
            { key: 'speed', label: 'Скорость', icon: 'zap' },
            { key: 'value', label: 'Соотношение цена/качество', icon: 'coins' },
            { key: 'context', label: 'Работа с контекстом', icon: 'layers' },
            { key: 'creativity', label: 'Креативность', icon: 'sparkles' },
            { key: 'accuracy', label: 'Точность фактов', icon: 'target' },
        ];

        return criteria.map(c => {
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
    },

    /**
     * Create SVG arc-progress circle
     */
    createRatingCircle(value, size = 64) {
        const r = (size - 8) / 2;
        const circumference = 2 * Math.PI * r;
        const pct = value / 10;
        const offset = circumference * (1 - pct);
        const color = Helpers.getRatingColor(value);

        return `
            <div class="rating-circle" style="width:${size}px;height:${size}px">
                <svg width="${size}" height="${size}">
                    <circle class="bg-ring" cx="${size / 2}" cy="${size / 2}" r="${r}"></circle>
                    <circle class="fg-ring" cx="${size / 2}" cy="${size / 2}" r="${r}"
                        stroke="${color}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}">
                    </circle>
                </svg>
                <span class="rating-value">${value.toFixed(1)}</span>
            </div>
        `;
    },
};
