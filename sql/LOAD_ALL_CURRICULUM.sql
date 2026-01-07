-- =====================================================
-- ClassroomNeo: COMPLETE CURRICULUM LOADER
-- Run this ENTIRE script in Supabase SQL Editor
-- Project: tsuowadcbrztlplzaobf
-- =====================================================

-- =====================================================
-- STEP 1: Create AI Foundations Class
-- =====================================================

INSERT INTO classes (name, description, is_active)
VALUES (
  'AI Foundations',
  'Start your AI journey here! Learn to use AI assistants effectively - no coding or technical skills required. Perfect for beginners who want to understand and use AI in their daily work and life.',
  true
)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- =====================================================
-- STEP 2: Load AI Foundations Modules & Steps
-- =====================================================

DO $$
DECLARE
  v_class_id INTEGER;
  v_mod1_id INTEGER;
  v_mod2_id INTEGER;
  v_mod3_id INTEGER;
  v_mod4_id INTEGER;
BEGIN
  SELECT id INTO v_class_id FROM classes WHERE name = 'AI Foundations';
  
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'AI Foundations class not found!';
  END IF;

  -- Clean existing data for this class
  DELETE FROM steps WHERE module_id IN (SELECT id FROM modules WHERE class_id = v_class_id);
  DELETE FROM modules WHERE class_id = v_class_id;

  -- MODULE 1: Welcome to AI
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'Welcome to AI', 'Understand what AI really is in simple terms anyone can understand', 1, true)
  RETURNING id INTO v_mod1_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
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

AI is a powerful tool that makes you MORE productive - it doesn''t replace you, it helps you work smarter! 💡', 1, 15),

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

### Option 2: Claude Desktop App (Advanced course)
- More powerful features
- We cover this in **Claude Desktop Mastery**!

## Your First Task 🎯

1. Open your browser
2. Go to **claude.ai**
3. Create an account
4. Say "Hello Claude!" and see what happens!', 2, 10),

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

Just chat naturally - there''s no wrong way to do this!', 3, 20);

  -- MODULE 2: Getting Better Answers
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'Getting Better Answers', 'Learn simple techniques to get exactly what you need from AI', 2, true)
  RETURNING id INTO v_mod2_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
  (v_mod2_id, 'The Magic of Clear Requests', '# The Magic of Clear Requests ✨

## Vague vs Specific

The clearer your request, the better Claude''s response!

### ❌ Vague Request:
```
Write me an email
```
Claude: "What kind of email? To whom? About what?"

### ✅ Specific Request:
```
Write a short, friendly email to my manager 
asking if I can take Friday off for a doctor''s appointment
```
Claude: *Writes exactly what you need*

## The 3 Magic Ingredients

### 1. WHO is this for?
- "For my boss..."
- "For a 5-year-old..."
- "For someone who knows nothing about tech..."

### 2. WHAT do you want?
- "Write a summary..."
- "Explain this concept..."
- "Give me 5 ideas for..."

### 3. HOW should it be?
- "Keep it under 100 words"
- "Make it formal/casual"
- "Include bullet points"

## 🎯 Practice

Take one of these vague requests and make it specific:
1. "Write something about coffee"
2. "Help me with a presentation"
3. "Explain exercise"', 1, 15),

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

"The CozyMug - Your morning companion. Keeps coffee hot for 8 hours, 
fits in any cupholder, and looks good doing it."

Now write one for: Stainless steel water bottle, 750ml, 
keeps drinks cold 24 hours, leak-proof lid.
```

Claude will match your style!

## When to Use Examples

✅ When you have a specific style in mind
✅ When explaining is harder than showing
✅ When you want consistent output
✅ When Claude''s first attempt wasn''t quite right

## 🎯 Practice

Find a piece of writing you like (email, post, description) and ask Claude to write something new in that style!', 2, 15),

  (v_mod2_id, 'The Art of Follow-Up Questions', '# Follow-Up Questions Are Your Superpower 🦸

## Don''t Accept the First Answer!

Claude''s first response might be good, but follow-ups make it GREAT.

## Useful Follow-Up Phrases

### To Get More:
- "Can you expand on point #3?"
- "Give me 5 more examples"
- "What else should I consider?"

### To Get Less:
- "Make this shorter"
- "Summarize in 3 bullet points"
- "Give me just the key takeaway"

### To Adjust Tone:
- "Make this more casual"
- "Make this more professional"
- "Add some humor"

### To Fix:
- "The second paragraph doesn''t fit. Can you rewrite it?"
- "Change [this part] to [that]"
- "Actually, I meant [correction]"

## Key Insight 💡

Chatting with AI is a CONVERSATION, not a one-shot request.

The more you interact, the better the result!

## 🎯 Practice

1. Ask Claude to write something
2. Give at least 3 follow-up requests to improve it
3. See how much better the final version is!', 3, 15),

  (v_mod2_id, 'Giving Claude a Role', '# Give Claude a Role 🎭

## The Role Technique

Tell Claude WHO to be, and it will respond accordingly!

## Examples of Roles

### Expert Roles:
```
"Act as a nutritionist and review my meal plan"

"You are an experienced teacher. Explain photosynthesis 
to a 12-year-old student."

"As a career coach, help me prepare for my interview"
```

### Specific Perspectives:
```
"Review this from a customer''s perspective"

"As a beginner, what would confuse me about this?"

"Think like a skeptic - what are the weak points?"
```

## Why This Works

1. **Focus** - Claude knows what perspective to take
2. **Expertise** - Claude draws on relevant knowledge
3. **Tone** - The role sets the communication style

## Real Use Case

**Without Role:**
```
Help me with my business idea
```

**With Role:**
```
You are a venture capitalist who has evaluated 1000 startups. 
I''ll share my business idea and I want you to:
1. Point out the strengths
2. Identify potential problems
3. Suggest improvements

Be honest but constructive.
```

Much more useful feedback!

## 🎯 Practice

Try asking Claude to be:
1. A tough but fair editor reviewing your writing
2. A patient tutor explaining something difficult
3. A creative brainstorming partner for ideas', 4, 15);

  -- MODULE 3: AI for Everyday Tasks
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'AI for Everyday Tasks', 'Practical ways to use AI in your daily work and life', 3, true)
  RETURNING id INTO v_mod3_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
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

### Email Improvement
```
Make this email more polite and professional:
[paste your draft]
```

### Reply Assistance
```
Someone sent me this email: [paste email]

How should I respond? I want to [your goal]
```

## Difficult Messages

### Saying No Nicely
```
Help me politely decline a meeting invitation. 
I''m too busy but don''t want to seem rude.
```

### Delivering Bad News
```
I need to tell my client that their project will be delayed by 2 weeks.
Help me write this in a way that maintains our good relationship.
```

### Asking for Things
```
Write a message asking my boss for a raise.
I''ve been here 2 years and took on extra responsibilities.
Make it confident but not demanding.
```

## Pro Tips

1. **Always review** before sending - Claude doesn''t know your relationships
2. **Adjust the tone** - Ask for "warmer" or "more direct" versions
3. **Multiple options** - Ask for 2-3 versions to choose from

## 🎯 Practice

Think of an email you''ve been putting off. Ask Claude to help you write it!', 1, 20),

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

### Learning New Skills
```
I want to learn basic photography. Create a learning plan:
- What to learn first
- Practice exercises
- Common mistakes to avoid
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
- Give me your recommendation for a casual user
```

## Study Helper

### Test Yourself
```
I just learned about [topic]. 
Quiz me with 5 questions to test my understanding.
```

### Create Flashcards
```
Create 10 flashcard pairs (question/answer) 
for studying [subject]
```

## ⚠️ Important Note

Claude''s knowledge has a cutoff date. For current events or recent information:
- Ask Claude when its knowledge was last updated
- Verify important facts with current sources

## 🎯 Practice

Pick something you''ve always wanted to understand and ask Claude to explain it!', 2, 20),

  (v_mod3_id, 'Creative Projects & Ideas', '# Unleash Your Creativity 🎨

## Brainstorming Partner

### Generating Ideas
```
Give me 10 creative ideas for:
- A team building activity
- A side business
- A birthday surprise
- A blog post topic
```

### Building on Ideas
```
I like idea #3. Expand on it:
- How would I actually do this?
- What would I need?
- What could go wrong?
```

## Content Creation

### Social Media Posts
```
Write 5 Instagram caption options for a photo of:
[describe your photo]

Make them engaging and include relevant emojis.
Keep under 100 words each.
```

### Presentation Outlines
```
Create an outline for a 10-minute presentation about:
[your topic]

Audience: [describe audience]
Goal: [what should they learn/do after?]
```

## Planning & Organizing

### Event Planning
```
Create a checklist for planning a:
- Office party for 30 people
- 2-week vacation to Japan
- Product launch
```

### Decision Making
```
I''m deciding between 3 job offers. Help me create a decision matrix.
Here are the details: [share details]
```

## 🎯 Practice

1. Think of a creative project you want to do
2. Use Claude as your brainstorming partner
3. Go through at least 5 rounds of back-and-forth to develop the idea', 3, 20),

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

### Consider Consequences
```
If I choose option A, what might happen?
What are the risks and benefits?
```

## Common Problem Types

### Work Challenges
```
My coworker keeps taking credit for my work. 
How can I handle this professionally 
without damaging the relationship?
```

### Time Management
```
I''m overwhelmed with tasks. Help me prioritize:
[list your tasks]

Consider urgency and importance.
```

### Communication Issues
```
I need to have a difficult conversation with [person].
Topic: [what about]

Help me:
1. Plan what to say
2. Anticipate their response
3. Stay calm and constructive
```

## Important Boundaries ⚠️

Claude can help with many things, but remember:

- **Medical issues**: See a doctor
- **Legal matters**: Consult a lawyer
- **Financial decisions**: Speak to a professional
- **Mental health**: Reach out to a counselor

Claude can provide information, but not professional advice.

## 🎯 Practice

Think of a real problem you''re facing (work, personal, or creative).

1. Describe it clearly to Claude
2. Ask for multiple solutions
3. Discuss the pros and cons of each
4. Decide on an action plan', 4, 15);

  -- MODULE 4: Working Smarter with AI
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'Working Smarter with AI', 'Advanced tips to become an AI power user', 4, true)
  RETURNING id INTO v_mod4_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
  (v_mod4_id, 'Building Your Personal Templates', '# Create Your Personal AI Templates 📋

## What Are Templates?

Templates are pre-written prompts you can reuse.

Instead of typing the same request every time, save templates for things you do often!

## How to Create Templates

### Step 1: Identify Repetitive Tasks

Think about what you ask AI to help with repeatedly:
- Weekly report formatting
- Email responses
- Content creation
- Meeting summaries

### Step 2: Write a Detailed First Prompt

```
You are my email assistant. When I give you an email to respond to:

1. Keep responses under 100 words
2. Use a professional but friendly tone
3. Start with acknowledgment of their message
4. End with a clear next step
5. Match the formality level of their email

Here''s the email to respond to:
[PASTE EMAIL HERE]
```

### Step 3: Save It Somewhere

- Notes app
- Google Doc
- Notion
- Even a text file!

## Template Examples

### Meeting Summary Template
```
Summarize this meeting:

Format:
- 📋 Key Decisions (bullet points)
- ✅ Action Items (who does what, by when)
- 💡 Ideas Discussed (brief)
- 📅 Next Steps

Meeting Notes:
[PASTE NOTES]
```

## Pro Tip 💡

Start with a basic template and improve it over time.

When Claude gives a great response, note what made your prompt work!

## 🎯 Practice

Create a template for something you do weekly:
1. Write the template
2. Test it with Claude
3. Refine based on results
4. Save it for future use', 1, 20),

  (v_mod4_id, 'Common Mistakes to Avoid', '# Common AI Mistakes (And How to Avoid Them) ⚠️

## Mistake #1: Being Too Vague

❌ "Help me with work"
✅ "Help me write a project proposal for a website redesign. Budget: $5000. Timeline: 3 months."

**Fix:** Add WHO, WHAT, WHY, and HOW

## Mistake #2: Assuming AI Knows About You

❌ "Continue what we discussed yesterday"
✅ "I''m working on the marketing plan I mentioned. Here''s where I left off: [context]"

**Fix:** Always provide context - each conversation starts fresh

## Mistake #3: Not Correcting Mistakes

❌ Accept answer that''s not quite right
✅ "That''s not quite what I meant. I need [clarification]"

**Fix:** Keep asking follow-ups until you get what you need

## Mistake #4: Trusting Everything Without Checking

❌ Copy-paste AI answer as final work
✅ Review, fact-check, and personalize before using

**Fix:** AI is a draft creator, YOU are the editor

## Mistake #5: Oversharing Sensitive Information

❌ Sharing passwords, personal IDs, confidential data
✅ Use generic examples or anonymize sensitive info

**Fix:** Think before sharing - would you post this publicly?

## Quick Reference

| Mistake | Fix |
|---------|-----|
| Too vague | Add specific details |
| No context | Provide background |
| Accept first answer | Use follow-ups |
| Blind trust | Review and verify |
| One-shot | Have a conversation |
| Oversharing | Protect sensitive info |', 2, 15),

  (v_mod4_id, 'AI Ethics & Best Practices', '# Using AI Responsibly 🤝

## Golden Rules of AI Use

### 1. Be Honest About AI Use

When appropriate, let people know AI assisted you:
- "I used AI to help draft this, then I edited it"
- "This summary was AI-generated from the original document"

**Why?** Transparency builds trust.

### 2. Always Add Human Value

Don''t just copy-paste AI output:
- Review for accuracy
- Add your expertise and experience
- Personalize for your audience
- Check facts and sources

**Why?** AI makes mistakes. You''re the expert.

### 3. Protect Privacy

Don''t share with AI:
- Personal identification numbers
- Passwords or security info
- Confidential business data
- Other people''s private information

**Why?** AI conversations may be reviewed for training.

### 4. Don''t Use AI to Deceive

Never use AI to:
- Create fake reviews or testimonials
- Spread misinformation
- Impersonate real people
- Produce harmful content

**Why?** It''s unethical and often illegal.

## When AI Assistance Is Great

✅ Drafting that you''ll review and edit
✅ Learning and understanding new topics
✅ Brainstorming and ideation
✅ Formatting and organizing

## Your Responsibility

Remember: **YOU are responsible for everything you publish or submit.**

AI is a tool - like a calculator or spell-checker.
The final work and its consequences are YOURS.

## 🎯 Reflection

Think about:
1. When would you disclose AI use at work?
2. What types of information would you never share with AI?
3. How can you add value beyond what AI provides?', 3, 15),

  (v_mod4_id, 'Congratulations! What''s Next?', '# Congratulations! You''re Now AI-Ready! 🎉

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
- ⚡ Work more efficiently

## What''s Next?

### Keep Practicing
The more you use AI, the better you''ll get at it.
Try using Claude for something new every day!

### Advanced Learning (Optional)

When you''re ready, consider:
- **Claude Desktop Mastery** - Learn to use Claude''s desktop app with powerful integrations
- Connect Claude to GitHub, databases, and more!

## Your Challenge 🎯

This week, try using AI for:

**Monday:** Write an email you''ve been putting off
**Tuesday:** Learn about a topic that interests you
**Wednesday:** Brainstorm solutions to a problem
**Thursday:** Create a template for a repetitive task
**Friday:** Help a friend or colleague discover AI

## Thank You! 🙏

You''ve taken an important first step into the AI era.

Remember:
- AI doesn''t replace you - it amplifies you
- Start simple, then explore more
- The best way to learn is by doing

Welcome to your new AI-powered life! 🚀', 4, 10);

  RAISE NOTICE 'AI Foundations course created with 4 modules and 15 steps!';
  
END $$;

-- =====================================================
-- STEP 3: Load Claude Desktop Mastery Modules & Steps
-- =====================================================

DO $$
DECLARE
  v_class_id INTEGER;
  v_mod1_id INTEGER;
  v_mod2_id INTEGER;
  v_mod3_id INTEGER;
  v_mod4_id INTEGER;
BEGIN
  SELECT id INTO v_class_id FROM classes WHERE name = 'Claude Desktop Mastery';
  
  IF v_class_id IS NULL THEN
    RAISE NOTICE 'Claude Desktop Mastery class not found, skipping...';
    RETURN;
  END IF;

  -- Clean existing data for this class
  DELETE FROM steps WHERE module_id IN (SELECT id FROM modules WHERE class_id = v_class_id);
  DELETE FROM modules WHERE class_id = v_class_id;

  -- MODULE 1: Getting Started
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'Getting Started with Claude Desktop', 'Download, install, and set up Claude Desktop on your computer', 1, true)
  RETURNING id INTO v_mod1_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
  (v_mod1_id, 'Why Claude Desktop?', '# Why Use Claude Desktop? 🖥️

## The Upgrade from Claude.ai

You''ve been using Claude.ai in your browser. Now let''s level up!

### Claude Desktop Can:

🗂️ **Access Your Files**
- Read documents on your computer
- Work with multiple files at once
- No more copy-pasting!

🔌 **Connect to Tools**
- GitHub for code
- Databases for data
- And much more!

🚀 **Work Faster**
- Keyboard shortcuts
- Instant access
- Better for long work sessions

## Simple Comparison

| Feature | Claude.ai (Browser) | Claude Desktop |
|---------|---------------------|----------------|
| Use anywhere | ✅ Any device | ❌ Your computer only |
| Access local files | ❌ Upload only | ✅ Full access |
| Connect to tools | ❌ No | ✅ Yes! |

## What You''ll Learn

By the end of this course:
1. ✅ Install Claude Desktop
2. ✅ Connect to external tools (MCP)
3. ✅ Work with GitHub
4. ✅ Connect to ClassroomNeo!

## Prerequisites

- ✅ Completed **AI Foundations** course
- ✅ Anthropic account (same as claude.ai)
- ✅ About 1 hour for installation', 1, 10),

  (v_mod1_id, 'Installation (Step-by-Step)', '# Installing Claude Desktop 📥

## Step 1: Download

1. Open your browser
2. Go to: **claude.ai/download**
3. Click the download button for your system

---

## Step 2: Install

### 🍎 For Mac Users:

1. Find the downloaded file (usually in Downloads folder)
2. Double-click the `.dmg` file
3. A window opens - drag Claude to Applications
4. Done! Find Claude in your Applications folder

### 🪟 For Windows Users:

1. Find the downloaded `.exe` file
2. Double-click to run the installer
3. Follow the on-screen instructions
4. Click "Finish" when done
5. Find Claude in Start Menu

---

## Step 3: First Launch

1. Open Claude Desktop
2. Sign in with your Anthropic account
   - Same account you use for claude.ai!
3. You should see the chat interface

---

## Step 4: Quick Test

Type this to Claude:
```
Hello! Can you confirm Claude Desktop is working?
```

If Claude responds, you''re all set! 🎉

---

## ❓ Having Problems?

**Mac: "App can''t be opened"**
- Right-click the app → Open → Click "Open" again

**Windows: "Windows protected your PC"**
- Click "More info" → "Run anyway"

**Can''t sign in?**
- Make sure you have an Anthropic account
- Try signing in at claude.ai first

## ✅ Assignment

Take a screenshot showing Claude Desktop is open and working!', 2, 20),

  (v_mod1_id, 'Understanding the Interface', '# The Claude Desktop Interface 🎯

## Main Parts of the Screen

### 1. Sidebar (Left Side)
📂 **Conversations** - Your chat history
📁 **Projects** - Organize related chats
⚙️ **Settings** - Configuration options

### 2. Chat Area (Center)
💬 Where you talk to Claude
📎 Drag files here to share them

### 3. Input Box (Bottom)
⌨️ Type your messages here
📎 Click the paperclip to attach files

---

## Keyboard Shortcuts You''ll Love

### Mac Users:
| What | Shortcut |
|------|----------|
| New Chat | ⌘ + N |
| Settings | ⌘ + , |
| Search | ⌘ + K |

### Windows Users:
| What | Shortcut |
|------|----------|
| New Chat | Ctrl + N |
| Settings | Ctrl + , |
| Search | Ctrl + K |

---

## Try These Now!

### 1. Start a New Chat
Press the shortcut for new chat.

### 2. Open Settings
Press the shortcut for settings.
Look around - you''ll see options for:
- Appearance (dark/light mode)
- Model selection
- MCP Servers (we''ll learn this next!)

### 3. Drag a File
Find any document on your computer.
Drag it into the chat area.
Ask Claude: "What is this file about?"

---

## Pro Tips 💡

1. **Use Projects** to organize chats by topic
2. **Star important chats** for quick access
3. **Dark mode** is easier on the eyes at night

## ✅ You''re Ready!

Now you know your way around Claude Desktop.

Next up: **The Magic of MCP Servers!**', 3, 15);

  -- MODULE 2: MCP Servers
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'MCP - Connecting Claude to Tools', 'Learn how MCP lets Claude connect to external tools and services', 2, true)
  RETURNING id INTO v_mod2_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
  (v_mod2_id, 'What is MCP? (Simple Explanation)', '# What is MCP? 🔌

## Think of It Like a Universal Adapter

You know how you need different adapters for different countries?

MCP is like a **universal adapter** that lets Claude talk to many different tools!

---

## Without MCP:
```
You → Claude → Response
```
Claude can only chat.

## With MCP:
```
You → Claude → [MCP Adapter] → GitHub, Database, Files, etc.
```
Claude can DO things!

---

## Real Examples

### Example 1: File Access
**Without MCP:**
```
You: "Read the file project-notes.txt on my computer"
Claude: "I can''t access files on your computer."
```

**With MCP:**
```
You: "Read the file project-notes.txt on my computer"
Claude: "Here''s what''s in that file: ..."
```

### Example 2: GitHub
**Without MCP:**
```
You: "Commit this code to my repo"
Claude: "I can''t access GitHub."
```

**With MCP:**
```
You: "Commit this code to my repo"
Claude: "Done! I''ve committed the code."
```

---

## What MCP Servers Are Available?

🗂️ **Filesystem** - Read/write files on your computer
🐙 **GitHub** - Manage code repositories
🗄️ **Database** - Query databases
📁 **Google Drive** - Access cloud files
...and many more!

---

## How Hard Is It?

Setting up MCP requires:
1. Editing a configuration file (we''ll guide you!)
2. Installing Node.js (one-time setup)
3. Restarting Claude Desktop

It sounds technical, but we''ll break it down! 💪', 1, 15),

  (v_mod2_id, 'Installing Node.js (Required)', '# Installing Node.js 📦

## What is Node.js?

Think of it as a "translator" that helps MCP servers run on your computer.

You only need to install it once!

---

## 🍎 Mac Installation

### Option A: Download (Easiest)

1. Go to: **nodejs.org**
2. Click the **LTS** button (the one that says "Recommended")
3. Open the downloaded file
4. Follow the installer steps
5. Done!

### Option B: Using Terminal
```bash
brew install node
```

---

## 🪟 Windows Installation

1. Go to: **nodejs.org**
2. Click the **LTS** button
3. Open the downloaded `.msi` file
4. Click "Next" through the installer
5. ✅ Make sure "Add to PATH" is checked
6. Done!

---

## ✅ Verify Installation

### Mac:
1. Open **Terminal** (search for it in Spotlight)
2. Type: `node --version`
3. Press Enter
4. You should see something like: `v20.10.0`

### Windows:
1. Open **PowerShell** or **Command Prompt**
2. Type: `node --version`
3. Press Enter
4. You should see something like: `v20.10.0`

---

## ❓ Troubleshooting

**"command not found" or "not recognized":**
- Close Terminal/PowerShell and reopen it
- Or restart your computer
- Reinstall Node.js if needed

---

## 🎉 Great Job!

Node.js is now installed.

Next: We''ll create your first MCP configuration!', 2, 20),

  (v_mod2_id, 'Your First MCP Setup (File Access)', '# Setting Up File Access MCP 📂

Let''s give Claude access to a folder on your computer!

---

## Step 1: Find the Config Location

### 🍎 Mac:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**How to open it:**
1. Open **Finder**
2. Click **Go** menu → **Go to Folder**
3. Paste: `~/Library/Application Support/Claude/`
4. Press Enter

### 🪟 Windows:
```
%APPDATA%\\Claude\\claude_desktop_config.json
```

**How to open it:**
1. Press **Win + R**
2. Type: `%APPDATA%\\Claude`
3. Press Enter

---

## Step 2: Create a Test Folder

Create a new folder that Claude will access:

- Mac: `/Users/YOURNAME/ClaudeFiles`
- Windows: `C:\\Users\\YOURNAME\\ClaudeFiles`

Put a few test files in it!

---

## Step 3: Create/Edit the Config File

Open `claude_desktop_config.json` with a text editor.

### 🍎 Mac Config:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/YOUR_USERNAME/ClaudeFiles"
      ]
    }
  }
}
```

### 🪟 Windows Config:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/Users/YOUR_USERNAME/ClaudeFiles"
      ]
    }
  }
}
```

**Note:** Use forward slashes `/` on Windows too!

---

## Step 4: Restart Claude Desktop

- Mac: Press ⌘ + Q to quit, then reopen
- Windows: Right-click tray icon → Exit, then reopen

---

## Step 5: Test It!

Ask Claude:
```
Can you list the files in my ClaudeFiles folder?
```

If Claude shows your files, it worked! 🎉', 3, 30),

  (v_mod2_id, 'Troubleshooting MCP', '# MCP Troubleshooting Guide 🔧

## Common Issues & Fixes

### Problem 1: "MCP Server Failed to Start"

**Possible causes:**
- Node.js not installed correctly
- Wrong file path in config
- Typo in configuration

**Fixes:**
1. Verify Node.js: Open terminal, type `node --version`
2. Check your config file for typos
3. Make sure the folder path exists

---

### Problem 2: "Permission Denied"

**Mac Fix:**
1. System Preferences → Security & Privacy
2. Click "Privacy" tab
3. Select "Files and Folders"
4. Find Claude and check the boxes

**Windows Fix:**
1. Right-click Claude Desktop
2. Select "Run as Administrator"
3. Allow access when prompted

---

### Problem 3: Claude Says "I can''t access files"

**Checks:**
1. Did you restart Claude Desktop after editing config?
2. Is the folder path exactly correct?
3. Did you use the right slash direction?
   - Both Mac and Windows: Use forward slashes `/`

---

### Problem 4: Config File Errors

**JSON Syntax Rules:**
- Every `{` needs a matching `}`
- Every `[` needs a matching `]`
- Commas between items, not after the last one
- All text must be in `"quotes"`

**Use a JSON Validator:**
1. Go to: **jsonlint.com**
2. Paste your config
3. Click "Validate"
4. It will show any errors!

---

## Quick Checklist ✅

- [ ] Node.js installed and working
- [ ] Config file in correct location
- [ ] JSON syntax is valid
- [ ] Folder path exists
- [ ] Using forward slashes in paths
- [ ] Claude Desktop restarted after changes

---

## You''ve Got This! 💪

MCP setup is the hardest part of this course.

Once it works, everything else is easier!', 4, 15);

  -- MODULE 3: GitHub Integration
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'GitHub Integration', 'Connect Claude to GitHub for code management', 3, true)
  RETURNING id INTO v_mod3_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
  (v_mod3_id, 'Why Connect GitHub?', '# GitHub + Claude = Superpowers 🐙

## What Can Claude Do with GitHub?

### Reading (Looking at code)
- 📂 List your repositories
- 📄 Read file contents
- 🔍 Search your code
- 📋 View issues and pull requests

### Writing (Making changes)
- 📝 Create new files
- ✏️ Edit existing code
- 🌿 Create branches
- 📤 Push commits
- 🔀 Create pull requests

---

## Real Examples

### Example 1: Quick Code Check
```
You: "Show me the README file from my project-x repo"

Claude: "Here''s your README:
# Project X
This project is about..."
```

### Example 2: Create Something New
```
You: "Create a new file called utils.js with a 
function that formats dates"

Claude: "Done! I''ve created utils.js and pushed it to your repo."
```

---

## What You''ll Need

1. ✅ A GitHub account (free)
2. ✅ At least one repository
3. ✅ A Personal Access Token (we''ll create this)

---

## Important Note ⚠️

Connecting GitHub gives Claude access to:
- Read your code
- Make changes to your repositories

**Always review changes before merging to production!**', 1, 10),

  (v_mod3_id, 'Creating a GitHub Token', '# Creating Your GitHub Token 🔑

A token is like a special password that lets Claude access GitHub.

---

## Step 1: Go to GitHub Settings

1. Log into **github.com**
2. Click your profile picture (top right)
3. Click **Settings**

---

## Step 2: Find Developer Settings

1. Scroll down the left sidebar
2. Click **Developer settings** (at the very bottom)

---

## Step 3: Create Token

1. Click **Personal access tokens**
2. Click **Tokens (classic)**
3. Click **Generate new token** → **Generate new token (classic)**

---

## Step 4: Configure Token

**Note:** Give it a name like "Claude Desktop"

**Expiration:** Choose 90 days (or No expiration)

**Scopes (checkboxes):** Select these:
- ✅ **repo** (full control of repositories)
- ✅ **read:org** (read organization info)

---

## Step 5: Generate and SAVE!

Click **Generate token** at the bottom.

⚠️ **IMPORTANT:** Copy the token NOW!

It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**You will NEVER see this token again!**

Save it somewhere safe (password manager recommended)

---

## Quick Reference

```
GitHub.com
 → Profile → Settings
   → Developer settings
     → Personal access tokens
       → Tokens (classic)
         → Generate new token (classic)
           → Select: repo, read:org
             → Generate token
               → COPY AND SAVE IT!
```

---

## ✅ You''re Ready!

You now have a token.

Next: We''ll add GitHub to your Claude config!', 2, 15),

  (v_mod3_id, 'Connecting GitHub to Claude', '# Adding GitHub to Your Config 🔧

## Step 1: Open Your Config File

### Mac:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows:
```
%APPDATA%\\Claude\\claude_desktop_config.json
```

---

## Step 2: Add GitHub Server

Your config should now look like this:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/YOUR_USERNAME/ClaudeFiles"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

**Replace:**
- `YOUR_USERNAME` with your actual username
- `ghp_YOUR_TOKEN_HERE` with your actual GitHub token

---

## Step 3: Save and Restart

1. Save the config file
2. Quit Claude Desktop completely
3. Reopen Claude Desktop

---

## Step 4: Test It!

Ask Claude:
```
Can you list my GitHub repositories?
```

If Claude shows your repos, it worked! 🎉

---

## ❓ Common Issues

**"Bad credentials" error:**
- Check that your token is correct
- Make sure there are no extra spaces
- Token might have expired - create a new one

**JSON error:**
- Check for missing commas between servers
- Validate at jsonlint.com

---

## ✅ Success!

You''ve connected Claude to GitHub!

Try these commands:
- "List my repositories"
- "Show me the README from [repo-name]"
- "What are the open issues in [repo-name]?"', 3, 20);

  -- MODULE 4: Final Project
  INSERT INTO modules (class_id, title, description, order_number, is_active)
  VALUES (v_class_id, 'Final Project - ClassroomNeo Integration', 'Connect your Claude Desktop to ClassroomNeo!', 4, true)
  RETURNING id INTO v_mod4_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes) VALUES
  (v_mod4_id, 'What We''re Building', '# Your Final Project: ClassroomNeo Integration 🎓

## The Goal

Connect your Claude Desktop directly to ClassroomNeo!

This means Claude can:
- 📊 Check your course progress
- ✅ Mark steps as complete
- 📝 Submit assignments
- 📈 Track your learning

---

## Why This Matters

This project demonstrates:

1. **API Integration** - Connecting to web services
2. **Authentication** - Using API keys securely
3. **Real-world Use** - Practical automation
4. **Everything You''ve Learned** - MCP, config, troubleshooting

---

## What You''ll Need

1. ✅ Claude Desktop working
2. ✅ MCP servers configured
3. ✅ Your ClassroomNeo student API key
4. ✅ About 30 minutes

---

## How It Will Work

```
You: "What''s my progress in AI Foundations?"

Claude: "Here''s your progress:
- Module 1: Complete ✅
- Module 2: 75% complete
- Module 3: Not started
- Overall: 42% complete"

You: "Mark step 2.3 as complete"

Claude: "Done! Step 2.3 is now marked complete."
```

---

## Ready?

Let''s build this step by step!', 1, 10),

  (v_mod4_id, 'Getting Your API Key', '# Get Your ClassroomNeo API Key 🔑

## Step 1: Log Into ClassroomNeo

Go to: **classroom.neotodak.com**

Sign in with your account.

---

## Step 2: Find API Settings

1. Click your profile icon (top right)
2. Select **Settings** or **Profile**
3. Look for **API Keys** or **Claude Desktop Integration**

---

## Step 3: Generate Your Key

1. Click **Generate New API Key**
2. Give it a name: "My Claude Desktop"
3. Click **Create**

---

## Step 4: Copy Your Key

Your key looks like:
```
crn_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

⚠️ **IMPORTANT:**
- Copy it NOW - you won''t see it again!
- Keep it secret - treat it like a password
- One key per device

---

## What Your Key Can Do

✅ Read YOUR progress only
✅ Complete steps in YOUR enrolled classes
✅ Submit assignments for YOU
✅ Log activity for YOUR account

❌ Cannot access other students'' data
❌ Cannot modify class content

---

## Save Your Key Securely

Store it in:
- Password manager (recommended)
- Secure notes app
- NOT in plain text on desktop!

---

## ✅ Assignment

Generate your API key and save it securely.

You''ll need it in the next step!', 2, 15),

  (v_mod4_id, 'Configuring the Connection', '# Connect Claude Desktop to ClassroomNeo 🔌

## Step 1: Open Your Config File

### Mac:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows:
```
%APPDATA%\\Claude\\claude_desktop_config.json
```

---

## Step 2: Add ClassroomNeo Server

Add this to your `mcpServers` section:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/folder"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
      }
    },
    "classroomneo": {
      "command": "npx",
      "args": ["-y", "@broneotodak/classroomneo-mcp"],
      "env": {
        "CLASSROOMNEO_API_KEY": "crn_YOUR_KEY_HERE",
        "CLASSROOMNEO_URL": "https://classroom.neotodak.com"
      }
    }
  }
}
```

---

## Step 3: Restart Claude Desktop

1. Save the config file
2. Quit Claude Desktop completely
3. Reopen Claude Desktop

---

## Step 4: Test Connection

Ask Claude:
```
Check my ClassroomNeo connection status
```

You should see:
```
✅ Connected to ClassroomNeo!
Student: your-username
Enrolled Classes: 2
```

---

## Available Commands

Once connected, try:

- "Show my ClassroomNeo progress"
- "What''s my next incomplete step?"
- "Mark step 2.3 as complete"
- "Submit my assignment for this step"

---

## ✅ Assignment

Configure the MCP server and verify connection!', 3, 25),

  (v_mod4_id, 'Congratulations! 🎉', '# You Did It! 🎓🎉

## What You''ve Accomplished

You''ve gone from AI beginner to Claude Desktop power user!

### ✅ Skills Mastered:

1. **Claude Desktop Installation**
   - Downloaded and set up the app
   - Learned the interface

2. **MCP Configuration**
   - Installed Node.js
   - Created config files
   - Troubleshot issues

3. **File System Integration**
   - Claude can read your files
   - Work with documents locally

4. **GitHub Integration**
   - Created access tokens
   - Connected repositories
   - Managed code with Claude

5. **ClassroomNeo Integration**
   - API key setup
   - Progress tracking
   - Automated learning!

---

## You''re Now a Claude Power User! 🦸

You can:
- 🗂️ Work with files on your computer
- 🐙 Manage GitHub repositories
- 📊 Track your learning automatically
- 🔧 Configure and troubleshoot MCP
- 🚀 Extend Claude with new tools

---

## What''s Next?

### Continue Learning:
- Explore more MCP servers (Slack, databases, etc.)
- Build custom integrations
- Help others get started!

### Share Your Achievement:
- Download your course certificate
- Share on LinkedIn/social media

---

## Thank You! 🙏

You''ve invested time in learning this powerful tool.

Now go make amazing things with Claude! 🚀

---

## 🎯 Final Assignment

To complete this course:

1. Take a screenshot showing your ClassroomNeo progress via Claude Desktop
2. Submit it as proof of completion
3. Download your certificate!

**You''ve earned it!**', 4, 10);

  RAISE NOTICE 'Claude Desktop Mastery course created with 4 modules and 14 steps!';
  
END $$;

-- =====================================================
-- VERIFICATION: Check what was created
-- =====================================================

SELECT 
  c.id as class_id,
  c.name as class_name,
  COUNT(DISTINCT m.id) as modules,
  COUNT(s.id) as steps
FROM classes c
LEFT JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
GROUP BY c.id, c.name
ORDER BY c.id;

-- Show detailed breakdown
SELECT 
  c.name as class_name,
  m.order_number as mod_num,
  m.title as module_title,
  COUNT(s.id) as step_count
FROM classes c
JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
WHERE c.name IN ('AI Foundations', 'Claude Desktop Mastery')
GROUP BY c.name, m.order_number, m.title
ORDER BY c.name, m.order_number;
