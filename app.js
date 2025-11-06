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

      // Handle initial route - redirect to dashboard if authenticated
      if (this.auth.isAuthenticated() && (window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#home')) {
        window.location.hash = '#dashboard';
      }
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
    document.getElementById('backToDashboardFromClass')?.addEventListener('click', () => this.navigateTo('dashboard'));
    document.getElementById('downloadCertificate')?.addEventListener('click', () => this.downloadCertificate());

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
    
    // Edit class modal
    document.getElementById('closeEditClassModal')?.addEventListener('click', () => this.hideModal('editClassModal'));
    document.getElementById('cancelEditClass')?.addEventListener('click', () => this.hideModal('editClassModal'));
    document.getElementById('submitEditClass')?.addEventListener('click', () => this.handleEditClass());
    
    // Manage students modal
    document.getElementById('closeManageStudentsModal')?.addEventListener('click', () => this.hideModal('manageStudentsModal'));
    document.getElementById('closeManageStudents')?.addEventListener('click', () => this.hideModal('manageStudentsModal'));
    document.getElementById('saveEnrollments')?.addEventListener('click', () => this.handleSaveEnrollments());
    document.getElementById('searchAvailableStudents')?.addEventListener('input', (e) => this.filterAvailableStudents(e.target.value));
    
    // View submissions modal
    document.getElementById('closeViewSubmissions')?.addEventListener('click', () => this.hideModal('viewSubmissionsModal'));
    document.getElementById('closeSubmissionsModal')?.addEventListener('click', () => this.hideModal('viewSubmissionsModal'));
    
    // View individual submission modal
    document.getElementById('closeViewSubmission')?.addEventListener('click', () => this.hideModal('viewSubmissionModal'));
    document.getElementById('closeSubmissionDetailsModal')?.addEventListener('click', () => this.hideModal('viewSubmissionModal'));

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
      } else if (page === 'class-detail') {
        const classId = params[0];
        if (classId) {
          await this.renderClassDetail(parseInt(classId));
        }
      }

      // Scroll to top
      window.scrollTo(0, 0);
    }
  }

  // View class detail page
  async viewClassDetail(classId) {
    this.navigateTo('class-detail', [classId]);
  }

  // Render class detail page
  async renderClassDetail(classId) {
    try {
      // Load class data
      const { data: classData, error: classError } = await this.supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError) throw classError;

      // Update header
      document.getElementById('classDetailTitle').textContent = classData.name;
      document.getElementById('classDetailDescription').textContent = classData.description || '';

      // Get progress for this specific class
      const progress = await this.getClassProgress(classId);

      // Update stats
      document.getElementById('classModulesCount').textContent = progress.totalModules;
      document.getElementById('classCompletedCount').textContent = `${progress.completedModules}/${progress.totalModules}`;
      document.getElementById('classAssignmentsCount').textContent = `${progress.gradedAssignments}/${progress.totalAssignments}`;
      
      // Calculate average grade
      const avgGrade = await this.getAverageGradeForClass(classId);
      document.getElementById('classAvgGrade').textContent = avgGrade ? `${avgGrade}/5` : '--';

      // Show certificate if eligible
      const certSection = document.getElementById('certificateSection');
      if (progress.certificateEligible) {
        certSection.style.display = 'block';
      } else {
        certSection.style.display = 'none';
      }

      // Load modules for this class
      await this.loadClassModules(classId);

      // Load assignments overview for this class
      await this.loadClassAssignments(classId);

      // Load student's own submissions for this class
      await this.loadMySubmissionsForClass(classId);

    } catch (error) {
      console.error('Error rendering class detail:', error);
      alert('Failed to load class details');
      this.navigateTo('dashboard');
    }
  }

  async loadMySubmissionsForClass(classId) {
    // This will be rendered in a dedicated section
    const container = document.getElementById('mySubmissionsList');
    if (!container) return;

    try {
      const userId = this.auth.getCurrentUser().id;
      
      // Get step IDs for this class
      const { data: modules } = await this.supabase
        .from('modules')
        .select('id')
        .eq('class_id', classId);
      
      if (!modules || modules.length === 0) return;
      
      const moduleIds = modules.map(m => m.id);
      
      const { data: steps } = await this.supabase
        .from('steps')
        .select('id')
        .in('module_id', moduleIds);
      
      if (!steps || steps.length === 0) return;
      
      const stepIds = steps.map(s => s.id);
      
      // Get assignments for these steps
      const { data: assignments } = await this.supabase
        .from('assignments')
        .select('id, title')
        .in('step_id', stepIds);
      
      if (!assignments || assignments.length === 0) {
        container.innerHTML = '<div class="loading">No assignments in this class yet.</div>';
        return;
      }
      
      const assignmentIds = assignments.map(a => a.id);
      
      // Get my submissions
      const { data: subs } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('student_id', userId)
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false });
      
      if (!subs || subs.length === 0) {
        container.innerHTML = '<div class="loading">You haven\'t submitted any assignments in this class yet.</div>';
        return;
      }
      
      // Fetch assignment titles and grades
      for (const sub of subs) {
        const assignment = assignments.find(a => a.id === sub.assignment_id);
        sub.assignment_title = assignment?.title || 'Assignment';
        
        const { data: grades } = await this.supabase
          .from('grades')
          .select('*')
          .eq('submission_id', sub.id);
        
        sub.grade = grades && grades.length > 0 ? grades[0] : null;
      }
      
      // Render my submissions
      container.innerHTML = subs.map(sub => {
        const grade = sub.grade;
        return `
          <div class="submission-card ${grade ? 'graded' : sub.status}" style="margin-bottom: 1rem;">
            <div class="submission-header">
              <div>
                <div class="student-name" style="font-weight: 600;">${this.escapeHtml(sub.assignment_title)}</div>
                <div class="submission-time">Submitted ${this.formatDate(sub.submitted_at)}</div>
              </div>
              <div class="submission-status-group">
                ${grade ? `
                  <div class="grade-badge">
                    <span class="grade-stars-small">${'⭐'.repeat(grade.score)}</span>
                    <span class="grade-score-small">${grade.score}/5</span>
                  </div>
                ` : `
                  <span class="status-badge status-${sub.status}">${sub.status}</span>
                `}
              </div>
            </div>
            
            ${sub.submission_url ? `
              <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                <strong>🔗 URL:</strong> <a href="${sub.submission_url}" target="_blank">${sub.submission_url}</a>
              </div>
            ` : ''}
            
            ${grade ? `
              <div style="margin-top: 1rem; padding: 1rem; background: var(--light-bg); border-radius: 0.5rem;">
                <strong style="display: block; margin-bottom: 0.5rem;">💬 AI Feedback:</strong>
                <p style="margin: 0; color: var(--text-secondary);">${this.escapeHtml(grade.feedback)}</p>
                ${grade.ai_strengths ? `
                  <div style="margin-top: 0.75rem;">
                    <strong style="color: var(--success-color);">✅ Strengths:</strong>
                    <p style="margin: 0.25rem 0 0; color: var(--text-secondary);">${this.escapeHtml(grade.ai_strengths)}</p>
                  </div>
                ` : ''}
                ${grade.ai_improvements ? `
                  <div style="margin-top: 0.75rem;">
                    <strong style="color: var(--primary-color);">💡 Improvements:</strong>
                    <p style="margin: 0.25rem 0 0; color: var(--text-secondary);">${this.escapeHtml(grade.ai_improvements)}</p>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div style="margin-top: 1rem;">
              <button class="btn btn-secondary btn-small" onclick="app.showSubmission(${sub.id})">
                View Full Details
              </button>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error loading my submissions:', error);
      container.innerHTML = '<div class="error">Failed to load submissions</div>';
    }
  }

  async getAverageGradeForClass(classId) {
    const userId = this.auth.getCurrentUser().id;
    
    const stepIds = await this.getStepIdsForClass(classId);
    const { data: assignments } = await this.supabase
      .from('assignments')
      .select('id')
      .in('step_id', stepIds);

    if (!assignments || assignments.length === 0) return null;

    const { data: submissions } = await this.supabase
      .from('submissions')
      .select('id')
      .eq('student_id', userId)
      .in('assignment_id', assignments.map(a => a.id));

    if (!submissions || submissions.length === 0) return null;

    const { data: grades } = await this.supabase
      .from('grades')
      .select('score')
      .in('submission_id', submissions.map(s => s.id));

    if (!grades || grades.length === 0) return null;

    const avg = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
    return avg.toFixed(1);
  }

  async loadClassModules(classId) {
    const container = document.getElementById('classModulesList');
    if (!container) return;

    try {
      const { data: modules, error } = await this.supabase
        .from('modules')
        .select(`
          *,
          steps:steps(*)
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('order_number');

      if (error) throw error;

      if (!modules || modules.length === 0) {
        container.innerHTML = '<div class="loading">No modules in this class yet.</div>';
        return;
      }

      // Render module cards (similar to existing renderModulesList)
      const userId = this.auth.getCurrentUser().id;
      
      container.innerHTML = await Promise.all(
        modules.map(async module => {
          const { data: allSteps } = await this.supabase
            .from('steps')
            .select('id')
            .eq('module_id', module.id);

          const { data: completedSteps } = await this.supabase
            .from('user_progress')
            .select('id')
            .eq('user_id', userId)
            .eq('module_id', module.id)
            .eq('status', 'completed');

          const totalSteps = allSteps ? allSteps.length : 0;
          const completed = completedSteps ? completedSteps.length : 0;
          const completionPercentage = totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;
          const isCompleted = completed === totalSteps && totalSteps > 0;
          const buttonText = isCompleted ? '🔄 Review' : (completed > 0 ? 'Continue' : 'Start');
          const buttonClass = isCompleted ? 'btn-secondary' : 'btn-primary';

          return `
            <div class="module-card ${isCompleted ? 'module-completed' : ''}" data-module-id="${module.id}">
              <div class="module-card-header">
                <h3>${module.title}</h3>
                <span class="module-badge ${isCompleted ? 'badge-completed' : ''}">${completed}/${totalSteps} steps</span>
              </div>
              <p class="module-description">${module.description || ''}</p>
              <div class="module-progress-bar">
                <div class="module-progress-fill" style="width: ${completionPercentage}%"></div>
              </div>
              <div class="module-card-footer">
                <span class="module-progress-text">
                  ${isCompleted ? '✅ Completed' : `${completionPercentage}% complete`}
                </span>
                <button class="btn ${buttonClass} btn-small" onclick="app.startModuleFromClass(${module.id}, '${module.slug}', ${classId})">
                  ${buttonText} →
                </button>
              </div>
            </div>
          `;
        })
      ).then(cards => cards.join(''));

    } catch (error) {
      console.error('Error loading class modules:', error);
      container.innerHTML = '<div class="error">Failed to load modules.</div>';
    }
  }

  async startModuleFromClass(moduleId, moduleSlug, classId) {
    // Store current class for navigation
    this.currentClassId = classId;
    
    // Find first step to navigate to
    const { data: steps } = await this.supabase
      .from('steps')
      .select('slug')
      .eq('module_id', moduleId)
      .order('order_number')
      .limit(1);

    if (steps && steps.length > 0) {
      this.navigateTo('learning', [moduleSlug, steps[0].slug]);
    }
  }

  async loadClassAssignments(classId) {
    const container = document.getElementById('classAssignmentsList');
    if (!container) return;

    try {
      const userId = this.auth.getCurrentUser().id;
      const stepIds = await this.getStepIdsForClass(classId);

      const { data: assignments } = await this.supabase
        .from('assignments')
        .select('*')
        .in('step_id', stepIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!assignments || assignments.length === 0) {
        container.innerHTML = '<div class="loading">No assignments in this class yet.</div>';
        return;
      }

      // Get submissions for these assignments
      const { data: submissions } = await this.supabase
        .from('submissions')
        .select('*, grades(*)')
        .eq('student_id', userId)
        .in('assignment_id', assignments.map(a => a.id));

      const submissionMap = {};
      (submissions || []).forEach(s => {
        submissionMap[s.assignment_id] = s;
      });

      container.innerHTML = assignments.map(assignment => {
        const submission = submissionMap[assignment.id];
        const grade = submission && submission.grades && submission.grades.length > 0 ? submission.grades[0] : null;

        return `
          <div class="assignment-overview-card ${grade ? 'graded' : (submission ? 'submitted' : 'not-submitted')}">
            <div class="assignment-overview-header">
              <h4>${this.escapeHtml(assignment.title)}</h4>
              ${grade ? 
                `<div class="assignment-grade-badge">${'⭐'.repeat(grade.score)} ${grade.score}/5</div>` :
                (submission ? 
                  `<span class="status-badge status-${submission.status}">${submission.status}</span>` :
                  '<span class="not-submitted-badge">Not Submitted</span>'
                )
              }
            </div>
            <p class="assignment-overview-description">${this.escapeHtml(assignment.description || '')}</p>
            <div class="assignment-overview-footer">
              ${submission ?
                `<span class="submitted-date">Submitted ${this.formatDate(submission.submitted_at)}</span>` :
                '<span class="not-submitted-text">Awaiting submission</span>'
              }
              <button class="btn btn-${grade ? 'secondary' : 'primary'} btn-small" onclick="app.goToAssignmentStep(${assignment.step_id})">
                ${grade ? 'View Feedback' : (submission ? 'View Submission' : 'Submit Now')} →
              </button>
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Error loading class assignments:', error);
      container.innerHTML = '<div class="error">Failed to load assignments.</div>';
    }
  }

  async goToAssignmentStep(stepId) {
    // Get step and module info
    const { data: step } = await this.supabase
      .from('steps')
      .select('slug, module_id')
      .eq('id', stepId)
      .single();

    if (!step) return;

    const { data: module } = await this.supabase
      .from('modules')
      .select('slug')
      .eq('id', step.module_id)
      .single();

    if (module) {
      this.navigateTo('learning', [module.slug, step.slug]);
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

    // Load user's enrolled classes
    await this.loadEnrolledClasses();
    
    // Load available classes (not enrolled)
    await this.loadAvailableClassesForDashboard();
    
    // Calculate overall stats across all classes
    await this.calculateOverallStats();
  }

  async loadEnrolledClasses() {
    const container = document.getElementById('myClassesList');
    if (!container) return;

    try {
      const userId = this.auth.getCurrentUser().id;
      
      // Get enrolled classes with progress
      const { data: enrollments, error } = await this.supabase
        .from('class_enrollments')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('student_id', userId)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📚</div>
            <h3>No Classes Yet</h3>
            <p>Join a class below to start learning!</p>
          </div>
        `;
        return;
      }

      // Render enrolled class cards
      container.innerHTML = await Promise.all(
        enrollments.map(async enrollment => {
          const classData = enrollment.class;
          const progress = await this.getClassProgress(classData.id);
          
          return `
            <div class="my-class-card" onclick="app.viewClassDetail(${classData.id})">
              <div class="my-class-header">
                <h3>${this.escapeHtml(classData.name)}</h3>
                <span class="class-badge">${classData.is_active ? 'Active' : 'Ended'}</span>
              </div>
              <p class="my-class-description">${this.escapeHtml(classData.description || '')}</p>
              
              <div class="class-progress-overview">
                <div class="progress-item">
                  <span class="progress-label">Modules</span>
                  <span class="progress-value">${progress.completedModules}/${progress.totalModules}</span>
                </div>
                <div class="progress-item">
                  <span class="progress-label">Progress</span>
                  <span class="progress-value">${progress.completionPercentage}%</span>
                </div>
                <div class="progress-item">
                  <span class="progress-label">Assignments</span>
                  <span class="progress-value">${progress.gradedAssignments}/${progress.totalAssignments}</span>
                </div>
              </div>
              
              <div class="my-class-progress-bar">
                <div class="my-class-progress-fill" style="width: ${progress.completionPercentage}%"></div>
              </div>
              
              <div class="my-class-footer">
                ${progress.certificateEligible ? 
                  '<span class="certificate-ready">🎓 Certificate Ready!</span>' : 
                  `<span class="class-status">${progress.completionPercentage}% Complete</span>`
                }
                <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.viewClassDetail(${classData.id})">
                  View Class →
                </button>
              </div>
            </div>
          `;
        })
      ).then(cards => cards.join(''));

    } catch (error) {
      console.error('Error loading enrolled classes:', error);
      container.innerHTML = '<div class="error">Failed to load your classes.</div>';
    }
  }

  async getClassProgress(classId) {
    const userId = this.auth.getCurrentUser().id;
    
    // Get modules count
    const { data: modules } = await this.supabase
      .from('modules')
      .select('id')
      .eq('class_id', classId)
      .eq('is_active', true);

    const totalModules = modules ? modules.length : 0;

    // Get completed modules (where all steps are completed)
    let completedModules = 0;
    if (modules) {
      for (const module of modules) {
        const { data: allSteps } = await this.supabase
          .from('steps')
          .select('id')
          .eq('module_id', module.id);

        const { data: completedSteps } = await this.supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('module_id', module.id)
          .eq('status', 'completed');

        if (allSteps && completedSteps && allSteps.length === completedSteps.length && allSteps.length > 0) {
          completedModules++;
        }
      }
    }

    // Get assignments count
    const { data: assignments } = await this.supabase
      .from('assignments')
      .select('id, step_id')
      .in('step_id', await this.getStepIdsForClass(classId));

    const totalAssignments = assignments ? assignments.length : 0;

    // Get graded assignments
    const { data: submissions } = await this.supabase
      .from('submissions')
      .select('id, assignment_id')
      .eq('student_id', userId)
      .in('assignment_id', assignments ? assignments.map(a => a.id) : []);

    const { data: grades } = await this.supabase
      .from('grades')
      .select('submission_id')
      .in('submission_id', submissions ? submissions.map(s => s.id) : []);

    const gradedAssignments = grades ? grades.length : 0;

    const completionPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    const certificateEligible = completedModules === totalModules && gradedAssignments === totalAssignments && totalAssignments > 0;

    return {
      totalModules,
      completedModules,
      totalAssignments,
      gradedAssignments,
      completionPercentage,
      certificateEligible
    };
  }

  async getStepIdsForClass(classId) {
    const { data: steps } = await this.supabase
      .from('steps')
      .select('id, module_id')
      .in('module_id', 
        await this.supabase
          .from('modules')
          .select('id')
          .eq('class_id', classId)
          .then(res => res.data ? res.data.map(m => m.id) : [])
      );
    
    return steps ? steps.map(s => s.id) : [];
  }

  async loadAvailableClassesForDashboard() {
    const container = document.getElementById('availableClassesList');
    if (!container) return;

    try {
      const userId = this.auth.getCurrentUser().id;
      
      // Get all active classes
      const { data: allClasses } = await this.supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Get enrolled class IDs
      const { data: enrollments } = await this.supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', userId)
        .eq('status', 'active');

      const enrolledIds = new Set((enrollments || []).map(e => e.class_id));
      const availableClasses = (allClasses || []).filter(c => !enrolledIds.has(c.id));

      if (availableClasses.length === 0) {
        container.innerHTML = '<div class="loading">No new classes available at the moment.</div>';
        return;
      }

      // Get trainer info
      const trainerIds = [...new Set(availableClasses.map(c => c.trainer_id).filter(Boolean))];
      const { data: trainers } = await this.supabase
        .from('users_profile')
        .select('id, github_username')
        .in('id', trainerIds);

      const trainerMap = {};
      (trainers || []).forEach(t => trainerMap[t.id] = t);

      container.innerHTML = availableClasses.map(cls => {
        const trainer = trainerMap[cls.trainer_id];
        return `
          <div class="available-class-card">
            <div class="available-class-header">
              <div class="available-class-title">${this.escapeHtml(cls.name)}</div>
              <div class="available-class-trainer">👨‍🏫 ${this.escapeHtml(trainer?.github_username || 'Staff')}</div>
            </div>
            ${cls.description ? `<div class="available-class-description">${this.escapeHtml(cls.description)}</div>` : ''}
            <div class="available-class-meta">
              <div class="class-meta-item">
                <span>📅</span>
                <span>Starts: ${cls.start_date ? new Date(cls.start_date).toLocaleDateString() : 'TBD'}</span>
              </div>
            </div>
            <button class="btn btn-primary btn-small" onclick="app.joinClass(${cls.id}, '${this.escapeHtml(cls.name).replace(/'/g, "\\'")}')">
              Join Class
            </button>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Error loading available classes:', error);
      container.innerHTML = '<div class="error">Failed to load classes.</div>';
    }
  }

  async calculateOverallStats() {
    const summary = this.progress.getOverallProgress();
    const timeRemaining = this.progress.getEstimatedTimeRemaining();

    document.getElementById('overallProgress').textContent = `${summary.overallPercentage}%`;
    document.getElementById('completedSteps').textContent = `${summary.completedSteps}/${summary.totalSteps}`;
    document.getElementById('timeRemaining').textContent = timeRemaining.formatted;
    
    const nextStep = this.progress.getNextStep();
    document.getElementById('currentModule').textContent = nextStep ? nextStep.module.title.split(' ')[0] : '--';
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

    // Check if this step has an assignment
    const assignment = await this.loadAssignmentForStep(step.id);
    
    // Get content based on module and step
    const content = this.getStepContent(module, step);

    container.innerHTML = `
      <div class="step-header">
        <div class="step-meta">
          <span class="step-badge">${module.title}</span>
          <span class="step-duration">⏱️ ${step.estimated_minutes} min</span>
          ${assignment ? '<span class="assignment-badge">📝 Assignment</span>' : ''}
        </div>
        <h1 class="step-title">${step.title}</h1>
      </div>

      <div class="step-body">
        ${content}
        ${assignment ? await this.renderAssignmentSection(assignment, step.id) : ''}
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
    await this.loadAllSubmissionsAdmin();
  }

  async loadAllSubmissionsAdmin() {
    const container = document.getElementById('allSubmissionsAdmin');
    if (!container) return;

    try {
      container.innerHTML = '<div class="loading">Loading submissions...</div>';

      // Get all submissions with student and assignment info
      const { data: subs } = await this.supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50); // Show last 50 submissions

      if (!subs || subs.length === 0) {
        container.innerHTML = '<div class="loading">No submissions yet.</div>';
        return;
      }

      // Fetch details for each submission
      for (const sub of subs) {
        // Get student profile
        const { data: profile } = await this.supabase
          .from('users_profile')
          .select('github_username, github_avatar_url')
          .eq('id', sub.student_id)
          .maybeSingle();
        
        sub.student = profile || { github_username: 'Unknown', github_avatar_url: '' };

        // Get assignment
        const { data: assignment } = await this.supabase
          .from('assignments')
          .select('title')
          .eq('id', sub.assignment_id)
          .maybeSingle();
        
        sub.assignment_title = assignment?.title || 'Unknown Assignment';

        // Get grade
        const { data: grades } = await this.supabase
          .from('grades')
          .select('*')
          .eq('submission_id', sub.id);
        
        sub.grade = grades && grades.length > 0 ? grades[0] : null;
      }

      // Render submissions
      container.innerHTML = subs.map(sub => {
        const grade = sub.grade;
        return `
          <div class="submission-card ${grade ? 'graded' : sub.status}">
            <div class="submission-header">
              <div class="student-info">
                <img src="${sub.student.github_avatar_url || 'https://ui-avatars.com/api/?name=Student'}" 
                     class="student-avatar" 
                     alt="${sub.student.github_username}">
                <div class="student-details">
                  <div class="student-name">${this.escapeHtml(sub.student.github_username)}</div>
                  <div class="submission-time">${this.escapeHtml(sub.assignment_title)}</div>
                  <div class="submission-time">Submitted ${this.formatDate(sub.submitted_at)}</div>
                </div>
              </div>
              <div class="submission-status-group">
                ${grade ? `
                  <div class="grade-badge">
                    <span class="grade-stars-small">${'⭐'.repeat(grade.score)}</span>
                    <span class="grade-score-small">${grade.score}/5</span>
                  </div>
                ` : `
                  <span class="status-badge status-${sub.status}">${sub.status}</span>
                `}
              </div>
            </div>
            
            <div class="submission-actions" style="margin-top: 1rem;">
              <button class="btn btn-secondary btn-small" onclick="app.showSubmission(${sub.id})">
                View Details
              </button>
              ${!grade && sub.status === 'pending' ? `
                <button class="btn btn-primary btn-small" onclick="app.manualGradeSubmission(${sub.id})">
                  Grade Now
                </button>
                <button class="btn btn-secondary btn-small" onclick="app.triggerAIGrading(${sub.id})">
                  🤖 AI Grade
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Error loading submissions:', error);
      container.innerHTML = '<div class="error">Failed to load submissions</div>';
    }
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
    // Load class data
    try {
      const { data: classData, error } = await this.supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) throw error;

      if (!classData) {
        alert('Class not found');
        return;
      }

      // Populate form
      document.getElementById('editClassId').value = classData.id;
      document.getElementById('editClassName').value = classData.name || '';
      document.getElementById('editClassDescription').value = classData.description || '';
      document.getElementById('editStartDate').value = classData.start_date || '';
      document.getElementById('editEndDate').value = classData.end_date || '';
      document.getElementById('editIsActive').checked = classData.is_active;

      // Show modal
      this.showModal('editClassModal');
    } catch (error) {
      console.error('Error loading class for edit:', error);
      alert('Failed to load class data. Please try again.');
    }
  }

  async handleEditClass() {
    const classId = document.getElementById('editClassId').value;
    const name = document.getElementById('editClassName').value.trim();
    const description = document.getElementById('editClassDescription').value.trim();
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    const isActive = document.getElementById('editIsActive').checked;

    if (!name) {
      alert('Please enter a class name');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('classes')
        .update({
          name: name,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (error) throw error;

      alert('✅ Class updated successfully!');
      this.hideModal('editClassModal');
      await this.loadClasses();
      await this.loadAdminStats();
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Failed to update class. Please try again.');
    }
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

  // ==========================================
  // ASSIGNMENTS & AI GRADING
  // ==========================================

  async loadAssignmentForStep(stepId) {
    try {
      const { data, error } = await this.supabase
        .from('assignments')
        .select('*')
        .eq('step_id', stepId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      console.error('Error loading assignment:', error);
      return null;
    }
  }

  async renderAssignmentSection(assignment, stepId) {
    // Check if student has submitted
    const submission = await this.loadStudentSubmission(assignment.id);
    const grade = submission ? await this.loadGrade(submission.id) : null;

    // Get user role
    const profile = await this.auth.getUserProfile();
    const isTrainer = profile && (profile.role === 'admin' || profile.role === 'trainer');

    if (isTrainer) {
      return this.renderTrainerAssignmentView(assignment, stepId);
    } else {
      return this.renderStudentAssignmentView(assignment, submission, grade, stepId);
    }
  }

  renderTrainerAssignmentView(assignment, stepId) {
    return `
      <div class="assignment-section trainer-view">
        <div class="assignment-header">
          <h2>📝 Assignment: ${this.escapeHtml(assignment.title)}</h2>
          <span class="assignment-meta">Trainer View</span>
        </div>
        <div class="assignment-details">
          <p><strong>Instructions:</strong> ${this.escapeHtml(assignment.instructions || assignment.description || '')}</p>
          ${assignment.ai_grading_rubric ? `<p><strong>AI Rubric:</strong> ${this.escapeHtml(assignment.ai_grading_rubric)}</p>` : ''}
          <p><strong>Max Score:</strong> ${assignment.max_score}/5</p>
          <p><strong>Accepts:</strong> 
            ${assignment.allow_file_upload ? '📎 Files' : ''} 
            ${assignment.allow_url_submission ? '🔗 URLs' : ''}
          </p>
        </div>
        <button class="btn btn-secondary btn-small" onclick="app.viewAllSubmissions(${assignment.id})">
          View All Submissions
        </button>
      </div>
    `;
  }

  async renderStudentAssignmentView(assignment, submission, grade, stepId) {
    if (grade) {
      // Show grade and feedback
      return `
        <div class="assignment-section graded">
          <div class="assignment-header">
            <h2>📝 Assignment: ${this.escapeHtml(assignment.title)}</h2>
            <div class="grade-stars">${'⭐'.repeat(grade.score)}${'☆'.repeat(5 - grade.score)}</div>
          </div>
          <div class="grade-card">
            <div class="grade-score">
              <div class="grade-number">${grade.score}/5</div>
              <div class="grade-label">${this.getGradeLabel(grade.score)}</div>
            </div>
            <div class="grade-feedback">
              <h3>📝 Feedback</h3>
              <p>${this.escapeHtml(grade.feedback || '')}</p>
              
              ${grade.ai_strengths ? `
                <h4>✅ Strengths</h4>
                <p>${this.escapeHtml(grade.ai_strengths)}</p>
              ` : ''}
              
              ${grade.ai_improvements ? `
                <h4>💡 Suggestions for Improvement</h4>
                <p>${this.escapeHtml(grade.ai_improvements)}</p>
              ` : ''}
              
              ${grade.ai_analysis ? `
                <details>
                  <summary>🔍 Detailed Analysis</summary>
                  <p>${this.escapeHtml(grade.ai_analysis)}</p>
                </details>
              ` : ''}
            </div>
            <div class="grade-meta">
              Graded by ${grade.grader_type === 'ai' ? '🤖 AI' : '👨‍🏫 Instructor'} • ${this.formatDate(grade.created_at)}
            </div>
          </div>
          <button class="btn btn-secondary btn-small" onclick="app.showSubmission(${submission.id})">
            View My Submission
          </button>
        </div>
      `;
    } else if (submission) {
      // Show pending submission
      return `
        <div class="assignment-section pending">
          <div class="assignment-header">
            <h2>📝 Assignment: ${this.escapeHtml(assignment.title)}</h2>
            <span class="status-badge status-${submission.status}">${submission.status}</span>
          </div>
          <div class="submission-info">
            <p>✅ You submitted this assignment on ${this.formatDate(submission.submitted_at)}</p>
            ${submission.status === 'grading' ? '<p>🤖 AI is grading your work...</p>' : ''}
            ${submission.status === 'pending' ? '<p>⏳ Waiting for AI review...</p>' : ''}
          </div>
          <div class="submission-actions">
            <button class="btn btn-secondary btn-small" onclick="app.showSubmission(${submission.id})">
              View Submission
            </button>
            ${submission.status === 'pending' && (CONFIG.openai.enabled || CONFIG.openai.useServerless) ? `
              <button class="btn btn-primary btn-small" onclick="app.requestAIGrading(${submission.id})">
                🤖 Request AI Grading Now
              </button>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      // Show submission form
      return `
        <div class="assignment-section unsubmitted">
          <div class="assignment-header">
            <h2>📝 Assignment: ${this.escapeHtml(assignment.title)}</h2>
            <span class="assignment-required">Required</span>
          </div>
          
          <div class="assignment-instructions">
            <h3>Instructions</h3>
            <p>${this.escapeHtml(assignment.instructions || assignment.description || '')}</p>
            ${assignment.due_date ? `<p class="due-date">📅 Due: ${new Date(assignment.due_date).toLocaleString()}</p>` : ''}
          </div>

          <div class="submission-form">
            <h3>Submit Your Work</h3>
            
            ${assignment.allow_file_upload ? `
              <div class="form-group">
                <label for="assignmentFile">Upload File</label>
                <div class="file-upload-area" id="fileUploadArea_${assignment.id}">
                  <input type="file" 
                         id="assignmentFile_${assignment.id}" 
                         accept="${(assignment.allowed_file_types || []).join(',')}"
                         style="display: none;"
                         onchange="app.handleFileSelect(${assignment.id}, event)">
                  <div class="upload-placeholder" onclick="document.getElementById('assignmentFile_${assignment.id}').click()">
                    <div class="upload-icon">📤</div>
                    <div class="upload-text">Click to upload or drag and drop</div>
                    <div class="upload-hint">Images, PDFs (max ${assignment.max_file_size_mb || 10}MB)</div>
                  </div>
                  <div id="filePreview_${assignment.id}" class="file-preview" style="display: none;"></div>
                </div>
              </div>
            ` : ''}

            ${assignment.allow_url_submission ? `
              <div class="form-group">
                <label for="assignmentUrl_${assignment.id}">Submission URL</label>
                <input type="url" 
                       id="assignmentUrl_${assignment.id}" 
                       class="form-input" 
                       placeholder="https://your-project.netlify.app or https://github.com/username/repo">
                <small class="form-help">Link to your deployed project, GitHub repo, or other relevant URL</small>
              </div>
            ` : ''}

            <div class="form-group">
              <label for="assignmentNotes_${assignment.id}">Notes (Optional)</label>
              <textarea id="assignmentNotes_${assignment.id}" 
                        class="form-textarea" 
                        rows="3" 
                        placeholder="Add any notes about your submission..."></textarea>
            </div>

            <button class="btn btn-primary" onclick="app.submitAssignment(${assignment.id}, ${stepId})">
              🚀 Submit Assignment
            </button>
          </div>
        </div>
      `;
    }
  }

  async loadStudentSubmission(assignmentId) {
    try {
      const { data, error } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', this.auth.getCurrentUser().id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error loading submission:', error);
      return null;
    }
  }

  async loadGrade(submissionId) {
    try {
      const { data, error } = await this.supabase
        .from('grades')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error loading grade:', error);
      return null;
    }
  }

  getGradeLabel(score) {
    const labels = {
      5: 'Excellent',
      4: 'Good',
      3: 'Satisfactory',
      2: 'Needs Work',
      1: 'Incomplete'
    };
    return labels[score] || 'Ungraded';
  }

  selectedFile = null;

  handleFileSelect(assignmentId, event) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    // Show preview
    const preview = document.getElementById(`filePreview_${assignmentId}`);
    const placeholder = preview.previousElementSibling;

    placeholder.style.display = 'none';
    preview.style.display = 'block';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
          <img src="${e.target.result}" alt="Preview" class="file-preview-image">
          <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <button class="btn-remove" onclick="app.clearFile(${assignmentId})">Remove</button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = `
        <div class="file-info">
          <span class="file-icon">📄</span>
          <span class="file-name">${file.name}</span>
          <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
          <button class="btn-remove" onclick="app.clearFile(${assignmentId})">Remove</button>
        </div>
      `;
    }
  }

  clearFile(assignmentId) {
    this.selectedFile = null;
    const fileInput = document.getElementById(`assignmentFile_${assignmentId}`);
    const preview = document.getElementById(`filePreview_${assignmentId}`);
    const placeholder = preview.previousElementSibling;

    if (fileInput) fileInput.value = '';
    preview.style.display = 'none';
    preview.innerHTML = '';
    placeholder.style.display = 'flex';
  }

  async submitAssignment(assignmentId, stepId) {
    const urlInput = document.getElementById(`assignmentUrl_${assignmentId}`);
    const notesInput = document.getElementById(`assignmentNotes_${assignmentId}`);

    const submissionUrl = urlInput?.value.trim() || null;
    const notes = notesInput?.value.trim() || null;

    if (!this.selectedFile && !submissionUrl) {
      alert('Please upload a file or provide a URL');
      return;
    }

    try {
      this.showLoading(true);

      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if selected
      if (this.selectedFile) {
        const uploadResult = await this.uploadFile(this.selectedFile);
        fileUrl = uploadResult.publicUrl;
        fileName = this.selectedFile.name;
        fileType = this.selectedFile.type;
      }

      // Create submission
      const { data: submission, error: submitError } = await this.supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: this.auth.getCurrentUser().id,
          submission_type: this.selectedFile && submissionUrl ? 'both' : (this.selectedFile ? 'file' : 'url'),
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          submission_url: submissionUrl,
          notes: notes,
          status: 'pending'
        })
        .select()
        .single();

      if (submitError) throw submitError;

      alert('✅ Assignment submitted successfully!');
      
      // Trigger AI grading if enabled
      const assignment_data = await this.loadAssignmentForStep(stepId);
      if (assignment_data && assignment_data.ai_grading_enabled && (CONFIG.openai.enabled || CONFIG.openai.useServerless)) {
        await this.triggerAIGrading(submission.id);
      }

      // Reload step content
      await this.renderStepContent(this.currentModule, this.currentStep);
      
      this.showLoading(false);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment. Please try again.');
      this.showLoading(false);
    }
  }

  async uploadFile(file) {
    const userId = this.auth.getCurrentUser().id;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from('assignment-submissions')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicData } = this.supabase.storage
      .from('assignment-submissions')
      .getPublicUrl(fileName);

    return publicData;
  }

  async triggerAIGrading(submissionId) {
    // AI grading always available via serverless function
    if (!CONFIG.openai.useServerless && !CONFIG.openai.enabled) {
      alert('AI grading is not enabled.');
      return;
    }

    try {
      this.showLoading(true);

      // Update status to grading
      await this.supabase
        .from('submissions')
        .update({ status: 'grading' })
        .eq('id', submissionId);

      // Get submission and assignment data with context
      const { data: submission } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      const { data: assignment } = await this.supabase
        .from('assignments')
        .select('*, steps(*, modules(*))')
        .eq('id', submission.assignment_id)
        .single();

      if (!submission || !assignment) {
        throw new Error('Submission or assignment not found');
      }

      // Build context for AI
      const moduleContext = assignment.steps?.modules 
        ? `${assignment.steps.modules.title} - ${assignment.steps.modules.description}`
        : '';
      
      const stepContext = assignment.steps
        ? `Step ${assignment.steps.order_index}: ${assignment.steps.title}\n${assignment.steps.content || ''}`
        : '';

      // Initialize AI grader (uses serverless function)
      const aiGrader = new AIGrader();

      // Grade the submission with full context
      const gradeData = await aiGrader.gradeSubmission({
        assignment_title: assignment.title,
        instructions: assignment.instructions,
        rubric: assignment.ai_grading_rubric,
        submission_url: submission.submission_url,
        file_url: submission.file_url,
        student_notes: submission.notes,
        module_context: moduleContext,
        step_context: stepContext
      });

      // Save grade to database
      await this.supabase
        .from('grades')
        .insert({
          submission_id: submissionId,
          grader_type: 'ai',
          score: gradeData.score,
          feedback: gradeData.feedback,
          ai_analysis: gradeData.analysis,
          ai_strengths: gradeData.strengths,
          ai_improvements: gradeData.improvements,
          graded_by: null
        });

      // Update submission status
      await this.supabase
        .from('submissions')
        .update({ 
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      this.showLoading(false);
      alert('🤖 AI has graded your submission! Refresh to see the feedback.');
      
      // Reload the step content to show grade
      if (this.currentModule && this.currentStep) {
        await this.renderStepContent(this.currentModule, this.currentStep);
      }
      
    } catch (error) {
      console.error('Error in AI grading:', error);
      this.showLoading(false);
      alert(`Failed to grade submission: ${error.message}`);
      
      // Update status back to pending if grading failed
      await this.supabase
        .from('submissions')
        .update({ status: 'pending' })
        .eq('id', submissionId);
    }
  }

  // Wrapper for manual trigger (for students and trainers)
  async requestAIGrading(submissionId) {
    if (!confirm('Request AI to grade this submission now?')) return;
    await this.triggerAIGrading(submissionId);
  }

  async viewAllSubmissions(assignmentId) {
    try {
      // Get assignment details
      const { data: assignment } = await this.supabase
        .from('assignments')
        .select('title')
        .eq('id', assignmentId)
        .single();

      document.getElementById('submissionsAssignmentTitle').textContent = assignment?.title || 'Assignment';

      // Get all submissions for this assignment
      const { data: subs } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (subs && subs.length > 0) {
        // Fetch student data and grades separately for each submission
        for (const sub of subs) {
          // Get profile data
          const { data: profile } = await this.supabase
            .from('users_profile')
            .select('github_username, github_avatar_url, full_name, id')
            .eq('id', sub.student_id)
            .maybeSingle();

          // If no profile, try to get basic info from a join query
          if (!profile || !profile.github_username) {
            // Get user email via a different approach - query from our own user if admin
            const { data: allUsers } = await this.supabase
              .from('users_profile')
              .select('id, github_username, github_avatar_url, full_name')
              .eq('id', sub.student_id)
              .maybeSingle();
            
            sub.student = {
              github_username: allUsers?.github_username || `Student ${sub.student_id.substring(0, 8)}`,
              github_avatar_url: allUsers?.github_avatar_url || `https://ui-avatars.com/api/?name=Student`,
              full_name: allUsers?.full_name || ''
            };
          } else {
            sub.student = {
              github_username: profile.github_username,
              github_avatar_url: profile.github_avatar_url || `https://ui-avatars.com/api/?name=${profile.github_username}`,
              full_name: profile.full_name || ''
            };
          }

          // Get grade
          const { data: grades } = await this.supabase
            .from('grades')
            .select('*')
            .eq('submission_id', sub.id);
          
          sub.grade = grades || [];
        }
        this.renderSubmissionsList(subs);
      } else {
        this.renderSubmissionsList([]);
      }

      this.showModal('viewSubmissionsModal');

    } catch (error) {
      console.error('Error loading submissions:', error);
      alert('Failed to load submissions. Please try again.');
    }
  }

  renderSubmissionsList(submissions) {
    const container = document.getElementById('submissionsList');

    if (!submissions || submissions.length === 0) {
      container.innerHTML = '<div class="loading">No submissions yet. Students haven\'t submitted anything.</div>';
      return;
    }

    container.innerHTML = submissions.map(sub => {
      const grade = sub.grade && sub.grade.length > 0 ? sub.grade[0] : null;
      const student = sub.student || {};
      
      return `
        <div class="submission-card ${grade ? 'graded' : sub.status}">
          <div class="submission-header">
            <div class="student-info">
              <img src="${student.github_avatar_url || 'https://ui-avatars.com/api/?name=User'}" 
                   class="student-avatar" 
                   alt="${student.github_username}">
              <div class="student-details">
                <div class="student-name">${this.escapeHtml(student.github_username || 'Unknown')}</div>
                <div class="submission-time">Submitted ${this.formatDate(sub.submitted_at)}</div>
              </div>
            </div>
            <div class="submission-status-group">
              ${grade ? `
                <div class="grade-badge">
                  <span class="grade-stars-small">${'⭐'.repeat(grade.score)}</span>
                  <span class="grade-score-small">${grade.score}/5</span>
                </div>
              ` : `
                <span class="status-badge status-${sub.status}">${sub.status}</span>
              `}
            </div>
          </div>
          
          <div class="submission-content">
            ${sub.submission_url ? `
              <div class="submission-item">
                <strong>🔗 URL:</strong> 
                <a href="${sub.submission_url}" target="_blank" class="submission-link">${sub.submission_url}</a>
              </div>
            ` : ''}
            
            ${sub.file_url ? `
              <div class="submission-item">
                <strong>📎 File:</strong> 
                <a href="${sub.file_url}" target="_blank" class="submission-link">${sub.file_name || 'View File'}</a>
              </div>
            ` : ''}
            
            ${sub.notes ? `
              <div class="submission-item">
                <strong>📝 Notes:</strong> 
                <p>${this.escapeHtml(sub.notes)}</p>
              </div>
            ` : ''}
            
            ${grade && grade.feedback ? `
              <div class="submission-item">
                <strong>💬 AI Feedback:</strong>
                <p>${this.escapeHtml(grade.feedback)}</p>
              </div>
            ` : ''}
          </div>
          
          <div class="submission-actions">
            ${!grade && sub.status === 'pending' ? `
              <button class="btn btn-primary btn-small" onclick="app.manualGradeSubmission(${sub.id})">
                Grade Manually
              </button>
              <button class="btn btn-secondary btn-small" onclick="app.triggerAIGrading(${sub.id})">
                🤖 Grade with AI
              </button>
            ` : ''}
            ${grade ? `
              <button class="btn btn-secondary btn-small" onclick="app.viewFullGrade(${sub.id})">
                View Full Feedback
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  async manualGradeSubmission(submissionId) {
    try {
      // Get submission details
      const { data: submission } = await this.supabase
        .from('submissions')
        .select('*, assignments(*)')
        .eq('id', submissionId)
        .single();

      if (!submission) {
        alert('Submission not found');
        return;
      }

      // Show grading modal
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content grade-modal">
          <div class="modal-header">
            <h2>Grade Submission</h2>
            <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="submission-preview">
              <h3>${this.escapeHtml(submission.assignments.title)}</h3>
              ${submission.submission_url ? `
                <p><strong>URL:</strong> <a href="${submission.submission_url}" target="_blank">${submission.submission_url}</a></p>
              ` : ''}
              ${submission.file_url ? `
                <p><strong>File:</strong> <a href="${submission.file_url}" target="_blank">${submission.file_name}</a></p>
              ` : ''}
              ${submission.notes ? `
                <p><strong>Notes:</strong> ${this.escapeHtml(submission.notes)}</p>
              ` : ''}
            </div>

            <div class="grade-form">
              <div class="form-group">
                <label>Score (1-5 stars)</label>
                <div class="star-selector">
                  ${[1, 2, 3, 4, 5].map(star => `
                    <button type="button" class="star-btn" data-score="${star}" onclick="app.selectGradeScore(${star})">
                      <span class="star-icon">⭐</span>
                      <span class="star-label">${star}</span>
                    </button>
                  `).join('')}
                </div>
                <input type="hidden" id="gradeScore" value="5">
              </div>

              <div class="form-group">
                <label for="gradeFeedback">Overall Feedback *</label>
                <textarea id="gradeFeedback" rows="4" placeholder="Provide constructive feedback..." required></textarea>
              </div>

              <div class="form-group">
                <label for="gradeStrengths">What They Did Well</label>
                <textarea id="gradeStrengths" rows="3" placeholder="Highlight their strengths..."></textarea>
              </div>

              <div class="form-group">
                <label for="gradeImprovements">How to Improve</label>
                <textarea id="gradeImprovements" rows="3" placeholder="Suggestions for improvement..."></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="app.submitManualGrade(${submissionId})">Submit Grade</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Auto-select 5 stars by default
      this.selectGradeScore(5);

    } catch (error) {
      console.error('Error showing grade form:', error);
      alert('Failed to load grading form');
    }
  }

  selectGradeScore(score) {
    document.getElementById('gradeScore').value = score;
    
    // Update UI
    document.querySelectorAll('.star-btn').forEach(btn => {
      const btnScore = parseInt(btn.dataset.score);
      if (btnScore <= score) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  async submitManualGrade(submissionId) {
    try {
      const score = parseInt(document.getElementById('gradeScore').value);
      const feedback = document.getElementById('gradeFeedback').value.trim();
      const strengths = document.getElementById('gradeStrengths').value.trim();
      const improvements = document.getElementById('gradeImprovements').value.trim();

      if (!feedback) {
        alert('Please provide feedback');
        return;
      }

      if (score < 1 || score > 5) {
        alert('Score must be between 1 and 5');
        return;
      }

      this.showLoading(true);

      // Insert grade
      const { error: gradeError } = await this.supabase
        .from('grades')
        .insert({
          submission_id: submissionId,
          grader_type: 'manual',
          score: score,
          feedback: feedback,
          ai_strengths: strengths || null,
          ai_improvements: improvements || null,
          graded_by: this.user.id
        });

      if (gradeError) throw gradeError;

      // Update submission status
      const { error: statusError } = await this.supabase
        .from('submissions')
        .update({ 
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (statusError) throw statusError;

      this.showLoading(false);

      // Close modal
      document.querySelector('.modal-overlay').remove();

      alert('✅ Grade submitted successfully!');

      // Refresh current view
      if (this.currentStep) {
        await this.renderStepContent(this.currentModule, this.currentStep);
      }

    } catch (error) {
      this.showLoading(false);
      console.error('Error submitting grade:', error);
      alert('Failed to submit grade: ' + error.message);
    }
  }

  async viewFullGrade(submissionId) {
    // This already works via showSubmission, just redirect
    await this.showSubmission(submissionId);
  }

  async showSubmission(submissionId) {
    try {
      // Load submission with grade
      const { data: submission, error: subError } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (subError) throw subError;

      const { data: grade } = await this.supabase
        .from('grades')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      const { data: assignment } = await this.supabase
        .from('assignments')
        .select('title')
        .eq('id', submission.assignment_id)
        .single();

      this.renderSubmissionDetails(submission, grade, assignment);
      this.showModal('viewSubmissionModal');

    } catch (error) {
      console.error('Error loading submission:', error);
      alert('Failed to load submission details.');
    }
  }

  renderSubmissionDetails(submission, grade, assignment) {
    const container = document.getElementById('submissionDetails');

    container.innerHTML = `
      <div class="submission-detail-card">
        <div class="detail-section">
          <h3>${assignment?.title || 'Assignment'}</h3>
          <div class="detail-meta">
            Submitted on ${this.formatDate(submission.submitted_at)}
            ${grade ? ` • Graded on ${this.formatDate(grade.created_at)}` : ''}
          </div>
        </div>

        ${submission.submission_url ? `
          <div class="detail-section">
            <h4>🔗 Submitted URL</h4>
            <a href="${submission.submission_url}" target="_blank" class="detail-link">
              ${submission.submission_url}
            </a>
            <a href="${submission.submission_url}" target="_blank" class="btn btn-secondary btn-small" style="margin-top: 0.5rem;">
              Open in New Tab →
            </a>
          </div>
        ` : ''}

        ${submission.file_url ? `
          <div class="detail-section">
            <h4>📎 Uploaded File</h4>
            <div class="file-display">
              ${submission.file_type?.startsWith('image/') ? `
                <img src="${submission.file_url}" alt="Submission" class="submission-image-full">
              ` : `
                <div class="file-icon-large">📄</div>
              `}
              <div class="file-meta">
                <strong>${submission.file_name || 'Uploaded File'}</strong>
                <a href="${submission.file_url}" target="_blank" class="btn btn-secondary btn-small">
                  Download File
                </a>
              </div>
            </div>
          </div>
        ` : ''}

        ${submission.notes ? `
          <div class="detail-section">
            <h4>📝 Your Notes</h4>
            <p class="detail-notes">${this.escapeHtml(submission.notes)}</p>
          </div>
        ` : ''}

        <div class="detail-section">
          <h4>Status</h4>
          <span class="status-badge status-${submission.status}">${submission.status}</span>
        </div>

        ${grade ? `
          <div class="detail-section grade-section">
            <h4>Your Grade</h4>
            <div class="grade-display-compact">
              <div class="grade-stars-large">${'⭐'.repeat(grade.score)}${'☆'.repeat(5 - grade.score)}</div>
              <div class="grade-score-large">${grade.score}/5 - ${this.getGradeLabel(grade.score)}</div>
            </div>
            
            <div class="feedback-detail">
              <h5>📝 Feedback</h5>
              <p>${this.escapeHtml(grade.feedback)}</p>
              
              ${grade.ai_strengths ? `
                <h5>✅ What You Did Well</h5>
                <p>${this.escapeHtml(grade.ai_strengths)}</p>
              ` : ''}
              
              ${grade.ai_improvements ? `
                <h5>💡 How to Improve</h5>
                <p>${this.escapeHtml(grade.ai_improvements)}</p>
              ` : ''}
              
              ${grade.ai_analysis ? `
                <h5>🔍 Detailed Analysis</h5>
                <p>${this.escapeHtml(grade.ai_analysis)}</p>
              ` : ''}
            </div>
            
            <div class="grader-info">
              Graded by ${grade.grader_type === 'ai' ? '🤖 AI Assistant' : '👨‍🏫 Instructor'}
            </div>
          </div>
        ` : `
          <div class="detail-section">
            <div class="pending-message">
              ${submission.status === 'grading' ? '🤖 AI is currently grading your work...' : '⏳ Waiting for review'}
            </div>
          </div>
        `}
      </div>
    `;
  }

  // ==========================================
  // CERTIFICATE SYSTEM
  // ==========================================

  async downloadCertificate() {
    try {
      const userId = this.auth.getCurrentUser().id;
      const classId = this.currentClassId || parseInt(window.location.hash.split('/')[1]);
      
      if (!classId) {
        alert('No class selected');
        return;
      }

      // Check if certificate already exists
      let { data: certificate } = await this.supabase
        .from('certificates')
        .select('*')
        .eq('student_id', userId)
        .eq('class_id', classId)
        .single();

      // If not, generate it
      if (!certificate) {
        certificate = await this.generateCertificate(userId, classId);
      }

      if (certificate) {
        // Show certificate modal
        await this.showCertificate(certificate);
      }

    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    }
  }

  async generateCertificate(studentId, classId) {
    try {
      // Get class data
      const { data: classData } = await this.supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      // Get progress
      const progress = await this.getClassProgress(classId);

      // Get average grade
      const avgGrade = await this.getAverageGradeForClass(classId);

      // Generate unique certificate code
      const certCode = `CERT-${classId}-${studentId.substring(0, 8)}-${Date.now()}`;

      // Create certificate record
      const { data: certificate, error } = await this.supabase
        .from('certificates')
        .insert({
          student_id: studentId,
          class_id: classId,
          completion_date: new Date().toISOString(),
          modules_completed: progress.completedModules,
          total_modules: progress.totalModules,
          assignments_graded: progress.gradedAssignments,
          total_assignments: progress.totalAssignments,
          average_grade: avgGrade ? parseFloat(avgGrade) : null,
          certificate_code: certCode
        })
        .select()
        .single();

      if (error) throw error;

      alert('🎓 Certificate generated successfully!');
      return certificate;

    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  async showCertificate(certificate) {
    // Get student and class info
    const { data: student } = await this.supabase
      .from('users_profile')
      .select('*')
      .eq('id', certificate.student_id)
      .single();

    const { data: classData } = await this.supabase
      .from('classes')
      .select('*, trainer:users_profile!classes_trainer_id_fkey(github_username)')
      .eq('id', certificate.class_id)
      .single();

    // For now, just show alert with certificate info
    // In production, this would open a beautiful certificate modal with download option
    const certInfo = `
🎓 CERTIFICATE OF COMPLETION

Student: ${student?.github_username || 'Student'}
Class: ${classData?.name || 'Class'}
Completed: ${new Date(certificate.completion_date).toLocaleDateString()}
Modules: ${certificate.modules_completed}/${certificate.total_modules}
Assignments: ${certificate.assignments_graded}/${certificate.total_assignments}
Average Grade: ${certificate.average_grade ? certificate.average_grade.toFixed(1) : 'N/A'}/5
Certificate ID: ${certificate.certificate_code}

Download feature coming in next update!
    `;

    alert(certInfo);
  }

  // Dark mode functionality
  initDarkMode() {
    // Check localStorage for saved theme (default is now dark)
    const savedTheme = localStorage.getItem('theme') || 'dark';
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
      icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new AIClassroom();
  app.initialize();
});

