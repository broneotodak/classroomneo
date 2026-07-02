# 🎓 AI Classroom v2.0 - Full Stack Development Tutorial

A comprehensive, interactive tutorial platform with **GitHub OAuth authentication** and **progress tracking** that teaches students how to build, deploy, and scale modern web applications using **Claude Code**, **GitHub**, **Netlify**, and **Supabase**.

![AI Classroom](https://img.shields.io/badge/Tutorial-Full%20Stack-blue)
![Version](https://img.shields.io/badge/Version-2.0-green)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 What's New in v2.0

- ✅ **GitHub OAuth Authentication** - Sign in with your GitHub account
- ✅ **User Progress Tracking** - Track completion across all modules
- ✅ **Personalized Dashboard** - See your learning progress at a glance
- ✅ **Step-by-Step Learning** - Structured curriculum with clear milestones
- ✅ **Community Board** - Share your journey with other learners
- ✅ **Real-time Updates** - Progress synced across devices

## 🎯 Features

### For Students
- **Structured Learning Path** - Follow a clear, step-by-step curriculum
- **Progress Tracking** - See exactly where you are in your journey
- **Interactive Lessons** - Learn by doing with hands-on projects
- **Time Estimates** - Know how long each section will take
- **Resume Anytime** - Pick up exactly where you left off

### For Teachers
- **Student Analytics** - Track student progress through Supabase dashboard
- **Easy Content Management** - Update modules and steps in the database
- **GitHub Integration** - Students build their developer portfolio
- **Self-Paced Learning** - Students learn at their own speed

## 🚀 Quick Start

### Prerequisites
- A GitHub account
- A Supabase account (free tier works great!)
- Basic knowledge of HTML, CSS, and JavaScript

### Setup (5 minutes)

1. **Clone this repository**
   ```bash
   git clone https://github.com/broneotodak/classroomneo.git
   cd classroomneo
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL script in `SUPABASE_SETUP.sql`
   - Enable GitHub authentication
   - Copy your project URL and anon key

3. **Configure the app**
   - Open `config.js`
   - Add your Supabase URL and anon key

4. **Test locally**
   ```bash
   python3 -m http.server 8000
   ```
   Visit `http://localhost:8000`

For detailed setup instructions, see **[AUTH_SETUP.md](AUTH_SETUP.md)**

## 📁 Project Structure

```
ClassroomNeo/
├── index.html              # Main application HTML
├── styles.css              # Complete styling
├── config.js               # Configuration (add your credentials here)
├── auth.js                 # Authentication manager
├── progress.js             # Progress tracking manager
├── app.js                  # Main application logic
├── SUPABASE_SETUP.sql      # Database schema and initial data
├── AUTH_SETUP.md           # Complete authentication setup guide
├── README.md               # This file
├── netlify.toml            # Netlify configuration
└── .gitignore              # Git ignore rules
```

## 📚 Learning Modules

### 1. Claude Code Setup (45 min)
Learn to install and use your AI coding partner
- Install Claude Code
- Sign in and start your first session
- Create your first project by describing it in plain English
- Learn the core prompting workflow

### 2. GitHub Integration (60 min)
Master version control and collaboration
- Create GitHub account
- Install and configure Git
- Create repositories
- Push code to GitHub
- Collaboration workflows

### 3. Netlify Deployment (45 min)
Deploy your website with continuous deployment
- Sign up for Netlify
- Connect GitHub repository
- Configure build settings
- Deploy your site
- Custom domains

### 4. Supabase Backend (90 min)
Build a full-stack app with backend services
- Create Supabase project
- Design database schema
- Set up authentication
- Query your database
- Real-time features
- Row Level Security

## 🗄️ Database Schema

The platform uses Supabase (PostgreSQL) with the following tables:

- **`users_profile`** - Extended user information
- **`modules`** - Learning modules
- **`steps`** - Individual learning steps
- **`user_progress`** - Progress tracking per user
- **`messages`** - Community message board

All tables have Row Level Security (RLS) enabled for data protection.

## 🔐 Authentication Flow

1. User clicks "Sign in with GitHub"
2. Redirected to GitHub OAuth authorization
3. GitHub returns user to Supabase callback
4. Supabase creates user session
5. User profile automatically created via database trigger
6. User redirected to dashboard with active session

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Interface** - Clean, professional design
- **Smooth Animations** - Polished user experience
- **Progress Indicators** - Visual feedback on completion
- **Intuitive Navigation** - Easy to find and access content
- **Dark Mode Ready** - Color variables for easy theming

## 🌐 Deployment

### Deploy to Netlify

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy AI Classroom"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Import your GitHub repository
   - Deploy!

3. **Update GitHub OAuth**
   - Add your Netlify URL to GitHub OAuth app
   - Update callback URLs

See [AUTH_SETUP.md](AUTH_SETUP.md) for complete deployment instructions.

## 🔒 Security

### Best Practices Implemented
- ✅ Row Level Security (RLS) on all tables
- ✅ Secure authentication via Supabase Auth
- ✅ OAuth tokens never exposed to client
- ✅ API keys properly scoped (using anon key)
- ✅ Input validation and sanitization
- ✅ SQL injection protection via Supabase client

### What to Protect
- ⚠️ Never commit `service_role` key to Git
- ⚠️ Always use `anon` key in frontend code
- ⚠️ Keep RLS policies strict and tested
- ⚠️ Validate user input before database operations

## 🎓 For Teachers

### Customizing Content

1. **Add/Edit Modules**
   ```sql
   INSERT INTO modules (slug, title, description, order_number)
   VALUES ('new-module', 'New Module', 'Description', 5);
   ```

2. **Add/Edit Steps**
   ```sql
   INSERT INTO steps (module_id, slug, title, order_number, estimated_minutes)
   VALUES (1, 'new-step', 'New Step', 5, 15);
   ```

3. **View Student Progress**
   - Use the `user_progress_summary` view in Supabase
   - Export data for analytics
   - Track completion rates

### Analytics Queries

**See overall completion rates:**
```sql
SELECT 
  m.title,
  COUNT(DISTINCT up.user_id) as students_started,
  COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completions
FROM modules m
LEFT JOIN user_progress up ON up.module_id = m.id
GROUP BY m.id, m.title;
```

**See individual student progress:**
```sql
SELECT 
  u.email,
  m.title as module,
  COUNT(s.id) as total_steps,
  COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed
FROM users_profile u
CROSS JOIN modules m
LEFT JOIN steps s ON s.module_id = m.id
LEFT JOIN user_progress up ON up.user_id = u.id AND up.step_id = s.id
GROUP BY u.id, u.email, m.id, m.title;
```

## 🤝 Contributing

This is an educational project designed for teaching. Feel free to:
- Fork and modify for your own classes
- Submit improvements via pull requests
- Share feedback and suggestions
- Report bugs or issues

## 📖 Additional Resources

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [GitHub Guides](https://guides.github.com/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

## 🐛 Troubleshooting

### Common Issues

**"Supabase not configured"**
- Check that `config.js` has your credentials
- Verify credentials are correct

**"redirect_uri_mismatch"**
- Update GitHub OAuth callback URL
- Make sure it matches Supabase callback exactly

**Progress not saving**
- Check browser console for errors
- Verify you're signed in
- Check RLS policies in Supabase

**Can't sign in**
- Verify GitHub OAuth app is configured
- Check that redirect URLs are correct
- Ensure Supabase GitHub provider is enabled

See [AUTH_SETUP.md](AUTH_SETUP.md) for detailed troubleshooting.

## 📊 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vanilla JS** | No framework dependencies, easy to understand |
| **Supabase** | Authentication, database, real-time updates |
| **GitHub OAuth** | Secure authentication via GitHub |
| **Netlify** | Hosting and continuous deployment |
| **PostgreSQL** | Relational database via Supabase |

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Learning Outcomes

After completing AI Classroom, students will be able to:
- ✅ Use AI-powered tools to accelerate development
- ✅ Manage code with Git and GitHub
- ✅ Deploy websites automatically with CI/CD
- ✅ Build full-stack applications with authentication
- ✅ Design and implement database schemas
- ✅ Implement user authentication and authorization
- ✅ Track user data and analytics
- ✅ Follow security best practices

## 🚀 Roadmap

Planned features for future versions:
- [ ] Code editor integration for in-browser coding
- [ ] Automated code submission and review
- [ ] Badges and achievements system
- [ ] Leaderboards and challenges
- [ ] Video tutorial integration
- [ ] Multi-language support
- [ ] Mobile app version

## 💡 Philosophy

AI Classroom is built on these principles:
1. **Learn by Doing** - Hands-on practice, not just theory
2. **Real Tools** - Use industry-standard tools
3. **Progressive Complexity** - Start simple, build up gradually
4. **Track Progress** - Know where you are and where you're going
5. **Build Portfolio** - Every project adds to your GitHub profile

## 📧 Contact & Support

- **Project Repository**: [github.com/broneotodak/classroomneo](https://github.com/broneotodak/classroomneo)
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for educators and students learning full-stack development**

Version 2.0.0 - Now with user authentication and progress tracking!
