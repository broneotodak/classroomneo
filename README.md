# 🎓 AI Classroom - Full Stack Development Tutorial

A comprehensive, interactive tutorial website that teaches students how to build, deploy, and scale modern web applications using **Cursor AI**, **GitHub**, **Netlify**, and **Supabase**.

![AI Classroom](https://img.shields.io/badge/Tutorial-Full%20Stack-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 What You'll Learn

This project demonstrates a complete workflow from development to deployment:

1. **Cursor AI Setup** - Learn to use AI-powered coding tools
2. **GitHub Integration** - Version control and collaboration
3. **Netlify Deployment** - Continuous deployment and hosting
4. **Supabase Integration** - Backend as a Service (BaaS)

## 🚀 Live Demo

The demo includes an interactive message board powered by Supabase that demonstrates real-time database operations.

## 📋 Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- A computer with internet access
- Willingness to learn!

## 🛠️ Getting Started

### 1. Clone this Repository

```bash
git clone https://github.com/yourusername/ClassroomNeo.git
cd ClassroomNeo
```

### 2. Set Up Supabase (Optional for Demo)

To enable the interactive demo:

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. In the SQL Editor, run this query:

```sql
-- Create messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read messages
CREATE POLICY "Allow public read access" ON messages
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert messages
CREATE POLICY "Allow public insert access" ON messages
  FOR INSERT
  WITH CHECK (true);
```

4. Get your API credentials from Settings → API
5. Update `script.js` with your credentials:

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Test Locally

Simply open `index.html` in your web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🌐 Deploy to Netlify

### Option 1: Deploy via Git (Recommended)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `.` (or root)
6. Click "Deploy site"

### Option 2: Drag and Drop

1. Go to [netlify.com](https://netlify.com)
2. Drag your project folder onto the deploy area
3. Your site will be live in seconds!

### Environment Variables (if using Supabase)

In Netlify dashboard:
1. Go to Site settings → Environment variables
2. Add your Supabase credentials (optional, for future server-side features)

## 📁 Project Structure

```
ClassroomNeo/
├── index.html          # Main HTML file with all sections
├── styles.css          # Complete styling with responsive design
├── script.js           # JavaScript for interactivity and Supabase
├── README.md           # This file
├── netlify.toml        # Netlify configuration
└── .gitignore          # Git ignore file
```

## 🎨 Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Smooth Scrolling** - Navigate seamlessly between sections
- **Interactive Demo** - Real-time message board with Supabase
- **Modern UI** - Beautiful gradients and animations
- **Step-by-Step Tutorials** - Clear instructions for each tool
- **Copy-Paste Ready** - Code examples you can use immediately

## 📖 Tutorial Sections

### 1. Cursor AI
- Installation and setup
- AI-powered features
- Keyboard shortcuts
- Best practices

### 2. GitHub
- Creating repositories
- Version control basics
- Pushing code
- Collaboration tips

### 3. Netlify
- Continuous deployment
- Custom domains
- Environment variables
- Form handling

### 4. Supabase
- Database setup
- Real-time features
- Authentication (coming soon)
- Row Level Security

## 🔐 Security Notes

- Never commit API keys to GitHub
- Use environment variables for sensitive data
- Enable Row Level Security in Supabase
- Use the anon key only for public operations

## 🤝 Contributing

This is an educational project. Feel free to:
- Fork the repository
- Make improvements
- Submit pull requests
- Share with students

## 📚 Additional Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [GitHub Guides](https://guides.github.com/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍🏫 For Teachers

This project is designed to be:
- **Self-contained** - Students can learn at their own pace
- **Hands-on** - Real deployments, not just theory
- **Modern** - Uses current industry tools
- **Free** - All services have generous free tiers

### Suggested Curriculum

1. **Week 1** - Cursor setup and basic web development
2. **Week 2** - Git and GitHub fundamentals
3. **Week 3** - Netlify deployment and CI/CD
4. **Week 4** - Supabase and database integration

## 🆘 Troubleshooting

### Supabase Connection Issues
- Check your URL and API key
- Verify Row Level Security policies
- Check browser console for errors

### Netlify Build Failures
- Ensure all files are committed to Git
- Check build logs for specific errors
- Verify file paths are correct

### CORS Errors
- Make sure Supabase URL is correct
- Check that RLS policies allow your operations

## 🎯 Learning Outcomes

After completing this tutorial, students will be able to:
- ✅ Use AI to accelerate development
- ✅ Manage code with Git and GitHub
- ✅ Deploy websites automatically with Netlify
- ✅ Build full-stack applications with Supabase
- ✅ Understand modern development workflows

## 💡 Next Steps

Want to extend this project? Try:
- Adding user authentication with Supabase Auth
- Implementing file uploads with Supabase Storage
- Creating a REST API with Supabase Edge Functions
- Adding real-time chat functionality
- Building a blog or portfolio site

## 📧 Contact

Created for educational purposes. Happy learning! 🚀

---

**Note**: This is a teaching tool. For production applications, implement proper security measures and follow best practices.

