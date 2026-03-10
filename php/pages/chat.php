<?php
$pageTitle = 'MapAble Assistant';
require __DIR__ . '/../includes/layout_header.php';
?>
<div class="flex h-[calc(100vh-60px)]" data-testid="chat-container">
    <div id="chat-sidebar" class="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
        <div class="p-3 border-b border-gray-200 dark:border-gray-800">
            <button onclick="chatNewSession()" class="btn btn-teal w-full btn-sm" data-testid="button-new-chat">
                + New Conversation
            </button>
        </div>
        <div id="chat-sessions" class="flex-1 overflow-y-auto p-2 space-y-1" data-testid="chat-session-list">
        </div>
    </div>

    <div class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button onclick="document.getElementById('chat-sidebar').classList.toggle('hidden')" class="md:hidden btn btn-ghost btn-sm" data-testid="button-toggle-chat-sidebar">☰</button>
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-map-teal to-map-blue flex items-center justify-center text-white text-sm font-bold" data-testid="img-agent-avatar">M</div>
                <div>
                    <h2 class="font-semibold text-sm" data-testid="text-chat-title">MapAble Assistant</h2>
                    <p class="text-[10px] text-gray-400" data-testid="text-agent-subtitle">Agentic AI · Voice · Predictive Text</p>
                </div>
            </div>
        </div>

        <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
            <div class="text-center py-10 text-gray-400 space-y-4" id="chat-empty">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-map-teal to-map-blue flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg">M</div>
                <div>
                    <h3 class="font-semibold text-gray-600 dark:text-gray-300 text-lg" data-testid="text-welcome-title">MapAble Assistant</h3>
                    <p class="text-sm max-w-md mx-auto mt-1">I'm your intelligent NDIS assistant. I can plan multi-step tasks, look up your data, and help manage your care, transport, budget, and more.</p>
                </div>
                <div class="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span class="flex items-center gap-1">🎤 Voice input</span>
                    <span class="flex items-center gap-1">✨ Predictive text</span>
                    <span class="flex items-center gap-1">🔧 17 tools</span>
                </div>
                <div class="flex flex-wrap gap-2 justify-center mt-2">
                    <button onclick="chatSendQuick('Review my NDIS budget and suggest how to optimise spending')" class="badge badge-teal cursor-pointer min-h-[36px]" data-testid="button-quick-budget">📊 Review My Budget</button>
                    <button onclick="chatSendQuick('Find available care workers near me and show their ratings')" class="badge badge-blue cursor-pointer min-h-[36px]" data-testid="button-quick-carer">♥ Find Care Workers</button>
                    <button onclick="chatSendQuick('Search for wheelchair accessible transport options')" class="badge badge-gold cursor-pointer min-h-[36px]" data-testid="button-quick-transport">🚌 Accessible Transport</button>
                    <button onclick="chatSendQuick('Show me available disability support jobs')" class="badge badge-blue cursor-pointer min-h-[36px]" data-testid="button-quick-jobs">💼 Browse Jobs</button>
                    <button onclick="chatSendQuick('Report an accessibility barrier in my area')" class="badge badge-red cursor-pointer min-h-[36px]" data-testid="button-quick-barrier">⚠ Report Barrier</button>
                </div>
            </div>
        </div>

        <div id="chat-quick-actions" class="px-4 py-1 flex flex-wrap gap-2 hidden" data-testid="chat-quick-actions"></div>

        <div class="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900 relative">
            <div id="prediction-dropdown" class="hidden absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10" data-testid="prediction-dropdown"></div>
            <div id="speech-status" class="hidden text-xs text-red-500 font-medium mb-1 flex items-center gap-1.5 px-1" aria-live="polite" data-testid="text-speech-status">
                <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Listening...
            </div>
            <form id="chat-form" onsubmit="chatSend(event)" class="flex gap-2">
                <input type="text" id="chat-input" class="input flex-1" placeholder="Ask me anything — type or use voice..." autocomplete="off" data-testid="input-chat-message">
                <button type="button" id="chat-mic-btn" onclick="toggleVoice()" class="btn btn-ghost px-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all" aria-label="Start voice input" data-testid="button-voice-input">
                    <span class="mic-icon text-lg">🎤</span>
                </button>
                <button type="submit" id="chat-send-btn" class="btn btn-primary min-w-[44px] min-h-[44px]" data-testid="button-send-chat">Send</button>
            </form>
        </div>
    </div>
</div>

<script>window.csrfToken = '<?= h(csrfToken()) ?>';</script>
<script src="/assets/js/chat.js"></script>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
