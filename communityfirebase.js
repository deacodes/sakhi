import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCetu86df8EVlyhzBYlcOp1vRUjypQYZLk",
  authDomain: "sakhi-84ea1.firebaseapp.com",
  projectId: "sakhi-84ea1",
  storageBucket: "sakhi-84ea1.firebasestorage.app",
  messagingSenderId: "737146576086",
  appId: "1:737146576086:web:4c4328110a8a042f11fd77",
  measurementId: "G-7HW6J539FD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const categoryClassMap = {
  "Pregnancy": "cat-pregnancy",
  "Periods": "cat-periods",
  "Mental Health": "cat-mental",
  "Nutrition": "cat-nutrition",
  "General": "cat-general"
};

async function loadPosts() {
  const list = document.querySelector(".community-list");
  if (!list) {
    console.error("community-list not found!");
    return;
  }

  list.innerHTML = "";

  try {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("No posts found in Firestore.");
      return;
    }

    snapshot.forEach((doc) => {
      const post = doc.data();

      const date = post.timestamp
        ? new Date(post.timestamp).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long"
        })
        : "";

      const categoryClass = categoryClassMap[post.category] || "cat-general";
      const category = post.category || "General";

      const card = document.createElement("div");
      card.className = "community-card";

      card.innerHTML = `
  <div class="community-card-header">
    <div class="community-header-main">
      <span class="community-author">${post.author || "Member"}</span>
      <span class="community-date">${date}</span>
    </div>
    <span class="category-pill ${categoryClass}">${category}</span>
  </div>
  <div class="community-text">${post.text}</div>
  <button class="btn-translate" onclick="toggleTranslation(this, null, '${post.text.replace(/'/g, "\\'")}')">Translate →</button>
  <div class="translation-bubble" style="display:none;"></div>
`;

      list.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

async function submitPost() {
  const textarea = document.querySelector(".modal-textarea");
  const text = textarea.value.trim();
  if (!text) return;

  const selectedChip = document.querySelector(".cat-chip.selected");
  const category = selectedChip ? selectedChip.textContent.trim() : "General";

  try {
    await addDoc(collection(db, "posts"), {
      text: text,
      category: category,
      author: "Member",
      timestamp: Date.now()
    });

    textarea.value = "";
    closeModal();
    await loadPosts();

  } catch (err) {
    console.error("Error posting:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadPosts);

window.submitPost = submitPost;
