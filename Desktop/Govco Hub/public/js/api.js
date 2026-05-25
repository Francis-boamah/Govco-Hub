// api.js - GOVCO Hub PHP API helper
(function () {
  const API_BASE = '/api';

  async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const requestOptions = {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.headers || {}),
        'Accept': 'application/json',
      },
    };

    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, requestOptions);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `API request failed with status ${res.status}`);
    }
    return data;
  }

  window.govcoApi = {
    fetchProducts: async () => {
      const data = await apiFetch('/products');
      return data.products || [];
    },
    fetchProduct: async (productId) => {
      const data = await apiFetch(`/products/${encodeURIComponent(productId)}`);
      return data.product;
    },
    createOrder: async (payload) => {
      return apiFetch('/orders', { method: 'POST', body: payload });
    },
    fetchOrders: async () => {
      const data = await apiFetch('/orders');
      return data.orders || [];
    },
    createProduct: async (payload) => {
      return apiFetch('/products', { method: 'POST', body: payload });
    },
    deleteProduct: async (productId) => {
      return apiFetch(`/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
    },
    fetchCourses: async () => {
      const data = await apiFetch('/admin/courses');
      return data.courses || [];
    },
    createCourse: async (payload) => {
      return apiFetch('/admin/courses', { method: 'POST', body: payload });
    },
    deleteCourse: async (courseId) => {
      return apiFetch(`/admin/courses/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
    },
    fetchNews: async () => {
      const data = await apiFetch('/admin/news');
      return data.news || [];
    },
    createNews: async (payload) => {
      return apiFetch('/admin/news', { method: 'POST', body: payload });
    },
    deleteNews: async (newsId) => {
      return apiFetch(`/admin/news/${encodeURIComponent(newsId)}`, { method: 'DELETE' });
    }
  };
})();
