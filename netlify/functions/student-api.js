/**
 * ClassroomNeo Student API
 * Netlify Function for Claude Desktop Integration
 * 
 * Endpoints:
 * - GET  /progress     - Get student's progress
 * - POST /complete     - Mark step as complete
 * - POST /submit       - Submit assignment
 * - GET  /next-step    - Get next incomplete step
 * - POST /activity     - Log activity from Claude Desktop
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://tsuowadcbrztlplzaobf.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

// Validate API key and return user info
async function validateApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('crn_')) {
    return null;
  }

  const { data, error } = await supabase
    .from('student_api_keys')
    .select(`
      id,
      user_id,
      is_active,
      users_profile (
        id,
        github_username,
        email,
        role
      )
    `)
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Update last used
  await supabase
    .from('student_api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      usage_count: supabase.rpc('increment_usage', { key_id: data.id })
    })
    .eq('id', data.id);

  return {
    keyId: data.id,
    userId: data.user_id,
    username: data.users_profile?.github_username,
    email: data.users_profile?.email,
    role: data.users_profile?.role
  };
}

// Log activity
async function logActivity(keyId, userId, action, details) {
  await supabase.from('api_activity_log').insert({
    api_key_id: keyId,
    user_id: userId,
    action,
    details
  });
}

// GET /progress - Get student's progress
async function getProgress(user) {
  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select(`
      class_id,
      classes (
        id, name, description
      )
    `)
    .eq('user_id', user.userId);

  const progressData = [];

  for (const enrollment of enrollments || []) {
    const { data: modules } = await supabase
      .from('modules')
      .select(`
        id, title, order_number,
        steps (
          id, title, order_number
        )
      `)
      .eq('class_id', enrollment.class_id)
      .order('order_number');

    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('step_id, status')
      .eq('user_id', user.userId);

    const progressMap = new Map(userProgress?.map(p => [p.step_id, p.status]) || []);

    let totalSteps = 0;
    let completedSteps = 0;
    const moduleProgress = [];

    for (const mod of modules || []) {
      const steps = mod.steps || [];
      totalSteps += steps.length;
      const modCompleted = steps.filter(s => progressMap.get(s.id) === 'completed').length;
      completedSteps += modCompleted;
      
      moduleProgress.push({
        id: mod.id,
        title: mod.title,
        totalSteps: steps.length,
        completedSteps: modCompleted,
        percentage: steps.length ? Math.round((modCompleted / steps.length) * 100) : 0
      });
    }

    progressData.push({
      classId: enrollment.class_id,
      className: enrollment.classes?.name,
      totalSteps,
      completedSteps,
      percentage: totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0,
      modules: moduleProgress
    });
  }

  return {
    student: user.username,
    enrolledClasses: progressData.length,
    progress: progressData
  };
}

// POST /complete - Mark step as complete
async function completeStep(user, body) {
  const { stepId, moduleId, classId } = body;

  if (!stepId) {
    return { error: 'stepId is required' };
  }

  // Verify step exists and user is enrolled
  const { data: step } = await supabase
    .from('steps')
    .select(`
      id, title,
      modules (
        id, class_id,
        classes (
          id, name
        )
      )
    `)
    .eq('id', stepId)
    .single();

  if (!step) {
    return { error: 'Step not found' };
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('class_enrollments')
    .select('id')
    .eq('user_id', user.userId)
    .eq('class_id', step.modules.class_id)
    .single();

  if (!enrollment) {
    return { error: 'Not enrolled in this class' };
  }

  // Upsert progress
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.userId,
      step_id: stepId,
      module_id: step.modules.id,
      class_id: step.modules.class_id,
      status: 'completed',
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,step_id'
    });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: `Marked "${step.title}" as complete!`,
    step: step.title,
    class: step.modules.classes.name
  };
}

// GET /next-step - Get next incomplete step
async function getNextStep(user, classId) {
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id, title, order_number,
      steps (
        id, title, order_number, estimated_minutes
      )
    `)
    .eq('class_id', classId)
    .order('order_number');

  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('step_id')
    .eq('user_id', user.userId)
    .eq('status', 'completed');

  const completedIds = new Set(userProgress?.map(p => p.step_id) || []);

  for (const mod of modules || []) {
    const steps = (mod.steps || []).sort((a, b) => a.order_number - b.order_number);
    for (const step of steps) {
      if (!completedIds.has(step.id)) {
        return {
          nextStep: {
            id: step.id,
            title: step.title,
            module: mod.title,
            estimatedMinutes: step.estimated_minutes
          }
        };
      }
    }
  }

  return { nextStep: null, message: 'All steps completed! 🎉' };
}


// POST /submit - Submit assignment
async function submitAssignment(user, body) {
  const { stepId, submissionUrl, fileUrl, notes } = body;

  if (!stepId) {
    return { error: 'stepId is required' };
  }

  // Get step and assignment info
  const { data: step } = await supabase
    .from('steps')
    .select(`
      id, title,
      modules (id, class_id)
    `)
    .eq('id', stepId)
    .single();

  if (!step) {
    return { error: 'Step not found' };
  }

  // Get assignment for this step (if exists)
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title')
    .eq('step_id', stepId)
    .single();

  if (!assignment) {
    return { error: 'No assignment found for this step' };
  }

  // Create submission
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignment.id,
      user_id: user.userId,
      submission_url: submissionUrl,
      file_url: fileUrl,
      student_notes: notes || 'Submitted via Claude Desktop',
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: 'Assignment submitted successfully!',
    submissionId: submission.id,
    assignment: assignment.title,
    status: 'pending_review'
  };
}

// POST /activity - Log Claude Desktop activity
async function logClaudeActivity(user, keyId, body) {
  const { action, details, source } = body;

  await supabase.from('api_activity_log').insert({
    api_key_id: keyId,
    user_id: user.userId,
    action: action || 'claude_desktop_activity',
    details: {
      ...details,
      source: source || 'claude_desktop',
      timestamp: new Date().toISOString()
    }
  });

  return { success: true, logged: true };
}

// Main handler
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Get API key from header
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];

  if (!apiKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'Missing API key',
        hint: 'Include X-API-Key header with your ClassroomNeo API key'
      })
    };
  }

  // Validate API key
  const user = await validateApiKey(apiKey);

  if (!user) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ 
        error: 'Invalid or inactive API key',
        hint: 'Generate a new key from ClassroomNeo Dashboard'
      })
    };
  }

  // Parse path
  const path = event.path.replace(/^\/.netlify\/functions\/student-api\/?/, '');
  const method = event.httpMethod;
  let body = {};

  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    // Ignore parse errors for GET requests
  }

  // Query params
  const params = event.queryStringParameters || {};

  // Route requests
  try {
    let result;

    switch (path) {
      case 'progress':
      case '':
        if (method === 'GET') {
          result = await getProgress(user);
        }
        break;

      case 'complete':
        if (method === 'POST') {
          result = await completeStep(user, body);
          await logActivity(user.keyId, user.userId, 'complete_step', { stepId: body.stepId });
        }
        break;

      case 'submit':
        if (method === 'POST') {
          result = await submitAssignment(user, body);
          await logActivity(user.keyId, user.userId, 'submit_assignment', { stepId: body.stepId });
        }
        break;

      case 'next-step':
        if (method === 'GET') {
          result = await getNextStep(user, params.classId);
        }
        break;

      case 'activity':
        if (method === 'POST') {
          result = await logClaudeActivity(user, user.keyId, body);
        }
        break;

      case 'status':
        result = {
          connected: true,
          student: user.username,
          email: user.email,
          message: '✅ Claude Desktop successfully connected to ClassroomNeo!'
        };
        break;

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Endpoint not found',
            available: ['progress', 'complete', 'submit', 'next-step', 'activity', 'status']
          })
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
