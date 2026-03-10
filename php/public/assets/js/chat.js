let currentSessionId = null;
let predictionTimer = null;
let speechRecognition = null;
let isListening = false;

async function chatApi(path, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (window.csrfToken) opts.headers['X-CSRF-TOKEN'] = window.csrfToken;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api/chat' + path, opts);
    return res.json();
}

async function chatLoadSessions() {
    const sessions = await chatApi('/sessions');
    const container = document.getElementById('chat-sessions');
    container.innerHTML = '';
    sessions.forEach(s => {
        const el = document.createElement('div');
        el.className = 'flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-sm cursor-pointer min-h-[40px] ' +
            (s.id === currentSessionId ? 'bg-blue-50 dark:bg-blue-900/30 text-map-blue font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800');
        el.innerHTML = `<span class="truncate flex-1" onclick="chatSwitchSession('${s.id}')">${escHtml(s.title || 'New conversation')}</span>
            <button onclick="event.stopPropagation();chatDeleteSession('${s.id}')" class="text-gray-400 hover:text-red-500 p-1 shrink-0" aria-label="Delete conversation">✕</button>`;
        container.appendChild(el);
    });
}

async function chatNewSession() {
    const session = await chatApi('/sessions', 'POST');
    currentSessionId = session.id;
    await chatLoadSessions();
    chatClearMessages();
    document.getElementById('chat-empty').classList.remove('hidden');
}

async function chatSwitchSession(id) {
    currentSessionId = id;
    await chatLoadSessions();
    const messages = await chatApi('/sessions/' + id + '/messages');
    chatClearMessages();
    if (messages.length === 0) {
        document.getElementById('chat-empty').classList.remove('hidden');
    } else {
        document.getElementById('chat-empty').classList.add('hidden');
        messages.forEach(m => {
            const toolsCalled = m.tool_calls ? (typeof m.tool_calls === 'string' ? JSON.parse(m.tool_calls) : m.tool_calls) : [];
            chatAppendMessage(m.role, m.content, m.quick_actions, m.confidence, toolsCalled);
        });
    }
}

async function chatDeleteSession(id) {
    if (!confirm('Delete this conversation?')) return;
    await chatApi('/sessions/' + id, 'DELETE');
    if (currentSessionId === id) {
        currentSessionId = null;
        chatClearMessages();
        document.getElementById('chat-empty').classList.remove('hidden');
    }
    await chatLoadSessions();
}

function chatClearMessages() {
    const container = document.getElementById('chat-messages');
    const empty = document.getElementById('chat-empty');
    container.innerHTML = '';
    container.appendChild(empty);
    document.getElementById('chat-quick-actions').classList.add('hidden');
}

function renderMarkdown(text) {
    if (!text) return '';
    let html = escHtml(text);
    html = html.replace(/^### (.+)$/gm, '<h4 class="font-bold text-sm mt-2 mb-1">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">$1</code>');

    const lines = html.split('\n');
    let result = [];
    let inList = false;
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const bulletMatch = line.match(/^[\s]*[-•]\s+(.+)/);
        const numMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/);

        if (bulletMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
                result.push('<ul class="list-disc list-inside space-y-0.5 my-1">');
                inList = true;
                listType = 'ul';
            }
            result.push('<li>' + bulletMatch[1] + '</li>');
        } else if (numMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
                result.push('<ol class="list-decimal list-inside space-y-0.5 my-1">');
                inList = true;
                listType = 'ol';
            }
            result.push('<li>' + numMatch[2] + '</li>');
        } else {
            if (inList) {
                result.push(listType === 'ul' ? '</ul>' : '</ol>');
                inList = false;
                listType = null;
            }
            if (line.trim() === '') {
                result.push('<br>');
            } else if (!line.startsWith('<h')) {
                result.push('<p>' + line + '</p>');
            } else {
                result.push(line);
            }
        }
    }
    if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');

    return result.join('');
}

function chatAppendMessage(role, content, quickActions, confidence, toolsCalled) {
    const container = document.getElementById('chat-messages');
    document.getElementById('chat-empty').classList.add('hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'user' ? 'chat-user' : 'chat-assistant');

    if (role === 'assistant') {
        bubble.innerHTML = renderMarkdown(content);
    } else {
        const lines = content.split('\n');
        bubble.innerHTML = lines.map(l => l ? '<p>' + escHtml(l) + '</p>' : '<br>').join('');
    }

    if (role === 'assistant') {
        const meta = document.createElement('div');
        meta.className = 'flex items-center gap-2 mt-2 flex-wrap';

        if (confidence) {
            const colors = { high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', general: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
            let label = confidence;
            if (toolsCalled && toolsCalled.length > 0) {
                label += ' · ' + toolsCalled.length + ' tool' + (toolsCalled.length > 1 ? 's' : '');
            }
            meta.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[confidence] || colors.general}">${escHtml(label)}</span>`;
        }
        bubble.appendChild(meta);

        if (toolsCalled && toolsCalled.length > 0) {
            const activityEl = document.createElement('details');
            activityEl.className = 'mt-2 text-xs border-t border-gray-200 dark:border-gray-700 pt-2';
            let activityHtml = '<summary class="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 select-none" data-testid="button-agent-activity">Agent Activity</summary><div class="mt-1 space-y-0.5">';
            toolsCalled.forEach(tc => {
                activityHtml += `<div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><span class="text-map-teal">✓</span> ${escHtml(tc.summary || tc.name)}</div>`;
            });
            activityHtml += '</div>';
            activityEl.innerHTML = activityHtml;
            bubble.appendChild(activityEl);
        }
    }

    wrapper.appendChild(bubble);
    container.appendChild(wrapper);

    if (quickActions && quickActions.length > 0 && role === 'assistant') {
        const qaContainer = document.getElementById('chat-quick-actions');
        qaContainer.innerHTML = '';
        qaContainer.classList.remove('hidden');
        quickActions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'badge badge-blue cursor-pointer min-h-[36px]';
            btn.textContent = action;
            btn.onclick = () => chatHandleQuickAction(action);
            qaContainer.appendChild(btn);
        });
    }

    container.scrollTop = container.scrollHeight;
}

function chatHandleQuickAction(action) {
    const actionMap = {
        'Book Transport': '/transport',
        'View Pricing': '/pricing',
        'Find a Carer': '/care',
        'View Budget': '/budget',
        'Browse Jobs': '/jobs',
        'View Invoices': '/invoices',
    };

    if (actionMap[action]) {
        window.location.href = actionMap[action];
    } else {
        chatSendQuick(action);
    }
}

function showThinkingIndicator() {
    const container = document.getElementById('chat-messages');
    const thinkingEl = document.createElement('div');
    thinkingEl.id = 'chat-thinking';
    thinkingEl.className = 'flex justify-start';
    thinkingEl.innerHTML = `
        <div class="chat-bubble chat-assistant">
            <div class="flex items-center gap-2" data-testid="text-agent-thinking">
                <div class="flex gap-1">
                    <span class="w-2 h-2 bg-map-teal rounded-full animate-bounce" style="animation-delay:0ms"></span>
                    <span class="w-2 h-2 bg-map-teal rounded-full animate-bounce" style="animation-delay:150ms"></span>
                    <span class="w-2 h-2 bg-map-teal rounded-full animate-bounce" style="animation-delay:300ms"></span>
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400 thinking-text">Thinking...</span>
            </div>
        </div>`;
    container.appendChild(thinkingEl);
    container.scrollTop = container.scrollHeight;

    const thinkingSteps = [
        '🔍 Analysing your request...',
        '🧠 Planning approach...',
        '📊 Gathering data...',
        '⚙️ Processing...',
        '✍️ Composing response...',
    ];
    let step = 0;
    thinkingEl._interval = setInterval(() => {
        step = (step + 1) % thinkingSteps.length;
        const textEl = thinkingEl.querySelector('.thinking-text');
        if (textEl) textEl.textContent = thinkingSteps[step];
    }, 2000);
}

function removeThinkingIndicator() {
    const el = document.getElementById('chat-thinking');
    if (el) {
        if (el._interval) clearInterval(el._interval);
        el.remove();
    }
}

async function chatSend(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    if (!currentSessionId) {
        await chatNewSession();
    }

    input.value = '';
    hidePredictions();
    chatAppendMessage('user', message);

    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>';

    showThinkingIndicator();

    try {
        const result = await chatApi('/sessions/' + currentSessionId + '/messages', 'POST', { message });

        removeThinkingIndicator();

        if (result.message) {
            chatAppendMessage('assistant', result.message.content, result.quick_actions, result.confidence, result.tools_called);
        } else if (result.error) {
            chatAppendMessage('assistant', 'Sorry, something went wrong: ' + result.error);
        }
    } catch (err) {
        removeThinkingIndicator();
        chatAppendMessage('assistant', 'Connection error. Please try again.');
    }

    btn.disabled = false;
    btn.textContent = 'Send';
    await chatLoadSessions();
}

function chatSendQuick(text) {
    document.getElementById('chat-input').value = text;
    chatSend();
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = document.getElementById('chat-mic-btn');

    if (!SpeechRecognition) {
        if (micBtn) {
            micBtn.title = 'Voice input not supported in this browser';
            micBtn.classList.add('opacity-40', 'cursor-not-allowed');
            micBtn.disabled = true;
        }
        return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-AU';

    let finalTranscript = '';

    speechRecognition.onstart = () => {
        isListening = true;
        if (micBtn) {
            micBtn.classList.add('text-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'ring-2', 'ring-red-300');
            micBtn.setAttribute('aria-label', 'Stop voice input');
            micBtn.querySelector('.mic-icon').textContent = '⏹';
        }
        const sr = document.getElementById('speech-status');
        if (sr) { sr.textContent = 'Listening...'; sr.classList.remove('hidden'); }
    };

    speechRecognition.onresult = (event) => {
        let interim = '';
        finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        const input = document.getElementById('chat-input');
        const existing = input.dataset.preVoice || '';
        input.value = existing + finalTranscript + interim;
    };

    speechRecognition.onend = () => {
        isListening = false;
        if (micBtn) {
            micBtn.classList.remove('text-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'ring-2', 'ring-red-300');
            micBtn.setAttribute('aria-label', 'Start voice input');
            micBtn.querySelector('.mic-icon').textContent = '🎤';
        }
        const sr = document.getElementById('speech-status');
        if (sr) sr.classList.add('hidden');

        const input = document.getElementById('chat-input');
        if (finalTranscript) {
            input.dataset.preVoice = '';
        }
    };

    speechRecognition.onerror = (event) => {
        isListening = false;
        if (micBtn) {
            micBtn.classList.remove('text-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'ring-2', 'ring-red-300');
            micBtn.querySelector('.mic-icon').textContent = '🎤';
        }
        const sr = document.getElementById('speech-status');
        if (sr) sr.classList.add('hidden');

        if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone access in your browser settings.');
        }
    };
}

function toggleVoice() {
    if (!speechRecognition) return;
    const input = document.getElementById('chat-input');
    if (isListening) {
        speechRecognition.stop();
    } else {
        input.dataset.preVoice = input.value;
        speechRecognition.start();
    }
}

function initPredictions() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    input.addEventListener('input', () => {
        clearTimeout(predictionTimer);
        const text = input.value.trim();
        if (text.length < 3) {
            hidePredictions();
            return;
        }
        predictionTimer = setTimeout(() => fetchPredictions(text), 400);
    });

    input.addEventListener('keydown', (e) => {
        const dropdown = document.getElementById('prediction-dropdown');
        if (!dropdown || dropdown.classList.contains('hidden')) return;

        const items = dropdown.querySelectorAll('[data-prediction]');
        const active = dropdown.querySelector('.prediction-active');
        let idx = -1;
        items.forEach((item, i) => { if (item === active) idx = i; });

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items.forEach(i => i.classList.remove('prediction-active', 'bg-blue-50', 'dark:bg-blue-900/20'));
            const next = items[idx + 1 < items.length ? idx + 1 : 0];
            if (next) next.classList.add('prediction-active', 'bg-blue-50', 'dark:bg-blue-900/20');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items.forEach(i => i.classList.remove('prediction-active', 'bg-blue-50', 'dark:bg-blue-900/20'));
            const prev = items[idx - 1 >= 0 ? idx - 1 : items.length - 1];
            if (prev) prev.classList.add('prediction-active', 'bg-blue-50', 'dark:bg-blue-900/20');
        } else if (e.key === 'Tab' || (e.key === 'Enter' && active)) {
            if (active) {
                e.preventDefault();
                acceptPrediction(active.dataset.prediction);
            }
        } else if (e.key === 'Escape') {
            hidePredictions();
        }
    });
}

async function fetchPredictions(text) {
    try {
        const result = await chatApi('/predict', 'POST', {
            text: text,
            session_id: currentSessionId
        });
        if (result.predictions && result.predictions.length > 0) {
            showPredictions(text, result.predictions);
        } else {
            hidePredictions();
        }
    } catch (e) {
        hidePredictions();
    }
}

function showPredictions(currentText, predictions) {
    let dropdown = document.getElementById('prediction-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    dropdown.classList.remove('hidden');

    predictions.forEach((pred, i) => {
        const item = document.createElement('div');
        item.className = 'px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 flex items-center gap-2 min-h-[36px]' + (i === 0 ? ' prediction-active bg-blue-50 dark:bg-blue-900/20' : '');
        item.dataset.prediction = pred;
        item.dataset.testid = 'prediction-item-' + i;
        item.innerHTML = `<span class="text-map-teal text-xs">↳</span><span class="truncate"><span class="text-gray-400">${escHtml(currentText)}</span>${escHtml(pred)}</span>`;
        item.onclick = () => acceptPrediction(pred);
        dropdown.appendChild(item);
    });

    const hint = document.createElement('div');
    hint.className = 'px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700';
    hint.textContent = 'Tab to accept · ↑↓ to navigate · Esc to dismiss';
    dropdown.appendChild(hint);
}

function acceptPrediction(prediction) {
    const input = document.getElementById('chat-input');
    input.value = input.value.trim() + prediction;
    hidePredictions();
    input.focus();
}

function hidePredictions() {
    const dropdown = document.getElementById('prediction-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chatLoadSessions();
    initVoiceRecognition();
    initPredictions();
});
