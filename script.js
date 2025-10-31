// Supabase Configuration
// ⚠️ IMPORTANT: Replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase client
let supabase = null;

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && 
           SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';
};

// Initialize Supabase if configured
if (isSupabaseConfigured() && window.supabase) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase connected successfully!');
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
    }
} else {
    console.log('⚠️ Supabase not configured. Add your credentials to script.js');
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Demo functionality
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const refreshButton = document.getElementById('refreshButton');
const messagesList = document.getElementById('messagesList');

// Load messages from Supabase
async function loadMessages() {
    if (!supabase) {
        messagesList.innerHTML = '<div class="error">⚠️ Supabase not configured. Please add your credentials to script.js</div>';
        return;
    }

    try {
        messagesList.innerHTML = '<div class="loading">Loading messages...</div>';
        
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
            messagesList.innerHTML = data.map(msg => `
                <div class="message-item">
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${formatDate(msg.created_at)}</div>
                </div>
            `).join('');
        } else {
            messagesList.innerHTML = '<div class="loading">No messages yet. Be the first to send one!</div>';
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesList.innerHTML = `<div class="error">Error loading messages: ${error.message}<br><br>Make sure you have:<br>1. Created a table named 'messages'<br>2. Added columns: id, content, created_at<br>3. Enabled Row Level Security with appropriate policies</div>`;
    }
}

// Send a new message to Supabase
async function sendMessage() {
    if (!supabase) {
        alert('⚠️ Supabase not configured. Please add your credentials to script.js');
        return;
    }

    const content = messageInput.value.trim();
    
    if (!content) {
        alert('Please enter a message!');
        return;
    }

    try {
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';

        const { data, error } = await supabase
            .from('messages')
            .insert([
                { content: content }
            ])
            .select();

        if (error) throw error;

        console.log('✅ Message sent:', data);
        messageInput.value = '';
        
        // Reload messages to show the new one
        await loadMessages();
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert(`Error sending message: ${error.message}\n\nMake sure you have enabled Row Level Security with INSERT policy.`);
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = 'Send Message';
    }
}

// Event listeners
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

if (refreshButton) {
    refreshButton.addEventListener('click', loadMessages);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Load messages when page loads
window.addEventListener('DOMContentLoaded', () => {
    if (supabase) {
        loadMessages();
        
        // Set up real-time subscription for new messages
        const channel = supabase
            .channel('messages-channel')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages' }, 
                (payload) => {
                    console.log('New message received:', payload);
                    loadMessages();
                }
            )
            .subscribe();
    }
});

// Add typing indicator animation
if (messageInput) {
    let typingTimer;
    messageInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        messageInput.style.borderColor = 'var(--primary-color)';
        typingTimer = setTimeout(() => {
            messageInput.style.borderColor = 'var(--border-color)';
        }, 500);
    });
}

