// Minimal, essential form script using EmailJS sendForm
// Uses existing form with id `newsletterForm`, input `email-input`, button `notify-btn`.
// Replace EMAILJS_PUBLIC_KEY if you want to call emailjs.init(userID).

const EMAILJS_SERVICE_ID = 'qck-pre';
const EMAILJS_TEMPLATE_ID = 'template_jitqy5b';
const EMAILJS_PUBLIC_KEY = 'qxeAf91hjRblcXknk';

const form = document.getElementById('newsletterForm');
const emailInput = document.getElementById('email-input');
const btn = document.getElementById('notify-btn');

function isValidEmail(email) {
    const re = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return re.test(String(email).toLowerCase());
}

function setBtn(text, disabled = false) {
    if (!btn) return;
    if (btn.tagName === 'INPUT') btn.value = text;
    else btn.textContent = text;
    btn.disabled = disabled;
}

if (form) {
    // optional init if you have public key
    try {
        if (EMAILJS_PUBLIC_KEY && window.emailjs && emailjs.init) emailjs.init(EMAILJS_PUBLIC_KEY);
    } catch (e) { /* ignore */ }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = String(emailInput && emailInput.value || '').trim();
        const lang = (navigator.language || navigator.userLanguage || '').startsWith('pt') ? 'pt-br' : 'en-us';

        if (!isValidEmail(email)) {
            alert(lang === 'pt-br' ? 'Por favor insira um e-mail válido.' : 'Please enter a valid email.');
            return;
        }

        setBtn(lang === 'pt-br' ? 'Enviando...' : 'Sending...', true);

        // get public IP (best-effort)
        try {
            const r = await fetch('https://api.ipify.org?format=json');
            if (r.ok) {
                const j = await r.json();
                let ipInput = form.querySelector('input[name="ip"]');
                if (!ipInput) {
                    ipInput = document.createElement('input');
                    ipInput.type = 'hidden';
                    ipInput.name = 'ip';
                    form.appendChild(ipInput);
                }
                ipInput.value = j.ip || '';
            }
        } catch (err) {
            // ignore
        }

        // attach user_agent and lang as hidden fields
        try {
            let uaInput = form.querySelector('input[name="user_agent"]');
            if (!uaInput) {
                uaInput = document.createElement('input'); uaInput.type = 'hidden'; uaInput.name = 'user_agent'; form.appendChild(uaInput);
            }
            uaInput.value = navigator.userAgent || '';

            let langInput = form.querySelector('input[name="lang"]');
            if (!langInput) {
                langInput = document.createElement('input'); langInput.type = 'hidden'; langInput.name = 'lang'; form.appendChild(langInput);
            }
            langInput.value = lang;
        
            // if form has data-to-email, include it as to_email for templates that expect a recipient
            if (form.dataset && form.dataset.toEmail) {
                let toInput = form.querySelector('input[name="to_email"]');
                if (!toInput) {
                    toInput = document.createElement('input');
                    toInput.type = 'hidden';
                    toInput.name = 'to_email';
                    form.appendChild(toInput);
                }
                toInput.value = form.dataset.toEmail;
            }
        } catch (err) { /* ignore */ }

        // send form via EmailJS
        try {
            if (!window.emailjs) throw new Error('EmailJS SDK not loaded');
            await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
            setBtn(lang === 'pt-br' ? '✓ Enviado!' : '✓ Sent!', true);
        } catch (err) {
            console.error('Erro ao enviar via EmailJS:', err);
            setBtn(lang === 'pt-br' ? 'Erro — tente novamente' : 'Error — try again', false);
            setTimeout(() => setBtn(lang === 'pt-br' ? 'Notifique-me' : 'Notify Me', false), 2000);
            return;
        }

        setTimeout(() => {
            setBtn(lang === 'pt-br' ? 'Notifique-me' : 'Notify Me', false);
            if (emailInput) emailInput.value = '';
        }, 3000);
    });
}
