// Authentication JavaScript

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    
    // If on login/signup page and user is logged in, redirect to dashboard
    if (currentUser && (window.location.pathname.includes('index.html') || window.location.pathname.includes('signup.html') || window.location.pathname.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }
});

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Store current user
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            errorDiv.textContent = 'Invalid email or password';
        }
    });
}

// Signup form handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('signupError');
        const successDiv = document.getElementById('signupSuccess');
        
        // Clear previous messages
        errorDiv.textContent = '';
        successDiv.textContent = '';
        
        // Validation
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            errorDiv.textContent = 'Email already exists';
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: password
        };
        
        // Add to users array
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message
        successDiv.textContent = 'Account created successfully! You can now login.';
        
        // Clear form
        signupForm.reset();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}
