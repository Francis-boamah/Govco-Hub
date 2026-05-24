// past.js - Firestore courses + OneDrive links
(function(){
  const sidebar = document.getElementById('sidebar');
  if (document.getElementById('hamburger')) {
    document.getElementById('hamburger').addEventListener('click', ()=> sidebar.classList.add('show'));
  }
  if (document.getElementById('closeSidebar')) {
    document.getElementById('closeSidebar').addEventListener('click', ()=> sidebar.classList.remove('show'));
  }

  // Show/hide category selector based on level
  const levelSel = document.getElementById('levelSel');
  if (levelSel) {
    levelSel.addEventListener('change', function() {
      const level = this.value;
      const categoryContainer = document.getElementById('categoryContainer');
      
      if (level === '100') {
        categoryContainer.style.display = 'none';
      } else if (['200', '300', '400'].includes(level)) {
        categoryContainer.style.display = 'block';
      } else {
        categoryContainer.style.display = 'none';
      }
    });
  }

  // Check firebase
  if (!window.firebase) {
    console.error("Firebase is not loaded.");
    return;
  }

  const { db, collection, getDocs, query, where } = window.firebase;

  let loadedCoursesData = []; // Cache for local search filtering

  const loadBtn = document.getElementById('loadCourses');
  if (loadBtn) {
    loadBtn.addEventListener('click', async ()=>{
      const level = document.getElementById('levelSel').value;
      const semester = document.getElementById('semSel').value;
      const category = document.getElementById('categorySel')?.value;
      
      if (!level || !semester) {
        alert('Please select both level and semester');
        return;
      }

      if (level !== '100' && !category) {
        alert('Please select a category');
        return;
      }

      await loadCoursesFromFirestore(level, semester, category);
    });
  }

  async function loadCoursesFromFirestore(level, semester, category) {
    const list = document.getElementById('coursesList');
    list.innerHTML = '<div class="course-card">Loading courses...</div>';

    try {
      let q = query(
        collection(db, "courses"),
        where("level", "==", level),
        where("semester", "==", semester)
      );

      if (level !== '100' && category) {
        q = query(q, where("category", "==", category));
      }

      const snap = await getDocs(q);
      loadedCoursesData = [];

      list.innerHTML = '';
      
      if (snap.empty) {
        list.innerHTML = '<div class="course-card">No courses found for the selected criteria.</div>';
        return;
      }

      snap.forEach(docSnap => {
        const course = docSnap.data();
        course.id = docSnap.id;
        loadedCoursesData.push(course);
        renderCourseCard(course);
      });

    } catch (error) {
      console.error('Error loading courses:', error);
      list.innerHTML = '<div class="course-card">Error loading courses. Please try again.</div>';
    }
  }

  function renderCourseCard(course) {
    const list = document.getElementById('coursesList');
    
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'course-title';
    titleDiv.textContent = course.code;
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'course-meta';
    metaDiv.textContent = `Level ${course.level}, Semester ${course.semester}${course.category ? ', ' + course.category : ''}`;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'course-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-download';
    downloadBtn.innerHTML = '📥 Download PDF';
    
    const fileExists = !!course.pdfUrl;
    downloadBtn.disabled = !fileExists;
    
    if (!fileExists) {
      downloadBtn.title = 'File not available';
      downloadBtn.style.opacity = '0.6';
    } else {
      downloadBtn.onclick = (event) => {
        window.open(course.pdfUrl, '_blank');
        
        // Show download success feedback
        const target = event.currentTarget;
        const originalText = target.innerHTML;
        target.innerHTML = '✓ Opened!';
        target.style.background = 'linear-gradient(180deg, #4CAF50, #45a049)';
        
        setTimeout(() => {
          target.innerHTML = originalText;
          target.style.background = 'linear-gradient(180deg, #0ea5ff, #0a7fbf)';
        }, 2000);
      };
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'file-status';
    statusDiv.textContent = fileExists ? '✓ Available' : '✗ Not available';
    statusDiv.style.color = fileExists ? '#4CAF50' : '#f44336';
    statusDiv.style.fontSize = '12px';
    statusDiv.style.marginTop = '8px';
    
    actionsDiv.appendChild(downloadBtn);
    courseCard.appendChild(titleDiv);
    courseCard.appendChild(metaDiv);
    courseCard.appendChild(actionsDiv);
    courseCard.appendChild(statusDiv);
    
    list.appendChild(courseCard);
  }

  // Search functionality
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', ()=>{
      const queryVal = document.getElementById('searchInput').value.trim().toLowerCase();
      if (!queryVal) return;
      
      const filteredCourses = loadedCoursesData.filter(course => 
        course.code.toLowerCase().includes(queryVal)
      );
      
      const list = document.getElementById('coursesList');
      list.innerHTML = '';
      
      if (filteredCourses.length === 0) {
        list.innerHTML = '<div class="course-card">No courses found matching your search.</div>';
        return;
      }
      
      filteredCourses.forEach(course => {
        renderCourseCard(course);
      });
    });
  }

  // Load initial courses
  document.addEventListener('DOMContentLoaded', () => {
    // Set default category visibility
    const levelSel = document.getElementById('levelSel');
    if (levelSel) {
      const level = levelSel.value;
      const categoryContainer = document.getElementById('categoryContainer');
      if (categoryContainer) {
        categoryContainer.style.display = level === '100' ? 'none' : 'block';
      }
    }
    
    // Load initial courses if elements exist
    if (document.getElementById('loadCourses')) {
      document.getElementById('loadCourses').click();
    }
  });
})();