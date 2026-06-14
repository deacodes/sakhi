class SpeechRecognizer {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition API not supported');
            this.supported = false;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.supported = true;
        this.isListening = false;
        this.transcript = '';
        this.detectedLanguage = null;
        this.apiKey = 'free'; 

        this.setupRecognition();
        this.setupEventListeners();
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; 

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateMicButton('speaking');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript = finalTranscript || interimTranscript;

            const inputField = document.getElementById('chatInput');
            if (inputField) {
                inputField.value = this.transcript + (interimTranscript ? interimTranscript : '');
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateMicButton('idle');
            this.finalizeTranscript();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech Error:', event.error);
            this.updateMicButton('idle');
            alert('Microphone error: ' + event.error);
        };
    }

    setupEventListeners() {
        const micBtn = document.getElementById('micBtn');
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');

        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleListening());
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.finalizeTranscript();
                if (window.sendMessage) window.sendMessage();
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.finalizeTranscript();
                    if (window.sendMessage) window.sendMessage();
                }
            });
        }
    }

    detectLanguage(text) {
        if (!text || text.trim().length === 0) return;


        const devanagariRegex = /[\u0900-\u097F]/g;
        const devanagariChars = (text.match(devanagariRegex) || []).length;


        const englishRegex = /[a-zA-Z]/g;
        const englishChars = (text.match(englishRegex) || []).length;

        if (devanagariChars > englishChars && devanagariChars > 0) {
            this.detectedLanguage = 'hi';
        } else {
            this.detectedLanguage = 'en';
        }
    }

    toggleListening() {
        if (!this.supported) {
            alert('Speech Recognition not supported. Use Chrome, Edge, or Safari.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.transcript = '';
            this.detectedLanguage = null;
            this.recognition.lang = 'en-US'; 
            this.recognition.start();
        }
    }

    updateMicButton(state) {
        const micBtn = document.getElementById('micBtn');
        if (!micBtn) return;

        const emojiMap = {
            idle: '🎤',
            speaking: '🔊',
        };

        micBtn.textContent = emojiMap[state] || '🎤';
        micBtn.style.transition = 'all 0.2s ease';

        if (state === 'speaking') {
            micBtn.style.transform = 'scale(1.2)';
            micBtn.style.color = 'var(--pink, #FF69B4)';
        } else {
            micBtn.style.transform = 'scale(1)';
            micBtn.style.color = 'inherit';
        }
    }

    async detectLanguageWithAPI(text) {
        try {
            
            const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'mistral-7b',
                    messages: [
                        {
                            role: 'user',
                            content: `Detect the language of this text. Reply with only "en" for English or "hi" for Hindi: "${text}"`
                        }
                    ],
                    max_tokens: 10,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const langDetected = data.choices[0].message.content.toLowerCase().includes('hi') ? 'hi' : 'en';
                this.detectedLanguage = langDetected;
            }
        } catch (error) {
            console.log('API detection failed, using local detection');
            this.detectLanguage(text);
        }
    }

    romanizeHindi(text) {
        const hindiToEnglish = {
            'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
            'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
            'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga',
            'च': 'cha', 'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya',
            'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha', 'ण': 'na',
            'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na',
            'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
            'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'wa',
            'श': 'sha', 'ष': 'sha', 'स': 'sa', 'ह': 'ha',
            'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
            'ं': 'n', 'ः': 'h', 'ँ': 'n',
            '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
            '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
            '।': '.',
        };

        let romanized = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (hindiToEnglish[char]) {
                romanized += hindiToEnglish[char];
            } else if (char === ' ' || /[a-zA-Z0-9]/.test(char) || char === '.' || char === ',' || char === '?') {
                romanized += char;
            }
        }

        return romanized.replace(/\s+/g, ' ').trim();
    }

    finalizeTranscript() {
        if (this.transcript.trim()) {
            let finalText = this.transcript.trim();

            
            this.detectLanguage(finalText);

            
            if (this.detectedLanguage === 'hi') {
                finalText = this.romanizeHindi(finalText);
            }

            const inputField = document.getElementById('chatInput');
            if (inputField) {
                inputField.value = finalText;
            }

            window.lastDetectedLanguage = this.detectedLanguage;
            console.log('Detected Language:', this.detectedLanguage);
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.speechRecognizer = new SpeechRecognizer();

    if (!window.speechRecognizer.supported) {
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.style.opacity = '0.5';
            micBtn.title = 'Not supported in this browser';
        }
    }
});
