const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Spanish Decks
const spanishDecks = [
  {
    id: "spanish-basics",
    name: "Spanish Basics",
    description: "Essential Spanish vocabulary for beginners",
  },
];

// Spanish Cards
const spanishCards = [
  { id: "1", front: "Hello", back: "Hola" },
  { id: "2", front: "Goodbye", back: "Adiós" },
  { id: "3", front: "Thank you", back: "Gracias" },
  { id: "4", front: "Please", back: "Por favor" },
  { id: "5", front: "Yes", back: "Sí" },
  { id: "6", front: "No", back: "No" },
  { id: "7", front: "Water", back: "Agua" },
  { id: "8", front: "Food", back: "Comida" },
  { id: "9", front: "House", back: "Casa" },
  { id: "10", front: "Friend", back: "Amigo" },
].map((card) => ({
  ...card,
  deckId: "spanish-basics",
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  difficulty: "good",
}));

// French Decks
const frenchDecks = [
  {
    id: "french-verbs",
    name: "French Verbs",
    description: "Common French verbs and conjugations",
  },
];

// French Cards
const frenchCards = [
  { id: "1", front: "to be", back: "être" },
  { id: "2", front: "to have", back: "avoir" },
  { id: "3", front: "to go", back: "aller" },
  { id: "4", front: "to do/make", back: "faire" },
  { id: "5", front: "to say", back: "dire" },
  { id: "6", front: "to see", back: "voir" },
  { id: "7", front: "to know", back: "savoir" },
  { id: "8", front: "to come", back: "venir" },
  { id: "9", front: "to take", back: "prendre" },
  { id: "10", front: "to want", back: "vouloir" },
].map((card) => ({
  ...card,
  deckId: "french-verbs",
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  difficulty: "good",
}));

const defaultStats = {
  totalCardsStudied: 0,
  studyStreak: 0,
  totalStudyTime: 0,
  lastStudyDate: null,
  achievements: [
    {
      id: "first_card",
      title: "First Steps",
      description: "Study your first flashcard",
      icon: "🎯",
      progress: 0,
      target: 1,
    },
    {
      id: "study_streak_7",
      title: "Week Warrior",
      description: "Study for 7 days in a row",
      icon: "🔥",
      progress: 0,
      target: 7,
    },
    {
      id: "cards_100",
      title: "Century Club",
      description: "Study 100 flashcards",
      icon: "💯",
      progress: 0,
      target: 100,
    },
    {
      id: "perfect_session",
      title: "Perfect Score",
      description: "Get 100% correct in a study session",
      icon: "⭐",
      progress: 0,
      target: 1,
    },
  ],
};

async function uploadLanguage(language, decks, cards) {
  console.log(`Uploading ${language} decks and cards...`);

  for (const deck of decks) {
    const deckRef = db
      .collection("flashcards")
      .doc(language)
      .collection("decks")
      .doc(deck.id);
    await deckRef.set({
      ...deck,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const deckCards = cards.filter((c) => c.deckId === deck.id);
    for (const card of deckCards) {
      const cardRef = deckRef.collection("cards").doc(card.id);
      await cardRef.set({
        ...card,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        nextReview: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

async function uploadFlashcards() {
  try {
    await uploadLanguage("spanish", spanishDecks, spanishCards);
    await uploadLanguage("french", frenchDecks, frenchCards);

    await db.doc("stats/default").set({
      ...defaultStats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Upload completed successfully!");
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

uploadFlashcards();
