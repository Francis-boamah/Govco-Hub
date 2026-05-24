// checkout.js
(function(){
  const cartKey="govco_cart_v1";
  const userKey="govco_user_v1";

  // Check firebase
  if (!window.firebase) {
    console.error("Firebase is not loaded.");
    return;
  }

  const { db, functions, doc, getDoc, httpsCallable } = window.firebase;

  function getCart(){return JSON.parse(localStorage.getItem(cartKey)||'[]')}
  function setCart(c){localStorage.setItem(cartKey,JSON.stringify(c))}

  // back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', ()=> history.back());
  }

  // Populate order list from Firestore details
  const orderList = document.getElementById('orderList');
  let cartProducts = []; // To store resolved product data

  async function renderOrder(){
    const cart = getCart();
    if (!orderList) return;
    orderList.innerHTML='<div style="padding: 10px;">Loading order items...</div>';
    
    if (cart.length === 0) {
      orderList.innerHTML='<div style="padding: 10px;">Your cart is empty.</div>';
      document.getElementById('subtotal').textContent = `GHS 0.00`;
      document.getElementById('total').textContent = `GHS 0.00`;
      return;
    }

    try {
      // Fetch details of all items in cart in parallel
      const promises = cart.map(async (item) => {
        const docRef = doc(db, 'products', item.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: item.id, qty: item.qty, name: snap.data().name, price: snap.data().price };
        }
        return null;
      });

      cartProducts = (await Promise.all(promises)).filter(p => p !== null);
      
      orderList.innerHTML='';
      let subtotal = 0;

      cartProducts.forEach(p => {
        const row = document.createElement('div'); row.className='order-item';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';

        const left = document.createElement('div'); left.textContent = `${p.name} x ${p.qty}`;
        const right = document.createElement('div'); right.textContent = `GHS ${(p.price*p.qty).toFixed(2)}`;
        
        const remove = document.createElement('button'); 
        remove.textContent='Remove';
        remove.style.marginLeft = '10px';
        remove.onclick = ()=>{
          const updated = getCart().filter(i=>i.id!==p.id);
          setCart(updated); 
          renderOrder();
        };

        const rightWrapper = document.createElement('div');
        rightWrapper.style.display = 'flex';
        rightWrapper.style.alignItems = 'center';
        rightWrapper.appendChild(right);
        rightWrapper.appendChild(remove);

        row.appendChild(left); 
        row.appendChild(rightWrapper);
        orderList.appendChild(row);
        subtotal += p.price * p.qty;
      });

      document.getElementById('subtotal').textContent = `GHS ${subtotal.toFixed(2)}`;
      document.getElementById('total').textContent = `GHS ${subtotal.toFixed(2)}`;
    } catch (err) {
      console.error("Error loading order items:", err);
      orderList.innerHTML='<div style="padding: 10px; color: red;">Error loading order items.</div>';
    }
  }

  // Populate user info if signed in
  const u = JSON.parse(localStorage.getItem(userKey) || 'null');
  if(u){
    if(u.name && document.getElementById('name')) document.getElementById('name').value = u.name;
    if(u.phone && document.getElementById('phone')) document.getElementById('phone').value = u.phone;
    if(u.email && document.getElementById('email')) document.getElementById('email').value = u.email;
    if(u.house && document.getElementById('house')) document.getElementById('house').value = u.house;
    if(u.room && document.getElementById('room')) document.getElementById('room').value = u.room;
  }

  // Submit form
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      
      const cart = getCart();
      if(cart.length===0) return alert('Your cart is empty.');
      
      const submitBtn = document.getElementById('submitOrder');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting order...';
      }

      // Gather customer details
      const customerName = document.getElementById('name').value;
      const customerEmail = document.getElementById('email').value;
      const customerPhone = document.getElementById('phone').value;
      const house = document.getElementById('house').value;
      const room = document.getElementById('room').value;
      const notes = document.getElementById('notes')?.value || '';

      // Prepare payload for placeOrder callable function
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        house,
        room,
        notes,
        items: cart.map(item => ({
          productId: item.id,
          qty: item.qty
        }))
      };

      try {
        const placeOrderFn = httpsCallable(functions, 'placeOrder');
        const result = await placeOrderFn(payload);
        
        if (result.data && result.data.ok) {
          alert(`Order placed successfully!\nOrder ID: ${result.data.orderId}\nWe will deliver to your room.`);
          setCart([]);
          location.href='index.html';
        } else {
          alert('Failed to place order.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Order';
          }
        }
      } catch (err) {
        console.error("Order submission error:", err);
        alert('Error placing order: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Order';
        }
      }
    });
  }

  // Initial render
  renderOrder();
})();
