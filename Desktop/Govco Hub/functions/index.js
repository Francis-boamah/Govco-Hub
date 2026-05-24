const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

exports.placeOrder = onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated to place an order.");
  }

  const { customerName, customerEmail, customerPhone, house, room, notes, items } = data;

  if (!customerName || !customerEmail || !customerPhone || !house || !room || !items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError("invalid-argument", "Missing required order details.");
  }

  try {
    let calculatedTotal = 0;
    const orderItems = [];

    // Retrieve each product from Firestore to calculate the actual total safely
    for (const item of items) {
      const productSnap = await db.collection("products").doc(item.productId).get();
      if (!productSnap.exists) {
        throw new HttpsError("not-found", `Product with ID ${item.productId} not found.`);
      }
      const productData = productSnap.data();
      const unitPrice = productData.price;
      const qty = parseInt(item.qty) || 1;
      calculatedTotal += unitPrice * qty;

      orderItems.push({
        productId: item.productId,
        productName: productData.name,
        qty: qty,
        unitPrice: unitPrice
      });
    }

    // Write orders/{id}
    const orderRef = db.collection("orders").doc();
    const orderDoc = {
      userId: auth.uid,
      customerName,
      customerEmail,
      customerPhone,
      house,
      room,
      notes: notes || "",
      total: calculatedTotal,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await orderRef.set(orderDoc);

    // Write subcollection items
    const batch = db.batch();
    orderItems.forEach((orderItem) => {
      const itemRef = orderRef.collection("items").doc();
      batch.set(itemRef, orderItem);
    });
    await batch.commit();

    // Send email via Nodemailer
    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailPassword = process.env.GMAIL_PASSWORD;

    if (gmailEmail && gmailPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail,
          pass: gmailPassword
        }
      });

      const itemsText = orderItems
        .map(item => `- ${item.productName} x ${item.qty} (GHS ${item.unitPrice.toFixed(2)} each)`)
        .join("\n");

      const mailOptions = {
        from: `"GOVCO Hub Store" <${gmailEmail}>`,
        to: customerEmail,
        cc: gmailEmail,
        subject: `GOVCO Hub Order Confirmation - #${orderRef.id}`,
        text: `Hello ${customerName},

Thank you for your order! We will deliver it to your room shortly.

Order Details:
Order ID: ${orderRef.id}
Delivery Address: House: ${house}, Room: ${room}
Phone: ${customerPhone}
Notes: ${notes || "None"}

Items Ordered:
${itemsText}

Total: GHS ${calculatedTotal.toFixed(2)}

If you have any questions, please contact us at 0547482391 or francisboamah338@gmail.com.

Best regards,
GOVCO Hub Team`
      };

      await transporter.sendMail(mailOptions);
    } else {
      console.warn("Gmail environment variables GMAIL_EMAIL and GMAIL_PASSWORD not set. Email not sent.");
    }

    return { ok: true, orderId: orderRef.id, total: calculatedTotal };

  } catch (error) {
    console.error("Error processing order:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An error occurred while processing your order: " + error.message);
  }
});
