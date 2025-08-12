// Authentication JavaScript

// Check if user is already logged in on page load
$(document).ready(function() {
    const currentUser = localStorage.getItem('currentUser');
    // If on login/signup page and user is logged in, redirect to dashboard
    if (currentUser && (window.location.pathname.includes('index.html') || window.location.pathname.includes('signup.html') || window.location.pathname.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }
});

// Login form handler
if ($('#loginForm').length) {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();
        const $errorDiv = $('#loginError');
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // Store current user
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            $errorDiv.text('Invalid email or password');
        }
    });
}

// Signup form handler
if ($('#signupForm').length) {
    $('#signupForm').on('submit', function(e) {
        e.preventDefault();
        const name = $('#signupName').val();
        const email = $('#signupEmail').val();
        const password = $('#signupPassword').val();
        const confirmPassword = $('#confirmPassword').val();
        const $errorDiv = $('#signupError');
        const $successDiv = $('#signupSuccess');
        // Clear previous messages
        $errorDiv.text('');
        $successDiv.text('');
        // Validation
        if (password !== confirmPassword) {
            $errorDiv.text('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            $errorDiv.text('Password must be at least 6 characters long');
            return;
        }
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            $errorDiv.text('Email already exists');
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
        $successDiv.text('Account created successfully! You can now login.');
        // Clear form
        $('#signupForm')[0].reset();
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}
