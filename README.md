# Sakhi: A Health Companion for Rural Women

## Inspiration

Women in rural and underprivileged communities face critical barriers to healthcare: limited access to qualified doctors, lack of health literacy, and language barriers that prevent them from seeking or understanding medical guidance. Even common, manageable symptoms often feel alarming when there's no trusted source to explain them. Sakhi was born from the need to bridge this gap—to bring reliable, accessible health information directly to women in their own languages.

## What It Does

**Sakhi** is a comprehensive health platform designed specifically for women in rural communities. It combines three powerful features:

1. **AI Health Chatbot** — A multilingual health assistant that understands Hindi, Bhojpuri, Hinglish, and code-mixed languages. It provides warm, actionable health advice while automatically converting colloquial symptoms into clinical medical terms.

2. **Personal Health Dashboard** — Tracks symptoms, severity trends, and generates weekly health insights. Displays automated alerts when urgent patterns are detected in user data.

3. **Public Health Intelligence Tool** — Uses Named Entity Recognition (NER) to extract diseases, locations, organizations, and data points from health articles and news. Designed for journalists, NGOs, and government health officials to monitor regional health trends.

## How We Built It

### Architecture & Workflow

- **Frontend**: HTML5, CSS3, vanilla JavaScript (modular, no frameworks)
- **Backend Logic**: Client-side processing with Firebase for persistence
- **AI Integration**: LLaMA 3.1 via Featherless API for multilingual understanding and response generation
- **Real-time Data**: Firestore for user-specific health logs, symptoms, and metadata
- **Visualization**: Chart.js for analytics, Leaflet.js for interactive health heatmaps
- **NLP**: Rule-based clinical term mapping + Google Translate API for instant language support

### Key Design Decisions

- **No authentication layer**: Used localStorage-based persistent user IDs for immediate usability (critical in low-connectivity settings)
- **Modular JS files**: Separate logic for chat, health log, dashboard, symptoms to keep code maintainable
- **Client-heavy processing**: Minimized server dependency to reduce latency in rural areas
- **Cloudflare Workers**: Used as CORS proxy to allow direct API calls from browsers without backend complexity

## Challenges We Ran Into

**Language & NLP Complexity**
- Users naturally code-mix Hindi, English, and local Bhojpuri dialect in single messages ("Mere period cramps bahut tez hain aur I feel so tired")
- Standard NLP models fail on this; required custom dictionary + keyword detection

**Browser Compatibility**
- WebSpeech API for voice input only works in Chrome/Edge; not supported in Safari or Arc
- Had to design fallback text-input UI

**CORS & Network Constraints**
- Direct API calls from browser to third-party endpoints were blocked
- Solution: Cloudflare Workers as lightweight middleware

**Real-time Performance**
- LLaMA responses can be slow (~3-5s) in rural areas with weak connectivity
- Added "Thinking..." UI states and optimized token counts

**Data Privacy**
- Storing health data requires careful isolation; implemented user-scoped Firestore queries with localStorage-based user IDs

## Accomplishments We're Proud Of

✅ **Multilingual Health Chatbot** — Built a system that understands code-mixed Hindi/English/Bhojpuri and responds in the user's native language with clinically accurate advice

✅ **Functional Health Analytics Dashboard** — Real-time symptom tracking, severity distribution charts, weekly AI-generated health insights, and automated urgent alerts

✅ **Named Entity Recognition (NER) System** — Extracts diseases, locations, organizations, and data points from unstructured health articles to create actionable public health intelligence

✅ **Interactive Health Heatmap** — Geographic visualization of symptom burden, supply demand, and SOS frequency across Indian states with bubble-based data representation

✅ **Zero-Auth User Management** — Persistent, privacy-respecting user sessions without requiring sign-ups or passwords

## What We Learned

🔍 **Browser APIs Have Real Limits** — WebSpeech API is powerful but fragmented across browsers; graceful degradation is essential

🔍 **Rule-Based NLP > Generic Models for Low-Resource Contexts** — Custom dictionaries and keyword matching outperformed large models for detecting Hinglish medical terms

🔍 **CORS is Unavoidable in Browser-Heavy Apps** — Cloudflare Workers solved this elegantly without running a full backend server

🔍 **Response Quality Depends on System Prompts** — Carefully engineered prompts that specify output language and structure vastly improved LLaMA's medical advice quality

🔍 **User-Scoped Data is Non-Negotiable** — Health data must be isolated per user; localStorage-based user IDs provide sufficient privacy for this MVP



## Tech Stack

### Frontend
- **HTML5 / CSS3** — Semantic markup, CSS variables for theming
- **Vanilla JavaScript (ES6+)** — Modular files (chat.js, healthlog.js, dashboard.js, etc.)
- **Chart.js 4.x** — Data visualization (doughnut, bar, line, radar charts)
- **Leaflet.js 1.9** — Interactive maps and geospatial visualization
- **Compromise.js** — Lightweight NLP for English entity extraction (fallback)

### Backend & Data
- **Firebase Firestore** — NoSQL database with real-time sync
- **Firebase Authentication** — (Not implemented; using localStorage user IDs instead)
- **Google Translate API** — Real-time language translation for UI elements

### AI & Language Models
- **Featherless.ai** — Hosting for open-source LLM inference
- **Meta-Llama 3.1 8B Instruct** — Main multilingual health chatbot model
- **Mistral 7B Instruct v0.3** — Fallback model for insights and NER
- **Cloudflare Workers** — CORS proxy middleware for API calls

### Infrastructure & Deployment
- **Cloudflare Workers** — Serverless middleware for API proxying
- **GitHub** — Version control (optional; can deploy static files directly)
- **Local Development** — Simple HTTP server (Python `http.server` or Node `http-server`)

### External Services
- **OpenWeatherMap API** — (Future: for health data correlation)
- **WHO / NFHS-5 Data** — Public datasets for dashboard visualizations
- **CARTO Maps** — Basemap tiles for geographic visualization



## What's Next for Sakhi

🚀 **Phase 2: Scale & Integration**
- Real India health heatmap powered by aggregated, anonymized user data
- Hospital/clinic locator: "Find nearest gynecologist/maternity ward" based on symptoms
- Integration with ASHA (Accredited Social Health Activists) worker network for on-ground verification
- SMS-based access for feature phones (not just mobile web)

🚀 **Phase 3: Mobile & Offline**
- Progressive Web App (PWA) with offline symptom detection
- Native mobile apps for iOS/Android with push notifications
- Voice-first interface for low-literacy users

🚀 **Phase 4: Public Health Intelligence**
- Real-time disease surveillance dashboard for government health officials
- Automated anomaly detection (e.g., sudden spike in fever reports = potential outbreak)
- Integration with national health surveillance systems (HMIS)



## How to Use

1. **Health Chat**: Describe your symptoms in any language; get personalized advice instantly
2. **Health Log**: Maintain a digital diary of daily health observations
3. **Symptoms Page**: View all detected symptoms with severity levels
4. **Dashboard**: Analyze trends, see public health data, and run NER on news articles
5. **Community**: Read and post anonymously; learn from other women's experiences





**Built with ❤️ for women's health. Built by a team passionate about accessibility and equity in healthcare.**
