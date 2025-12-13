let currentPhraseIndex = 0;
        let phrases = [];
        let phraseInterval;

        function detectLanguage() {
            const browserLang = navigator.language || navigator.userLanguage;
            return browserLang.startsWith('pt') ? 'pt-br' : 'en-us';
        }

        async function loadPhrases() {
            try {
                const response = await fetch('./phrases.json');
                const data = await response.json();
                const lang = detectLanguage();
                phrases = data[lang] || data['en-us'];
                startPhraseCycle();
            } catch (error) {
                console.error('Erro ao carregar frases:', error);
                phrases = ['Fanzines sobre tecnologia', 'Fanzines sobre cultura digital', 'Fanzines sobre inovação'];
                startPhraseCycle();
            }
        }

        function startPhraseCycle() {
            const descElement = document.getElementById('description');
            if (!descElement) return;

            // Mostrar primeira frase
            if (phrases.length > 0) {
                descElement.textContent = phrases[0];
            }

            // Trocar frase a cada 3 segundos
            phraseInterval = setInterval(() => {
                currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
                
                // Efeito de fade out
                descElement.style.opacity = '0.5';
                
                setTimeout(() => {
                    descElement.textContent = phrases[currentPhraseIndex];
                    descElement.style.opacity = '1';
                }, 150);
            }, 5000);
        }

        window.addEventListener('DOMContentLoaded', loadPhrases);