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

      // Check if user is admin/trainer and show admin tab
      await this.checkAdminStatus();

      // Load data
      await this.loadUserData();
    } else {
      navLoggedIn.style.display = 'none';
      navLoggedOut.style.display = 'flex';

      // Redirect to home if on protected page
      if (['dashboard', 'learning', 'progress', 'admin'].includes(this.currentPage)) {
        this.navigateTo('home');
      }
    }
  }

  // Check if user is admin or trainer
  async checkAdminStatus() {
    if (!this.auth.isAuthenticated()) return false;

    try {
      const profile = await this.auth.getUserProfile();
      const isAdmin = profile && (profile.role === 'admin' || profile.role === 'trainer');
      
      // Show/hide admin nav link
      const adminNavLink = document.getElementById('adminNavLink');
      if (adminNavLink) {
        adminNavLink.style.display = isAdmin ? 'block' : 'none';
      }

      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
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

    // Admin dashboard
    document.getElementById('refreshRosterBtn')?.addEventListener('click', () => this.loadStudentRoster());
    document.getElementById('searchStudents')?.addEventListener('input', (e) => this.filterStudents(e.target.value));
    document.getElementById('classFilter')?.addEventListener('change', (e) => this.filterByClass(e.target.value));
    
    // Class management modals
    document.getElementById('createClassBtn')?.addEventListener('click', () => this.showCreateClassModal());
    document.getElementById('closeCreateClassModal')?.addEventListener('click', () => this.hideModal('createClassModal'));
    document.getElementById('cancelCreateClass')?.addEventListener('click', () => this.hideModal('createClassModal'));
    document.getElementById('submitCreateClass')?.addEventListener('click', () => this.handleCreateClass());
    
    // Manage students modal
    document.getElementById('closeManageStudentsModal')?.addEventListener('click', () => this.hideModal('manageStudentsModal'));
    document.getElementById('closeManageStudents')?.addEventListener('click', () => this.hideModal('manageStudentsModal'));
    document.getElementById('saveEnrollments')?.addEventListener('click', () => this.handleSaveEnrollments());
    document.getElementById('searchAvailableStudents')?.addEventListener('input', (e) => this.filterAvailableStudents(e.target.value));

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
  async navigateTo(page, params = [], updateHistory = true) {
    // Check authentication for protected pages
    if (['dashboard', 'learning', 'progress', 'admin'].includes(page)) {
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
      } else if (page === 'admin') {
        await this.renderAdminDashboard();
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
      // Get class name for completion message
      const className = this.modules.length > 0 && this.modules[0].class 
        ? this.modules[0].class.name 
        : 'AI Classroom';
      
      const completedCard = document.getElementById('completedCard');
      if (completedCard) {
        completedCard.querySelector('p').textContent = `You've completed all modules in ${className}!`;
      }
      
      document.getElementById('nextStepCard').style.display = 'none';
      document.getElementById('completedCard').style.display = 'block';
    }

    // Show available classes for everyone (students, trainers, admins can all join)
    await this.loadAvailableClasses();
    document.getElementById('joinClassSection').style.display = 'block';

    // Render modules list
    this.renderModulesList();
  }

  // Render modules list
  renderModulesList() {
    const container = document.getElementById('modulesList');
    const modules = this.progress.modules;

    if (!modules || modules.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>No Modules Available</h3>
          <p>Join a class above to access learning modules!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = modules.map(module => {
      const moduleProgress = this.progress.getModuleProgress(module.id);
      const isCompleted = moduleProgress.isCompleted;
      const buttonText = isCompleted ? '🔄 Review' : (moduleProgress.isStarted ? 'Continue' : 'Start');
      const buttonClass = isCompleted ? 'btn-secondary' : 'btn-primary';
      
      return `
        <div class="module-card ${isCompleted ? 'module-completed' : ''}" data-module-id="${module.id}">
          <div class="module-card-header">
            <h3>${module.title}</h3>
            <span class="module-badge ${isCompleted ? 'badge-completed' : ''}">${moduleProgress.completedSteps}/${moduleProgress.totalSteps} steps</span>
          </div>
          <p class="module-description">${module.description}</p>
          <div class="module-progress-bar">
            <div class="module-progress-fill" style="width: ${moduleProgress.completionPercentage}%"></div>
          </div>
          <div class="module-card-footer">
            <span class="module-progress-text">
              ${isCompleted ? '✅ Completed' : `${moduleProgress.completionPercentage}% complete`}
            </span>
            <button class="btn ${buttonClass} btn-small" onclick="app.startModule(${module.id})">
              ${buttonText} →
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
        <div class="step-footer-right">
          ${isCompleted ? '<span class="completion-notice">✅ You completed this step</span>' : ''}
          <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}" onclick="app.completeCurrentStep()">
            ${isCompleted ? 'Next Step →' : 'Mark Complete & Continue →'}
          </button>
        </div>
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

  // ==========================================
  // ADMIN DASHBOARD FUNCTIONS
  // ==========================================

  async renderAdminDashboard() {
    // Check if user is admin
    const isAdmin = await this.checkAdminStatus();
    if (!isAdmin) {
      alert('Access denied. Admin privileges required.');
      this.navigateTo('dashboard');
      return;
    }

    await this.loadStudentRoster();
    await this.loadAdminStats();
    await this.loadClasses();
  }

  async loadAdminStats() {
    try {
      // Get all students using function (more reliable with RLS)
      const { data: students, error } = await this.supabase
        .rpc('get_student_roster');

      if (error) {
        console.error('Error loading students:', error);
        throw error;
      }

      // Calculate stats
      const totalStudents = students ? students.length : 0;
      const avgCompletion = students && students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + (s.overall_completion_percentage || 0), 0) / students.length)
        : 0;

      // Get active classes
      const { data: classes } = await this.supabase
        .from('classes')
        .select('*')
        .eq('is_active', true);

      const activeClasses = classes ? classes.length : 0;

      // Get active this week (last login within 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const activeThisWeek = students
        ? students.filter(s => new Date(s.last_login) > weekAgo).length
        : 0;

      // Update UI
      document.getElementById('totalStudents').textContent = totalStudents;
      document.getElementById('activeClasses').textContent = activeClasses;
      document.getElementById('avgCompletion').textContent = `${avgCompletion}%`;
      document.getElementById('activeThisWeek').textContent = activeThisWeek;
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  }

  async loadStudentRoster() {
    const container = document.getElementById('studentRoster');
    if (!container) return;

    try {
      container.innerHTML = '<div class="loading">Loading students...</div>';

      // Use RPC function instead of direct view access
      const { data: students, error } = await this.supabase
        .rpc('get_student_roster');

      if (error) {
        console.error('Error loading roster:', error);
        throw error;
      }

      if (!students || students.length === 0) {
        container.innerHTML = '<div class="loading">No students enrolled yet.</div>';
        return;
      }

      // Store for filtering
      this.allStudents = students;

      // Render table
      this.renderStudentTable(students);
    } catch (error) {
      console.error('Error loading student roster:', error);
      container.innerHTML = '<div class="error">Failed to load student roster.</div>';
    }
  }

  renderStudentTable(students) {
    const container = document.getElementById('studentRoster');
    if (!students || students.length === 0) {
      container.innerHTML = '<div class="loading">No students match your filters.</div>';
      return;
    }

    container.innerHTML = `
      <table class="roster-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Progress</th>
            <th>Steps Completed</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td>
                <div class="student-info">
                  <img src="${student.github_avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.github_username || 'User')}" 
                       alt="${student.github_username}" 
                       class="student-avatar">
                  <div class="student-details">
                    <div class="student-name">${this.escapeHtml(student.github_username || student.full_name || 'Unknown')}</div>
                    <div class="student-email">${this.escapeHtml(student.email || '')}</div>
                  </div>
                </div>
              </td>
              <td>
                ${student.class_name ? `<span class="role-badge role-student">${this.escapeHtml(student.class_name)}</span>` : '<span class="text-secondary">Not assigned</span>'}
              </td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${student.overall_completion_percentage || 0}%"></div>
                </div>
                <div class="progress-text">${student.overall_completion_percentage || 0}%</div>
              </td>
              <td>${student.steps_completed || 0} / ${student.total_steps_started || 0}</td>
              <td>${this.formatDate(student.last_login)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  filterStudents(searchTerm) {
    if (!this.allStudents) return;

    const filtered = this.allStudents.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (student.github_username || '').toLowerCase().includes(searchLower) ||
        (student.email || '').toLowerCase().includes(searchLower) ||
        (student.full_name || '').toLowerCase().includes(searchLower)
      );
    });

    this.renderStudentTable(filtered);
  }

  filterByClass(classId) {
    if (!this.allStudents) return;

    if (!classId) {
      this.renderStudentTable(this.allStudents);
      return;
    }

    const filtered = this.allStudents.filter(student => 
      student.class_id && student.class_id.toString() === classId
    );

    this.renderStudentTable(filtered);
  }

  // ==========================================
  // CLASS MANAGEMENT FUNCTIONS
  // ==========================================

  async loadClasses() {
    const container = document.getElementById('classesList');
    if (!container) return;

    try {
      container.innerHTML = '<div class="loading">Loading classes...</div>';

      const { data: classes, error } = await this.supabase
        .from('classes')
        .select(`
          *,
          enrollments:class_enrollments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.allClasses = classes || [];

      if (!classes || classes.length === 0) {
        container.innerHTML = '<div class="loading">No classes created yet. Click "Create Class" to get started!</div>';
        return;
      }

      this.renderClassesList(classes);
    } catch (error) {
      console.error('Error loading classes:', error);
      container.innerHTML = '<div class="error">Failed to load classes.</div>';
    }
  }

  renderClassesList(classes) {
    const container = document.getElementById('classesList');
    
    container.innerHTML = classes.map(cls => {
      const enrollmentCount = cls.enrollments?.[0]?.count || 0;
      const startDate = cls.start_date ? new Date(cls.start_date).toLocaleDateString() : 'Not set';
      const endDate = cls.end_date ? new Date(cls.end_date).toLocaleDateString() : 'Not set';
      
      return `
        <div class="class-item" data-class-id="${cls.id}">
          <div class="class-item-header">
            <div>
              <div class="class-item-title">${this.escapeHtml(cls.name)}</div>
              <div class="class-item-meta">Created ${this.formatDate(cls.created_at)}</div>
            </div>
            <span class="module-badge">${cls.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          ${cls.description ? `<div class="class-item-description">${this.escapeHtml(cls.description)}</div>` : ''}
          <div class="class-item-stats">
            <div class="class-stat">
              <span class="class-stat-icon">👥</span>
              <span>${enrollmentCount} student${enrollmentCount !== 1 ? 's' : ''}</span>
            </div>
            <div class="class-stat">
              <span class="class-stat-icon">📅</span>
              <span>${startDate} - ${endDate}</span>
            </div>
          </div>
          <div class="class-item-actions">
            <button class="btn btn-primary btn-small-icon" onclick="app.showManageStudentsModal(${cls.id}, '${this.escapeHtml(cls.name).replace(/'/g, "\\'")}')">
              👥 Manage Students
            </button>
            <button class="btn btn-secondary btn-small-icon" onclick="app.editClass(${cls.id})">
              ✏️ Edit
            </button>
            <button class="btn btn-secondary btn-small-icon" onclick="app.deleteClass(${cls.id})">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Show create class modal
  showCreateClassModal() {
    this.showModal('createClassModal');
    // Reset form
    document.getElementById('createClassForm')?.reset();
  }

  // Handle create class
  async handleCreateClass() {
    const name = document.getElementById('className').value.trim();
    const description = document.getElementById('classDescription').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const isActive = document.getElementById('isActive').checked;

    if (!name) {
      alert('Please enter a class name');
      return;
    }

    try {
      const user = this.auth.getCurrentUser();
      
      const { data, error } = await this.supabase
        .from('classes')
        .insert({
          name: name,
          description: description || null,
          trainer_id: user.id,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: isActive
        })
        .select()
        .single();

      if (error) throw error;

      alert('✅ Class created successfully!');
      this.hideModal('createClassModal');
      await this.loadClasses();
      await this.loadAdminStats();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
    }
  }

  // Show manage students modal
  async showManageStudentsModal(classId, className) {
    this.currentClassId = classId;
    document.getElementById('modalClassName').textContent = className;
    this.showModal('manageStudentsModal');
    
    await this.loadStudentsForEnrollment(classId);
  }

  async loadStudentsForEnrollment(classId) {
    try {
      // Get all students
      const { data: allStudents, error: studentsError } = await this.supabase
        .from('users_profile')
        .select('*')
        .eq('role', 'student')
        .order('github_username');

      if (studentsError) throw studentsError;

      // Get enrolled students in this class
      const { data: enrollments, error: enrollError } = await this.supabase
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const enrolledIds = new Set((enrollments || []).map(e => e.student_id));
      
      this.availableStudents = (allStudents || []).filter(s => !enrolledIds.has(s.id));
      this.enrolledStudents = (allStudents || []).filter(s => enrolledIds.has(s.id));
      this.selectedStudents = new Set();

      this.renderAvailableStudents();
      this.renderEnrolledStudents();
    } catch (error) {
      console.error('Error loading students for enrollment:', error);
    }
  }

  renderAvailableStudents(filter = '') {
    const container = document.getElementById('availableStudentsList');
    const students = filter
      ? this.availableStudents.filter(s => 
          (s.github_username || '').toLowerCase().includes(filter.toLowerCase()) ||
          (s.email || '').toLowerCase().includes(filter.toLowerCase())
        )
      : this.availableStudents;

    if (!students || students.length === 0) {
      container.innerHTML = '<div class="loading">No available students</div>';
      return;
    }

    container.innerHTML = students.map(student => `
      <label class="student-checkbox-item">
        <input type="checkbox" 
               data-student-id="${student.id}" 
               onchange="app.toggleStudentSelection('${student.id}', this.checked)">
        <img src="${student.github_avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.github_username || 'User')}" 
             alt="${student.github_username}" 
             class="student-checkbox-avatar">
        <div class="student-checkbox-info">
          <div class="student-checkbox-name">${this.escapeHtml(student.github_username || student.full_name || 'Unknown')}</div>
          <div class="student-checkbox-email">${this.escapeHtml(student.email || '')}</div>
        </div>
      </label>
    `).join('');
  }

  renderEnrolledStudents() {
    const container = document.getElementById('enrolledStudentsList');
    
    if (!this.enrolledStudents || this.enrolledStudents.length === 0) {
      container.innerHTML = '<div class="loading">No students enrolled yet</div>';
      return;
    }

    container.innerHTML = this.enrolledStudents.map(student => `
      <div class="enrolled-student-item" data-student-id="${student.id}">
        <div class="enrolled-student-info">
          <img src="${student.github_avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.github_username || 'User')}" 
               alt="${student.github_username}" 
               class="student-checkbox-avatar">
          <div class="student-checkbox-info">
            <div class="student-checkbox-name">${this.escapeHtml(student.github_username || student.full_name || 'Unknown')}</div>
            <div class="student-checkbox-email">${this.escapeHtml(student.email || '')}</div>
          </div>
        </div>
        <button class="btn-remove" onclick="app.unenrollStudent('${student.id}')">Remove</button>
      </div>
    `).join('');
  }

  toggleStudentSelection(studentId, isChecked) {
    if (isChecked) {
      this.selectedStudents.add(studentId);
    } else {
      this.selectedStudents.delete(studentId);
    }
  }

  async unenrollStudent(studentId) {
    if (!confirm('Are you sure you want to remove this student from the class?')) return;

    try {
      const { error } = await this.supabase
        .from('class_enrollments')
        .delete()
        .eq('class_id', this.currentClassId)
        .eq('student_id', studentId);

      if (error) throw error;

      alert('✅ Student removed from class');
      await this.loadStudentsForEnrollment(this.currentClassId);
      await this.loadStudentRoster();
    } catch (error) {
      console.error('Error unenrolling student:', error);
      alert('Failed to remove student. Please try again.');
    }
  }

  async handleSaveEnrollments() {
    if (this.selectedStudents.size === 0) {
      alert('Please select at least one student to enroll');
      return;
    }

    try {
      const enrollments = Array.from(this.selectedStudents).map(studentId => ({
        class_id: this.currentClassId,
        student_id: studentId,
        status: 'active'
      }));

      const { error } = await this.supabase
        .from('class_enrollments')
        .insert(enrollments);

      if (error) throw error;

      alert(`✅ Successfully enrolled ${this.selectedStudents.size} student(s)!`);
      this.hideModal('manageStudentsModal');
      await this.loadClasses();
      await this.loadStudentRoster();
    } catch (error) {
      console.error('Error enrolling students:', error);
      alert('Failed to enroll students. Please try again.');
    }
  }

  filterAvailableStudents(searchTerm) {
    this.renderAvailableStudents(searchTerm);
  }

  async editClass(classId) {
    alert('Edit class feature coming soon! For now, you can edit directly in Supabase Table Editor.');
  }

  async deleteClass(classId) {
    if (!confirm('Are you sure you want to delete this class? This will also remove all student enrollments.')) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      alert('✅ Class deleted successfully');
      await this.loadClasses();
      await this.loadAdminStats();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  }

  // Modal helpers
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  }

  // ==========================================
  // STUDENT CLASS JOINING
  // ==========================================

  async loadAvailableClasses() {
    const container = document.getElementById('availableClassesList');
    if (!container) return;

    try {
      // Get all active classes (without the trainer join - we'll fetch separately)
      const { data: classes, error: classesError } = await this.supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Get trainer info separately
      if (classes && classes.length > 0) {
        const trainerIds = [...new Set(classes.map(c => c.trainer_id).filter(Boolean))];
        const { data: trainers } = await this.supabase
          .from('users_profile')
          .select('id, github_username')
          .in('id', trainerIds);

        // Map trainers to classes
        const trainerMap = {};
        (trainers || []).forEach(t => {
          trainerMap[t.id] = t;
        });

        classes.forEach(cls => {
          cls.trainer = trainerMap[cls.trainer_id];
        });
      }

      // Get user's enrollments
      const userId = this.auth.getCurrentUser().id;
      const { data: enrollments, error: enrollError } = await this.supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', userId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const enrolledClassIds = new Set((enrollments || []).map(e => e.class_id));

      if (!classes || classes.length === 0) {
        container.innerHTML = '<div class="loading">No active classes available at the moment.</div>';
        return;
      }

      container.innerHTML = classes.map(cls => {
        const isEnrolled = enrolledClassIds.has(cls.id);
        const trainerName = cls.trainer?.github_username || 'Staff';
        const startDate = cls.start_date ? new Date(cls.start_date).toLocaleDateString() : 'TBD';
        
        return `
          <div class="available-class-card ${isEnrolled ? 'enrolled' : ''}" data-class-id="${cls.id}">
            <div class="available-class-header">
              <div class="available-class-title">${this.escapeHtml(cls.name)}</div>
              <div class="available-class-trainer">👨‍🏫 Instructor: ${this.escapeHtml(trainerName)}</div>
            </div>
            ${cls.description ? `<div class="available-class-description">${this.escapeHtml(cls.description)}</div>` : ''}
            <div class="available-class-meta">
              <div class="class-meta-item">
                <span>📅</span>
                <span>Starts: ${startDate}</span>
              </div>
            </div>
            ${isEnrolled 
              ? '<div class="enrolled-badge">✅ Enrolled</div>'
              : `<button class="btn btn-primary btn-small" onclick="app.joinClass(${cls.id}, '${this.escapeHtml(cls.name).replace(/'/g, "\\'")}')">Join Class</button>`
            }
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading available classes:', error);
      container.innerHTML = '<div class="error">Failed to load classes.</div>';
    }
  }

  async joinClass(classId, className) {
    if (!confirm(`Do you want to join "${className}"?`)) return;

    try {
      const userId = this.auth.getCurrentUser().id;

      const { error } = await this.supabase
        .from('class_enrollments')
        .insert({
          class_id: classId,
          student_id: userId,
          status: 'active'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('You are already enrolled in this class!');
        } else {
          throw error;
        }
        return;
      }

      alert('🎉 Successfully joined the class!');
      await this.loadAvailableClasses();
    } catch (error) {
      console.error('Error joining class:', error);
      alert('Failed to join class. Please try again.');
    }
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

