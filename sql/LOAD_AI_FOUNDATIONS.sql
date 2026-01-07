-- =====================================================
-- ClassroomNeo: Load AI Foundations + Claude Desktop Mastery v2
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's see what classes exist
SELECT id, name FROM classes;

-- =====================================================
-- PART 1: Create AI Foundations Class
-- =====================================================

INSERT INTO classes (name, description, trainer_id, start_date, end_date, is_active)
SELECT 
  'AI Foundations',
  'Start your AI journey here! Learn to use AI assistants effectively - no coding or technical skills required. Perfect for beginners who want to understand and use AI in their daily work and life.',
  id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true
FROM users_profile 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 2: Insert AI Foundations Modules and Steps
-- =====================================================

DO $$
DECLARE
  v_class_id INTEGER;
  v_mod1_id INTEGER;
  v_mod2_id INTEGER;
  v_mod3_id INTEGER;
  v_mod4_id INTEGER;
BEGIN
  -- Get the class ID
  SELECT id INTO v_class_id FROM classes WHERE name = 'AI Foundations';
  
  IF v_class_id IS NULL THEN
    RAISE NOTICE 'AI Foundations class not found, skipping...';
    RETURN;
  END IF;

  -- Delete existing modules for this class (clean slate)
  DELETE FROM steps WHERE module_id IN (SELECT id FROM modules WHERE class_id = v_class_id);
  DELETE FROM modules WHERE class_id = v_class_id;

  -- MODULE 1: Welcome to AI
  INSERT INTO modules (class_id, title, description, order_number, slug, is_active)
  VALUES (v_class_id, 'Welcome to AI', 'Understand what AI really is (and isn''t) in simple terms anyone can understand', 1, 'welcome-to-ai', true)
  RETURNING id INTO v_mod1_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod1_id, 'What is AI? (No Jargon Version)', '# What is AI? 🤖

## Think of AI Like a Very Smart Assistant

Imagine having an assistant who:
- Has read millions of books, articles, and websites
- Can write, summarize, and explain things
- Never gets tired or annoyed
- Is available 24/7

That''s basically what AI assistants like Claude are!

## What AI Actually Does

**AI is good at:**
- ✅ Writing and editing text
- ✅ Explaining complex topics simply
- ✅ Brainstorming ideas
- ✅ Answering questions
- ✅ Helping you learn new things

**AI is NOT:**
- ❌ A human (it doesn''t have feelings)
- ❌ Always right (it can make mistakes)
- ❌ Connected to the internet in real-time
- ❌ Able to remember past conversations

## Key Takeaway

AI is a powerful tool that makes you MORE productive - it doesn''t replace you, it helps you work smarter! 💡', 1, 15, 'what-is-ai'),

  (v_mod1_id, 'Meet Claude - Your AI Assistant', '# Meet Claude 👋

## Who Made Claude?

Claude is made by **Anthropic**, a company focused on making AI that''s helpful, harmless, and honest.

## Why Claude?

- 🎯 **Clear explanations** - Great at breaking down complex topics
- 📝 **Excellent writing** - Produces natural, human-like text
- 🛡️ **Safety focus** - Designed to be helpful without being harmful
- 💬 **Conversational** - Easy to talk to naturally

## How to Access Claude

### Option 1: Claude.ai (Easiest - We''ll use this!)
1. Go to **claude.ai** in your web browser
2. Create a free account
3. Start chatting!

### Option 2: Claude Desktop App (We''ll learn this later)
- More powerful features
- We cover this in the advanced course!

## Your First Task 🎯

1. Open your browser
2. Go to **claude.ai**
3. Create an account
4. Say "Hello Claude!" and see what happens!', 2, 10, 'meet-claude'),

  (v_mod1_id, 'Your First Conversation with AI', '# Your First AI Conversation 💬

## It''s Just Like Texting a Smart Friend

You don''t need special commands or codes. Just type naturally!

## Try These Starter Conversations

### Example 1: Ask a Question
```
You: What''s the difference between a latte and a cappuccino?
```

### Example 2: Get Help Writing
```
You: I need to write a thank you message to my colleague 
who helped me with a project. Can you help?
```

### Example 3: Learn Something New
```
You: Explain how solar panels work. I''m not technical, 
so please keep it simple.
```

## Tips for Better Conversations

1. **Be specific** - More details = better answers
2. **Give context** - Tell Claude who you are, what you''re trying to do
3. **Ask follow-ups** - If you don''t understand, just ask!

## 🎯 Practice Exercise

Try having a conversation with Claude about:
- A hobby you enjoy
- Something you want to learn
- A problem you''re trying to solve

Just chat naturally - there''s no wrong way to do this!', 3, 20, 'first-conversation');

  -- MODULE 2: Getting Better Answers
  INSERT INTO modules (class_id, title, description, order_number, slug, is_active)
  VALUES (v_class_id, 'Getting Better Answers', 'Learn simple techniques to get exactly what you need from AI', 2, 'better-answers', true)
  RETURNING id INTO v_mod2_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod2_id, 'The Magic of Clear Requests', '# The Magic of Clear Requests ✨

## Vague vs Specific

The clearer your request, the better Claude''s response!

### ❌ Vague Request:
```
Write me an email
```

### ✅ Specific Request:
```
Write a short, friendly email to my manager 
asking if I can take Friday off for a doctor''s appointment
```

## The 3 Magic Ingredients

### 1. WHO is this for?
- "For my boss..."
- "For a 5-year-old..."

### 2. WHAT do you want?
- "Write a summary..."
- "Give me 5 ideas for..."

### 3. HOW should it be?
- "Keep it under 100 words"
- "Make it formal/casual"

## 🎯 Practice

Take one of these vague requests and make it specific:
1. "Write something about coffee"
2. "Help me with a presentation"', 1, 15, 'clear-requests'),

  (v_mod2_id, 'Giving Examples (Show, Don''t Just Tell)', '# Show Claude What You Want 📋

## Examples Are Powerful

Instead of describing what you want, SHOW Claude an example!

## The Example Technique

**Without example:**
```
Write a product description for a water bottle
```

**With example:**
```
Write a product description for a water bottle.

Here''s an example of the style I want:

"The CozyMug - Your morning companion. Keeps coffee hot for 8 hours."

Now write one for: Stainless steel water bottle, 750ml, 
keeps drinks cold 24 hours.
```

Claude will match your style!

## When to Use Examples

✅ When you have a specific style in mind
✅ When explaining is harder than showing
✅ When you want consistent output

## 🎯 Practice

Find a piece of writing you like and ask Claude to write something new in that style!', 2, 15, 'giving-examples'),

  (v_mod2_id, 'The Art of Follow-Up Questions', '# Follow-Up Questions Are Your Superpower 🦸

## Don''t Accept the First Answer!

Claude''s first response might be good, but follow-ups make it GREAT.

## Useful Follow-Up Phrases

### To Get More:
- "Can you expand on point #3?"
- "Give me 5 more examples"

### To Get Less:
- "Make this shorter"
- "Summarize in 3 bullet points"

### To Adjust Tone:
- "Make this more casual"
- "Add some humor"

### To Fix:
- "Change [this part] to [that]"
- "Actually, I meant [correction]"

## Key Insight 💡

Chatting with AI is a CONVERSATION, not a one-shot request.

The more you interact, the better the result!

## 🎯 Practice

1. Ask Claude to write something
2. Give at least 3 follow-up requests to improve it
3. See how much better the final version is!', 3, 15, 'follow-up-questions'),

  (v_mod2_id, 'Giving Claude a Role', '# Give Claude a Role 🎭

## The Role Technique

Tell Claude WHO to be, and it will respond accordingly!

## Examples of Roles

### Expert Roles:
```
"Act as a nutritionist and review my meal plan"

"You are an experienced teacher. Explain photosynthesis 
to a 12-year-old student."
```

### Specific Perspectives:
```
"Review this from a customer''s perspective"

"As a beginner, what would confuse me about this?"
```

## Why This Works

1. **Focus** - Claude knows what perspective to take
2. **Expertise** - Claude draws on relevant knowledge
3. **Tone** - The role sets the communication style

## 🎯 Practice

Try asking Claude to be:
1. A tough but fair editor reviewing your writing
2. A patient tutor explaining something difficult
3. A creative brainstorming partner for ideas', 4, 15, 'giving-roles');

  -- MODULE 3: AI for Everyday Tasks
  INSERT INTO modules (class_id, title, description, order_number, slug, is_active)
  VALUES (v_class_id, 'AI for Everyday Tasks', 'Practical ways to use AI in your daily work and life', 3, 'everyday-tasks', true)
  RETURNING id INTO v_mod3_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod3_id, 'Writing Emails & Messages', '# AI-Powered Communication ✉️

## Email Made Easy

### Quick Email Generation
```
Write a professional email:
- To: Client who missed a deadline
- Tone: Polite but firm
- Goal: Get them to commit to a new date
- Keep it under 100 words
```

### Difficult Messages

**Saying No Nicely:**
```
Help me politely decline a meeting invitation. 
I''m too busy but don''t want to seem rude.
```

**Asking for Things:**
```
Write a message asking my boss for a raise.
I''ve been here 2 years and took on extra responsibilities.
Make it confident but not demanding.
```

## Pro Tips

1. **Always review** before sending
2. **Adjust the tone** - Ask for "warmer" or "more direct" versions
3. **Multiple options** - Ask for 2-3 versions to choose from

## 🎯 Practice

Think of an email you''ve been putting off. Ask Claude to help you write it!', 1, 20, 'writing-emails'),

  (v_mod3_id, 'Research & Learning', '# Learn Anything with AI 📚

## Explaining Complex Topics

### The "Explain Like I''m 5" Technique
```
Explain cryptocurrency like I''m 5 years old
```

### Progressive Learning
```
Explain machine learning in 3 levels:
1. For a complete beginner
2. For someone who understands the basics
3. For someone who wants technical details
```

## Research Assistance

### Summarizing Long Content
```
Summarize this article in 5 bullet points:
[paste article]
```

### Comparing Options
```
Compare iPhone vs Samsung Galaxy:
- Make a simple comparison table
- Best for: photography, battery, price
```

## Study Helper

### Test Yourself
```
I just learned about [topic]. 
Quiz me with 5 questions to test my understanding.
```

## ⚠️ Important Note

Claude''s knowledge has a cutoff date. For current events, verify with current sources.

## 🎯 Practice

Pick something you''ve always wanted to understand and ask Claude to explain it!', 2, 20, 'research-learning'),

  (v_mod3_id, 'Creative Projects & Ideas', '# Unleash Your Creativity 🎨

## Brainstorming Partner

### Generating Ideas
```
Give me 10 creative ideas for:
- A team building activity
- A side business
- A birthday surprise
```

### Building on Ideas
```
I like idea #3. Expand on it:
- How would I actually do this?
- What would I need?
```

## Content Creation

### Social Media Posts
```
Write 5 Instagram caption options for a photo of:
[describe your photo]

Make them engaging and include relevant emojis.
```

### Presentation Outlines
```
Create an outline for a 10-minute presentation about:
[your topic]

Audience: [describe audience]
Goal: [what should they learn?]
```

## 🎯 Practice

1. Think of a creative project you want to do
2. Use Claude as your brainstorming partner
3. Go through at least 5 rounds to develop the idea', 3, 20, 'creative-projects'),

  (v_mod3_id, 'Problem Solving & Advice', '# AI as Your Problem-Solving Partner 🧩

## How to Ask for Advice

### Describe the Situation
```
I have a problem and need advice:

Situation: [what''s happening]
People involved: [who''s affected]
What I''ve tried: [previous attempts]
What I want: [ideal outcome]
```

### Get Multiple Solutions
```
Give me 5 different ways to approach this problem.
Include both quick fixes and long-term solutions.
```

## Common Problem Types

### Work Challenges
```
My coworker keeps taking credit for my work. 
How can I handle this professionally?
```

### Time Management
```
I''m overwhelmed with tasks. Help me prioritize:
[list your tasks]
```

## Important Boundaries ⚠️

Claude can help with many things, but remember:
- **Medical issues**: See a doctor
- **Legal matters**: Consult a lawyer
- **Mental health**: Reach out to a counselor

## 🎯 Practice

Think of a real problem you''re facing and work through it with Claude.', 4, 15, 'problem-solving');

  -- MODULE 4: Working Smarter with AI
  INSERT INTO modules (class_id, title, description, order_number, slug, is_active)
  VALUES (v_class_id, 'Working Smarter with AI', 'Advanced tips to become an AI power user', 4, 'working-smarter', true)
  RETURNING id INTO v_mod4_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod4_id, 'Building Your Personal Templates', '# Create Your Personal AI Templates 📋

## What Are Templates?

Templates are pre-written prompts you can reuse for things you do often!

## How to Create Templates

### Step 1: Identify Repetitive Tasks
- Weekly report formatting
- Email responses
- Meeting summaries

### Step 2: Write a Detailed Prompt
```
You are my email assistant. When I give you an email to respond to:
1. Keep responses under 100 words
2. Use a professional but friendly tone
3. End with a clear next step

Here''s the email to respond to:
[PASTE EMAIL HERE]
```

### Step 3: Save It
- Notes app
- Google Doc
- Text file

## Template Examples

### Meeting Summary Template
```
Summarize this meeting:
Format:
- 📋 Key Decisions (bullet points)
- ✅ Action Items (who does what, by when)
- 📅 Next Steps
```

## 🎯 Practice

Create a template for something you do weekly!', 1, 20, 'personal-templates'),

  (v_mod4_id, 'Common Mistakes to Avoid', '# Common AI Mistakes (And How to Avoid Them) ⚠️

## Mistake #1: Being Too Vague

❌ "Help me with work"
✅ "Help me write a project proposal for a website redesign"

## Mistake #2: No Context

❌ "Continue what we discussed yesterday"
✅ "I''m working on the marketing plan. Here''s where I left off..."

## Mistake #3: Not Correcting Mistakes

❌ Accept answer that''s not quite right
✅ "That''s not quite what I meant. I need [clarification]"

## Mistake #4: Trusting Everything

❌ Copy-paste AI answer as final work
✅ Review, fact-check, and personalize before using

## Mistake #5: Oversharing Sensitive Info

❌ Sharing passwords, personal IDs, confidential data
✅ Use generic examples or anonymize sensitive info

## Quick Reference

| Mistake | Fix |
|---------|-----|
| Too vague | Add specific details |
| No context | Provide background |
| Accept first answer | Use follow-ups |
| Blind trust | Review and verify |', 2, 15, 'common-mistakes'),

  (v_mod4_id, 'AI Ethics & Best Practices', '# Using AI Responsibly 🤝

## Golden Rules of AI Use

### 1. Be Honest About AI Use
When appropriate, let people know AI assisted you.

### 2. Always Add Human Value
- Review for accuracy
- Add your expertise
- Personalize for your audience

### 3. Protect Privacy
Don''t share with AI:
- Personal identification numbers
- Passwords
- Confidential business data

### 4. Don''t Use AI to Deceive
Never use AI to:
- Create fake reviews
- Spread misinformation
- Impersonate real people

## Your Responsibility

Remember: **YOU are responsible for everything you publish.**

AI is a tool - like a calculator. The final work is YOURS.

## 🎯 Reflection

1. When would you disclose AI use at work?
2. What info would you never share with AI?', 3, 15, 'ai-ethics'),

  (v_mod4_id, 'What''s Next? Your AI Journey Continues', '# Congratulations! You''re Now AI-Ready! 🎉

## What You''ve Learned

✅ What AI is (and isn''t)
✅ How to talk to AI naturally
✅ Techniques for better answers
✅ Practical everyday applications
✅ Templates and best practices
✅ Using AI responsibly

## Your New Superpowers

You can now:
- 💬 Communicate effectively with AI
- 📝 Get help with writing and editing
- 🔍 Research and learn faster
- 💡 Brainstorm and solve problems

## What''s Next?

### Keep Practicing
Use Claude for something new every day!

### Advanced Learning
When you''re ready, take **Claude Desktop Mastery** to learn powerful integrations!

## Your Challenge 🎯

This week, try using AI for:
- **Monday:** Write an email you''ve been putting off
- **Tuesday:** Learn about a topic that interests you
- **Wednesday:** Brainstorm solutions to a problem
- **Thursday:** Create a template for a repetitive task
- **Friday:** Help a friend discover AI

## Thank You! 🙏

Welcome to your new AI-powered life! 🚀', 4, 10, 'whats-next');

  RAISE NOTICE 'Successfully created AI Foundations course with % modules!', 4;
  
END $$;

-- =====================================================
-- PART 3: Verify AI Foundations was created
-- =====================================================

SELECT 
  c.name as class_name,
  m.title as module_title,
  COUNT(s.id) as step_count
FROM classes c
JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
WHERE c.name = 'AI Foundations'
GROUP BY c.name, m.title, m.order_number
ORDER BY m.order_number;
