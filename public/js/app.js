class KnowYourFanApp {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.currentView = 'dashboard';
        
        this.initElements();
        this.initEventListeners();
        this.checkAuth();
    }
    
    initElements() {
        // Login elements
        this.loginView = document.getElementById('login-view');
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginError = document.getElementById('login-error');
        
        // App elements
        this.appView = document.getElementById('app-view');
        this.logoutBtn = document.getElementById('logout-btn');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        // Views
        this.subViews = {
            dashboard: document.getElementById('dashboard-view'),
            fans: document.getElementById('fans-view'),
            analytics: document.getElementById('analytics-view')
        };
        
        // Dashboard
        this.dashboardCards = document.getElementById('dashboard-cards');
        
        // Fans
        this.fansContainer = document.getElementById('fans-container');
        this.searchFansInput = document.getElementById('search-fans');
        this.locationFilter = document.getElementById('location-filter');
        this.gameFilter = document.getElementById('game-filter');
        
        // Analytics
        this.locationChart = document.getElementById('location-chart');
        this.gameChart = document.getElementById('game-chart');
        this.engagementChart = document.getElementById('engagement-chart');
    }
    
    initEventListeners() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Logout button
        this.logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.showView(view);
            });
        });
        
        // Fans filters
        this.searchFansInput.addEventListener('input', () => {
            this.loadFans();
        });
        
        this.locationFilter.addEventListener('change', () => {
            this.loadFans();
        });
        
        this.gameFilter.addEventListener('change', () => {
            this.loadFans();
        });
    }
    
    checkAuth() {
        const token = localStorage.getItem('furia_token');
        if (token) {
            this.token = token;
            this.fetchCurrentUser();
        } else {
            this.showLogin();
        }
    }
    
    async fetchCurrentUser() {
        try {
            const response = await fetch('/api/analytics', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.showApp();
                this.loadInitialData();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            this.showLogin();
        }
    }
    
    async handleLogin() {
        const username = this.usernameInput.value;
        const password = this.passwordInput.value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('furia_token', this.token);
                this.currentUser = data.user;
                this.showApp();
                this.loadInitialData();
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        }
    }
    
    handleLogout() {
        localStorage.removeItem('furia_token');
        this.token = null;
        this.currentUser = null;
        this.showLogin();
    }
    
    showLogin() {
        this.loginView.style.display = 'block';
        this.appView.style.display = 'none';
        this.loginForm.reset();
        this.loginError.textContent = '';
    }
    
    showApp() {
        this.loginView.style.display = 'none';
        this.appView.style.display = 'block';
    }
    
    showView(viewName) {
        this.currentView = viewName;
        
        // Update active nav link
        this.navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-view') === viewName);
        });
        
        // Show/hide sub-views
        Object.keys(this.subViews).forEach(key => {
            this.subViews[key].style.display = key === viewName ? 'block' : 'none';
        });
        
        // Load data for the view
        switch(viewName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'fans':
                this.loadFans();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }
    
    async loadInitialData() {
        this.loadDashboard();
        this.initFilters();
    }
    
    async loadDashboard() {
        try {
            const [analyticsRes, fansRes] = await Promise.all([
                fetch('/api/analytics', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                }),
                fetch('/api/fans?limit=5', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                })
            ]);
            
            const analytics = await analyticsRes.json();
            const fans = await fansRes.json();
            
            this.renderDashboard(analytics, fans);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    renderDashboard(analytics, fans) {
        this.dashboardCards.innerHTML = '';
        
        // Add analytics cards
        const cards = [
            { title: 'Total Fans', value: analytics.totalFans },
            { title: 'High Engagement', value: analytics.engagementStats.high },
            { title: 'Top Location', value: Object.keys(analytics.byLocation)[0] || 'N/A' },
            { title: 'Top Game', value: Object.keys(analytics.byGame)[0] || 'N/A' },
            { title: 'Recent Fans', value: fans.length }
        ];
        
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
                <h3>${card.title}</h3>
                <div class="value">${card.value}</div>
            `;
            this.dashboardCards.appendChild(cardEl);
        });
    }
    
    async initFilters() {
        try {
            const response = await fetch('/api/analytics', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            // Locations
            const locations = Object.keys(data.byLocation);
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                this.locationFilter.appendChild(option);
            });
            
            // Games
            const games = Object.keys(data.byGame);
            games.forEach(game => {
                const option = document.createElement('option');
                option.value = game;
                option.textContent = game;
                this.gameFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    }
    
    async loadFans() {
        try {
            const location = this.locationFilter.value;
            const game = this.gameFilter.value;
            const search = this.searchFansInput.value;
            
            let url = '/api/fans?';
            if (location) url += `location=${location}&`;
            if (game) url += `game=${game}&`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            let fans = await response.json();
            
            // Apply search filter
            if (search) {
                const searchTerm = search.toLowerCase();
                fans = fans.filter(fan => 
                    fan.name.toLowerCase().includes(searchTerm) ||
                    (fan.socialMedia.twitter && fan.socialMedia.twitter.toLowerCase().includes(searchTerm)) ||
                    (fan.socialMedia.instagram && fan.socialMedia.instagram.toLowerCase().includes(searchTerm))
                );
            }
            
            this.renderFans(fans);
        } catch (error) {
            console.error('Error loading fans:', error);
        }
    }
    
    renderFans(fans) {
        this.fansContainer.innerHTML = '';
        
        if (fans.length === 0) {
            this.fansContainer.innerHTML = '<p>No fans found matching your criteria.</p>';
            return;
        }
        
        fans.forEach(fan => {
            const fanEl = document.createElement('div');
            fanEl.className = 'fan-card';
            
            let socialIcons = '';
            if (fan.socialMedia.twitter) {
                socialIcons += `<img src="/assets/twitter-icon.png" alt="Twitter" class="social-icon" title="${fan.socialMedia.twitter}">`;
            }
            if (fan.socialMedia.instagram) {
                socialIcons += `<img src="/assets/instagram-icon.png" alt="Instagram" class="social-icon" title="${fan.socialMedia.instagram}">`;
            }
            if (fan.socialMedia.twitch) {
                socialIcons += `<img src="/assets/twitch-icon.png" alt="Twitch" class="social-icon" title="${fan.socialMedia.twitch}">`;
            }
            
            fanEl.innerHTML = `
                <img src="/assets/user-avatar.png" alt="${fan.name}" class="fan-avatar">
                <div class="fan-info">
                    <h3>${fan.name}</h3>
                    <p><strong>Age:</strong> ${fan.age}</p>
                    <p><strong>Location:</strong> ${fan.location}</p>
                    <p><strong>Favorite Game:</strong> ${fan.favoriteGame}</p>
                    <p><strong>Engagement:</strong> ${this.getEngagementLabel(fan.engagement)}</p>
                    <div class="fan-social">${socialIcons}</div>
                </div>
            `;
            
            this.fansContainer.appendChild(fanEl);
        });
    }
    
    async loadAnalytics() {
        try {
            const response = await fetch('/api/analytics', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            this.renderAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }
    
    renderAnalytics(data) {
        // Simple text representation of charts
        // In a real app, you would use a library like Chart.js
        
        // Locations chart
        let locationHtml = '<ul>';
        for (const [location, count] of Object.entries(data.byLocation)) {
            locationHtml += `<li>${location}: ${count}</li>`;
        }
        locationHtml += '</ul>';
        this.locationChart.innerHTML = locationHtml;
        
        // Games chart
        let gameHtml = '<ul>';
        for (const [game, count] of Object.entries(data.byGame)) {
            gameHtml += `<li>${game}: ${count}</li>`;
        }
        gameHtml += '</ul>';
        this.gameChart.innerHTML = gameHtml;
        
        // Engagement chart
        let engagementHtml = '<ul>';
        for (const [level, count] of Object.entries(data.engagementStats)) {
            engagementHtml += `<li>${this.getEngagementLabel(level)}: ${count}</li>`;
        }
        engagementHtml += '</ul>';
        this.engagementChart.innerHTML = engagementHtml;
    }
    
    getEngagementLabel(level) {
        const labels = {
            high: 'High',
            medium: 'Medium',
            low: 'Low'
        };
        return labels[level] || level;
    }
    
    showError(message) {
        this.loginError.textContent = message;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KnowYourFanApp();
});