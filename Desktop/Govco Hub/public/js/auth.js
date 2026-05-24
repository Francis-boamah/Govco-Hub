// auth.js - Shared Firebase authentication and user profile sync
(function () {
  const userKey = "govco_user_v1";

  // Check if firebase is loaded
  if (!window.firebase) {
    console.error("Firebase config is not loaded. Please include firebase-config.js first.");
    return;
  }

  const {
    auth,
    db,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc,
    getDoc,
    setDoc
  } = window.firebase;

  // Update account button text and behavior
  function updateUI(userProfile) {
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
      if (userProfile) {
        accountBtn.textContent = userProfile.name || userProfile.email.split('@')[0];
        accountBtn.onclick = async (e) => {
          const confirmed = confirm(`Signed in as ${userProfile.name || userProfile.email}\nTap OK to sign out.`);
          if (confirmed) {
            try {
              await signOut(auth);
              localStorage.removeItem(userKey);
              window.location.reload();
            } catch (err) {
              alert("Error signing out: " + err.message);
            }
          }
        };
      } else {
        accountBtn.textContent = "Account";
        accountBtn.onclick = (e) => {
          const authModal = document.getElementById('authModal');
          if (authModal) {
            authModal.classList.add('show');
          } else {
            window.location.href = 'auth.html';
          }
        };
      }
    }

    // Update sidebar for admin users
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

  // Monitor auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let cached = localStorage.getItem(userKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.email === user.email) {
          updateUI(parsed);
        }
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const profile = snap.data();
          localStorage.setItem(userKey, JSON.stringify(profile));
          updateUI(profile);
        } else {
          // If Firestore profile doesn't exist, create a basic one
          const profile = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            house: "",
            room: "",
            phone: "",
            isAdmin: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, profile);
          localStorage.setItem(userKey, JSON.stringify(profile));
          updateUI(profile);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    } else {
      localStorage.removeItem(userKey);
      updateUI(null);
    }
  });

  // Attach submit listeners if forms are present on the current page
  function initAuthForms() {
    const authModal = document.getElementById('authModal');
    const closeAuth = document.getElementById('closeAuth');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    if (closeAuth && authModal) {
      closeAuth.onclick = () => authModal.classList.remove('show');
    }

    if (signInForm) {
      signInForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const email = document.getElementById('siEmail').value.trim();
        const pass = document.getElementById('siPassword').value;

        try {
          await signInWithEmailAndPassword(auth, email, pass);
          if (authModal) authModal.classList.remove('show');
          alert("Signed in successfully!");
          if (window.location.pathname.endsWith('auth.html')) {
            window.location.href = 'index.html';
          }
        } catch (err) {
          alert("Sign in failed: " + err.message);
        }
      });
    }

    if (signUpForm) {
      signUpForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const name = document.getElementById('suName').value.trim();
        const house = document.getElementById('suHouse').value.trim();
        const room = document.getElementById('suRoom').value.trim();
        const phone = document.getElementById('suPhone').value.trim();
        const email = document.getElementById('suEmail').value.trim();
        const pass = document.getElementById('suPassword').value;

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
          const user = userCredential.user;

          const profile = {
            name,
            email,
            house,
            room,
            phone,
            isAdmin: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", user.uid), profile);
          localStorage.setItem(userKey, JSON.stringify(profile));

          if (authModal) authModal.classList.remove('show');
          alert("Account created successfully!");
          if (window.location.pathname.endsWith('auth.html')) {
            window.location.href = 'index.html';
          }
        } catch (err) {
          alert("Sign up failed: " + err.message);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthForms);
  } else {
    initAuthForms();
  }
})();