// ============================================================
// Loader: inserts the "Claude Code: Zero to Clauder" course.
//
// Additive & idempotent: creates a NEW class, never touches the other
// classes. Re-running does a clean reload of THIS class only — and it
// refuses to touch the class if any student has already submitted work.
//
// Run directly with the classroom service credentials in env:
//   CLASSROOM_SUPABASE_URL=... CLASSROOM_SUPABASE_SERVICE_KEY=... \
//     node tools/load-claude-code-course.js
// (No secrets are hardcoded here.)
// ============================================================

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const COURSE = require('../curriculum/claude-code-course.js');

async function loadCourse(db, content = COURSE) {
  // 1) Find or create the class (match by name so re-runs are safe)
  const { data: existing, error: findErr } = await db
    .from('classes').select('id').eq('name', content.class.name).maybeSingle();
  if (findErr) throw new Error('lookup class: ' + findErr.message);

  let classId;
  if (existing) {
    classId = existing.id;
    // Safety: refuse to reload if any student already submitted work here.
    const { data: mods } = await db.from('modules').select('id').eq('class_id', classId);
    const modIds = (mods || []).map(m => m.id);
    let stepIds = [];
    if (modIds.length) {
      const { data: steps } = await db.from('steps').select('id').in('module_id', modIds);
      stepIds = (steps || []).map(s => s.id);
    }
    if (stepIds.length) {
      const { data: asgs } = await db.from('assignments').select('id').in('step_id', stepIds);
      const asgIds = (asgs || []).map(a => a.id);
      if (asgIds.length) {
        const { count } = await db.from('submissions')
          .select('*', { count: 'exact', head: true }).in('assignment_id', asgIds);
        if (count && count > 0) {
          throw new Error(`Refusing to reload: ${count} student submission(s) exist for this class.`);
        }
      }
      // Clean reload of THIS class only.
      await db.from('assignments').delete().in('step_id', stepIds);
    }
    if (modIds.length) await db.from('steps').delete().in('module_id', modIds);
    await db.from('modules').delete().eq('class_id', classId);
    console.log(`↻ Reloading existing class #${classId}`);
  } else {
    const { data, error } = await db.from('classes')
      .insert(content.class).select('id').single();
    if (error) throw new Error('insert class: ' + error.message);
    classId = data.id;
    console.log(`＋ Created class #${classId}: ${content.class.name}`);
  }

  // 2) Modules → steps
  const stepSlugToId = {};
  let stepCount = 0;
  for (const m of content.modules) {
    const { data: mod, error: me } = await db.from('modules').insert({
      class_id: classId, slug: m.slug, title: m.title,
      description: m.description, order_number: m.order_number, is_active: true,
    }).select('id').single();
    if (me) throw new Error(`insert module ${m.slug}: ` + me.message);

    const stepRows = m.steps.map((s, i) => ({
      module_id: mod.id, slug: s.slug, title: s.title,
      content: s.content, order_number: i + 1, estimated_minutes: s.estimated_minutes,
    }));
    const { data: steps, error: se } = await db.from('steps').insert(stepRows).select('id, slug');
    if (se) throw new Error(`insert steps for ${m.slug}: ` + se.message);
    steps.forEach(st => { stepSlugToId[st.slug] = st.id; });
    stepCount += steps.length;
    console.log(`  • ${m.title} — ${steps.length} steps`);
  }

  // 3) Assignments (attached to steps)
  let asgCount = 0;
  for (const a of content.assignments) {
    const step_id = stepSlugToId[a.step_slug];
    if (!step_id) throw new Error(`assignment "${a.title}": step_slug ${a.step_slug} not found`);
    const { error: ae } = await db.from('assignments').insert({
      step_id, title: a.title, description: a.description, instructions: a.instructions,
      max_score: a.max_score, allow_file_upload: a.allow_file_upload,
      allow_url_submission: a.allow_url_submission, allowed_file_types: a.allowed_file_types,
      is_active: true, ai_grading_enabled: a.ai_grading_enabled, ai_grading_rubric: a.ai_grading_rubric,
    });
    if (ae) throw new Error(`insert assignment ${a.title}: ` + ae.message);
    asgCount++;
  }

  return { classId, modules: content.modules.length, steps: stepCount, assignments: asgCount };
}

module.exports = { loadCourse };

// Self-run
if (require.main === module) {
  const url = process.env.CLASSROOM_SUPABASE_URL;
  const key = process.env.CLASSROOM_SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Set CLASSROOM_SUPABASE_URL and CLASSROOM_SUPABASE_SERVICE_KEY.');
    process.exit(1);
  }
  const db = createClient(url, key);
  loadCourse(db)
    .then(r => { console.log('\n✅ Done:', JSON.stringify(r)); })
    .catch(e => { console.error('\n❌', e.message); process.exit(1); });
}
