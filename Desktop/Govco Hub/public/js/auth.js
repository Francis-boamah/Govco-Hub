// auth.js - Local auth manager for GOVCO Hub
(function () {
  const userKey = 'govco_user_v1';
  const usersKey = 'govco_users_v1';

  function getStoredUsers() {
    return JSON.parse(localStorage.getItem(usersKey) || '[]');
  }

  function saveStoredUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(userKey) || 'null');
  }

  function setCurrentUser(user) {
    localStorage.setItem(userKey, JSON.stringify(user));
  }

  function clearCurrentUser() {
    localStorage.removeItem(userKey);
  }

  function updateUI(userProfile) {
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
      if (userProfile) {
        accountBtn.textContent = userProfile.name || userProfile.email.split('@')[0];
        accountBtn.onclick = () => {
          const confirmed = confirm(`Signed in as ${userProfile.name || userProfile.email}\nTap OK to sign out.`);
          if (confirmed) {
            clearCurrentUser();
            window.location.reload();
          }
        };
      } else {
        accountBtn.textContent = 'Account';
        accountBtn.onclick = () => {
          const authModal = document.getElementById('authModal');
          if (authModal) {
            authModal.classList.add('show');
          } else {
            window.location.href = 'auth.html';
          }
        };
      }
    }

    const sidebarUl = document.querySelector('#sidebar ul');
    if (sidebarUl) {
      const existingAdminLink = document.getElementById('adminSidebarLink');
      if (existingAdminLink) {
        existingAdminLink.remove();
      }

      if (userProfile && userProfile.isAdmin) {
        const li = document.createElement('li');
        li.id = 'adminSidebarLink';
        li.innerHTML = '<a href="admin.html" style="color: #ff9800; font-weight: bold;">Admin Panel</a>';
        sidebarUl.appendChild(li);
      }
    }
  }

  function loadCurrentUser() {
    const userProfile = getCurrentUser();
    updateUI(userProfile);
  }

  function initAuthForms() {
    const authModal = document.getElementById('authModal');
    const closeAuth = document.getElementById('closeAuth');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    if (closeAuth && authModal) {
      closeAuth.onclick = () => authModal.classList.remove('show');
    }

    if (signInForm) {
      signInForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = document.getElementById('siEmail').value.trim();
        const pass = document.getElementById('siPassword').value;
        const users = getStoredUsers();
        const account = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!account || account.password !== pass) {
          alert('Sign in failed: Invalid email or password.');
          return;
        }

        setCurrentUser(account);
        if (authModal) authModal.classList.remove('show');
        updateUI(account);
        alert('Signed in successfully!');
        if (window.location.pathname.endsWith('auth.html')) {
          window.location.href = 'index.html';
        }
      });
    }

    if (signUpForm) {
      signUpForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = document.getElementById('suName').value.trim();
        const house = document.getElementById('suHouse').value.trim();
        const room = document.getElementById('suRoom').value.trim();
        const phone = document.getElementById('suPhone').value.trim();
        const email = document.getElementById('suEmail').value.trim();
        const pass = document.getElementById('suPassword').value;

        if (!name || !email || !pass) {
          alert('Please complete all required fields.');
          return;
        }

        const users = getStoredUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          alert('A user with that email already exists.');
          return;
        }

        const profile = {
          name,
          email,
          house,
          room,
          phone,
          isAdmin: false,
          password: pass,
          createdAt: new Date().toISOString()
        };

        users.push(profile);
        saveStoredUsers(users);
        setCurrentUser(profile);

        if (authModal) authModal.classList.remove('show');
        updateUI(profile);
        alert('Account created successfully!');
        if (window.location.pathname.endsWith('auth.html')) {
          window.location.href = 'index.html';
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAuthForms();
      loadCurrentUser();
    });
  } else {
    initAuthForms();
    loadCurrentUser();
  }
})();