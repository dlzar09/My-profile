/*
    Interactive portfolio JavaScript
    - Scroll progress
    - Reveal animations
    - Active nav
    - Counter animation
    - Magnetic tilt cards
    - Hero constellation canvas
    - Command palette with keyboard shortcut D
*/

(() => {
    "use strict";

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll progress + navbar + back-to-top
    const progress = $(".scroll-progress");
    const nav = $(".luxury-nav");
    const backToTop = $(".back-to-top");

    const updateScrollUI = () => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        const pct = total > 0 ? (doc.scrollTop / total) * 100 : 0;
        if (progress) progress.style.width = `${pct}%`;
        if (nav) nav.classList.toggle("scrolled", window.scrollY > 18);
        if (backToTop) backToTop.classList.toggle("show", window.scrollY > 600);
    };

    window.addEventListener("scroll", updateScrollUI, { passive: true });
    updateScrollUI();

    // Typed role without external plugin
    const typedOutput = $(".typed-text-output");
    const typedSource = $(".typed-text");
    if (typedOutput && typedSource && !prefersReducedMotion) {
        const words = typedSource.textContent.split(",").map(w => w.trim()).filter(Boolean);
        let wordIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const tick = () => {
            const word = words[wordIndex] || "";
            typedOutput.textContent = deleting
                ? word.slice(0, charIndex--)
                : word.slice(0, charIndex++);

            if (!deleting && charIndex > word.length + 8) deleting = true;
            if (deleting && charIndex < 0) {
                deleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                charIndex = 0;
            }

            setTimeout(tick, deleting ? 42 : 72);
        };

        tick();
    } else if (typedOutput && typedSource) {
        typedOutput.textContent = typedSource.textContent.split(",")[0].trim();
    }

    // Reveal on scroll
    const revealItems = $$(".reveal");
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    revealItems.forEach(item => revealObserver.observe(item));

    // Counter animation
    const counters = $$("[data-counter]");
    const animateCounter = (el) => {
        const target = Number(el.dataset.counter || 0);
        const suffix = el.dataset.suffix || "+";
        const start = performance.now();
        const duration = 1100;

        const frame = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${Math.round(eased * target)}${suffix}`;
            if (progress < 1) requestAnimationFrame(frame);
        };

        requestAnimationFrame(frame);
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.65 });

    counters.forEach(counter => counterObserver.observe(counter));

    // Active nav
    const sectionIds = $$(".navbar-nav .nav-link")
        .map(link => link.getAttribute("href"))
        .filter(href => href && href.startsWith("#"));

    const sections = sectionIds.map(id => $(id)).filter(Boolean);
    const updateActiveNav = () => {
        const y = window.scrollY + 120;
        let active = sections[0]?.id;

        sections.forEach(section => {
            if (section.offsetTop <= y) active = section.id;
        });

        $$(".navbar-nav .nav-link").forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${active}`);
        });
    };

    window.addEventListener("scroll", updateActiveNav, { passive: true });
    updateActiveNav();

    // Magnetic tilt
    const tiltCards = $$("[data-tilt]");
    if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
        tiltCards.forEach(card => {
            card.addEventListener("mousemove", (event) => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const rotateX = ((y / rect.height) - 0.5) * -7;
                const rotateY = ((x / rect.width) - 0.5) * 7;
                card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
            });
        });
    }

    // Cursor glow
    const glow = $(".cursor-glow");
    if (glow && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("pointermove", (event) => {
            glow.style.left = `${event.clientX}px`;
            glow.style.top = `${event.clientY}px`;
        }, { passive: true });
    }

    // Command palette
    const palette = $("#commandPalette");
    const openButtons = $$("[data-command-open]");
    const closeButtons = $$("[data-command-close]");

    const openPalette = () => {
        if (!palette) return;
        palette.classList.add("open");
        palette.setAttribute("aria-hidden", "false");
    };

    const closePalette = () => {
        if (!palette) return;
        palette.classList.remove("open");
        palette.setAttribute("aria-hidden", "true");
    };

    openButtons.forEach(btn => btn.addEventListener("click", openPalette));
    closeButtons.forEach(btn => btn.addEventListener("click", closePalette));

    window.addEventListener("keydown", (event) => {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isTyping = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;
        if (isTyping) return;

        if (event.key.toLowerCase() === "d") openPalette();
        if (event.key === "Escape") closePalette();
    });

    if (palette) {
        palette.addEventListener("click", (event) => {
            if (event.target === palette) closePalette();
        });
    }

    // Hero constellation canvas
    const canvas = $("#signalCanvas");
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext("2d");
        let width = 0;
        let height = 0;
        let particles = [];

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = Math.min(96, Math.max(44, Math.floor(width / 18)));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.28,
                vy: (Math.random() - 0.5) * 0.28,
                r: Math.random() * 1.8 + 0.7
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(216, 222, 230, 0.45)";
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(216, 222, 230, ${0.12 * (1 - dist / 130)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(draw);
        };

        resize();
        draw();
        window.addEventListener("resize", resize);
    }
})();
