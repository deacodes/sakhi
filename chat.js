const FEATHERLESS_API_KEY = 'rc_06f25a3615af02e085b2eb6617d6131332ef42185df4bb6b23ccec08fe4ec541';
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
// Clinical Terms Dictionary
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
    'pair dard': 'Leg pain',
    'baap re': 'Exclamation of pain',
    'dard baa': 'Pain (Bhojpuri)',
    'takleef baa': 'Discomfort (Bhojpuri)',
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
    const bhojpuriWords = ['baa', 'hau', 'hamaar', 'tohar', 'kahe', 'kehu', 'lagta', 'raha ba', 'kahi'];
    const isBhojpuri = bhojpuriWords.some(w => text.toLowerCase().includes(w));

    const langs = [];
    if (isBhojpuri) langs.push({ lang: 'Bhojpuri', pct: 45 });
    if (hindiScript > 0) langs.push({ lang: 'Hindi', pct: 40 });
    else if (!isBhojpuri && englishWords > 2) langs.push({ lang: 'Hinglish', pct: 50 });
    if (englishWords > 0) langs.push({ lang: 'English', pct: 20 });
    if (langs.length === 0) langs.push({ lang: 'English', pct: 100 });

    const total = langs.reduce((s, l) => s + l.pct, 0);
    return langs.map(l => ({ ...l, pct: Math.round((l.pct / total) * 100) }));
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

    // Run local NLP instantly
    const clinicalTerms = extractClinicalTerms(val);
    const langs = detectLangs(val);
    updateSidebar(langs, clinicalTerms);

    try {
        const response = await fetch('https://sakhi.deaplayz2011.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 1000,
                messages: [
                    {
                        role: 'system',
                        content: `You are Sakhi, a warm and caring women's health companion for rural Indian women.
You understand Hindi, Bhojpuri, Hinglish, Urdu, Bengali, Tamil and code-mixed languages.
Always respond in the same language the user wrote in. and provide medical advice for the time being to help

You must ALWAYS start your response with a JSON block on the very first line like this:
{"severity":"low","category":"General","langs":[{"lang":"Hindi","pct":60},{"lang":"Bhojpuri","pct":40}]}

Severity options: low, see-doctor, urgent
Category options: Symptoms, Periods, Pregnancy, Mental Health, Nutrition, Medications, Emergency, General

Then on the next line, write your warm empathetic response.
Never diagnose. Always suggest seeing a doctor for serious symptoms.`
                    },
                    {
                        role: 'user',
                        content: val
                    }
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

        // Parse JSON from first line
        const lines = fullText.split('\n');
        let meta = { severity: 'low', category: 'General', langs };
        try {
            meta = { ...meta, ...JSON.parse(lines[0]) };
        } catch (e) { }

        const cleanText = lines.slice(1).join('\n').trim();

        // Update sidebar with Llama's language detection
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

    } catch (err) {
        console.error(err);
        loadingDiv.innerHTML = 'Something went wrong. Please try again.';
    }

    msgs.scrollTop = msgs.scrollHeight;
}

document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
});

window.sendMessage = sendMessage;
