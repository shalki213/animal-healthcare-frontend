/**
 * Flow Field Background — Vanilla JS
 * Adapted from the React Flow-Field component
 */
(function () {
    'use strict';

    // Configuration
    const color = "#2ecc71"; // Updated to match the original green theme from the site (#2ecc71 or #6366f1 if requested indigo)
    const trailOpacity = 0.15;
    const particleCount = 600;
    const speed = 1;

    function init() {
        const canvas = document.createElement('canvas');
        canvas.id = 'flowFieldBackground';
        // z-index: -9999 ensures it's always behind the content
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-9999;pointer-events:none;background-color:#0d1117;';
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let particles = [];
        let animationFrameId;
        // Since pointer-events is none on canvas, track mouse on window
        let mouse = { x: -1000, y: -1000 };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = 0;
                this.vy = 0;
                this.age = 0;
                this.life = Math.random() * 200 + 100;
            }

            update() {
                // Flow Field Math
                const angle = (Math.cos(this.x * 0.005) + Math.sin(this.y * 0.005)) * Math.PI;
                this.vx += Math.cos(angle) * 0.2 * speed;
                this.vy += Math.sin(angle) * 0.2 * speed;

                // Mouse Repulsion
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const interactionRadius = 150;

                if (distance < interactionRadius) {
                    const force = (interactionRadius - distance) / interactionRadius;
                    this.vx -= dx * force * 0.05;
                    this.vy -= dy * force * 0.05;
                }

                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.95; // Friction
                this.vy *= 0.95;

                this.age++;
                if (this.age > this.life) this.reset();

                // Wrap around edges
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = 0;
                this.vy = 0;
                this.age = 0;
                this.life = Math.random() * 200 + 100;
            }

            draw(context) {
                context.fillStyle = color;
                // Fade based on age
                const alpha = 1 - Math.abs((this.age / this.life) - 0.5) * 2;
                context.globalAlpha = alpha;
                context.fillRect(this.x, this.y, 1.5, 1.5);
            }
        }

        const setupCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            // Trail effect (fade out old frames)
            ctx.fillStyle = `rgba(13, 17, 23, ${trailOpacity})`; // Dark background to match #0d1117 theme
            ctx.globalAlpha = 1.0;
            ctx.fillRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            animationFrameId = window.requestAnimationFrame(animate);
        };

        const handleResize = () => {
            setupCanvas();
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        setupCanvas();
        animate();

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
