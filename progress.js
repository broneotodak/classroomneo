// ==========================================
// AI Classroom - Progress Tracking Module
// ==========================================

class ProgressManager {
  constructor(supabaseClient, authManager) {
    this.supabase = supabaseClient;
    this.auth = authManager;
    this.modules = [];
    this.userProgress = [];
  }

  // Load all modules and steps (for enrolled classes only)
  async loadModules() {
    try {
      // Get user's enrolled classes first
      const userId = this.auth.getCurrentUser().id;
      const { data: enrollments, error: enrollError } = await this.supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('student_id', userId)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        // No enrolled classes, return empty
        this.modules = [];
        return [];
      }

      const classIds = enrollments.map(e => e.class_id);

      // Get modules from enrolled classes
      const { data: modules, error: modulesError } = await this.supabase
        .from('modules')
        .select(`
          *,
          steps:steps(*),
          class:classes(name)
        `)
        .in('class_id', classIds)
        .eq('is_active', true)
        .order('order_number', { ascending: true });

      if (modulesError) throw modulesError;

      // Sort steps within each module
      modules.forEach(module => {
        if (module.steps) {
          module.steps.sort((a, b) => a.order_number - b.order_number);
        }
      });

      this.modules = modules;
      return modules;
    } catch (error) {
      console.error('Error loading modules:', error);
      return [];
    }
  }

  // Load user progress
  async loadUserProgress() {
    if (!this.auth.isAuthenticated()) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', this.auth.getCurrentUser().id);

      if (error) throw error;

      this.userProgress = data || [];
      return this.userProgress;
    } catch (error) {
      console.error('Error loading user progress:', error);
      return [];
    }
  }

  // Get progress for a specific step
  getStepProgress(stepId) {
    return this.userProgress.find(p => p.step_id === stepId) || null;
  }

  // Get progress for a specific module
  getModuleProgress(moduleId) {
    const module = this.modules.find(m => m.id === moduleId);
    if (!module || !module.steps) return null;

    const stepIds = module.steps.map(s => s.id);
    const moduleProgress = this.userProgress.filter(p => stepIds.includes(p.step_id));

    const totalSteps = module.steps.length;
    const completedSteps = moduleProgress.filter(p => p.status === 'completed').length;
    const inProgressSteps = moduleProgress.filter(p => p.status === 'in_progress').length;

    return {
      moduleId,
      totalSteps,
      completedSteps,
      inProgressSteps,
      completionPercentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      isCompleted: completedSteps === totalSteps && totalSteps > 0,
      isStarted: moduleProgress.length > 0
    };
  }

  // Mark step as started
  async startStep(moduleId, stepId) {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Must be authenticated to track progress');
    }

    try {
      const existing = this.getStepProgress(stepId);

      if (existing) {
        // DON'T update if already completed - allow review without losing progress
        if (existing.status === 'completed') {
          return existing;
        }
        
        // Update existing progress to in_progress (only if not completed)
        const { data, error } = await this.supabase
          .from('user_progress')
          .update({
            status: 'in_progress',
            started_at: existing.started_at || new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        this.updateLocalProgress(data);
        return data;
      } else {
        // Create new progress entry
        const { data, error } = await this.supabase
          .from('user_progress')
          .insert({
            user_id: this.auth.getCurrentUser().id,
            module_id: moduleId,
            step_id: stepId,
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        this.userProgress.push(data);
        return data;
      }
    } catch (error) {
      console.error('Error starting step:', error);
      throw error;
    }
  }

  // Mark step as completed
  async completeStep(moduleId, stepId, notes = null) {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Must be authenticated to track progress');
    }

    try {
      const existing = this.getStepProgress(stepId);

      if (existing) {
        // Update existing progress
        const { data, error } = await this.supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: notes
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        this.updateLocalProgress(data);
        return data;
      } else {
        // Create new completed progress entry
        const { data, error } = await this.supabase
          .from('user_progress')
          .insert({
            user_id: this.auth.getCurrentUser().id,
            module_id: moduleId,
            step_id: stepId,
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            notes: notes
          })
          .select()
          .single();

        if (error) throw error;
        this.userProgress.push(data);
        return data;
      }
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  }

  // Update local progress cache
  updateLocalProgress(updatedProgress) {
    const index = this.userProgress.findIndex(p => p.id === updatedProgress.id);
    if (index >= 0) {
      this.userProgress[index] = updatedProgress;
    }
  }

  // Get overall progress summary
  getOverallProgress() {
    const summary = {
      totalModules: this.modules.length,
      completedModules: 0,
      inProgressModules: 0,
      totalSteps: 0,
      completedSteps: 0,
      overallPercentage: 0
    };

    this.modules.forEach(module => {
      const moduleProgress = this.getModuleProgress(module.id);
      if (moduleProgress) {
        summary.totalSteps += moduleProgress.totalSteps;
        summary.completedSteps += moduleProgress.completedSteps;

        if (moduleProgress.isCompleted) {
          summary.completedModules++;
        } else if (moduleProgress.isStarted) {
          summary.inProgressModules++;
        }
      }
    });

    if (summary.totalSteps > 0) {
      summary.overallPercentage = Math.round((summary.completedSteps / summary.totalSteps) * 100);
    }

    return summary;
  }

  // Get next recommended step
  getNextStep() {
    for (const module of this.modules) {
      if (!module.steps) continue;

      for (const step of module.steps) {
        const progress = this.getStepProgress(step.id);
        if (!progress || progress.status !== 'completed') {
          return {
            module: module,
            step: step,
            isFirstStep: !progress
          };
        }
      }
    }

    return null; // All steps completed!
  }

  // Calculate estimated time remaining
  getEstimatedTimeRemaining() {
    let totalMinutes = 0;

    this.modules.forEach(module => {
      if (!module.steps) return;

      module.steps.forEach(step => {
        const progress = this.getStepProgress(step.id);
        if (!progress || progress.status !== 'completed') {
          totalMinutes += step.estimated_minutes || 10;
        }
      });
    });

    return {
      minutes: totalMinutes,
      hours: Math.round(totalMinutes / 60 * 10) / 10,
      formatted: this.formatDuration(totalMinutes)
    };
  }

  // Format duration in a human-readable way
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${mins} min`;
  }

  // Export progress data
  async exportProgress() {
    if (!this.auth.isAuthenticated()) {
      return null;
    }

    const summary = this.getOverallProgress();
    const timeRemaining = this.getEstimatedTimeRemaining();

    const exportData = {
      user: {
        id: this.auth.getCurrentUser().id,
        email: this.auth.getCurrentUser().email
      },
      summary,
      timeRemaining,
      modules: this.modules.map(module => ({
        id: module.id,
        title: module.title,
        progress: this.getModuleProgress(module.id),
        steps: module.steps.map(step => ({
          id: step.id,
          title: step.title,
          progress: this.getStepProgress(step.id)
        }))
      })),
      exportedAt: new Date().toISOString()
    };

    return exportData;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressManager;
}

