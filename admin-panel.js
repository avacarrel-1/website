// ===========================
// ADMIN PANEL FUNCTIONALITY
// ===========================

// CONFIGURATION: Change this password to secure your admin panel
const ADMIN_PASSWORD = 'IBuiltThis'; // TODO: Change this to your own secure password!

document.addEventListener('DOMContentLoaded', function() {
    const adminPanel = document.getElementById('admin-panel');
    const adminToggle = document.getElementById('admin-toggle');
    const adminForm = document.getElementById('admin-form');
    const closeAdminBtn = document.getElementById('close-admin');
    const resetBtn = document.getElementById('reset-content');
    const exportBtn = document.getElementById('export-content');
    const importBtn = document.getElementById('import-content');
    const importFile = document.getElementById('import-file');
    const saveStatus = document.getElementById('save-status');

    // Password prompt elements
    const passwordPrompt = document.getElementById('password-prompt');
    const passwordInput = document.getElementById('admin-password');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordCancel = document.getElementById('password-cancel');
    const passwordError = document.getElementById('password-error');

    // Check if user is authenticated
    function isAuthenticated() {
        return sessionStorage.getItem('adminAuthenticated') === 'true';
    }

    // Set authentication
    function setAuthenticated(value) {
        if (value) {
            sessionStorage.setItem('adminAuthenticated', 'true');
        } else {
            sessionStorage.removeItem('adminAuthenticated');
        }
    }

    // Show password prompt
    function showPasswordPrompt() {
        passwordPrompt.classList.add('active');
        passwordInput.value = '';
        passwordError.style.display = 'none';
        setTimeout(() => passwordInput.focus(), 100);
    }

    // Hide password prompt
    function hidePasswordPrompt() {
        passwordPrompt.classList.remove('active');
        passwordInput.value = '';
        passwordError.style.display = 'none';
    }

    // Verify password
    function verifyPassword(password) {
        return password === ADMIN_PASSWORD;
    }

    // Check URL hash for admin access
    function checkAdminAccess() {
        if (window.location.hash === '#admin') {
            requestAdminAccess();
        }
    }

    // Request admin access (with password check)
    function requestAdminAccess() {
        if (isAuthenticated()) {
            openAdminPanel();
        } else {
            showPasswordPrompt();
        }
    }

    // Open admin panel
    function openAdminPanel() {
        adminPanel.classList.add('active');
        populateForm();
        window.location.hash = 'admin';
    }

    // Close admin panel
    function closeAdminPanel() {
        adminPanel.classList.remove('active');
        window.location.hash = '';
        // Note: We don't clear authentication here so user can reopen without re-entering password
    }

    // Populate form with current content
    async function populateForm() {
        const content = await ContentManager.load();

        document.getElementById('page-title').value = content.meta.pageTitle;
        document.getElementById('logo').value = content.navigation.logo.replace('<br>', '\n');
        document.getElementById('menu-title').value = content.menu.title;
        document.getElementById('title-prefix').value = content.hero.titlePrefix;
        document.getElementById('name').value = content.hero.name;
        document.getElementById('tagline').value = content.hero.tagline;
        document.getElementById('bio').value = content.hero.bio;
        document.getElementById('explore-text').value = content.hero.exploreText;

        content.sections.forEach((section, index) => {
            document.getElementById(`section-${index + 1}`).value = section.label;
        });
    }

    // Show save status message
    function showStatus(message, isError = false) {
        saveStatus.textContent = message;
        saveStatus.className = 'save-status ' + (isError ? 'error' : 'success');
        saveStatus.style.display = 'block';
        setTimeout(() => {
            saveStatus.style.display = 'none';
        }, 3000);
    }

    // Event: Password submit
    if (passwordSubmit) {
        passwordSubmit.addEventListener('click', function() {
            const password = passwordInput.value;
            if (verifyPassword(password)) {
                setAuthenticated(true);
                hidePasswordPrompt();
                openAdminPanel();
            } else {
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    // Event: Password cancel
    if (passwordCancel) {
        passwordCancel.addEventListener('click', function() {
            hidePasswordPrompt();
            window.location.hash = '';
        });
    }

    // Event: Password input enter key
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                passwordSubmit.click();
            }
        });
    }

    // Event: Toggle admin panel
    if (adminToggle) {
        adminToggle.addEventListener('click', requestAdminAccess);
    }

    // Event: Close admin panel
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', closeAdminPanel);
    }

    // Event: Keyboard shortcut (Ctrl+Shift+E or Cmd+Shift+E)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            if (adminPanel.classList.contains('active')) {
                closeAdminPanel();
            } else {
                requestAdminAccess();
            }
        }
    });

    // Event: Save form
    if (adminForm) {
        adminForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Load current content so we preserve fields the form doesn't edit (blurb, experiences, color)
            const currentContent = await ContentManager.load();

            const newContent = {
                ...currentContent,
                meta: {
                    pageTitle: document.getElementById('page-title').value
                },
                navigation: {
                    logo: document.getElementById('logo').value.replace('\n', '<br>')
                },
                menu: {
                    title: document.getElementById('menu-title').value
                },
                hero: {
                    titlePrefix: document.getElementById('title-prefix').value,
                    name: document.getElementById('name').value,
                    tagline: document.getElementById('tagline').value,
                    bio: document.getElementById('bio').value,
                    exploreText: document.getElementById('explore-text').value
                },
                sections: currentContent.sections.map((section, index) => ({
                    ...section,
                    label: document.getElementById(`section-${index + 1}`).value
                }))
            };

            const success = ContentManager.save(newContent);
            if (success) {
                ContentManager.apply(newContent);
                showStatus('Content saved successfully!');
            } else {
                showStatus('Error saving content. Please try again.', true);
            }
        });
    }

    // Event: Reset to defaults
    if (resetBtn) {
        resetBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to reset all content to the public version from content.json? This will clear your LocalStorage edits.')) {
                const publicContent = await ContentManager.reset();
                ContentManager.apply(publicContent);
                await populateForm();
                showStatus('Content reset to public version');
            }
        });
    }

    // Event: Export content
    if (exportBtn) {
        exportBtn.addEventListener('click', async function() {
            await ContentManager.export();
            showStatus('Content exported as content.json! Replace the old file to publish changes.');
        });
    }

    // Event: Import content
    if (importBtn && importFile) {
        importBtn.addEventListener('click', function() {
            importFile.click();
        });

        importFile.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const content = await ContentManager.import(file);
                    ContentManager.apply(content);
                    await populateForm();
                    showStatus('Content imported successfully!');
                } catch (err) {
                    showStatus('Error importing file: ' + err.message, true);
                }
                // Reset file input
                e.target.value = '';
            }
        });
    }

    // Check for admin access on load
    checkAdminAccess();

    // Listen for hash changes
    window.addEventListener('hashchange', checkAdminAccess);
});
