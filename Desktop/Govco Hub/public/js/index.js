// index.js
// Homepage behavior: sidebar, news and products rendering from Firestore, cart counter
(function(){
  // Utilities
  function $(sel){return document.querySelector(sel)}
  function drawPlaceholderSVG(container,width=72,height=72,label="No image"){
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns,"svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
    svg.innerHTML = `<rect width="${width}" height="${height}" rx="8" fill="#efefef"></rect>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${Math.floor(width/8)}" fill="#999">${label}</text>`;
    container.appendChild(svg);
  }

  const cartKey="govco_cart_v1";
  function getCart(){return JSON.parse(localStorage.getItem(cartKey)||'[]')}
  function setCart(c){localStorage.setItem(cartKey,JSON.stringify(c)); updateCounter()}

  function updateCounter(){
    const cnt = getCart().reduce((s,i)=>s+i.qty,0);
    const el = $('#cartCounter');
    if(el) {
      if(cnt>0){ el.style.display='inline-block'; el.textContent=cnt } else { el.style.display='none' }
    }
  }

  // sidebar
  const sidebar = $("#sidebar");
  if ($("#hamburger")) {
    $("#hamburger").addEventListener("click", ()=> sidebar.classList.add("show"));
  }
  if ($("#closeSidebar")) {
    $("#closeSidebar").addEventListener("click", ()=> sidebar.classList.remove("show"));
  }
  
  // Close sidebar when clicking outside
  document.addEventListener('click', (event) => {
      const sidebar = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      if (!sidebar || !hamburger) return;
      const isClickInsideSidebar = sidebar.contains(event.target);
      const isClickOnHamburger = hamburger.contains(event.target);
      const isSidebarVisible = sidebar.classList.contains('show');
      
      if (isSidebarVisible && !isClickInsideSidebar && !isClickOnHamburger) {
          sidebar.classList.remove('show');
          sidebar.setAttribute('aria-hidden', 'true');
      }
  });

  // Load news from Firestore
  async function loadNews() {
    const newsGrid = $("#newsGrid");
    if (!newsGrid) return;
    newsGrid.innerHTML = '<div>Loading news...</div>';

    try {
      const { db, collection, getDocs, query, orderBy, limit } = window.firebase;
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      
      newsGrid.innerHTML = '';
      if (snap.empty) {
        newsGrid.innerHTML = '<div>No news available at this time.</div>';
        return;
      }

      snap.forEach(docSnap => {
        const n = docSnap.data();
        const card = document.createElement('div');
        card.className = 'news-card';
        card.style.display = 'flex';
        card.style.gap = '12px';
        card.style.alignItems = 'center';
        
        const thumb = document.createElement('div'); 
        thumb.className = 'thumb';
        
        if (n.imageUrl) {
          const img = document.createElement('img');
          img.src = n.imageUrl;
          img.style.width = '72px';
          img.style.height = '72px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '8px';
          thumb.appendChild(img);
        } else {
          drawPlaceholderSVG(thumb, 72, 72, 'NEWS');
        }
        
        const contentWrap = document.createElement('div');
        contentWrap.style.display = 'flex';
        contentWrap.style.flexDirection = 'column';
        contentWrap.style.justifyContent = 'center';
        
        const h = document.createElement('div'); 
        h.textContent = n.title;
        h.style.fontWeight = 'bold';
        
        const body = document.createElement('div');
        body.textContent = n.body || '';
        body.style.fontSize = '12px';
        body.style.color = '#666';
        body.style.marginTop = '4px';

        contentWrap.appendChild(h);
        contentWrap.appendChild(body);

        card.appendChild(thumb); 
        card.appendChild(contentWrap);
        newsGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading news:", err);
      newsGrid.innerHTML = '<div>Error loading news.</div>';
    }
  }

  // Load products from Firestore
  async function loadProducts() {
    const productGrid = $("#productGrid");
    if (!productGrid) return;
    productGrid.innerHTML = '<div>Loading products...</div>';

    try {
      const { db, collection, getDocs, query, orderBy, limit } = window.firebase;
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(6));
      const snap = await getDocs(q);

      productGrid.innerHTML = '';
      if (snap.empty) {
        productGrid.innerHTML = '<div>No products in store.</div>';
        return;
      }

      snap.forEach(docSnap => {
        const p = docSnap.data();
        const pId = docSnap.id;

        const pc = document.createElement('div'); pc.className='product-card';
        const imgWrap = document.createElement('div'); imgWrap.className='img';
        
        if(p.imageUrl){ 
          const img = document.createElement('img'); 
          img.src = p.imageUrl; 
          img.style.maxWidth = '100%'; 
          img.style.maxHeight = '120px';
          img.style.objectFit = 'contain';
          imgWrap.appendChild(img);
        } else { 
          drawPlaceholderSVG(imgWrap,160,120,'IMG');
        }
        
        const name = document.createElement('div'); name.textContent = p.name;
        const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${p.meta || ''} — GHS ${(p.price || 0).toFixed(2)}`;
        const controls = document.createElement('div'); controls.className='controls';
        const qtyWrap = document.createElement('div'); qtyWrap.className='qty';
        const minus = document.createElement('button'); minus.textContent='-';
        const qty = document.createElement('span'); qty.textContent='1';
        const plus = document.createElement('button'); plus.textContent='+';
        minus.onclick = ()=> { qty.textContent = Math.max(1, parseInt(qty.textContent) - 1) };
        plus.onclick = ()=> { qty.textContent = parseInt(qty.textContent) + 1 };
        qtyWrap.appendChild(minus); qtyWrap.appendChild(qty); qtyWrap.appendChild(plus);

        const addBtn = document.createElement('button'); addBtn.className='add-cart'; addBtn.textContent='Add to cart';
        addBtn.onclick = ()=>{
          const cart = getCart();
          const cur = cart.find(it=>it.id===pId);
          const desired = parseInt(qty.textContent);
          if(cur){ cur.qty += desired } else { cart.push({ id:pId, qty:desired }) }
          setCart(cart);
          addBtn.textContent = 'Added ✓';
          setTimeout(()=> addBtn.textContent='Add to cart',900);
        };

        controls.appendChild(qtyWrap); controls.appendChild(addBtn);
        pc.appendChild(imgWrap); pc.appendChild(name); pc.appendChild(meta); pc.appendChild(controls);
        productGrid.appendChild(pc);
      });
    } catch (err) {
      console.error("Error loading products:", err);
      productGrid.innerHTML = '<div>Error loading products.</div>';
    }
  }

  // search button action
  if ($("#searchBtn")) {
    $("#searchBtn").addEventListener("click", ()=>{
      const q = $("#searchInput").value.trim();
      if(!q) return alert("Type something to search");
      const isProduct = ["dress","accessory","electrical","lamp","fan","wallet"].some(w=>q.toLowerCase().includes(w));
      window.location.href = isProduct ? 'store.html' : 'past.html';
    });
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    updateCounter();
    loadNews();
    loadProducts();
  });
  
  // Also run immediately if DOM is already loaded
  if (document.readyState !== 'loading') {
    updateCounter();
    loadNews();
    loadProducts();
  }
})();
