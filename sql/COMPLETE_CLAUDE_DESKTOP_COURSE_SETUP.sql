 -- =====================================================
-- ClassroomNeo: Complete Setup for Claude Desktop Course
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Student API Infrastructure
-- =====================================================

-- Table for student API keys (Claude Desktop integration)
CREATE TABLE IF NOT EXISTS student_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Claude Desktop',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_api_keys_key ON student_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_student_api_keys_user ON student_api_keys(user_id);

-- RLS Policies for student_api_keys
ALTER TABLE student_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own API keys" ON student_api_keys;
CREATE POLICY "Users can view own API keys"
  ON student_api_keys FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own API keys" ON student_api_keys;
CREATE POLICY "Users can create own API keys"
  ON student_api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own API keys" ON student_api_keys;
CREATE POLICY "Users can update own API keys"
  ON student_api_keys FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own API keys" ON student_api_keys;
CREATE POLICY "Users can delete own API keys"
  ON student_api_keys FOR DELETE
  USING (user_id = auth.uid());

-- API Activity Log table
CREATE TABLE IF NOT EXISTS api_activity_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES student_api_keys(id),
  user_id UUID REFERENCES users_profile(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_activity_user ON api_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_activity_time ON api_activity_log(created_at);

ALTER TABLE api_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON api_activity_log;
CREATE POLICY "Users can view own activity"
  ON api_activity_log FOR SELECT
  USING (user_id = auth.uid());

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_student_api_key(p_user_id UUID, p_name TEXT DEFAULT 'Claude Desktop')
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  v_key := 'crn_' || encode(gen_random_bytes(16), 'hex');
  
  INSERT INTO student_api_keys (user_id, api_key, name)
  VALUES (p_user_id, v_key, p_name);
  
  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(p_api_key TEXT)
RETURNS TABLE (
  user_id UUID,
  github_username TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.user_id,
    u.github_username,
    true as is_valid
  FROM student_api_keys k
  JOIN users_profile u ON k.user_id = u.id
  WHERE k.api_key = p_api_key
    AND k.is_active = true;
    
  UPDATE student_api_keys 
  SET last_used_at = NOW(), usage_count = usage_count + 1
  WHERE api_key = p_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: Create Claude Desktop Mastery Class
-- =====================================================

-- Insert the new class
INSERT INTO classes (name, description, trainer_id, start_date, end_date, is_active)
SELECT 
  'Claude Desktop Mastery',
  'Master Claude Desktop with MCP servers, extensions, and integrations. Learn to build powerful AI-assisted workflows for web development. Final project: Connect your Claude Desktop to ClassroomNeo!',
  id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days',
  true
FROM users_profile 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 3: Insert Modules and Steps
-- =====================================================

DO $$
DECLARE
  v_class_id INTEGER;
  v_mod1_id INTEGER;
  v_mod2_id INTEGER;
  v_mod3_id INTEGER;
  v_mod4_id INTEGER;
  v_mod5_id INTEGER;
  v_mod6_id INTEGER;
BEGIN
  -- Get the class ID
  SELECT id INTO v_class_id FROM classes WHERE name = 'Claude Desktop Mastery';
  
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Class not found!';
  END IF;

  -- MODULE 1: Introduction to Claude Desktop
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (v_class_id, 'Introduction to Claude Desktop', 'Understanding Claude Desktop architecture and capabilities across different operating systems', 1, 'intro-claude-desktop')
  RETURNING id INTO v_mod1_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod1_id, 'What is Claude Desktop?', '# What is Claude Desktop?

Claude Desktop is Anthropic''s native application that brings Claude AI directly to your computer with powerful local capabilities.

## Why Claude Desktop?

- **Local File Access**: Read and work with files on your computer
- **MCP Protocol**: Connect to external tools and services
- **Extended Context**: Longer conversations with better memory
- **Privacy**: Some processing stays local
- **Integrations**: GitHub, databases, APIs, and more

## Desktop vs Web

| Feature | Claude.ai (Web) | Claude Desktop |
|---------|-----------------|----------------|
| File Access | Upload only | Full local access |
| MCP Servers | Limited | Full support |
| External Tools | No | Yes |
| Offline Work | No | Partial |

## What You''ll Learn

By the end of this course, you''ll be able to:
1. Configure Claude Desktop for your OS
2. Install and manage MCP servers
3. Connect to GitHub, Netlify, and databases
4. Build automated workflows
5. **Connect Claude Desktop to this classroom!**', 1, 20, 'what-is-claude-desktop'),

  (v_mod1_id, 'Installation Guide (Choose Your OS)', '# Installing Claude Desktop

## 🍎 MacOS Installation

1. **Download**: Visit [claude.ai/download](https://claude.ai/download)
2. **Install**: Open the `.dmg` file and drag to Applications
3. **First Launch**: Open from Applications folder
4. **Sign In**: Use your Anthropic account

### MacOS-Specific Features
- Native Apple Silicon support (M1/M2/M3)
- Spotlight integration
- Homebrew package management for MCP servers
- Terminal/zsh integration

## 🪟 Windows Installation

1. **Download**: Visit [claude.ai/download](https://claude.ai/download)
2. **Install**: Run the `.exe` installer
3. **First Launch**: Find in Start Menu
4. **Sign In**: Use your Anthropic account

### Windows-Specific Features
- PowerShell integration
- WSL2 support for Linux tools
- Windows Terminal compatibility
- Chocolatey/Scoop for package management

## ✅ Verification

After installation, verify by:
1. Opening Claude Desktop
2. Checking Settings → About for version
3. Testing a simple conversation

**Assignment**: Screenshot your Claude Desktop About page and share!', 2, 30, 'installation-guide'),

  (v_mod1_id, 'Understanding the Interface', '# The Claude Desktop Interface

## Main Components

### 1. Conversation Panel
- Where you chat with Claude
- Supports markdown, code blocks, images
- Drag & drop files directly

### 2. Sidebar
- **Conversations**: Your chat history
- **Projects**: Organize related chats
- **Settings**: Configuration options

### 3. Input Area
- Text input with @ mentions
- File attachment button
- Voice input (if enabled)

## Keyboard Shortcuts

| Action | MacOS | Windows |
|--------|-------|--------|
| New Chat | ⌘ + N | Ctrl + N |
| Settings | ⌘ + , | Ctrl + , |
| Search | ⌘ + K | Ctrl + K |

## Pro Tips

1. **Use Projects** to organize by topic
2. **Pin important chats** for quick access
3. **Drag files** directly into the chat', 3, 25, 'understanding-interface');

  -- MODULE 2: MCP Servers
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (v_class_id, 'MCP Servers - The Power Core', 'Deep dive into Model Context Protocol (MCP) - the technology that makes Claude Desktop incredibly powerful', 2, 'mcp-servers')
  RETURNING id INTO v_mod2_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod2_id, 'What is MCP?', '# Model Context Protocol (MCP)

## The Game Changer

MCP (Model Context Protocol) is an open protocol that allows Claude to:
- **Read** from external data sources
- **Write** to external services
- **Execute** commands and scripts
- **Connect** to APIs and databases

## How MCP Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│   MCP Server    │────▶│ External Service│
│    (Client)     │◀────│   (Bridge)      │◀────│ (GitHub, DB...)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Types of MCP Servers

1. **File System** - Read/write local files
2. **Database** - Query PostgreSQL, SQLite, etc.
3. **API Connectors** - GitHub, Slack, etc.
4. **Custom Tools** - Build your own!

## Why This Matters

Without MCP: Claude can only chat
With MCP: Claude becomes your **AI-powered assistant** that can:
- Commit code to GitHub
- Deploy to Netlify
- Query your database
- And much more!', 1, 30, 'what-is-mcp'),

  (v_mod2_id, 'MCP Configuration (MacOS)', '# MCP Configuration for MacOS 🍎

## Configuration File Location

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

## Creating Your First Config

### Step 1: Open Terminal
```bash
mkdir -p ~/Library/Application\\ Support/Claude
nano ~/Library/Application\\ Support/Claude/claude_desktop_config.json
```

### Step 2: Basic Config Structure
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/YOUR_USERNAME/Projects"
      ]
    }
  }
}
```

### Step 3: Prerequisites
```bash
brew install node
node --version
npm --version
```

### Step 4: Restart Claude Desktop
- Quit completely (⌘ + Q)
- Reopen from Applications

## Verify MCP is Working

Ask Claude: "Can you list the files in my Projects folder?"

**Assignment**: Configure filesystem MCP and screenshot Claude listing your files!', 2, 45, 'mcp-config-macos'),

  (v_mod2_id, 'MCP Configuration (Windows)', '# MCP Configuration for Windows 🪟

## Configuration File Location

```
%APPDATA%\\Claude\\claude_desktop_config.json
```

Or typically:
```
C:\\Users\\YOUR_USERNAME\\AppData\\Roaming\\Claude\\claude_desktop_config.json
```

## Creating Your First Config

### Step 1: Open PowerShell
```powershell
cd $env:APPDATA\\Claude
New-Item -ItemType Directory -Force -Path $env:APPDATA\\Claude
notepad claude_desktop_config.json
```

### Step 2: Basic Config Structure
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\\\Users\\\\YOUR_USERNAME\\\\Projects"
      ]
    }
  }
}
```

**⚠️ Windows Note**: Use double backslashes `\\\\` in paths!

### Step 3: Prerequisites
```powershell
choco install nodejs
node --version
```

### Step 4: Restart Claude Desktop
- Close from System Tray
- Reopen from Start Menu

**Assignment**: Configure filesystem MCP and screenshot Claude listing your files!', 3, 45, 'mcp-config-windows'),

  (v_mod2_id, 'Managing Multiple MCP Servers', '# Multi-Server MCP Configuration

## Adding Multiple Servers

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@host:5432/db"
      }
    }
  }
}
```

## Server Categories

### 🔧 Development
- filesystem, github, git

### 🗄️ Databases
- postgres, sqlite, supabase

### 🚀 Deployment
- netlify, vercel

## Performance Tip

Only enable servers you need! Each server uses resources.', 4, 35, 'managing-mcp-servers');

  -- MODULE 3: GitHub Integration
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (v_class_id, 'GitHub Integration', 'Connect Claude Desktop to GitHub for powerful code management and collaboration', 3, 'github-integration')
  RETURNING id INTO v_mod3_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod3_id, 'Setting Up GitHub MCP', '# GitHub MCP Integration

## Prerequisites
- GitHub account
- Personal Access Token (PAT)

## Creating a GitHub PAT

1. Go to GitHub → Settings → Developer Settings
2. Click Personal Access Tokens → Tokens (classic)
3. Generate new token with scopes:
   - `repo` (full control)
   - `read:org`
   - `gist`

**⚠️ SAVE THIS TOKEN! You won''t see it again!**

## Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

## What Claude Can Do with GitHub

✅ List repositories
✅ View file contents
✅ Create repositories
✅ Push commits
✅ Create branches
✅ Open issues/PRs

**Assignment**: Connect GitHub and ask Claude to list your repos!', 1, 40, 'github-mcp-setup'),

  (v_mod3_id, 'Git Workflows with Claude', '# Git Workflows Powered by Claude

## Common Workflows

### 1. Code Review
```
You: "Review the latest PR in my project-name repo"
```

### 2. Create Feature Branch
```
You: "Create a new branch called feature/user-auth in my-app repo"
```

### 3. Commit Changes
```
You: "Commit the changes in /Projects/my-app with message Add login form"
```

## Real-World Example

```
You: "I need to fix a bug in my website. 
      1. Create a bugfix branch
      2. Look at the relevant files
      3. Suggest a fix
      4. Commit and create a PR"
```

Claude handles the entire workflow!

## Security Note

⚠️ Never share your PAT or config file
⚠️ Review all commits before pushing to production

**Assignment**: Have Claude create a branch, make a commit, and create a PR!', 2, 50, 'git-workflows');

  -- MODULE 4: Netlify Deployment
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (v_class_id, 'Netlify Deployment Integration', 'Deploy and manage websites directly from Claude Desktop using Netlify MCP', 4, 'netlify-integration')
  RETURNING id INTO v_mod4_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod4_id, 'Setting Up Netlify MCP', '# Netlify MCP Integration

## Prerequisites
- Netlify account
- Netlify Personal Access Token

## Getting Your Netlify Token

1. Login to [app.netlify.com](https://app.netlify.com)
2. Go to User Settings → Applications
3. Click New access token
4. Name it: Claude Desktop
5. Copy and save the token

## Configuration

```json
{
  "mcpServers": {
    "netlify": {
      "command": "npx",
      "args": ["-y", "netlify-mcp"],
      "env": {
        "NETLIFY_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Capabilities

✅ List all sites
✅ Create new sites
✅ Trigger deploys
✅ View deploy logs
✅ Manage environment variables

**Assignment**: Connect Netlify and list your sites!', 1, 35, 'netlify-mcp-setup'),

  (v_mod4_id, 'Deploy Workflow: Code to Live', '# Complete Deployment Workflow

## The Dream Workflow

```
Code → GitHub → Netlify → Live Site
          ↑
    Claude Desktop (orchestrates everything!)
```

## One-Shot Deployment

```
You: "Build a simple portfolio website with my projects,
      push it to a new GitHub repo called my-portfolio,
      and deploy it to Netlify."
```

Claude handles:
1. ✅ Creates HTML/CSS/JS files
2. ✅ Initializes git repo
3. ✅ Creates GitHub repository
4. ✅ Pushes code
5. ✅ Triggers Netlify deploy
6. ✅ Gives you the live URL!

## Environment Variables

```
You: "Set these env vars on my-site:
      - API_KEY: abc123
      - DATABASE_URL: postgres://..."
```

**Assignment**: Deploy a simple HTML page through this full workflow!', 2, 60, 'deploy-workflow');

  -- MODULE 5: Database Integration
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (v_class_id, 'Database Integration (Supabase & Neon)', 'Connect Claude Desktop to databases for full-stack development capabilities', 5, 'database-integration')
  RETURNING id INTO v_mod5_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod5_id, 'Supabase MCP Setup', '# Supabase Integration

## Why Supabase?

- PostgreSQL database
- Authentication built-in
- Real-time subscriptions
- Storage for files
- **FREE tier available!**

## Getting Credentials

1. Go to your Supabase project
2. Settings → API
3. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: `eyJhbG...` (keep secret!)

## MCP Configuration

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Capabilities

✅ Execute SQL queries
✅ Create/modify tables
✅ Insert/update/delete data
✅ Run migrations

**Assignment**: Connect Supabase and list your tables!', 1, 45, 'supabase-setup'),

  (v_mod5_id, 'Neon Database (Netlify DB)', '# Neon Database Integration

## What is Neon?

- Serverless PostgreSQL
- Auto-scaling
- Branching (like Git for databases!)
- Powers Netlify DB
- **Generous free tier**

## Netlify DB (Powered by Neon)

```bash
npx netlify db init
```

This auto-creates a Neon database connected to your Netlify site!

## MCP Configuration

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require"
      }
    }
  }
}
```

## Neon-Specific Features

### Database Branching
```
You: "Create a development branch of my production database"
```

**Assignment**: Set up Neon and create a test table!', 2, 40, 'neon-setup'),

  (v_mod5_id, 'Database Operations with Claude', '# Real Database Operations

## Natural Language → SQL

```
You: "Show me all users who signed up in the last 7 days, 
      ordered by signup date, with their total order count"

Claude: (generates and executes SQL automatically)
```

## Common Operations

### Schema Design
```
You: "Design a database schema for a blog with:
      - Posts (title, content, author)
      - Comments (text, author, post_id)
      - Tags (name)"
```

### Data Migration
```
You: "Migrate all users with role=basic to role=free_tier"
```

## Safety First! ⚠️

1. **Always review** before executing destructive queries
2. **Use transactions** for bulk operations
3. **Test on dev branch** (Neon branching!)

**Assignment**: Design and create a database schema using natural language!', 3, 50, 'database-operations');

  -- MODULE 6: Final Project
  INSERT INTO modules (class_id, title, description, order_number, slug)
  VALUES (v_class_id, 'Final Project - ClassroomNeo Integration', 'Build the ultimate integration: Connect your Claude Desktop to ClassroomNeo for automated learning tracking!', 6, 'final-project')
  RETURNING id INTO v_mod6_id;

  INSERT INTO steps (module_id, title, content, order_number, estimated_minutes, slug) VALUES
  (v_mod6_id, 'Understanding the ClassroomNeo API', '# ClassroomNeo Integration Architecture

## The Goal

Connect YOUR Claude Desktop to ClassroomNeo so that:
- Claude can check your learning progress
- Claude can mark steps complete
- Claude can submit assignments
- Claude can track your activity automatically!

## Architecture Overview

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Your Claude     │────▶│ ClassroomNeo    │────▶│    Supabase      │
│  Desktop         │◀────│ API (Edge Fn)   │◀────│    Database      │
└──────────────────┘     └─────────────────┘     └──────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/student/progress` | GET | Get your progress |
| `/api/student/complete` | POST | Mark step done |
| `/api/student/submit` | POST | Submit assignment |
| `/api/student/status` | GET | Check connection |

## Authentication

Each student gets a unique API key (crn_xxxxx) tied to their account.

**Next**: Generate your personal API key!', 1, 40, 'classroomneo-api'),

  (v_mod6_id, 'Generating Your API Key', '# Get Your Personal API Key

## 🎓 Access the Key Generator

1. Login to ClassroomNeo
2. Go to Dashboard → Settings
3. Click Claude Desktop Integration
4. Click Generate New API Key

## ⚠️ Important!

- **Copy your key immediately** - it won''t be shown again!
- **Keep it secret** - treat it like a password
- **One key per device** - generate new key for each machine

## Your Key Format

```
crn_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

- `crn_` = ClassRoomNeo prefix
- 32 character random string

## What Your Key Can Do

✅ Read YOUR progress only
✅ Complete steps in YOUR enrolled classes
✅ Submit assignments for YOU
✅ Log activity for YOUR account

❌ Cannot access other students data
❌ Cannot modify class content

**Assignment**: Generate your API key and save it securely!', 2, 30, 'generate-api-key'),

  (v_mod6_id, 'Configuring Claude Desktop for ClassroomNeo', '# Connect Claude Desktop to ClassroomNeo

## Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "classroomneo": {
      "command": "npx",
      "args": ["-y", "@classroomneo/mcp-server"],
      "env": {
        "CLASSROOMNEO_API_KEY": "crn_your_key_here",
        "CLASSROOMNEO_URL": "https://classroom.neotodak.com"
      }
    }
  }
}
```

## Available Commands

Once connected, Claude can:

```
You: "Show my ClassroomNeo progress"
You: "Mark step 2.3 as complete"
You: "Submit my assignment for Module 3"
You: "What is my next incomplete step?"
```

## Verify Connection

```
You: "Check my ClassroomNeo connection status"

Claude: ✅ Connected to ClassroomNeo!
        Student: your-github-username
        Enrolled Classes: 2
        Overall Progress: 45%
```

**Assignment**: Configure the MCP server and verify connection!', 3, 45, 'configure-mcp-classroomneo'),

  (v_mod6_id, 'Building Your Progress Dashboard', '# Build a Progress Dashboard

## Challenge

Create a dashboard that displays your ClassroomNeo progress.

## Requirements

1. **HTML/CSS/JS** - Simple static site
2. **Fetches from API** - Uses your API key
3. **Shows**:
   - Total progress percentage
   - List of enrolled classes
   - Completed vs total steps
   - Next step to complete

## Example Request

```javascript
const response = await fetch(
  "https://classroom.neotodak.com/api/student/progress",
  {
    headers: {
      "X-API-Key": "crn_your_key_here"
    }
  }
);
const data = await response.json();
```

## Deployment

1. Push to GitHub
2. Deploy to Netlify
3. Share your live URL!

**Assignment**: Build and deploy your dashboard!', 4, 60, 'build-dashboard'),

  (v_mod6_id, 'Final Challenge: Full Automation', '# 🏆 Final Challenge

## Prove Your Mastery!

Complete this automated workflow:

## Part 1: Setup Verification (20 pts)
- [ ] Claude Desktop connected to GitHub
- [ ] Claude Desktop connected to Netlify
- [ ] Claude Desktop connected to Supabase/Neon
- [ ] Claude Desktop connected to ClassroomNeo

## Part 2: Automated Progress Check (20 pts)
```
You: "Check my ClassroomNeo progress and tell me which 
     steps I haven''t completed yet in this course."
```

## Part 3: Code a Feature (30 pts)
```
You: "Build a simple dashboard that shows my ClassroomNeo 
     progress. Push it to GitHub and deploy to Netlify."
```

## Part 4: Automated Submission (30 pts)
```
You: "Submit my final project to ClassroomNeo:
     - GitHub repo: [your-repo-url]
     - Live site: [your-netlify-url]
     - Notes: Built entirely with Claude Desktop!"
```

## 🎉 Completion

When all parts are done:
1. Your submission will be AI-graded
2. You receive a completion certificate
3. You have proven Claude Desktop Mastery!

**Good luck! 🚀**', 5, 90, 'final-challenge');

  RAISE NOTICE 'Successfully created Claude Desktop Mastery course with all modules and steps!';
  
END $$;

-- =====================================================
-- VERIFICATION: Check what was created
-- =====================================================

SELECT 
  c.name as class_name,
  m.title as module_title,
  COUNT(s.id) as step_count
FROM classes c
JOIN modules m ON m.class_id = c.id
LEFT JOIN steps s ON s.module_id = m.id
WHERE c.name = 'Claude Desktop Mastery'
GROUP BY c.name, m.title, m.order_number
ORDER BY m.order_number;
