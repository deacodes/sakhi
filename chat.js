import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getUserId } from './user.js';

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

const MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

const clinicalMap = {
    'pet dard': 'Abdominal pain',
    'chhati dard': 'Chest pain / Angina',
    'doodh mein dard': 'Mastodynia',
    'chhati bhaari': 'Chest heaviness / Tightness',
    'saans lene mein takleef': 'Dyspnea',
    'sar dard': 'Headache / Cephalalgia',
    'bukhar': 'Fever / Pyrexia',
    'ulti': 'Vomiting / Emesis',
    'thakan': 'Fatigue / Lethargy',
    'chakkar': 'Dizziness / Vertigo',
    'khoon': 'Hemorrhage',
    'dast': 'Diarrhea',
    'kabz': 'Constipation',
    'neend nahi': 'Insomnia',
    'cramps': 'Dysmenorrhea',
    'iron ki kami': 'Iron deficiency anemia',
    'kamzori': 'Asthenia / Weakness',
    'dil ki dhadkan': 'Palpitations',
    'kamar dard': 'Lumbago / Back pain',
    'pair dard': 'Leg pain'
};

function extractClinicalTerms(text) {
    const lower = text.toLowerCase();
    const found = [];
    for (const [term, clinical] of Object.entries(clinicalMap)) {
        if (lower.includes(term)) found.push({ original: term, clinical });
    }
    return found;
}

function detectLangs(text) {
    const hindiScript = (text.match(/[\u0900-\u097F]/g) || []).length;
    const englishWords = (text.match(/\b[a-zA-Z]+\b/g) || []).length;


    if (hindiScript === 0) {
        return [{ lang: 'English', pct: 100 }];
    }


    if (hindiScript > 0 && englishWords > 3) {
        return [{ lang: 'Hinglish', pct: 100 }];
    }


    const bhojpuriWords = ['baa', 'hau', 'hamaar', 'tohar', 'kahe', 'kehu', 'lagta', 'raha ba', 'kahi'];
    const isBhojpuri = bhojpuriWords.some(w => text.toLowerCase().includes(w));

    if (isBhojpuri && hindiScript > 0) {
        return [{ lang: 'Bhojpuri', pct: 100 }];
    } else if (hindiScript > 0) {
        return [{ lang: 'Hindi', pct: 100 }];
    }

    return [{ lang: 'English', pct: 100 }];
}

function updateSidebar(langs, clinicalTerms) {
    const colorClasses = ['fill-pink', 'fill-purple', 'fill-blue'];
    const langSection = document.querySelector('.chat-sidebar-section:first-child');
    langSection.innerHTML = `
    <div class="chat-sidebar-title">Language Distribution</div>
    <div class="lang-bar-row">
      ${langs.map((l, i) => `
        <div class="lang-bar-item" style="margin-top:${i > 0 ? '8px' : '0'}">
          <div class="lang-bar-label">${l.lang}</div>
          <div class="lang-bar-track">
            <div class="lang-bar-fill ${colorClasses[i % colorClasses.length]}" style="width:${l.pct}%;"></div>
          </div>
        </div>`).join('')}
    </div>`;

    const clinicalSection = document.querySelector('.chat-sidebar-section:last-child');
    if (clinicalTerms.length === 0) {
        clinicalSection.innerHTML = `<div class="chat-sidebar-title">Clinical Terms</div><div class="clinical-terms-list"><div style="color:#aaa;font-size:13px;">None detected</div></div>`;
        return;
    }
    clinicalSection.innerHTML = `
    <div class="chat-sidebar-title">Clinical Terms</div>
    <div class="clinical-terms-list">
      ${clinicalTerms.map(t => `
        <div class="clinical-term-row">
          <span class="ct-original">${t.original}</span>
          <span class="ct-clinical">${t.clinical}</span>
        </div>`).join('')}
    </div>`;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const val = input.value.trim();
    if (!val) return;

    const msgs = document.getElementById('chatMessages');

    const userDiv = document.createElement('div');
    userDiv.className = 'msg-user';
    userDiv.textContent = val;
    msgs.appendChild(userDiv);
    input.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'msg-sakhi';
    loadingDiv.innerHTML = 'Thinking...';
    msgs.appendChild(loadingDiv);
    msgs.scrollTop = msgs.scrollHeight;


    const clinicalTerms = extractClinicalTerms(val);
    const langs = detectLangs(val);
    updateSidebar(langs, clinicalTerms);

    try {
        const response = await fetch('https://sakhi.deaplayz2011.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 1000,
                messages: [
                    {
                        role: 'system',
                        content: `You are Sakhi, a warm and caring women's health companion for rural Indian women.
You understand Hindi, Bhojpuri, Hinglish, Urdu, Bengali, Tamil and code-mixed languages.
Always respond in the user's language.

You must ALWAYS start your response with a JSON block on the very first line like this:
{"severity":"low","category":"General","langs":[{"lang":"Hindi","pct":60},{"lang":"Bhojpuri","pct":40}]}

Severity options: low, see-doctor, urgent
Category options: Symptoms, Periods, Pregnancy, Mental Health, Nutrition, Medications, Emergency, General

Then on the next line, write your warm empathetic response.
Give helpful advice. Please take their health seriously too as you are a medical assistant but you have to be caring and warm`
                    },
                    { role: 'user', content: val }
                ]
            })
        });

        const data = await response.json();
        console.log('API response:', JSON.stringify(data));

        const fullText = data?.choices?.[0]?.message?.content;
        if (!fullText) {
            loadingDiv.innerHTML = 'No response received. Check console.';
            return;
        }


        const lines = fullText.split('\n');
        let meta = { severity: 'low', category: 'General', langs };
        try {
            meta = { ...meta, ...JSON.parse(lines[0]) };
        } catch (e) { }

        const cleanText = lines.slice(1).join('\n').trim();


        if (meta.langs && meta.langs.length > 0) {
            updateSidebar(meta.langs, clinicalTerms);
        }

        const pillMap = {
            'low': { cls: 'pill-low', label: 'Low Concern' },
            'see-doctor': { cls: 'pill-see-doctor', label: 'See A Doctor' },
            'urgent': { cls: 'pill-emergency', label: '🚨 Urgent' }
        };
        const pill = pillMap[meta.severity] || pillMap['low'];

        loadingDiv.innerHTML = `
      <span class="severity-pill ${pill.cls}">${pill.label}</span>
      <span style="font-size:11px;color:#888;margin-left:8px;">${meta.category}</span>
      <br><br>${cleanText.replace(/\n/g, '<br>')}
    `;


        const symptomCategories = ['Symptoms', 'Emergency', 'Periods', 'Pregnancy'];

        await addDoc(collection(db, 'symptoms'), {
            text: val,
            severity: meta.severity,
            category: meta.category,
            timestamp: Date.now(),
            userId: getUserId()
        });

    } catch (err) {
        console.error(err);
        loadingDiv.innerHTML = 'Something went wrong. Please try again.';
    }

    msgs.scrollTop = msgs.scrollHeight;
}

document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
});

document.getElementById('sendBtn').addEventListener('click', sendMessage);
