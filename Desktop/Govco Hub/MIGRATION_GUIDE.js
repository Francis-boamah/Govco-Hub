/**
 * Firebase to PHP API Migration Guide
 * 
 * This file shows before/after examples for converting
 * Firebase calls to PHP API calls
 */

// ============================================
// 1. CHECKOUT / ORDER PLACEMENT
// ============================================

// BEFORE (Firebase Cloud Function)
async function placeOrderFirebase(orderData) {
  try {
    const functions = firebase.functions();
    const placeOrder = functions.httpsCallable('placeOrder');
    
    const result = await placeOrder({
      customerName: orderData.name,
      customerEmail: orderData.email,
      customerPhone: orderData.phone,
      house: orderData.house,
      room: orderData.room,
      notes: orderData.notes,
      items: orderData.items
    });
    
    return result.data; // { ok: true, orderId, total }
  } catch (error) {
    console.error('Order error:', error);
    throw error;
  }
}

// AFTER (PHP API)
async function placeOrderPHP(orderData) {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerName: orderData.name,
        customerEmail: orderData.email,
        customerPhone: orderData.phone,
        house: orderData.house,
        room: orderData.room,
        notes: orderData.notes,
        items: orderData.items // [{ productId, qty }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Order failed');
    }

    return await response.json(); // { ok: true, orderId, total }
  } catch (error) {
    console.error('Order error:', error);
    throw error;
  }
}


// ============================================
// 2. PRODUCT FETCHING
// ============================================

// BEFORE (Firestore)
async function getProductsFirebase() {
  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('products').get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// AFTER (PHP API)
async function getProductsPHP() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}


// ============================================
// 3. SINGLE PRODUCT FETCH
// ============================================

// BEFORE (Firestore)
async function getProductFirebase(productId) {
  try {
    const db = firebase.firestore();
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) throw new Error('Product not found');
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// AFTER (PHP API)
async function getProductPHP(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) throw new Error('Product not found');
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}


// ============================================
// 4. PAST QUESTIONS - CHECK FILE
// ============================================

// BEFORE (Node.js Express)
async function checkFileFirebase(courseCode, level, semester, category) {
  try {
    const response = await fetch(
      `/api/check-file/${courseCode}?level=${level}&semester=${semester}&category=${category}`
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking file:', error);
    return false;
  }
}

// AFTER (PHP API - same endpoint!)
async function checkFilePHP(courseCode, level, semester, category) {
  try {
    const response = await fetch(
      `/api/check-file/${courseCode}?level=${level}&semester=${semester}&category=${category}`
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking file:', error);
    return false;
  }
}
// Note: This endpoint works the same! Just replace Node.js server with PHP


// ============================================
// 5. PAST QUESTIONS - DOWNLOAD
// ============================================

// BEFORE (Node.js Express)
function downloadFileFirebase(courseCode, level, semester, category) {
  const params = new URLSearchParams({
    level, semester, category
  });
  window.location.href = `/api/download/${courseCode}?${params}`;
}

// AFTER (PHP API - same endpoint!)
function downloadFilePHP(courseCode, level, semester, category) {
  const params = new URLSearchParams({
    level, semester, category
  });
  window.location.href = `/api/download/${courseCode}?${params}`;
}
// Note: This endpoint works the same! Just replace Node.js server with PHP


// ============================================
// 6. EXAMPLE: Update checkout.js
// ============================================

/*
In js/checkout.js, find where placeOrderFirebase() is called
and replace it with:

OLD:
  const result = await placeOrderFirebase({...});

NEW:
  const result = await placeOrderPHP({...});

Or better yet, rename the function to just:

  async function placeOrder(orderData) {
    // Your implementation here
  }

And update the call site without changing anything else.
*/


// ============================================
// 7. ERROR HANDLING COMPARISON
// ============================================

// Firebase: errors are Firebase-specific
try {
  await placeOrderFirebase(data);
} catch (error) {
  // error.code, error.message
  if (error.code === 'unauthenticated') { }
  if (error.code === 'invalid-argument') { }
}

// PHP API: errors are standard JSON
try {
  await placeOrderPHP(data);
} catch (error) {
  // error.message from JSON
  if (error.message.includes('Missing required field')) { }
  if (error.message.includes('Product not found')) { }
}

// Better: Check status codes
async function placeOrderPHPWithStatus(orderData) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  if (response.status === 400) {
    const error = await response.json();
    console.error('Validation error:', error.error);
    throw new Error(error.error);
  }
  
  if (response.status === 500) {
    throw new Error('Server error - please try again');
  }

  if (response.ok) {
    return await response.json();
  }
}


// ============================================
// 8. SUMMARY OF CHANGES
// ============================================

/*
Files to update:
1. js/checkout.js
   - Replace Firebase placeOrder call with PHP API call
   
2. js/store.js
   - Replace Firestore getProducts() with PHP API call
   
3. js/admin.js
   - Replace Firestore queries with PHP API calls
   
4. js/index.js
   - Replace Firestore news/products with PHP API
   
5. Remove from HTML:
   - Firebase SDK scripts
   - Firebase config script
   - Keep: your own JS files

Endpoints are mostly compatible:
✓ /api/download/* - works with both Node.js and PHP
✓ /api/check-file/* - works with both Node.js and PHP
✓ /api/products* - new with PHP
✓ /api/orders* - new with PHP
*/
