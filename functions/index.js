const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

async function sendToRegisteredDevices(title, body) {
  const tokenSnapshot = await db.collection("notification_tokens").get();
  if (tokenSnapshot.empty) return;

  const tokenDocs = tokenSnapshot.docs;
  const tokens = tokenDocs.map(doc => doc.data().token).filter(Boolean);
  const staleDocs = [];

  for (let start = 0; start < tokens.length; start += 500) {
    const batchTokens = tokens.slice(start, start + 500);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: batchTokens,
      notification: { title, body },
      webpush: {
        notification: {
          icon: "https://vehicle-maintenance-64890.web.app/icon-192.png",
          badge: "https://vehicle-maintenance-64890.web.app/icon-192.png"
        }
      }
    });

    response.responses.forEach((result, index) => {
      const code = result.error?.code || "";
      if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
        const token = batchTokens[index];
        const stale = tokenDocs.find(doc => doc.data().token === token);
        if (stale) staleDocs.push(stale.ref.delete());
      }
    });
  }

  await Promise.all(staleDocs);
}

exports.notifyNewSale = onDocumentCreated("sales_dashboard/{recordId}", async event => {
  const data = event.data?.data() || {};
  await sendToRegisteredDevices(
    "มีรายการขายใหม่",
    `${data.name || "รายการใหม่"} · ฿${Number(data.amt || 0).toLocaleString("th-TH")}`
  );
});

exports.notifyNewFuel = onDocumentCreated("fuel_records/{recordId}", async event => {
  const data = event.data?.data() || {};
  await sendToRegisteredDevices(
    "มีรายการน้ำมันใหม่",
    `${data.vehicleId || "ไม่ระบุรถ"} · ฿${Number(data.total || 0).toLocaleString("th-TH")}`
  );
});
