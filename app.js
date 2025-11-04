// ==========================================
// AI Classroom - Main Application
// ==========================================

class AIClassroom {
  constructor() {
    this.supabase = null;
    this.auth = null;
    this.progress = null;
    this.currentPage = 'home';
    this.currentModule = null;
    this.currentStep = null;
  }

  // Initialize the application
  async initialize() {
    this.showLoading(true);

    try {
      // Check configuration
      if (!isConfigured()) {
        this.showError('Please configure your Supabase credentials in config.js');
        this.showLoading(false);
        return;
      }

      // Initialize Supabase
      this.supabase = window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
      );

      // Initialize managers
      this.auth = new AuthManager(this.supabase);
      this.progress = new ProgressManager(this.supabase, this.auth);

      // Set up auth state change handler
      this.auth.onAuthStateChange = (isAuthenticated) => {
        this.handleAuthStateChange(isAuthenticated);
      };

      // Initialize auth
      await this.auth.initialize();

      // Set up event listeners
      this.setupEventListeners();

      // Handle initial route
      this.handleRoute();

      this.showLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Failed to initialize application. Please check your configuration.');
      this.showLoading(false);
    }
  }

  // Handle authentication state changes
  async handleAuthStateChange(isAuthenticated) {
    const navLoggedIn = document.getElementById('navLoggedIn');
    const navLoggedOut = document.getElementById('navLoggedOut');

    if (isAuthenticated) {
      navLoggedIn.style.display = 'flex';
      navLoggedOut.style.display = 'none';

      // Update user UI
      await this.updateUserUI();

      // Load data
      await this.loadUserData();
    } else {
      navLoggedIn.style.display = 'none';
      navLoggedOut.style.display = 'flex';

      // Redirect to home if on protected page
      if (['dashboard', 'learning', 'progress'].includes(this.currentPage)) {
        this.navigateTo('home');
      }
    }
  }

  // Update user UI elements
  async updateUserUI() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const profile = await this.auth.getUserProfile();
    
    const userName = profile?.github_username || profile?.full_name || user.email?.split('@')[0] || 'User';
    const avatarUrl = profile?.github_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;

    document.getElementById('userName').textContent = userName;
    document.getElementById('userAvatar').src = avatarUrl;
    document.getElementById('userMenuName').textContent = userName;
    document.getElementById('userMenuEmail').textContent = user.email;
    document.getElementById('dashboardUserName').textContent = userName;
  }

  // Load user data
  async loadUserData() {
    if (!this.auth.isAuthenticated()) return;

    try {
      await this.progress.loadModules();
      await this.progress.loadUserProgress();

      // Update dashboard if visible
      if (this.currentPage === 'dashboard') {
        this.renderDashboard();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Dark mode toggle
    this.initDarkMode();
    document.getElementById('darkModeToggle')?.addEventListener('click', () => this.toggleDarkMode());
    
    // Auth buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
    document.getElementById('getStartedBtn')?.addEventListener('click', () => this.handleGetStarted());

    // User menu
    document.getElementById('userMenuBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userMenuDropdown').classList.toggle('show');
    });

    document.addEventListener('click', () => {
      document.getElementById('userMenuDropdown')?.classList.remove('show');
    });

    // Navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('href').substring(1);
        this.navigateTo(page);
      });
    });

    // Dashboard buttons
    document.getElementById('continueBtn')?.addEventListener('click', () => this.handleContinueLearning());
    document.getElementById('backToDashboard')?.addEventListener('click', () => this.navigateTo('dashboard'));

    // Community
    document.getElementById('sendMessageBtn')?.addEventListener('click', () => this.handleSendMessage());
    document.getElementById('refreshMessagesBtn')?.addEventListener('click', () => this.loadMessages());
    document.getElementById('messageInput')?.addEventListener('input', (e) => {
      document.getElementById('charCount').textContent = e.target.value.length;
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => this.handleRoute());
  }

  // Handle routing
  handleRoute() {
    const hash = window.location.hash.substring(1) || 'home';
    const [page, ...params] = hash.split('/');
    this.navigateTo(page, params, false);
  }

  // Navigate to a page
  navigateTo(page, params = [], updateHistory = true) {
    // Check authentication for protected pages
    if (['dashboard', 'learning', 'progress'].includes(page)) {
      if (!this.auth?.isAuthenticated()) {
        this.showLoginPrompt();
        page = 'home';
      }
    }

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(page);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = page;

      // Update URL
      if (updateHistory) {
        const url = params.length ? `#${page}/${params.join('/')}` : `#${page}`;
        window.history.pushState({}, '', url);
      }

      // Page-specific actions
      if (page === 'dashboard') {
        this.renderDashboard();
      } else if (page === 'learning') {
        this.renderLearning(params);
      } else if (page === 'community') {
        this.loadMessages();
      }

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }

  // Handle login
  async handleLogin() {
    try {
      await this.auth.signInWithGitHub();
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to sign in. Please try again.');
    }
  }

  // Handle logout
  async handleLogout() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to sign out. Please try again.');
    }
  }

  // Handle get started
  handleGetStarted() {
    if (this.auth.isAuthenticated()) {
      this.navigateTo('dashboard');
    } else {
      this.showLoginPrompt();
    }
  }

  // Show login prompt
  showLoginPrompt() {
    alert('Please sign in with GitHub to start learning!');
    document.getElementById('loginBtn')?.click();
  }

  // Render dashboard
  async renderDashboard() {
    if (!this.auth.isAuthenticated()) return;

    const summary = this.progress.getOverallProgress();
    const timeRemaining = this.progress.getEstimatedTimeRemaining();
    const nextStep = this.progress.getNextStep();

    // Update progress cards
    document.getElementById('overallProgress').textContent = `${summary.overallPercentage}%`;
    document.getElementById('completedSteps').textContent = `${summary.completedSteps}/${summary.totalSteps}`;
    document.getElementById('timeRemaining').textContent = timeRemaining.formatted;

    // Show next step or completion
    if (nextStep) {
      document.getElementById('currentModule').textContent = nextStep.module.title.split(' ')[0];
      document.getElementById('nextStepTitle').textContent = nextStep.step.title;
      document.getElementById('nextStepModule').textContent = `${nextStep.module.title} • ${nextStep.step.estimated_minutes} min`;
      document.getElementById('nextStepCard').style.display = 'block';
      document.getElementById('completedCard').style.display = 'none';
    } else {
      document.getElementById('nextStepCard').style.display = 'none';
      document.getElementById('completedCard').style.display = 'block';
    }

    // Render modules list
    this.renderModulesList();
  }

  // Render modules list
  renderModulesList() {
    const container = document.getElementById('modulesList');
    const modules = this.progress.modules;

    if (!modules || modules.length === 0) {
      container.innerHTML = '<div class="loading">No modules available</div>';
      return;
    }

    container.innerHTML = modules.map(module => {
      const moduleProgress = this.progress.getModuleProgress(module.id);
      return `
        <div class="module-card" data-module-id="${module.id}">
          <div class="module-card-header">
            <h3>${module.title}</h3>
            <span class="module-badge">${moduleProgress.completedSteps}/${moduleProgress.totalSteps} steps</span>
          </div>
          <p class="module-description">${module.description}</p>
          <div class="module-progress-bar">
            <div class="module-progress-fill" style="width: ${moduleProgress.completionPercentage}%"></div>
          </div>
          <div class="module-card-footer">
            <span class="module-progress-text">${moduleProgress.completionPercentage}% complete</span>
            <button class="btn btn-primary btn-small" onclick="app.startModule(${module.id})">
              ${moduleProgress.isStarted ? 'Continue' : 'Start'} →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Start/continue module
  async startModule(moduleId) {
    const module = this.progress.modules.find(m => m.id === moduleId);
    if (!module || !module.steps || module.steps.length === 0) return;

    // Find first incomplete step
    let targetStep = null;
    for (const step of module.steps) {
      const stepProgress = this.progress.getStepProgress(step.id);
      if (!stepProgress || stepProgress.status !== 'completed') {
        targetStep = step;
        break;
      }
    }

    // If all steps completed, go to first step
    if (!targetStep) {
      targetStep = module.steps[0];
    }

    this.navigateTo('learning', [module.slug, targetStep.slug]);
  }

  // Handle continue learning
  handleContinueLearning() {
    const nextStep = this.progress.getNextStep();
    if (nextStep) {
      this.navigateTo('learning', [nextStep.module.slug, nextStep.step.slug]);
    }
  }

  // Render learning page
  async renderLearning(params) {
    const [moduleSlug, stepSlug] = params;

    if (!moduleSlug) {
      this.navigateTo('dashboard');
      return;
    }

    const module = this.progress.modules.find(m => m.slug === moduleSlug);
    if (!module) {
      this.navigateTo('dashboard');
      return;
    }

    this.currentModule = module;

    // Render sidebar
    this.renderLearningSidebar(module, stepSlug);

    // Load step content
    if (stepSlug) {
      const step = module.steps.find(s => s.slug === stepSlug);
      if (step) {
        await this.renderStepContent(module, step);
      }
    }
  }

  // Render learning sidebar
  renderLearningSidebar(module, activeStepSlug) {
    const sidebar = document.getElementById('moduleSidebar');
    
    sidebar.innerHTML = `
      <div class="sidebar-module-title">${module.title}</div>
      <div class="sidebar-steps">
        ${module.steps.map(step => {
          const stepProgress = this.progress.getStepProgress(step.id);
          const isActive = step.slug === activeStepSlug;
          const isCompleted = stepProgress?.status === 'completed';
          const isInProgress = stepProgress?.status === 'in_progress';
          
          return `
            <a href="#learning/${module.slug}/${step.slug}" 
               class="sidebar-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}"
               data-step-id="${step.id}">
              <span class="step-status-icon">
                ${isCompleted ? '✓' : isInProgress ? '▶' : '○'}
              </span>
              <span class="step-title">${step.title}</span>
              <span class="step-duration">${step.estimated_minutes}min</span>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render step content
  async renderStepContent(module, step) {
    this.currentStep = step;

    // Mark as in progress
    await this.progress.startStep(module.id, step.id);

    const container = document.getElementById('stepContent');
    const stepProgress = this.progress.getStepProgress(step.id);
    const isCompleted = stepProgress?.status === 'completed';

    // Get content based on module and step
    const content = this.getStepContent(module, step);

    container.innerHTML = `
      <div class="step-header">
        <div class="step-meta">
          <span class="step-badge">${module.title}</span>
          <span class="step-duration">⏱️ ${step.estimated_minutes} min</span>
        </div>
        <h1 class="step-title">${step.title}</h1>
      </div>

      <div class="step-body">
        ${content}
      </div>

      <div class="step-footer">
        <button class="btn btn-secondary" onclick="app.navigateToPreviousStep()">← Previous</button>
        <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}" onclick="app.completeCurrentStep()">
          ${isCompleted ? 'Next Step →' : 'Mark Complete & Continue →'}
        </button>
      </div>
    `;
  }

  // Get step content
  getStepContent(module, step) {
    // This would typically come from a database or content files
    // For now, we'll generate basic content structure
    return this.getDefaultStepContent(module, step);
  }

  // Navigate to previous step
  navigateToPreviousStep() {
    if (!this.currentModule || !this.currentStep) return;

    const currentIndex = this.currentModule.steps.findIndex(s => s.id === this.currentStep.id);
    if (currentIndex > 0) {
      const previousStep = this.currentModule.steps[currentIndex - 1];
      this.navigateTo('learning', [this.currentModule.slug, previousStep.slug]);
    } else {
      this.navigateTo('dashboard');
    }
  }

  // Complete current step and move to next
  async completeCurrentStep() {
    if (!this.currentModule || !this.currentStep) return;

    try {
      await this.progress.completeStep(this.currentModule.id, this.currentStep.id);

      // Find next step
      const currentIndex = this.currentModule.steps.findIndex(s => s.id === this.currentStep.id);
      if (currentIndex < this.currentModule.steps.length - 1) {
        const nextStep = this.currentModule.steps[currentIndex + 1];
        this.navigateTo('learning', [this.currentModule.slug, nextStep.slug]);
      } else {
        // Module completed, go to dashboard
        alert('🎉 Congratulations! You completed this module!');
        this.navigateTo('dashboard');
      }
    } catch (error) {
      console.error('Error completing step:', error);
      alert('Failed to save progress. Please try again.');
    }
  }

  // Load messages for community board
  async loadMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;

    try {
      container.innerHTML = '<div class="loading">Loading messages...</div>';

      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        container.innerHTML = data.map(msg => `
          <div class="message-item">
            <div class="message-header">
              <img src="${msg.avatar_url || 'https://ui-avatars.com/api/?name=User'}" alt="${msg.username}" class="message-avatar">
              <div class="message-meta">
                <span class="message-username">${this.escapeHtml(msg.username || 'Anonymous')}</span>
                <span class="message-time">${this.formatDate(msg.created_at)}</span>
              </div>
            </div>
            <div class="message-content">${this.escapeHtml(msg.content)}</div>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<div class="loading">No messages yet. Be the first to post!</div>';
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      container.innerHTML = '<div class="error">Failed to load messages.</div>';
    }
  }

  // Handle send message
  async handleSendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content) {
      alert('Please enter a message!');
      return;
    }

    if (!this.auth.isAuthenticated()) {
      alert('Please sign in to post messages!');
      return;
    }

    try {
      const user = this.auth.getCurrentUser();
      const profile = await this.auth.getUserProfile();

      const { error } = await this.supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: content,
          username: profile?.github_username || profile?.full_name || user.email?.split('@')[0],
          avatar_url: profile?.github_avatar_url
        });

      if (error) throw error;

      input.value = '';
      document.getElementById('charCount').textContent = '0';
      await this.loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }

  // Get default step content (fallback)
  getDefaultStepContent(module, step) {
    return `
      <div class="content-section">
        <h2>Overview</h2>
        <p>This is the ${step.title} step in the ${module.title} module.</p>
      </div>

      <div class="content-section">
        <h2>What You'll Learn</h2>
        <ul>
          <li>Key concepts and best practices</li>
          <li>Step-by-step instructions</li>
          <li>Practical examples and code samples</li>
        </ul>
      </div>

      <div class="content-section">
        <h2>Instructions</h2>
        <p>Follow the steps below to complete this section:</p>
        <ol>
          <li>Review the documentation</li>
          <li>Follow along with the examples</li>
          <li>Complete the practice exercises</li>
          <li>Mark this step as complete when done</li>
        </ol>
      </div>

      <div class="tips-box">
        <strong>💡 Pro Tip:</strong>
        <p>Take your time and don't hesitate to revisit previous steps if needed!</p>
      </div>
    `;
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  showError(message) {
    alert(message);
  }

  // Dark mode functionality
  initDarkMode() {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateDarkModeIcon(savedTheme);
  }

  toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateDarkModeIcon(newTheme);
  }

  updateDarkModeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new AIClassroom();
  app.initialize();
});

