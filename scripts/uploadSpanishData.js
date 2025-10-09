const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadSpanishData() {
  try {
    const dataPath = path.join(process.cwd(), "assets/data/spanish.json");
    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const spanishDocRef = db.collection("language").doc("spanish");
    const flashcardsCollection = spanishDocRef.collection("flashcards");

    console.log(`Starting upload of ${jsonData.length} flashcards...`);

    let uploadedCount = 0;
    for (const card of jsonData) {
      const docId = card.word;

      await flashcardsCollection.doc(docId).set(card, { merge: true });
      uploadedCount++;
      console.log(`Uploaded/Updated: ${card.word}`);
    }

    console.log(`Uploaded ${uploadedCount} new flashcards.`);
  } catch (error) {
    console.error("Error uploading:", error);
  }
}

uploadSpanishData();
