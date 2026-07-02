// ============================================================
// Claude Code: Zero to Clauder — course content
// Loaded into the live classroom DB by tools/load-claude-code-course.js
// Content is markdown (rendered in-app via marked.js). Written for total
// beginners — plain English, one idea at a time.
// ============================================================

module.exports = {
  class: {
    name: 'Claude Code: Zero to Clauder',
    description:
      'Go from complete beginner to building and shipping real apps — just by talking to Claude Code. First understand how AI actually thinks, then install and supercharge Claude Code, then build real projects with it. No coding background needed.',
    is_active: true,
  },

  modules: [
    // ========================================================
    {
      slug: 'foundations',
      title: 'Foundations — How AI Actually Thinks',
      description:
        'Before you touch the tool, understand how AI thinks, remembers, and acts. This is what makes everything later click.',
      order_number: 1,
      steps: [
        {
          slug: 'what-is-an-llm',
          title: 'What is an LLM (an "AI")?',
          estimated_minutes: 8,
          content: `# What is an LLM?

You already use a tiny version of AI every day — the **autocomplete on your phone keyboard**.

## The phone keyboard
When you type, your keyboard guesses the *next word* you're likely to want. It learned from **your** messages, so it's small and personal — and often hilariously wrong.

## An LLM (a "large language model")
An LLM — the thing behind ChatGPT and Claude — works the **same way**, with two big differences:

- Instead of guessing the next word in **your sentence**, it guesses the next word in an **answer to you**.
- Instead of learning from just your texts, it learned from a huge slice of the world's writing — books, websites, and code.

So when you ask *"What's the capital of Malaysia?"*, it doesn't "look up" the answer. It predicts the answer one word at a time — "Kuala… Lumpur" — and because it read so much, those predictions are usually right and useful.

<div class="cc-demo" data-demo="autocomplete"></div>

## The one-line mental model
> Your phone guesses **your** sentence. An LLM guesses **the answer** — trained on the whole world.

That's it. Everything else in this course builds on this simple idea.`,
        },
        {
          slug: 'why-models-differ',
          title: 'Why models differ (parameters & families)',
          estimated_minutes: 8,
          content: `# Why there are so many AIs

Every LLM first "studies" — a stage called **pre-training** — using hundreds of billions of **parameters** (think of parameters as the tiny dials it tunes while learning). But each one is trained with a different recipe and goal, so each becomes good at different things.

## The main families
- **Anthropic — Claude.** Strong at reasoning and coding; great at long, careful work. Models like **Opus**, **Sonnet**, **Haiku**, and **Fable**. *This is what Claude Code runs on.*
- **OpenAI — GPT.** Creative and general-purpose; the brain behind ChatGPT.
- **Google — Gemini.** Strong multilingual and multimodal skills.
- **Meta — Llama** and **DeepSeek.** Open-source options you can even run yourself.

## What actually matters to you
You don't need to memorise model names. Just know:

- More (and better-organised) training generally means a smarter model.
- Different models have different strengths — for **building software**, Claude is the pick, which is why this course uses Claude Code.

> Rule of thumb: pick the model built for your job. For coding and shipping, that's Claude.`,
        },
        {
          slug: 'search-by-meaning',
          title: 'How AI searches by meaning',
          estimated_minutes: 9,
          content: `# Finding things by meaning, not words

How does an AI dig through a mountain of notes and pull out exactly the right one? It doesn't search for **matching words** — it searches for **matching meaning**.

## The trick: turn text into numbers
The AI converts every note into a list of numbers that captures its *meaning* (the technical name is an **embedding**, or a **vector**). You see a sentence; the AI sees its meaning as numbers.

Imagine a table of your notes:

| note | meaning (what the AI stores) |
|---|---|
| "Pay staff salaries this month" | [0.91, −0.12, 0.44, …] |
| "Service the car next week" | [0.05, 0.77, −0.31, …] |
| "Buy fertiliser for the garden" | [−0.50, 0.22, 0.60, …] |

## Why this is powerful
If you search *"when do I pay my workers?"*, a normal search finds nothing — none of those exact words appear. But a **meaning search** instantly returns the salary note, because the *idea* matches.

This is called **semantic search**, and it's how AI can remember and sift through huge amounts of information without getting lost.

<div class="cc-demo" data-demo="semantic-search"></div>

> You'll set this up yourself later (it's called **pgvector**) to give Claude a long-term memory.`,
        },
        {
          slug: 'chatbot-to-agent',
          title: 'From chatbot to agent (reasoning + tools)',
          estimated_minutes: 8,
          content: `# It's not just a chatbot anymore

Old AI could only **reply with text**. Modern AI can **think first, then use tools to do real work**.

## What that looks like
Ask it to *"help me launch a kebab stall online"* and a modern agent will:

1. **Think** and make a plan.
2. **Use tools** to carry it out:
   - search the web for popular kebab names,
   - generate a logo image,
   - build a website,
   - write the copy,
   - even make a short video ad.

Each of those is a **tool** the AI can pick up and use — not just talk about.

## Why this matters for you
This is the whole shift: from *"an AI that answers questions"* to *"an AI that gets things done."*

Claude Code takes this the furthest, because it lives on your computer and can use the real tools there — reading and writing files, running commands, and deploying your work.

<div class="cc-demo" data-demo="reason-act"></div>

> Mental model: **reason + act**. The more tools (skills) you give it, the more it can actually build.`,
        },
        {
          slug: 'context-window',
          title: 'Context windows — why AI forgets',
          estimated_minutes: 7,
          content: `# Why a long chat gets heavy

Every time the AI answers, it re-reads the **entire conversation from the start**. Everything it has to "hold in mind" at once is called the **context window**.

## The catch
- The longer you chat, the more the AI must carry each turn.
- What you *see* is only part of it — there's a lot of hidden reasoning behind each reply too.
- The context window has a **limit**. Fill it up and something has to give.

## Why you should care
This is *the* reason AI sometimes seems to "forget" what you said earlier in a very long session, or gets slower and less sharp.

<div class="cc-demo" data-demo="context-window"></div>

> Mental model: a longer conversation = a heavier load. Which is exactly why AI needs **memory outside the chat** — coming up next.`,
        },
        {
          slug: 'memory-md-files',
          title: 'Lasting memory — .md files',
          estimated_minutes: 9,
          content: `# Giving AI a memory that survives

The context window fills up and resets. So how does Claude remember your project tomorrow? It writes notes into **plain text files** on your disk — **markdown** (\`.md\`) files. A new session reads them back, and it "remembers."

## What a markdown file looks like
Markdown is just text with a few simple symbols:

\`\`\`markdown
# Project: Kebab Shop
**Owner:** Neo
**Budget:** RM20,000

## Decisions
- Name: "Kebab Neo"
- Open: July 2026
- Partner: Ali
\`\`\`

\`#\` makes a heading, \`**bold**\` makes bold, \`-\` makes a list. Humans and AI both read it easily — like a shared notebook.

## The files Claude Code uses
- **CLAUDE.md** — standing instructions: who the AI is, how to work, project context. Read automatically every session.
- **MEMORY.md** — an index: one short line per saved fact.
- **memory/*.md** — one file = one fact, pulled in when relevant.
- **Each project gets its own CLAUDE.md** — the "brain" for that project.

Markdown is universal — every AI writes its answers in it. But files like these are special because they **persist on disk** and get **re-read**, giving Claude memory across sessions.`,
        },
        {
          slug: 'why-claude-code',
          title: 'Why Claude Code',
          estimated_minutes: 8,
          content: `# Chatbot vs. IDE vs. coding agent

Most AIs are smart — the difference is **where they live** and **how much they can actually touch**.

## The spectrum of access
- **Chatbots** (ChatGPT, Claude on the web, Gemini): you chat, they reply with text. They **can't touch** the files, terminal, or projects on your machine.
- **In-app agents** (like some editors): they do work **inside their own app**.
- **Coding agents that live in your terminal** (**Claude Code**, and OpenAI's Codex): they live **right on your computer**. They read and write your files, run commands, and truly build and deploy real projects.

## Why we choose Claude Code
Because it sits closest to the real work. It doesn't just *describe* what to do — it **does it**, on your actual machine, using your real tools.

> This is why the whole course is built around Claude Code: it's the one that turns "talking to AI" into "shipping real things."

## Section recap
You now understand: what an LLM is, why models differ, meaning-search, reason+act, context limits, memory via \`.md\` files, and why Claude Code is the tool. Next: let's install it.`,
        },
      ],
    },

    // ========================================================
    {
      slug: 'install-claude-code',
      title: 'Install Claude Code',
      description:
        'From zero: subscribe, install, and get Claude Code running on your own machine.',
      order_number: 2,
      steps: [
        {
          slug: 'subscribe-pro',
          title: 'Step 1 — Subscribe to Claude Pro',
          estimated_minutes: 6,
          content: `# Get an account you can build with

Go to **[claude.ai](https://claude.ai)** (by Anthropic), create an account, and subscribe to at least **Pro** — that's the minimum plan that includes **Claude Code**.

## The plans, plainly
- **Free (USD 0)** — good for trying Claude in the browser, but the message limits are too low for real Claude Code work.
- **Pro (~USD 20/month)** — **includes Claude Code**, much higher limits, access to the strong models. *This is the minimum to follow this course.*
- **Max (higher tier)** — for heavy, all-day building.

Prices and limits change — always check the latest on claude.ai. There are also Team/Enterprise plans, and pay-as-you-go API credits, but for now: **Pro is all you need.**

> One decision: subscribe to Pro. Then come back here.`,
        },
        {
          slug: 'install-cli',
          title: 'Step 2 — Install Claude Code',
          estimated_minutes: 8,
          content: `# Install with one line

The easiest way is a single command. You don't need to install anything else first. Open your **Terminal** (macOS) or **PowerShell** (Windows), paste the line, and press Enter.

## macOS / Linux
\`\`\`bash
curl -fsSL https://claude.ai/install.sh | bash
\`\`\`

## Windows (PowerShell)
\`\`\`powershell
irm https://claude.ai/install.ps1 | iex
\`\`\`

When it finishes, type:

\`\`\`bash
claude
\`\`\`

…and Claude Code starts. It'll ask you to sign in with your Claude account the first time.

## Stuck?
If anything errors out, **don't panic — ask Claude itself**. Open Claude on the web and paste something like:

> "I ran the curl install for Claude Code on my Mac but got this error: ___. How do I fix it?"

Getting unstuck by asking the AI is a core Clauder skill. Get comfortable with it now.`,
        },
        {
          slug: 'fix-path',
          title: 'Step 3 — Fix your PATH',
          estimated_minutes: 7,
          content: `# When "claude" isn't found yet

Right after installing, typing \`claude\` sometimes gives an error like:

\`\`\`text
command not found: claude        # macOS/Linux
'claude' is not recognized...    # Windows
\`\`\`

This is normal. It just means your computer doesn't yet know **where** Claude Code was installed — a setting called your **PATH**.

## The fix (the Clauder way)
Take a **screenshot** of the error, open Claude on the web, and ask:

> "I installed Claude Code, but typing 'claude' says 'command not found'. Here's a screenshot of my terminal. How do I fix my PATH on [macOS / Windows]?"

Claude will give you the exact line to run for your system. Paste it, restart your terminal, and try \`claude\` again. You should see:

\`\`\`text
Claude Code
Ready. What are we building today?
\`\`\`

> The pattern to remember: **screenshot the problem → ask Claude → paste the fix.** You'll use this constantly.`,
        },
        {
          slug: 'setup-env',
          title: 'Step 4 — Set up your .env (secrets)',
          estimated_minutes: 8,
          content: `# One safe place for your keys

As you connect services later, you'll collect **keys and tokens** (like passwords for apps). Keep them all in one hidden file called **.env**, and let Claude Code read from there.

## Just ask Claude Code to make it
In the terminal, type this and press Enter:

> "Set up a file at .claude/.env to store my important keys and tokens, so you can use them across all my projects from now on."

## What ends up inside
\`\`\`bash
# one key per line: NAME=value
OPENAI_API_KEY=sk-••••••
GITHUB_TOKEN=ghp_••••••
NETLIFY_AUTH_TOKEN=nfp_••••••
SUPABASE_KEY=ey••••••
\`\`\`

## Three things to know
- **One home for secrets.** Claude reads keys from here instead of you pasting them into code.
- **It's hidden.** The name starts with a dot (\`.env\`), so it's normally hidden — but it's just a text file.
- **Never upload it.** Don't put it on the web or in Git. If it leaks, people can steal your keys. Add \`.env\` to your \`.gitignore\`. (Not sure how? Ask Claude.)

**Location:** macOS/Linux \`~/.claude/.env\` · Windows \`%USERPROFILE%\\.claude\\.env\``,
        },
        {
          slug: 'setup-knowledge-base',
          title: 'Step 5 — Set up your knowledge base',
          estimated_minutes: 8,
          content: `# Give your projects a tidy brain

Same idea as \`.env\` — just **ask Claude Code to build it**. Type this and press Enter:

> "Set up a tidy knowledge-base structure for my projects — one organised folder per project, each with a CLAUDE.md holding the plan, milestones, methods and key info for that project."

## What you get
\`\`\`text
.claude/
└─ knowledge/
   ├─ kebab-shop/
   │  ├─ CLAUDE.md
   │  ├─ planning.md
   │  └─ milestones.md
   └─ todak-website/
      ├─ CLAUDE.md
      └─ ideas.md
\`\`\`

## Why bother
- **Organised by project.** Easy for you to find, easy for Claude to understand what it's building.
- **A CLAUDE.md per project.** That project's "brain" — Claude reads it automatically when you open the project.
- **Not just markdown.** A knowledge base can include images, PDFs, and other files too — Claude Code can read the whole folder.

## Section recap
Claude Code is now **alive on your machine**: subscribed, installed, PATH fixed, secrets stored, knowledge base ready. Next, we turn it into a real teammate.`,
        },
      ],
    },

    // ========================================================
    {
      slug: 'supercharge',
      title: 'Supercharge Claude Code',
      description:
        'Upgrade Claude into a real teammate: lasting memory, real service access, and a clean working rhythm.',
      order_number: 3,
      steps: [
        {
          slug: 'api-mcp-cli',
          title: 'Three ways to give Claude power',
          estimated_minutes: 8,
          content: `# How you "plug in" new powers

Remember: modern AI can **reason + act** — the more skills you give it, the more powerful it gets. There are three ways to connect a service to Claude:

## 1. API — the official door
The standard way programs talk to each other: send a request (with a secret key), get data back. Almost every service has one — but it's raw, and usually needs code written around it.
*(API = Application Programming Interface.)*

## 2. MCP — plug-and-play for AI
A newer standard built **specifically for AI**. A service wraps its abilities as ready-made **tools** that Claude can see and call directly — no wrestling with raw APIs. Example: the Supabase MCP gives Claude ready tools to manage a database.
*(MCP = Model Context Protocol.)*

## 3. CLI — Claude Code's home advantage
Tools you type in the **terminal** — like \`gh\`, \`supabase\`, \`netlify\`. Because Claude Code **lives in the terminal**, it can run these itself, instantly, with no extra setup.
*(CLI = Command Line Interface.)*

> Mental model: **CLI is Claude Code's superpower** — it's already in the terminal, so every terminal tool becomes its tool.`,
        },
        {
          slug: 'give-claude-memory',
          title: 'Give Claude a lasting memory (Supabase + pgvector)',
          estimated_minutes: 10,
          content: `# A brain that survives every session

By default Claude Code forgets when you close a session. Let's give it a **permanent memory** using a free **Supabase** database plus **pgvector** (the meaning-search from Section 1).

## Set it up
1. **Sign up at [supabase.com](https://supabase.com)** — free, no credit card (you can use your GitHub account).
2. **Create an access token:** avatar → Account → Access Tokens → *Generate new token*. Name it \`claude-code\`, set **No expiry**. You'll get a key starting \`sbp_…\`.
3. **Hand it to Claude Code.** Copy the token once, then type:

> "Here's my Supabase access token: sbp_xxxx. Please save it safely in my .claude/.env."

4. **Ask Claude to build the memory system:**

> "Using my Supabase token in .claude/.env, set up a pgvector memory system. I want tools to save memories and to recall relevant memories automatically each session. Use gte-small for embeddings."

## What you just gained
- **Save + recall.** Claude stores important facts and pulls them back when relevant — it remembers you across sessions.
- **Recall by meaning.** It finds the right memory even if you phrase things differently.
- **Free to start.** \`gte-small\` is built into Supabase — no key, no cost. Upgrade later for more accuracy.`,
        },
        {
          slug: 'choose-embedding',
          title: 'Choose your embedding (free vs. power)',
          estimated_minutes: 8,
          content: `# The engine behind recall

An **embedding** is the engine that turns text into meaning-numbers. Better engine = more accurate memory. Here are the good 2026 options:

| Embedding | Cost | Needs a key? | Good for |
|---|---|---|---|
| **gte-small** (Supabase, built-in) | Free | No | Starting out — zero setup |
| **text-embedding-3-small** (OpenAI) | ~cheap | Yes | Standard upgrade — accurate, multilingual |
| **gemini-embedding-001** (Google) | Free | Google login | Free but powerful, great multilingual |
| **bge-m3** (Ollama, local) | Free | No (offline) | Privacy — runs on your own machine |

## What "dimensions" means
You'll see numbers like *384* or *1536* "dimensions." That's just **how many numbers describe each meaning**. More dimensions catch finer nuance (better recall) but take a little more storage.

## The recommendation
**Start with gte-small** (free, zero setup). Move up to OpenAI or Gemini when your memory grows large or recall starts missing things — especially if you work a lot in Malay.`,
        },
        {
          slug: 'connect-github',
          title: 'Connect GitHub (optional but smart)',
          estimated_minutes: 8,
          content: `# A safe home for your code

**GitHub** is like "Google Drive for code" — but smarter: it tracks **every change** you make. Optional, but strongly recommended.

## Why Clauders use it
- **Backup.** Your code is safe in the cloud, even if your laptop dies.
- **History.** Every change is recorded — undo or roll back anytime, fearlessly.
- **Collaboration.** People (and AI) can work on the same project without stepping on each other.

## Set it up (same pattern as before)
1. **Sign up at [github.com](https://github.com)** — free. Pick a username you'll keep.
2. **Make a token:** Settings → Developer settings → Personal access tokens → *Tokens (classic)* → Generate. Name it \`claude-code\`, scope \`repo\`, **No expiration**. You'll get \`ghp_…\`.
3. **Give it to Claude Code:**

> "Here's my GitHub token: ghp_xxxx. Please save it safely in my .claude/.env."

Now Claude can back up your code and manage versions for you — just ask.

> Notice the pattern for every service: **sign up → make a token → tell Claude to save it in .env → done.**`,
        },
        {
          slug: 'hosting-and-domains',
          title: 'Hosting & domains (Netlify + Cloudflare)',
          estimated_minutes: 9,
          content: `# Putting your site online

When your site is ready, you need two things: a **place to host it**, and a **name people can visit**.

## Netlify — hosting
Where your website "lives." Claude deploys straight from your code and you get a **live URL with automatic HTTPS**, fast worldwide (CDN), with a generous free tier. Change the code → the site updates itself.

- Sign up at [netlify.com](https://netlify.com) (free) → User settings → Applications → **Personal access tokens** → New token → name it \`claude-code\` → you get \`nfp_…\`.
- Tell Claude Code: *"Here's my Netlify token: nfp_xxxx. Save it in my .claude/.env."*

Now Claude can **deploy your site from the terminal** in one step.

## Cloudflare — domain & DNS (optional)
Points your own name (like \`yourname.com\`) at your Netlify site, and adds speed and protection (caching, SSL, DDoS defence).

- Sign up at [cloudflare.com](https://cloudflare.com), create an API token (start with the DNS-edit permission), and save it to \`.env\` the same way.

> The flow: buy a domain → point it with Cloudflare's DNS → host on Netlify. Start with just Netlify; add a domain when you're ready.`,
        },
        {
          slug: 'session-rituals',
          title: 'Session rituals (start & save)',
          estimated_minutes: 7,
          content: `# A simple rhythm every session

Two small habits keep Claude sharp and stop it losing your progress between sessions.

## Starting a session
Kick off a new project by making Claude **plan with you first** — don't let it rush into building:

> "I want to start a new project called [name]. Discuss the plan with me first — don't build anything until we agree."

Continuing old work?

> "I want to continue the [name] project. Let's discuss first — don't change anything yet."

## Ending a session
Before you stop, tell Claude to **save**, so tomorrow picks up where you left off:

> "Save this session — we'll continue later."

It stores what matters in both your **pgvector memory** and your **knowledge base**.

## The key ritual
> **Start → plan first, don't rush. End → save so you can continue.**

## Section recap
Claude is now fully equipped: lasting memory, real service access (Supabase, GitHub, Netlify, Cloudflare), and a clean working rhythm. Time to build.`,
        },
      ],
    },

    // ========================================================
    {
      slug: 'build-projects',
      title: 'Build Real Projects with Claude Code',
      description:
        'Organise your work so you and Claude always understand what you are building — then ship it.',
      order_number: 4,
      steps: [
        {
          slug: 'projects-folder',
          title: 'One home — the projects folder',
          estimated_minutes: 7,
          content: `# Keep everything under one roof

Before building anything, make one parent folder called **projects/**. Every new project becomes a subfolder inside it. Easy for you to find, easy for Claude to keep tidy.

\`\`\`text
~/Desktop/
└─ projects/                 ← parent folder
   ├─ kebab-shop/
   │  ├─ CLAUDE.md           ← the project's brain
   │  ├─ index.html
   │  └─ img/
   ├─ todak-website/
   │  ├─ CLAUDE.md
   │  └─ src/
   └─ budget-app/
      └─ CLAUDE.md
\`\`\`

## Just ask Claude to set it up
> "Create one parent folder called projects. From now on, whenever I start a new project, make a subfolder inside it with a tidy structure and its own CLAUDE.md."

- **One place for everything** — no files scattered across your Desktop.
- **Claude organises itself** — say "new project" and it knows where to put it.
- **A CLAUDE.md in each** — the project's brain, read automatically when opened.`,
        },
        {
          slug: 'two-types-of-web',
          title: 'Two kinds of web project',
          estimated_minutes: 9,
          content: `# Static site vs. web app

Know the difference before you start — they open and deploy differently.

## Plain HTML (a static site)
- **What:** just HTML + CSS + JavaScript files.
- **Open it:** double-click the file → it opens in your browser. No install, no "running."
- **Deploy:** upload the files — drag and drop to Netlify.
- **Use for:** landing pages, portfolios, slideshows, explainers.

## A web app (React, Next.js, Vite…)
- **What:** built on Node.js and a framework; has an "engine" that must run.
- **Open it:** you must \`npm install\` then \`npm run dev\` first, then visit \`localhost:3000\`.
- **Deploy:** it needs a **build** step and a host that understands it (Netlify build, Vercel, a server).
- **Use for:** apps with logins, databases, and server logic.

## Why the dev server exists
Modern tools write code the browser can't read directly (JSX, TypeScript). It has to be **built/compiled** first. \`npm run dev\` does that for you while you work, and auto-reloads on every change.

> Don't memorise this — just know which kind you're building, and let Claude handle the setup. If unsure, ask it.`,
        },
        {
          slug: 'plan-before-build',
          title: 'Plan before you build (planning.html)',
          estimated_minutes: 8,
          content: `# Agree on the plan first

Before writing any real code, ask Claude to build a **planning.html** — a living page where all your discussion, research, phases, milestones, and checklists are laid out visually. It's not the project itself; it's **interactive notes** you both share.

## Ask for it
> "Before we build, create a planning.html that lays out our discussion, research, phases, milestones and a checklist — make it visual and interactive."

## Why a page instead of a document
Because it can hold anything: images, diagrams, flowcharts, timers, charts, even maps. You **click and explore** the plan instead of reading a flat PDF.

- **You bring:** the idea, decisions, and taste.
- **Claude brings:** research, structure, and suggestions.
- **Together:** one plan you both understand before a single feature is built.

> Alive, not on paper: you and the AI stay on the same page — literally.`,
        },
        {
          slug: 'beyond-the-web',
          title: 'Beyond the web',
          estimated_minutes: 7,
          content: `# Not just websites

Claude Code isn't limited to web pages. From phone apps to physical hardware, it can help you build:

- **Web apps** — sites and apps in the browser, on any device.
- **Mobile apps** — real iOS and Android apps.
- **Desktop apps** — Windows (.exe) and macOS (.app).
- **Your own operating system** — yes, from scratch, if you're bold.
- **Hardware** — Raspberry Pi, Arduino and more, connected over USB.
- **And more** — IoT, robots, games, automations…

A couple of notes: iPhone and Mac apps may need Xcode (Apple's official tools), but you don't need it just to start. And if you plug in a device over USB, Claude Code can help program and control it directly.

> The point: once you can talk to Claude Code, the "what can I build?" list is enormous. Start small, then stretch.`,
        },
        {
          slug: 'keep-the-brain-clean',
          title: "Keep your AI's brain clean",
          estimated_minutes: 6,
          content: `# Maintenance matters

Your **memory** (pgvector) and **knowledge base** (.md files) are Claude's brain — and like any brain, they need a tidy-up now and then.

## Clean up regularly
Every so often, remove memories and notes that are:
- **Expired** — no longer true (old plans, changed decisions),
- **Redundant** — the same fact saved many times,
- **Contradictory** — two notes that disagree.

## Why
If you don't, Claude can get confused and **hallucinate** — confidently give you wrong information — because it's reading stale or conflicting notes.

## Just ask
> "Review my saved memories and knowledge base. Flag anything expired, duplicated, or contradictory, and suggest what to clean up."

> A clean brain is a reliable teammate. Do this monthly and Claude stays sharp.`,
        },
        {
          slug: 'you-are-a-clauder',
          title: "You're a Clauder now",
          estimated_minutes: 6,
          content: `# Congratulations — you're a Clauder

Today you opened a door most people haven't even found yet. This skill — understanding how AI thinks, and using Claude Code to actually **build** — is still rare.

AI didn't come to replace you. It came to **multiply you**. So go fast, go build, and make the things that used to be just ideas.

## What you've mastered
- **How AI thinks** — prediction, models, meaning-search, reason+act, context, memory.
- **Installing Claude Code** — subscribe, install, PATH, .env, knowledge base.
- **Supercharging it** — pgvector memory, API/MCP/CLI, GitHub, Netlify, Cloudflare, rituals.
- **Building for real** — tidy projects, planning, shipping, and keeping the brain clean.

## Where to go next
When you're ready to go further, explore building your own always-on AI assistant that lives 24/7 and can even delegate work back to Claude Code — projects like **OpenClaw** point the way.

What you learned here isn't just a tutorial — it's a real method. Now it's yours. Take it, adapt it, break it, and build your own way.

> The future belongs to those who dare to start — and you just did.`,
        },
      ],
    },
  ],

  // Two hands-on assignments, attached to specific step slugs, AI-graded.
  assignments: [
    {
      step_slug: 'setup-knowledge-base',
      title: 'Get Claude Code running',
      description:
        'Prove Claude Code is alive on your machine — installed, signed in, and ready.',
      instructions:
        'Install Claude Code, fix your PATH if needed, then start it and sign in. Take a screenshot of your terminal showing the Claude Code welcome ("Ready. What are we building today?") and upload it. In the text box, write one sentence about anything that tripped you up and how you solved it (bonus if you asked Claude itself).',
      max_score: 5,
      allow_file_upload: true,
      allow_url_submission: false,
      allowed_file_types: ['image/png', 'image/jpeg'],
      ai_grading_enabled: true,
      ai_grading_rubric:
        'Full marks if the screenshot shows Claude Code running (a Claude Code prompt/welcome in a terminal) AND the note describes a real step (install, PATH fix, or sign-in). Partial marks if only one is present or the screenshot is a generic terminal without Claude Code. Zero if unrelated. Be encouraging and beginner-friendly; if it falls short, say specifically what to add.',
    },
    {
      step_slug: 'you-are-a-clauder',
      title: 'Ship your first project',
      description:
        'Build something small and real with Claude Code, and put it online.',
      instructions:
        'Using Claude Code, build a small project (a one-page site is perfect) and deploy it to Netlify. Submit the live URL. In the text box, describe in a few sentences what you asked Claude for, what it built, and one thing you would improve next.',
      max_score: 5,
      allow_file_upload: false,
      allow_url_submission: true,
      allowed_file_types: null,
      ai_grading_enabled: true,
      ai_grading_rubric:
        'Full marks if a working live URL is submitted (a reachable deployed page) AND the description shows the student directed Claude Code and reflects on the result. Partial marks if the URL works but the reflection is thin, or the reflection is good but the URL is missing/broken. Zero if no real project. Reward effort and clear thinking over polish; give one concrete next step.',
    },
  ],
};
