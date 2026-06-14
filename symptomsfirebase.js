import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCetu86df8EVlyhzBYlcOp1vRUjypQYZLk",
    authDomain: "sakhi-84ea1.firebaseapp.com",
    projectId: "sakhi-84ea1",
    storageBucket: "sakhi-84ea1.firebasestorage.app",
    messagingSenderId: "737146576086",
    appId: "1:737146576086:web:4c4328110a8a042f11fd77"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const pillMap = {
    'low': { cls: 'pill-low', label: 'Low Priority' },
    'medium': { cls: 'pill-see-doctor', label: 'See A Doctor' },
    'see-doctor': { cls: 'pill-see-doctor', label: 'See A Doctor' },
    'urgent': { cls: 'pill-urgent', label: 'Urgent' },
    'emergency': { cls: 'pill-urgent', label: 'Urgent' }
};

async function loadSymptoms() {
    const list = document.querySelector('.symptoms-list');
    if (!list) return;

    try {
        const q = query(collection(db, 'symptoms'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        // Clear hardcoded cards
        list.innerHTML = '';

        snapshot.forEach((doc) => {
            const s = doc.data();
            const pill = pillMap[s.severity] || pillMap['low'];

            const card = document.createElement('div');
            card.className = 'symptom-card';
            card.innerHTML = `
        <span class="severity-pill ${pill.cls}">${pill.label}</span>
        <div class="symptom-text">${s.text}</div>
      `;
            list.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading symptoms:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadSymptoms);
