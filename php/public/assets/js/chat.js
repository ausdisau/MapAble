let currentSessionId = null;

async function chatApi(path, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
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
        messages.forEach(m => chatAppendMessage(m.role, m.content, m.quick_actions, m.confidence));
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

function chatAppendMessage(role, content, quickActions, confidence) {
    const container = document.getElementById('chat-messages');
    document.getElementById('chat-empty').classList.add('hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (role === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'user' ? 'chat-user' : 'chat-assistant');

    const lines = content.split('\n');
    bubble.innerHTML = lines.map(l => l ? '<p>' + escHtml(l) + '</p>' : '<br>').join('');

    if (confidence && role === 'assistant') {
        const colors = { high: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', general: 'bg-gray-100 text-gray-600' };
        bubble.innerHTML += `<span class="confidence-badge ${colors[confidence] || colors.general} mt-2">${confidence}</span>`;
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
        'Report Barrier': null,
        'Talk to Human': null,
    };

    if (actionMap[action]) {
        window.location.href = actionMap[action];
    } else {
        chatSendQuick(action);
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
    chatAppendMessage('user', message);

    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;
    btn.textContent = '...';

    chatAppendMessage('assistant', 'Thinking...');

    try {
        const result = await chatApi('/sessions/' + currentSessionId + '/messages', 'POST', { message });

        const container = document.getElementById('chat-messages');
        container.removeChild(container.lastChild);

        if (result.message) {
            chatAppendMessage('assistant', result.message.content, result.quick_actions, result.confidence);
        } else if (result.error) {
            chatAppendMessage('assistant', 'Sorry, something went wrong: ' + result.error);
        }
    } catch (err) {
        const container = document.getElementById('chat-messages');
        container.removeChild(container.lastChild);
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

document.addEventListener('DOMContentLoaded', () => {
    chatLoadSessions();
});
