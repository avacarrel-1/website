// ===========================
// SMOOTH INTERACTIONS
// ===========================

document.addEventListener('DOMContentLoaded', function() {

    // ===========================
    // NAVBAR SCROLL EFFECT
    // ===========================

    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.style.backgroundColor = 'rgba(232, 223, 212, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = 'transparent';
            navbar.style.backdropFilter = 'none';
        }
    });

    // ===========================
    // MENU BUTTON INTERACTION
    // ===========================

    const menuBtn = document.querySelector('.menu-btn');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    if (menuBtn && menuOverlay) {
        // Toggle menu open/close
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            menuBtn.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (menuOverlay.classList.contains('active') &&
                !menuOverlay.contains(e.target) &&
                !menuBtn.contains(e.target)) {
                menuBtn.classList.remove('active');
                menuOverlay.classList.remove('active');
            }
        });

        // Close the menu when an item is clicked. The modal opening for menu
        // items is wired up in the ContentManager.load() block below, alongside
        // the ball click handlers, since both need the loaded section data.
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                menuBtn.classList.remove('active');
                menuOverlay.classList.remove('active');
            });
        });

        // Close menu with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
                menuBtn.classList.remove('active');
                menuOverlay.classList.remove('active');
            }
        });
    }

    // ===========================
    // FADE-IN ANIMATION FOR ELEMENTS
    // ===========================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate bio section
    const bioSection = document.querySelector('.bio-section');
    if (bioSection) {
        bioSection.style.opacity = '0';
        bioSection.style.transform = 'translateY(30px)';
        bioSection.style.transition = 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s';
        observer.observe(bioSection);
    }

    // ===========================
    // PHYSICS-BASED FLOATING BALLS WITH COLLISION
    // ===========================

    class Ball {
        constructor(element) {
            this.element = element;
            this.radius = element.offsetWidth / 2;

            // Get container bounds (bottom third of screen)
            this.containerHeight = window.innerHeight * 0.33;
            this.containerWidth = window.innerWidth;

            // Random initial position within bounds, avoiding edges
            const edgePadding = this.radius * 3;
            this.x = edgePadding + Math.random() * (this.containerWidth - edgePadding * 2);
            this.y = edgePadding + Math.random() * (this.containerHeight - edgePadding * 2);

            // Random initial velocity (gentle movement)
            this.vx = (Math.random() - 0.5) * 1.4;
            this.vy = (Math.random() - 0.5) * 1.4;

            // Physics properties
            this.mass = this.radius; // Mass proportional to size
            this.damping = 0.995; // Smooth, fluid movement
            this.isHovered = false;

            // Set initial position
            this.updatePosition();

            // Hover events
            this.element.addEventListener('mouseenter', () => {
                this.isHovered = true;
            });
            this.element.addEventListener('mouseleave', () => {
                this.isHovered = false;
            });
        }

        updatePosition() {
            // Convert from physics coordinates to CSS (bottom-left origin to top-left)
            const cssY = this.containerHeight - this.y;
            this.element.style.left = `${this.x - this.radius}px`;
            this.element.style.bottom = `${cssY - this.radius}px`;
        }

        update() {
            // Add gentle floating force (centered for balanced movement)
            this.vx += (Math.random() - 0.5) * .12;
            this.vy += (Math.random() - 0.5) * .12;

            // Apply damping for smooth movement
            this.vx *= this.damping;
            this.vy *= this.damping;

            // Cap maximum velocity for smooth movement
            const maxVelocity = 2.5;
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > maxVelocity) {
                const scale = maxVelocity / speed;
                this.vx *= scale;
                this.vy *= scale;
            }

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls with buffer and random push to prevent corners
            const buffer = 3;
            const bounceCoeff = 0.85;

            if (this.x - this.radius < buffer) {
                this.x = this.radius + buffer;
                this.vx = Math.abs(this.vx) * bounceCoeff;
                this.vy += (Math.random() - 0.5) * 0.1; // Gentle anti-corner push
            } else if (this.x + this.radius > this.containerWidth - buffer) {
                this.x = this.containerWidth - this.radius - buffer;
                this.vx = -Math.abs(this.vx) * bounceCoeff;
                this.vy += (Math.random() - 0.5) * 0.1; // Gentle anti-corner push
            }

            if (this.y - this.radius < buffer) {
                this.y = this.radius + buffer;
                this.vy = Math.abs(this.vy) * bounceCoeff;
                this.vx += (Math.random() - 0.5) * 0.1; // Gentle anti-corner push
            } else if (this.y + this.radius > this.containerHeight - buffer) {
                this.y = this.containerHeight - this.radius - buffer;
                this.vy = -Math.abs(this.vy) * bounceCoeff;
                this.vx += (Math.random() - 0.5) * 0.1; // Gentle anti-corner push
            }

            this.updatePosition();
        }

        // Check collision with another ball
        checkCollision(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + other.radius;

            return distance < minDistance;
        }

        // Resolve collision with another ball using elastic collision physics
        resolveCollision(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + other.radius;

            if (distance < minDistance && distance > 0.1) {
                // Normalize collision vector
                const nx = dx / distance;
                const ny = dy / distance;

                // Relative velocity
                const dvx = other.vx - this.vx;
                const dvy = other.vy - this.vy;

                // Relative velocity in collision normal direction
                const dvn = dvx * nx + dvy * ny;

                // Do not resolve if velocities are separating
                if (dvn > 0) return;

                // Collision impulse (balloon-like bounciness)
                const restitution = 0.95;
                const impulse = (2 * dvn) / (this.mass + other.mass);

                // Apply impulse
                this.vx += impulse * other.mass * nx * restitution;
                this.vy += impulse * other.mass * ny * restitution;
                other.vx -= impulse * this.mass * nx * restitution;
                other.vy -= impulse * this.mass * ny * restitution;

                // Aggressive separation to prevent clumping
                const overlap = (minDistance - distance) * 1.5; // Extra separation for clean bounces
                const totalMass = this.mass + other.mass;

                // Mass-weighted separation
                const thisRatio = other.mass / totalMass;
                const otherRatio = this.mass / totalMass;

                this.x -= nx * overlap * thisRatio;
                this.y -= ny * overlap * thisRatio;
                other.x += nx * overlap * otherRatio;
                other.y += ny * overlap * otherRatio;

                // Add a small bounce-away force for balloon-like behavior
                const bounceForce = 0.3;
                this.vx -= nx * bounceForce;
                this.vy -= ny * bounceForce;
                other.vx += nx * bounceForce;
                other.vy += ny * bounceForce;
            }
        }

        handleResize() {
            this.containerHeight = window.innerHeight * 0.33;
            this.containerWidth = window.innerWidth;

            // Keep ball within new bounds
            this.x = Math.max(this.radius, Math.min(this.x, this.containerWidth - this.radius));
            this.y = Math.max(this.radius, Math.min(this.y, this.containerHeight - this.radius));
        }
    }

    // Initialize balls
    const ballElements = document.querySelectorAll('.color-ball');
    const balls = Array.from(ballElements).map(el => new Ball(el));

    // Animation loop
    function animate() {
        // Update all balls
        balls.forEach(ball => {
            ball.update();

            // Anti-clump mechanism: if ball is moving very slowly, give it a gentle push
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed < 0.2) {
                ball.vx += (Math.random() - 0.5) * 0.3;
                ball.vy += (Math.random() - 0.5) * 0.3;
            }
        });

        // Check collisions between all pairs of balls
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                if (balls[i].checkCollision(balls[j])) {
                    balls[i].resolveCollision(balls[j]);
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // Start animation
    if (balls.length > 0) {
        animate();
    }

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            balls.forEach(ball => {
                ball.radius = ball.element.offsetWidth / 2;
                ball.handleResize();
            });
        }, 250);
    });

    // ===========================
    // BALL MODALS
    // ===========================

    const modal = document.getElementById('ball-modal');
    const modalTitle = modal.querySelector('.ball-modal-title');
    const modalBlurb = modal.querySelector('.ball-modal-blurb');
    const modalExperiences = modal.querySelector('.ball-modal-experiences');
    const modalClose = modal.querySelector('.ball-modal-close');
    const modalOverlay = modal.querySelector('.ball-modal-overlay');

    function openModal(section) {
        modalTitle.textContent = section.label;
        modalTitle.style.borderLeftColor = section.color;
        modalBlurb.textContent = section.blurb;

        modalExperiences.innerHTML = '';
        if (section.experiences && section.experiences.length > 0) {
            section.experiences.forEach(exp => {
                const entry = document.createElement('div');
                entry.className = 'experience-entry';

                const header = document.createElement('div');
                header.className = 'experience-header';

                const org = document.createElement('span');
                org.className = 'experience-org';
                org.textContent = exp.org;

                const dates = document.createElement('span');
                dates.className = 'experience-dates';
                dates.textContent = exp.dates;

                header.appendChild(org);
                header.appendChild(dates);
                entry.appendChild(header);

                const location = document.createElement('div');
                location.className = 'experience-location';
                location.textContent = exp.location;
                entry.appendChild(location);

                if (exp.context) {
                    const context = document.createElement('div');
                    context.className = 'experience-context';
                    context.textContent = exp.context;
                    entry.appendChild(context);
                }

                const role = document.createElement('div');
                role.className = 'experience-role';
                role.textContent = exp.role;
                entry.appendChild(role);

                if (exp.bullets && exp.bullets.length > 0) {
                    const ul = document.createElement('ul');
                    ul.className = 'experience-bullets';
                    exp.bullets.forEach(bulletText => {
                        const li = document.createElement('li');
                        li.textContent = bulletText;
                        ul.appendChild(li);
                    });
                    entry.appendChild(ul);
                }

                modalExperiences.appendChild(entry);
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Fallback used only if content.about is missing (e.g. stale saved content)
    const ABOUT_FALLBACK = {
        title: "About Me",
        paragraphs: [
            "I'm an Economics and Data Science student at Boston University interested in the intersection of technology, finance, and people."
        ]
    };

    function openAbout(about) {
        const data = (about && about.paragraphs && about.paragraphs.length) ? about : ABOUT_FALLBACK;

        modalTitle.textContent = data.title || "About Me";
        modalTitle.style.borderLeftColor = 'var(--primary-pink)';

        // About uses stacked paragraphs instead of the single blurb/experiences layout
        modalBlurb.textContent = '';
        modalBlurb.style.display = 'none';

        modalExperiences.innerHTML = '';
        data.paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.className = 'about-paragraph';
            p.textContent = text;
            modalExperiences.appendChild(p);
        });

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Restore the blurb element for section modals
        modalBlurb.style.display = '';
    }

    modalOverlay.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Attach click handlers to balls using loaded content
    ContentManager.load().then(content => {
        ballElements.forEach(el => {
            const ballClass = Array.from(el.classList).find(c => /^ball-\d+$/.test(c));
            if (!ballClass) return;
            const section = content.sections.find(s => s.id === ballClass);
            if (!section) return;
            el.addEventListener('click', () => openModal(section));
        });

        // Menu items open the same modal as their corresponding ball. The
        // data-ball attribute (e.g. "ball-2") matches a section id.
        menuItems.forEach(item => {
            const ballClass = item.getAttribute('data-ball');
            const section = content.sections.find(s => s.id === ballClass);
            if (!section) return;
            item.addEventListener('click', () => openModal(section));
        });

        // Wire the glowing "about" badge in the hero to the same modal
        const aboutBadge = document.getElementById('about-badge');
        if (aboutBadge) {
            aboutBadge.addEventListener('click', () => openAbout(content.about));
        }
    });

});
