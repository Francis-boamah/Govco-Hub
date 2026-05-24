// admin.js
(function () {
  // Guard check for admin authentication
  if (!window.firebase) {
    console.error("Firebase is not loaded.");
    return;
  }

  const {
    auth,
    db,
    storage,
    onAuthStateChanged,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    orderBy,
    where,
    ref,
    uploadBytes,
    getDownloadURL,
    serverTimestamp
  } = window.firebase;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Access Denied: Please sign in first.");
      window.location.href = "index.html";
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || !snap.data().isAdmin) {
        alert("Access Denied: You do not have administrator permissions.");
        window.location.href = "index.html";
        return;
      }

      // User is verified admin!
      initAdminPanel();
    } catch (err) {
      console.error("Auth check failed:", err);
      alert("Auth verification failed. Redirecting...");
      window.location.href = "index.html";
    }
  });

  function initAdminPanel() {
    // 1. Manage Tabs
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        const target = btn.dataset.tab;
        document.getElementById(`${target}-tab`).classList.add("active");

        // Load relevant tab data
        if (target === "products") loadProducts();
        else if (target === "courses") loadCourses();
        else if (target === "orders") loadOrders();
        else if (target === "news") loadNews();
      });
    });

    // 2. Previews for Product Image upload
    const prodImage = document.getElementById("prodImage");
    const imagePreview = document.getElementById("imagePreview");
    if (prodImage && imagePreview) {
      prodImage.addEventListener("change", () => {
        const file = prodImage.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
          };
          reader.readAsDataURL(file);
        } else {
          imagePreview.innerHTML = "";
        }
      });
    }

    // Previews for News Banner Image upload
    const newsImage = document.getElementById("newsImage");
    const newsImagePreview = document.getElementById("newsImagePreview");
    if (newsImage && newsImagePreview) {
      newsImage.addEventListener("change", () => {
        const file = newsImage.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newsImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
          };
          reader.readAsDataURL(file);
        } else {
          newsImagePreview.innerHTML = "";
        }
      });
    }

    // 3. Products Operations
    const productForm = document.getElementById("productForm");
    if (productForm) {
      productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById("prodSubmitBtn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        const name = document.getElementById("prodName").value.trim();
        const category = document.getElementById("prodCategory").value;
        const price = parseFloat(document.getElementById("prodPrice").value);
        const meta = document.getElementById("prodMeta").value.trim();
        const imageFile = document.getElementById("prodImage").files[0];

        try {
          let imageUrl = null;
          if (imageFile) {
            const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const uploadSnap = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadSnap.ref);
          }

          await addDoc(collection(db, "products"), {
            name,
            category,
            price,
            meta,
            imageUrl,
            createdAt: serverTimestamp()
          });

          productForm.reset();
          if (imagePreview) imagePreview.innerHTML = "";
          alert("Product added successfully!");
          loadProducts();
        } catch (err) {
          console.error(err);
          alert("Failed to add product: " + err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = "Save Product";
        }
      });
    }

    // 4. Courses Operations
    const courseForm = document.getElementById("courseForm");
    if (courseForm) {
      courseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById("courseSubmitBtn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        const code = document.getElementById("courseCode").value.trim().toUpperCase();
        const level = document.getElementById("courseLevel").value;
        const semester = document.getElementById("courseSemester").value;
        const category = document.getElementById("courseCategory").value || null;
        const pdfUrl = document.getElementById("coursePdfUrl").value.trim();

        try {
          await addDoc(collection(db, "courses"), {
            code,
            level,
            semester,
            category,
            pdfUrl,
            createdAt: serverTimestamp()
          });

          courseForm.reset();
          alert("Course added successfully!");
          loadCourses();
        } catch (err) {
          console.error(err);
          alert("Failed to add course: " + err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = "Save Course";
        }
      });
    }

    // 5. News Operations
    const newsForm = document.getElementById("newsForm");
    if (newsForm) {
      newsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById("newsSubmitBtn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing...";

        const title = document.getElementById("newsTitle").value.trim();
        const body = document.getElementById("newsBody").value.trim();
        const imageFile = document.getElementById("newsImage").files[0];

        try {
          let imageUrl = null;
          if (imageFile) {
            const storageRef = ref(storage, `news/${Date.now()}_${imageFile.name}`);
            const uploadSnap = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadSnap.ref);
          }

          await addDoc(collection(db, "news"), {
            title,
            body,
            imageUrl,
            createdAt: serverTimestamp()
          });

          newsForm.reset();
          if (newsImagePreview) newsImagePreview.innerHTML = "";
          alert("News announcement posted successfully!");
          loadNews();
        } catch (err) {
          console.error(err);
          alert("Failed to publish news: " + err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = "Publish News";
        }
      });
    }

    // Initial Load of active tab
    loadProducts();
  }

  // Load Products list
  async function loadProducts() {
    const productList = document.getElementById("productList");
    if (!productList) return;
    productList.innerHTML = "<div>Loading products...</div>";
    try {
      const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      productList.innerHTML = "";
      if (snap.empty) {
        productList.innerHTML = "<div>No products found.</div>";
        return;
      }
      snap.forEach(docSnap => {
        const p = docSnap.data();
        const pId = docSnap.id;

        const item = document.createElement("div");
        item.className = "admin-item";

        const details = document.createElement("div");
        details.className = "admin-item-details";

        if (p.imageUrl) {
          details.innerHTML = `<img src="${p.imageUrl}" alt="product" />`;
        } else {
          details.innerHTML = `<div style="width:48px;height:48px;border-radius:4px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:10px;color:#777">No Image</div>`;
        }

        const info = document.createElement("div");
        info.className = "admin-item-info";
        info.innerHTML = `<h4>${p.name}</h4><p>${p.category} — GHS ${(p.price || 0).toFixed(2)} (${p.meta || ""})</p>`;
        details.appendChild(info);

        const actions = document.createElement("div");
        actions.className = "admin-item-actions";
        const delBtn = document.createElement("button");
        delBtn.className = "btn-delete";
        delBtn.textContent = "Delete";
        delBtn.onclick = async () => {
          if (confirm(`Are you sure you want to delete ${p.name}?`)) {
            await deleteDoc(doc(db, "products", pId));
            loadProducts();
          }
        };
        actions.appendChild(delBtn);

        item.appendChild(details);
        item.appendChild(actions);
        productList.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      productList.innerHTML = "<div>Error loading products.</div>";
    }
  }

  // Load Courses list
  async function loadCourses() {
    const courseList = document.getElementById("courseList");
    if (!courseList) return;
    courseList.innerHTML = "<div>Loading courses...</div>";
    try {
      const snap = await getDocs(query(collection(db, "courses"), orderBy("code", "asc")));
      courseList.innerHTML = "";
      if (snap.empty) {
        courseList.innerHTML = "<div>No courses found.</div>";
        return;
      }
      snap.forEach(docSnap => {
        const c = docSnap.data();
        const cId = docSnap.id;

        const item = document.createElement("div");
        item.className = "admin-item";

        const details = document.createElement("div");
        details.className = "admin-item-info";
        details.innerHTML = `<h4>${c.code}</h4><p>Level ${c.level}, Sem ${c.semester} ${c.category ? '— ' + c.category : ''}</p>
        <a href="${c.pdfUrl}" target="_blank" style="font-size: 11px; color:#2196f3; text-decoration:none">OneDrive Link</a>`;

        const actions = document.createElement("div");
        actions.className = "admin-item-actions";
        const delBtn = document.createElement("button");
        delBtn.className = "btn-delete";
        delBtn.textContent = "Delete";
        delBtn.onclick = async () => {
          if (confirm(`Delete course ${c.code}?`)) {
            await deleteDoc(doc(db, "courses", cId));
            loadCourses();
          }
        };
        actions.appendChild(delBtn);

        item.appendChild(details);
        item.appendChild(actions);
        courseList.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      courseList.innerHTML = "<div>Error loading courses.</div>";
    }
  }

  // Load News list
  async function loadNews() {
    const newsList = document.getElementById("newsList");
    if (!newsList) return;
    newsList.innerHTML = "<div>Loading announcements...</div>";
    try {
      const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
      newsList.innerHTML = "";
      if (snap.empty) {
        newsList.innerHTML = "<div>No news published.</div>";
        return;
      }
      snap.forEach(docSnap => {
        const n = docSnap.data();
        const nId = docSnap.id;

        const item = document.createElement("div");
        item.className = "admin-item";

        const details = document.createElement("div");
        details.className = "admin-item-details";
        if (n.imageUrl) {
          details.innerHTML = `<img src="${n.imageUrl}" alt="news" />`;
        } else {
          details.innerHTML = `<div style="width:48px;height:48px;border-radius:4px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:10px;color:#777">No Image</div>`;
        }

        const info = document.createElement("div");
        info.className = "admin-item-info";
        info.innerHTML = `<h4>${n.title}</h4><p>${n.body || ''}</p>`;
        details.appendChild(info);

        const actions = document.createElement("div");
        actions.className = "admin-item-actions";
        const delBtn = document.createElement("button");
        delBtn.className = "btn-delete";
        delBtn.textContent = "Delete";
        delBtn.onclick = async () => {
          if (confirm(`Delete news "${n.title}"?`)) {
            await deleteDoc(doc(db, "news", nId));
            loadNews();
          }
        };
        actions.appendChild(delBtn);

        item.appendChild(details);
        item.appendChild(actions);
        newsList.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      newsList.innerHTML = "<div>Error loading news.</div>";
    }
  }

  // Load Orders list
  async function loadOrders() {
    const ordersContainer = document.getElementById("ordersListContainer");
    if (!ordersContainer) return;
    ordersContainer.innerHTML = "<div>Loading orders...</div>";
    try {
      const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      ordersContainer.innerHTML = "";
      if (snap.empty) {
        ordersContainer.innerHTML = "<div>No orders have been placed yet.</div>";
        return;
      }

      for (const orderSnap of snap.docs) {
        const order = orderSnap.data();
        const orderId = orderSnap.id;

        // Fetch items subcollection
        const itemsSnap = await getDocs(collection(db, `orders/${orderId}/items`));
        const itemsList = [];
        itemsSnap.forEach(itemDoc => {
          itemsList.push(itemDoc.data());
        });

        const card = document.createElement("div");
        card.className = "order-card";

        // Header
        const header = document.createElement("div");
        header.className = "order-header";
        header.innerHTML = `<span class="order-id">#${orderId}</span>
        <span class="order-status ${order.status}">${order.status}</span>`;
        card.appendChild(header);

        // Customer & Delivery Info
        const infoRow = document.createElement("div");
        infoRow.className = "order-info-row";

        const customerCol = document.createElement("div");
        customerCol.className = "order-customer";
        customerCol.innerHTML = `<strong>Customer:</strong>
        <span>Name: ${order.customerName}</span>
        <span>Email: ${order.customerEmail}</span>
        <span>Phone: ${order.customerPhone}</span>`;

        const addressCol = document.createElement("div");
        addressCol.className = "order-address";
        addressCol.innerHTML = `<strong>Delivery:</strong>
        <span>House: ${order.house}</span>
        <span>Room: ${order.room}</span>
        <span>Notes: ${order.notes || "None"}</span>`;

        infoRow.appendChild(customerCol);
        infoRow.appendChild(addressCol);
        card.appendChild(infoRow);

        // Items List
        const itemsListDiv = document.createElement("div");
        itemsListDiv.className = "order-items-list";
        itemsList.forEach(item => {
          const itemRow = document.createElement("div");
          itemRow.className = "order-item-row";
          itemRow.innerHTML = `<span>${item.productName} x ${item.qty}</span>
          <span>GHS ${(item.unitPrice * item.qty).toFixed(2)}</span>`;
          itemsListDiv.appendChild(itemRow);
        });
        card.appendChild(itemsListDiv);

        // Footer Actions
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "order-actions";

        const totalSpan = document.createElement("span");
        totalSpan.className = "order-total";
        totalSpan.textContent = `Total: GHS ${(order.total || 0).toFixed(2)}`;

        const select = document.createElement("select");
        select.className = "order-status-select";
        const options = ["pending", "processing", "delivered"];
        options.forEach(opt => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
          if (order.status === opt) o.selected = true;
          select.appendChild(o);
        });

        select.onchange = async () => {
          const newStatus = select.value;
          try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
            alert("Order status updated successfully!");
            loadOrders();
          } catch (err) {
            alert("Failed to update status: " + err.message);
          }
        };

        actionsDiv.appendChild(totalSpan);
        actionsDiv.appendChild(select);
        card.appendChild(actionsDiv);

        ordersContainer.appendChild(card);
      }
    } catch (err) {
      console.error(err);
      ordersContainer.innerHTML = "<div>Error loading orders.</div>";
    }
  }
})();
