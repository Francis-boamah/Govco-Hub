// past.js - Past questions feature is currently unavailable without Firebase
(function(){
  const sidebar = document.getElementById('sidebar');
  if (document.getElementById('hamburger')) {
    document.getElementById('hamburger').addEventListener('click', ()=> sidebar.classList.add('show'));
  }
  if (document.getElementById('closeSidebar')) {
    document.getElementById('closeSidebar').addEventListener('click', ()=> sidebar.classList.remove('show'));
  }

  function showUnavailable() {
    const list = document.getElementById('coursesList');
    if (list) {
      list.innerHTML = '<div class="course-card">The past questions catalog is unavailable in this version.</div>';
    }

    const selectors = document.querySelector('.selectors');
    if (selectors) {
      selectors.style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', showUnavailable);
  if (document.readyState !== 'loading') {
    showUnavailable();
  }
})();