// store.js - Product catalog using PHP products API
(function(){
  function $qs(s){return document.querySelector(s)}
  function drawPlaceholderSVG(container,w=160,h=120,label="IMG"){
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns,"svg");
    svg.setAttribute("width",w); svg.setAttribute("height",h); svg.setAttribute("viewBox",`0 0 ${w} ${h}`);
    svg.innerHTML = `<rect width="${w}" height="${h}" rx="6" fill="#f2f2f2"></rect>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${Math.floor(w/8)}" fill="#bbb">${label}</text>`;
    container.appendChild(svg);
  }

  const cartKey="govco_cart_v1";
  function getCart(){return JSON.parse(localStorage.getItem(cartKey)||'[]')}
  function setCart(c){localStorage.setItem(cartKey,JSON.stringify(c)); updateCounter()}
  function updateCounter(){
    const cnt = getCart().reduce((s,i)=>s+i.qty,0);
    const el = $qs('#cartCounter');
    if (el) {
      if(cnt>0){ el.style.display='inline-block'; el.textContent=cnt } else { el.style.display='none' }
    }
  }

  let allProductsCached = [];

  const sidebar = $qs('#sidebar');
  if ($qs('#hamburger')) {
    $qs('#hamburger').addEventListener('click', ()=> sidebar.classList.add('show'));
  }
  if ($qs('#closeSidebar')) {
    $qs('#closeSidebar').addEventListener('click', ()=> sidebar.classList.remove('show'));
  }

  updateCounter();

  const productGrid = $qs('#productGrid');

  function renderProducts(filter='all'){
    if (!productGrid) return;
    productGrid.innerHTML='<div style="padding: 20px; text-align: center;">Loading products...</div>';

    const filteredProducts = allProductsCached.filter(p => {
      if (filter === 'all') return true;
      const term = filter.toLowerCase();
      return (p.name || '').toLowerCase().includes(term)
        || (p.description || '').toLowerCase().includes(term);
    });

    if (filteredProducts.length === 0) {
      productGrid.innerHTML='<div style="padding: 20px; text-align: center;">No products found.</div>';
      return;
    }

    productGrid.innerHTML='';
    filteredProducts.forEach(p => {
      const pId = p.id;
      const pc = document.createElement('div'); pc.className='product-card';
      const imgWrap = document.createElement('div'); imgWrap.className='img';

      if(p.image_url){
        const img=document.createElement('img');
        img.src=p.image_url;
        img.style.maxWidth='100%';
        img.style.maxHeight='120px';
        img.style.objectFit='contain';
        imgWrap.appendChild(img);
      } else {
        drawPlaceholderSVG(imgWrap,160,120,'IMG');
      }

      const name = document.createElement('div'); name.textContent=p.name;
      const meta = document.createElement('div'); meta.textContent=`${p.description || ''} — GHS ${(parseFloat(p.price) || 0).toFixed(2)}`;
      const controls = document.createElement('div'); controls.className='controls';

      const qty = document.createElement('input'); qty.type='number'; qty.value=1; qty.min=1; qty.style.width='60px';
      const add = document.createElement('button'); add.className='add-cart'; add.textContent='Add to cart';

      add.onclick = ()=>{
        const c = getCart();
        const cur = c.find(i=>i.id===pId);
        const desired = Math.max(1,parseInt(qty.value||1));
        if(cur){ cur.qty += desired } else { c.push({id:pId,qty:desired}) }
        setCart(c);
        add.textContent='Added ✓'; setTimeout(()=> add.textContent='Add to cart',700);
      };

      controls.appendChild(qty); controls.appendChild(add);
      pc.appendChild(imgWrap); pc.appendChild(name); pc.appendChild(meta); pc.appendChild(controls);
      productGrid.appendChild(pc);
    });
  }

  async function loadProducts() {
    try {
      allProductsCached = await window.govcoApi.fetchProducts();
      renderProducts('all');
    } catch (err) {
      console.error('Error loading products:', err);
      if (productGrid) {
        productGrid.innerHTML='<div style="padding: 20px; text-align: center; color: red;">Error loading products.</div>';
      }
    }
  }

  document.querySelectorAll('.type-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.type;
      renderProducts(t);
    });
  });

  loadProducts();

  const cartMenu = $qs('#cartMenu');
  if (cartMenu) {
    cartMenu.addEventListener('click', ()=> {
      const u = JSON.parse(localStorage.getItem('govco_user_v1') || 'null');
      if (!u) {
        alert('Please sign in before you can access the checkout.');
        const authModal = $qs('#authModal');
        if (authModal) authModal.classList.add('show');
      } else {
        location.href='checkout.html';
      }
    });
  }

  const searchBtn = $qs('#searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', ()=>{
      const q = $qs('#searchInput').value.trim().toLowerCase();
      if(!q) return;
      const found = allProductsCached.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      productGrid.innerHTML='';
      if (found.length === 0) {
        productGrid.innerHTML='<div style="padding: 20px; text-align: center;">No matching products found.</div>';
        return;
      }
      found.forEach(p => {
        const pId = p.id;
        const pc = document.createElement('div'); pc.className='product-card';
        const imgWrap = document.createElement('div'); imgWrap.className='img';

        if(p.image_url){
          const img=document.createElement('img');
          img.src=p.image_url;
          img.style.maxWidth='100%';
          img.style.maxHeight='120px';
          img.style.objectFit='contain';
          imgWrap.appendChild(img);
        } else {
          drawPlaceholderSVG(imgWrap,160,120,'IMG');
        }

        const name = document.createElement('div'); name.textContent=p.name;
        const meta = document.createElement('div'); meta.textContent=`${p.description || ''} — GHS ${(parseFloat(p.price) || 0).toFixed(2)}`;
        const controls = document.createElement('div'); controls.className='controls';
        const qty = document.createElement('input'); qty.type='number'; qty.value=1; qty.min=1; qty.style.width='60px';
        const add = document.createElement('button'); add.className='add-cart'; add.textContent='Add to cart';

        add.onclick = ()=>{
          const c = getCart();
          const cur = c.find(i=>i.id===pId);
          const desired = Math.max(1,parseInt(qty.value||1));
          if(cur){ cur.qty += desired } else { c.push({id:pId,qty:desired}) }
          setCart(c);
          add.textContent='Added ✓'; setTimeout(()=> add.textContent='Add to cart',700);
        };

        controls.appendChild(qty); controls.appendChild(add);
        pc.appendChild(imgWrap); pc.appendChild(name); pc.appendChild(meta); pc.appendChild(controls);
        productGrid.appendChild(pc);
      });
    });
  }
})();
