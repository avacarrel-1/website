// ===========================
// CONTENT MANAGEMENT SYSTEM
// ===========================

const ContentManager = {
    // Public content (loaded from content.json)
    publicContent: null,

    // Load public content from content.json file
    async loadPublicContent() {
        try {
            // cache: 'no-store' ensures the browser always fetches the current content.json
            // (never a stale cached copy), so edits to the file always show on reload.
            const response = await fetch('content.json', { cache: 'no-store' });
            if (response.ok) {
                this.publicContent = await response.json();
                return this.publicContent;
            }
        } catch (e) {
            console.error('Error loading content.json:', e);
        }
        // Fallback if content.json fails to load
        return this.getFallbackContent();
    },

    // Fallback content if content.json fails to load
    getFallbackContent() {
        return {
            meta: {
                pageTitle: "Your Name - Portfolio"
            },
            navigation: {
                logo: "Contact Me"
            },
            menu: {
                title: "Explore"
            },
            hero: {
                titlePrefix: "made by",
                name: "AVA CARREL",
                tagline: '"Every line of code is her sound"',
                bio: "I'm a software engineer passionate about building beautiful, functional web experiences. I love working with modern technologies and solving complex problems through clean, efficient code.",
                exploreText: "explore"
            },
            sections: [
                { id: "ball-1", label: "Coral" },
                { id: "ball-2", label: "Ocean" },
                { id: "ball-3", label: "Sunshine" },
                { id: "ball-4", label: "Navy" },
                { id: "ball-5", label: "Cream" }
            ]
        };
    },

    // Load content: content.json is always the source of truth for the public page.
    // (The admin panel still writes to localStorage and updates the live preview in-session,
    //  but reloading always shows content.json — edit the file, or Export and replace it, to publish.)
    async load() {
        return await this.loadPublicContent();
    },

    // Save content to LocalStorage
    save(content) {
        try {
            localStorage.setItem('portfolioContent', JSON.stringify(content));
            return true;
        } catch (e) {
            console.error('Error saving content:', e);
            return false;
        }
    },

    // Reset to public content (clears LocalStorage overrides)
    async reset() {
        localStorage.removeItem('portfolioContent');
        return await this.loadPublicContent();
    },

    // Export content as JSON file (downloads as content.json for easy replacement)
    async export() {
        const content = await this.load();
        const dataStr = JSON.stringify(content, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'content.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Import content from JSON file
    import(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target.result);
                    // Validate structure matches expected format
                    if (content.meta && content.navigation && content.hero && content.sections) {
                        this.save(content);
                        resolve(content);
                    } else {
                        reject(new Error('Invalid content format'));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    // Apply content to the page
    apply(content) {
        // Page title
        document.title = content.meta.pageTitle;

        // Logo
        const logo = document.querySelector('.logo');
        if (logo) logo.innerHTML = content.navigation.logo;

        // Menu title
        const menuTitle = document.querySelector('.menu-title');
        if (menuTitle) menuTitle.textContent = content.menu.title;

        // Hero section
        const titlePrefix = document.querySelector('.title-prefix');
        if (titlePrefix) titlePrefix.textContent = content.hero.titlePrefix;

        const titleMain = document.querySelector('.title-main');
        if (titleMain) titleMain.textContent = content.hero.name;

        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) subtitle.textContent = content.hero.tagline;

        const bioText = document.querySelector('.bio-text');
        if (bioText) bioText.textContent = content.hero.bio;

        const exploreText = document.querySelector('.explore-text');
        if (exploreText) exploreText.textContent = content.hero.exploreText;

        // Sections (balls and menu items)
        content.sections.forEach((section) => {
            // Update menu item
            const menuItem = document.querySelector(`.menu-item[data-ball="${section.id}"]`);
            if (menuItem) menuItem.textContent = section.label;

            // Update ball label
            const ball = document.querySelector(`.${section.id}`);
            if (ball) {
                ball.setAttribute('data-label', section.label);
                const ballLabel = ball.querySelector('.ball-label');
                if (ballLabel) ballLabel.textContent = section.label;
            }
        });
    }
};

// Apply content on page load
document.addEventListener('DOMContentLoaded', async function() {
    const content = await ContentManager.load();
    ContentManager.apply(content);
});
