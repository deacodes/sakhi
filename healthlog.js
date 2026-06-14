import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
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

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadLoggedEntries(), loadCharts(), loadWeeklyInsights()]);
    await checkForAlert();

    document.querySelector('.btn-ai-insight').addEventListener('click', async () => {
        const btn = document.querySelector('.btn-ai-insight');
        const darkCard = document.querySelector('.insight-card-dark');
        btn.textContent = 'Generating...';

        try {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const q = query(
                collection(db, 'healthlogs'),
                where('userId', '==', getUserId())
            );
            const snapshot = await getDocs(q);
            const recentLogs = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                if (d.timestamp >= sevenDaysAgo) recentLogs.push(d.text);
            });

            const logsText = recentLogs.length > 0
                ? recentLogs.join('\n')
                : 'User has been experiencing fatigue, low mood, and irregular sleep this week.';

            const response = await fetch('https://sakhi.deaplayz2011.workers.dev', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mistralai/Mistral-7B-Instruct-v0.3',
                    max_tokens: 300,
                    messages: [
                        {
                            role: 'system',
                            content: `You are Sakhi, a women's health AI. Based on these weekly health logs, write a short 2-3 sentence empathetic insight about the user's health trend. Be specific, warm, and actionable. Reply in plain English only, no JSON, no bullet points.`
                        },
                        { role: 'user', content: logsText }
                    ]
                })
            });

            const data = await response.json();
            const insight = data?.choices?.[0]?.message?.content?.trim();

            const paras = darkCard.querySelectorAll('p');
            if (paras.length >= 1) paras[0].textContent = insight || 'Unable to generate insight.';
            if (paras.length >= 2) paras[1].textContent = '';

        } catch (err) {
            console.error(err);
        }

        btn.textContent = 'AI INSIGHT';
    });
});

window.submitLog = async function () {
    const input = document.getElementById('logInput');
    const val = input.value.trim();
    if (!val) return;

    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    await addDoc(collection(db, 'healthlogs'), {
        text: val,
        date,
        timestamp: Date.now(),
        userId: getUserId()
    });
    prependLogCard(val, date);
    input.value = '';
    await loadWeeklyInsights();
};

document.getElementById('logInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) window.submitLog();
});

function prependLogCard(text, date) {
    const container = document.getElementById('loggedEntries');
    const card = document.createElement('div');
    card.className = 'insight-card';
    card.style.marginBottom = '12px';
    card.innerHTML = `
    <div style="font-size:11px;color:var(--gray-400);font-family:'Sora',sans-serif;font-weight:600;margin-bottom:6px;">${date}</div>
    <div class="insight-text">${text}</div>
  `;
    container.prepend(card);
}

async function loadLoggedEntries() {
    const container = document.getElementById('loggedEntries');
    try {
        const q = query(
            collection(db, 'healthlogs'),
            where('userId', '==', getUserId()),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const d = doc.data();
            const card = document.createElement('div');
            card.className = 'insight-card';
            card.style.marginBottom = '12px';
            card.innerHTML = `
        <div style="font-size:11px;color:var(--gray-400);font-family:'Sora',sans-serif;font-weight:600;margin-bottom:6px;">${d.date}</div>
        <div class="insight-text">${d.text}</div>
      `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading logs:', err);
    }
}

async function loadCharts() {
    try {
        const q = query(
            collection(db, 'symptoms'),
            where('userId', '==', getUserId())
        );
        const snapshot = await getDocs(q);
        const severityCounts = { low: 0, 'see-doctor': 0, urgent: 0 };
        const categoryCounts = {};

        snapshot.forEach(doc => {
            const s = doc.data();
            if (s.severity && severityCounts[s.severity] !== undefined) severityCounts[s.severity]++;
            if (s.category) categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
        });

        const severityBox = document.querySelectorAll('.chart-box')[0];
        severityBox.innerHTML = `
      <div class="chart-box-title">Symptom Severity Distribution</div>
      <div style="width:180px;height:180px;margin:0 auto;">
        <canvas id="severityChart"></canvas>
      </div>
    `;
        new Chart(document.getElementById('severityChart'), {
            type: 'doughnut',
            data: {
                labels: ['Low', 'See Doctor', 'Urgent'],
                datasets: [{
                    data: [severityCounts['low'], severityCounts['see-doctor'], severityCounts['urgent']],
                    backgroundColor: ['#4ade80', '#f472b6', '#f87171'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: 'Montserrat', size: 11 }, boxWidth: 12, padding: 10 }
                    }
                },
                cutout: '60%'
            }
        });

        const categoryBox = document.querySelectorAll('.chart-box')[1];
        categoryBox.innerHTML = `
      <div class="chart-box-title">Commonly Faced</div>
      <div style="height:180px;">
        <canvas id="categoryChart"></canvas>
      </div>
    `;
        const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        new Chart(document.getElementById('categoryChart'), {
            type: 'bar',
            data: {
                labels: sortedCats.map(c => c[0]),
                datasets: [{
                    data: sortedCats.map(c => c[1]),
                    backgroundColor: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, font: { family: 'Montserrat', size: 11 } },
                        grid: { color: '#f0f0f0' }
                    },
                    x: {
                        ticks: { font: { family: 'Montserrat', size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error loading charts:', err);
    }
}

async function loadWeeklyInsights() {
    try {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const q = query(
            collection(db, 'healthlogs'),
            where('userId', '==', getUserId())
        );
        const snapshot = await getDocs(q);
        const recentLogs = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d.timestamp >= sevenDaysAgo) recentLogs.push(d.text);
        });

        if (recentLogs.length === 0) return;

        const response = await fetch('https://sakhi.deaplayz2011.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistralai/Mistral-7B-Instruct-v0.3',
                max_tokens: 400,
                messages: [
                    {
                        role: 'system',
                        content: `You are Sakhi, a women's health AI. Analyze these health log entries and return ONLY a JSON array of 2 insights, nothing else:
[
  {"en": "English insight", "hi": "Hindi translation"},
  {"en": "English insight", "hi": "Hindi translation"}
]`
                    },
                    { role: 'user', content: recentLogs.join('\n') }
                ]
            })
        });

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) return;

        let insights = [];
        try {
            const match = text.match(/\[[\s\S]*\]/);
            if (match) insights = JSON.parse(match[0]);
        } catch (e) { return; }

        const list = document.getElementById('insightsList');
        const darkCard = list.querySelector('.insight-card-dark');
        const lightDiv = list.querySelector('.insightcards');
        if (lightDiv) lightDiv.innerHTML = '';

        const container = lightDiv || document.createElement('div');
        container.className = 'insightcards';

        insights.forEach(ins => {
            const card = document.createElement('div');
            card.className = 'insight-card';
            card.innerHTML = `
        <div class="insight-text" style="font-weight:700;">${ins.en}</div>
        <div class="insight-sub">${ins.hi}</div>
      `;
            container.appendChild(card);
        });

        if (!lightDiv) { list.innerHTML = ''; list.appendChild(container); }
        if (darkCard && !list.contains(darkCard)) list.appendChild(darkCard);

    } catch (err) {
        console.error('Error loading insights:', err);
    }
}

async function checkForAlert() {
    const alertBanner = document.querySelector('.alert-banner');
    alertBanner.style.display = 'none';

    try {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const q = query(
            collection(db, 'symptoms'),
            where('userId', '==', getUserId())
        );
        const snapshot = await getDocs(q);

        const recentSymptoms = [];
        snapshot.forEach(doc => {
            const s = doc.data();
            if (s.timestamp >= sevenDaysAgo) recentSymptoms.push(s);
        });

        if (recentSymptoms.length === 0) return;

        const urgentCount = recentSymptoms.filter(s => s.severity === 'urgent').length;

        if (urgentCount >= 1) {
            const response = await fetch('https://sakhi.deaplayz2011.workers.dev', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mistralai/Mistral-7B-Instruct-v0.3',
                    max_tokens: 60,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a medical alert system. Based on the symptoms, generate a SHORT alert title in ALL CAPS (max 6 words). Reply with ONLY the alert text, nothing else. Example: EARLY SIGNS OF ANAEMIA DETECTED`
                        },
                        {
                            role: 'user',
                            content: recentSymptoms.map(s => s.text).join('\n')
                        }
                    ]
                })
            });

            const data = await response.json();
            const alertText = data?.choices?.[0]?.message?.content?.trim();

            alertBanner.style.display = 'block';
            alertBanner.querySelector('.alert-sub').textContent = alertText || 'UNUSUAL SYMPTOMS DETECTED THIS WEEK';
        }

    } catch (err) {
        console.error('Alert check failed:', err);
    }
}
