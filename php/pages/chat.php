<?php
$pageTitle = 'MapAble Chat';
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
                <span class="text-map-teal text-lg">🤖</span>
                <div>
                    <h2 class="font-semibold text-sm" data-testid="text-chat-title">MapAble Chat</h2>
                    <p class="text-[10px] text-gray-400">AI-powered NDIS assistant</p>
                </div>
            </div>
        </div>

        <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
            <div class="text-center py-12 text-gray-400 space-y-3" id="chat-empty">
                <div class="text-4xl">🤖</div>
                <h3 class="font-semibold text-gray-600 dark:text-gray-300">Welcome to MapAble Chat</h3>
                <p class="text-sm max-w-sm mx-auto">I can help with care bookings, transport planning, NDIS pricing, accessibility, and more.</p>
                <div class="flex flex-wrap gap-2 justify-center mt-4">
                    <button onclick="chatSendQuick('What transport options are available?')" class="badge badge-blue cursor-pointer min-h-[36px]" data-testid="button-quick-transport">🚌 Transport Options</button>
                    <button onclick="chatSendQuick('Help me find a support worker')" class="badge badge-teal cursor-pointer min-h-[36px]" data-testid="button-quick-carer">♥ Find a Carer</button>
                    <button onclick="chatSendQuick('What is my current budget?')" class="badge badge-gold cursor-pointer min-h-[36px]" data-testid="button-quick-budget">💰 Check Budget</button>
                    <button onclick="chatSendQuick('Report an accessibility barrier')" class="badge badge-red cursor-pointer min-h-[36px]" data-testid="button-quick-barrier">⚠ Report Barrier</button>
                </div>
            </div>
        </div>

        <div id="chat-quick-actions" class="px-4 py-1 flex flex-wrap gap-2 hidden" data-testid="chat-quick-actions"></div>

        <div class="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
            <form id="chat-form" onsubmit="chatSend(event)" class="flex gap-2">
                <input type="text" id="chat-input" class="input flex-1" placeholder="Ask about care, transport, jobs, NDIS..." autocomplete="off" data-testid="input-chat-message">
                <button type="submit" id="chat-send-btn" class="btn btn-primary" data-testid="button-send-chat">Send</button>
            </form>
        </div>
    </div>
</div>

<script>window.csrfToken = '<?= h(csrfToken()) ?>';</script>
<script src="/assets/js/chat.js"></script>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
