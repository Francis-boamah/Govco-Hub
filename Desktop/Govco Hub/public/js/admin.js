// admin.js - Admin panel backed by PHP APIs
(function () {
  const user = JSON.parse(localStorage.getItem('govco_user_v1') || 'null');

  if (!user || !user.isAdmin) {
    alert('Admin access required. Please sign in with an administrator account.');
    window.location.href = 'auth.html';
    return;
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read file.'));
      reader.readAsDataURL(file);
    });
  }

  function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((btn) => btn.classList.remove('active'));
        contents.forEach((content) => content.classList.remove('active'));

        button.classList.add('active');
        const target = button.dataset.tab;
        getElement(`${target}-tab`)?.classList.add('active');

        if (target === 'products') loadProducts();
        if (target === 'courses') loadCourses();
        if (target === 'orders') loadOrders();
        if (target === 'news') loadNews();
      });
    });
  }

  async function loadProducts() {
    try {
      const products = await window.govcoApi.fetchProducts();
      renderProductList(products);
    } catch (err) {
      console.error(err);
      alert('Unable to load products.');
    }
  }

  async function loadCourses() {
    try {
      const courses = await window.govcoApi.fetchCourses();
      renderCourseList(courses);
    } catch (err) {
      console.error(err);
      alert('Unable to load courses.');
    }
  }

  async function loadOrders() {
    try {
      const orders = await window.govcoApi.fetchOrders();
      renderOrderList(orders);
    } catch (err) {
      console.error(err);
      alert('Unable to load orders.');
    }
  }

  async function loadNews() {
    try {
      const news = await window.govcoApi.fetchNews();
      renderNewsList(news);
    } catch (err) {
      console.error(err);
      alert('Unable to load news items.');
    }
  }

  function renderProductList(products) {
    const list = getElement('productList');
    list.innerHTML = '';

    if (!products.length) {
      list.innerHTML = '<p>No products found.</p>';
      return;
    }

    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'admin-item';
      card.innerHTML = `
        <div class="item-data">
          <strong>${product.name}</strong>
          <span>${product.description || 'No description'}</span>
          <span>GHS ${parseFloat(product.price).toFixed(2)}</span>
        </div>
        <div class="item-actions">
          <button type="button" data-id="${product.id}" class="delete-product">Remove</button>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.delete-product').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this product permanently?')) return;
        try {
          await window.govcoApi.deleteProduct(btn.dataset.id);
          loadProducts();
        } catch (err) {
          console.error(err);
          alert('Failed to remove product.');
        }
      });
    });
  }

  function renderCourseList(courses) {
    const list = getElement('courseList');
    list.innerHTML = '';

    if (!courses.length) {
      list.innerHTML = '<p>No course entries found.</p>';
      return;
    }

    courses.forEach((course) => {
      const card = document.createElement('div');
      card.className = 'admin-item';
      card.innerHTML = `
        <div class="item-data">
          <strong>${course.course_code}</strong>
          <span>Level ${course.level} • Semester ${course.semester} ${course.category ? '• ' + course.category : ''}</span>
          <a href="${course.file_path}" target="_blank" rel="noreferrer">View file</a>
        </div>
        <div class="item-actions">
          <button type="button" data-id="${course.id}" class="delete-course">Remove</button>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.delete-course').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this course entry?')) return;
        try {
          await window.govcoApi.deleteCourse(btn.dataset.id);
          loadCourses();
        } catch (err) {
          console.error(err);
          alert('Failed to delete course entry.');
        }
      });
    });
  }

  function renderNewsList(newsItems) {
    const list = getElement('newsList');
    list.innerHTML = '';

    if (!newsItems.length) {
      list.innerHTML = '<p>No news items found.</p>';
      return;
    }

    newsItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'admin-item';
      card.innerHTML = `
        <div class="item-data">
          <strong>${item.title}</strong>
          <span>${item.body}</span>
          ${item.image_url ? `<img src="${item.image_url}" alt="News image" class="news-image" />` : ''}
        </div>
        <div class="item-actions">
          <button type="button" data-id="${item.id}" class="delete-news">Remove</button>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.delete-news').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this news item?')) return;
        try {
          await window.govcoApi.deleteNews(btn.dataset.id);
          loadNews();
        } catch (err) {
          console.error(err);
          alert('Failed to delete news item.');
        }
      });
    });
  }

  function renderOrderList(orders) {
    const container = getElement('ordersListContainer');
    container.innerHTML = '';

    if (!orders.length) {
      container.innerHTML = '<p>No orders found.</p>';
      return;
    }

    orders.forEach((order) => {
      const card = document.createElement('div');
      card.className = 'admin-order';
      card.innerHTML = `
        <div class="order-row"><strong>Order ID:</strong> ${order.id}</div>
        <div class="order-row"><strong>Name:</strong> ${order.customer_name}</div>
        <div class="order-row"><strong>Email:</strong> ${order.customer_email}</div>
        <div class="order-row"><strong>Phone:</strong> ${order.customer_phone}</div>
        <div class="order-row"><strong>Total:</strong> GHS ${parseFloat(order.total).toFixed(2)}</div>
        <div class="order-row"><strong>Status:</strong> ${order.status}</div>
        <div class="order-row"><strong>Placed:</strong> ${new Date(order.created_at).toLocaleString()}</div>
      `;
      container.appendChild(card);
    });
  }

  function attachImagePreview(inputId, previewId) {
    const input = getElement(inputId);
    const preview = getElement(previewId);

    if (!input || !preview) {
      return;
    }

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) {
        preview.innerHTML = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        preview.innerHTML = `<img src="${reader.result}" alt="Preview" />`;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    const submitBtn = getElement('prodSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const name = getElement('prodName').value.trim();
      const category = getElement('prodCategory').value;
      const price = getElement('prodPrice').value.trim();
      const description = getElement('prodMeta').value.trim();
      const imageFile = getElement('prodImage').files[0];

      const payload = { name, price, description: `${category} • ${description}` };
      if (imageFile) {
        payload.imageBase64 = await readFileAsDataUrl(imageFile);
      }

      await window.govcoApi.createProduct(payload);
      event.target.reset();
      getElement('imagePreview').innerHTML = '';
      loadProducts();
      alert('Product saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Unable to save product.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Product';
    }
  }

  async function handleCourseSubmit(event) {
    event.preventDefault();
    const submitBtn = getElement('courseSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const payload = {
        courseCode: getElement('courseCode').value.trim(),
        level: getElement('courseLevel').value,
        semester: getElement('courseSemester').value,
        category: getElement('courseCategory').value || '',
        pdfUrl: getElement('coursePdfUrl').value.trim(),
      };

      await window.govcoApi.createCourse(payload);
      event.target.reset();
      loadCourses();
      alert('Course entry added successfully.');
    } catch (err) {
      console.error(err);
      alert('Unable to save course entry.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Course';
    }
  }

  async function handleNewsSubmit(event) {
    event.preventDefault();
    const submitBtn = getElement('newsSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const imageFile = getElement('newsImage').files[0];
      const payload = {
        title: getElement('newsTitle').value.trim(),
        body: getElement('newsBody').value.trim(),
      };
      if (imageFile) {
        payload.imageBase64 = await readFileAsDataUrl(imageFile);
      }

      await window.govcoApi.createNews(payload);
      event.target.reset();
      getElement('newsImagePreview').innerHTML = '';
      loadNews();
      alert('News item published successfully.');
    } catch (err) {
      console.error(err);
      alert('Unable to publish news.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish News';
    }
  }

  function initForms() {
    const productForm = getElement('productForm');
    const courseForm = getElement('courseForm');
    const newsForm = getElement('newsForm');

    if (productForm) {
      productForm.addEventListener('submit', handleProductSubmit);
    }
    if (courseForm) {
      courseForm.addEventListener('submit', handleCourseSubmit);
    }
    if (newsForm) {
      newsForm.addEventListener('submit', handleNewsSubmit);
    }

    attachImagePreview('prodImage', 'imagePreview');
    attachImagePreview('newsImage', 'newsImagePreview');
  }

  function initAdminPanel() {
    initTabs();
    initForms();
    loadProducts();
    loadCourses();
    loadOrders();
    loadNews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
  } else {
    initAdminPanel();
  }
})();
