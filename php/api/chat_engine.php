<?php

function getSystemPrompt($user, $accessProfile) {
    $name = $user['full_name'] ?? 'there';
    $mobility = '';
    if ($accessProfile) {
        $aids = json_decode($accessProfile['mobility_aids'] ?? '[]', true);
        if ($aids) $mobility .= "\n- Mobility aids: " . implode(', ', $aids);
        $mobility .= "\n- Max transfer distance: " . ($accessProfile['max_transfer_m'] ?? 200) . "m";
        $mobility .= "\n- Stairs allowed: " . (($accessProfile['stairs_allowed'] ?? true) ? 'Yes' : 'No');
        $mobility .= "\n- Communication mode: " . ($accessProfile['communication_mode'] ?? 'text');
    }

    return <<<PROMPT
You are MapAble Chat, the AI assistant for MapAble 4.0 — an NDIS superapp by Australian Disability Ltd.
You help participants with care bookings, transport planning, job searches, NDIS pricing, and accessibility guidance.

Current user: {$name}
Role: {$user['role']}{$mobility}

SAFETY-FIRST RULES:
1. If a user mentions stairs and their profile says stairs_allowed = false, ALWAYS warn them about the safety risk
2. If the transfer distance exceeds their max_transfer_m, warn them and suggest alternatives
3. Never provide medical advice — always recommend consulting their support coordinator
4. Be warm, inclusive, and use plain language
5. Reference NDIS item codes when discussing pricing
6. Suggest relevant quick actions based on the conversation

You can use tools to look up user profiles, search for transport workers, check barrier reports, get pricing, submit barrier reports, book transport, and escalate to a human agent.

Respond in a helpful, concise manner. Use Australian English.
PROMPT;
}

function getToolDefinitions() {
    return [
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_user_profile',
                'description' => 'Get the current user\'s full profile including access needs and NDIS details',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'search_transport_workers',
                'description' => 'Search for available transport workers, optionally filtering by wheelchair accessibility',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'wheelchair_accessible' => ['type' => 'boolean', 'description' => 'Filter for wheelchair accessible vehicles'],
                    ],
                    'required' => [],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'check_barrier_reports',
                'description' => 'Check community-reported accessibility barriers at a location',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'location' => ['type' => 'string', 'description' => 'Location to check for barriers'],
                    ],
                    'required' => ['location'],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_transport_pricing',
                'description' => 'Get the current transport pricing tier for the user',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'submit_barrier_report',
                'description' => 'Submit an accessibility barrier report',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'location_ref' => ['type' => 'string', 'description' => 'Location reference'],
                        'barrier_type' => ['type' => 'string', 'enum' => ['lift_out', 'ramp_blocked', 'path_closed', 'door_too_heavy', 'kerb_ramp_missing', 'inaccessible_toilet', 'unsafe_crossing', 'driver_bypass', 'helpful_staff', 'other']],
                        'severity' => ['type' => 'string', 'enum' => ['low', 'medium', 'high', 'critical']],
                        'description' => ['type' => 'string'],
                    ],
                    'required' => ['location_ref', 'barrier_type', 'severity'],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'book_transport',
                'description' => 'Book a transport trip for the user',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'pickup_location' => ['type' => 'string'],
                        'dropoff_location' => ['type' => 'string'],
                        'date' => ['type' => 'string'],
                        'time' => ['type' => 'string'],
                        'wheelchair_required' => ['type' => 'boolean'],
                    ],
                    'required' => ['pickup_location', 'dropoff_location', 'date', 'time'],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'escalate_to_human',
                'description' => 'Escalate the conversation to a human support coordinator',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'reason' => ['type' => 'string', 'description' => 'Reason for escalation'],
                    ],
                    'required' => ['reason'],
                ],
            ]
        ],
    ];
}

function executeTool($pdo, $userId, $name, $args) {
    switch ($name) {
        case 'get_user_profile':
            $user = getUser($pdo, $userId);
            $access = getAccessProfile($pdo, $userId);
            $budgets = getParticipantBudgets($pdo, $userId);
            return json_encode(['user' => $user, 'access_profile' => $access, 'budgets' => $budgets]);

        case 'search_transport_workers':
            $workers = array_filter(getWorkers($pdo), fn($w) => $w['transport_capable']);
            if (!empty($args['wheelchair_accessible'])) {
                $workers = array_filter($workers, fn($w) => $w['wheelchair_accessible']);
            }
            $result = array_map(fn($w) => [
                'name' => $w['full_name'], 'rating' => $w['rating'],
                'hourly_rate' => $w['hourly_rate'], 'transport_type' => $w['transport_type'],
                'wheelchair_accessible' => $w['wheelchair_accessible'],
            ], array_values($workers));
            return json_encode($result);

        case 'check_barrier_reports':
            $reports = getCommunityReports($pdo);
            $location = strtolower($args['location'] ?? '');
            $filtered = array_filter($reports, fn($r) => str_contains(strtolower($r['location_ref']), $location));
            return json_encode(array_values($filtered));

        case 'get_transport_pricing':
            $rate = calculateTransportRate($pdo, $userId, date('Y-m'));
            return json_encode($rate);

        case 'submit_barrier_report':
            $report = createCommunityReport($pdo, [
                'reporter_user_id' => $userId,
                'location_ref' => $args['location_ref'],
                'barrier_type' => $args['barrier_type'],
                'severity' => $args['severity'],
                'description' => $args['description'] ?? null,
            ]);
            return json_encode(['success' => true, 'report_id' => $report['id']]);

        case 'book_transport':
            $request = createTransportRequest($pdo, [
                'participant_id' => $userId,
                'worker_id' => null,
                'pickup_location' => $args['pickup_location'],
                'dropoff_location' => $args['dropoff_location'],
                'date' => $args['date'],
                'time' => $args['time'],
                'wheelchair_required' => $args['wheelchair_required'] ?? false,
                'notes' => null,
            ]);
            return json_encode(['success' => true, 'request_id' => $request['id']]);

        case 'escalate_to_human':
            return json_encode(['success' => true, 'message' => 'Escalated to human support coordinator. Reason: ' . ($args['reason'] ?? 'User request')]);

        default:
            return json_encode(['error' => 'Unknown tool: ' . $name]);
    }
}

function applyRulesEngine($pdo, $userId, $message, $accessProfile) {
    $warnings = [];
    $msgLower = strtolower($message);

    if ($accessProfile) {
        if (str_contains($msgLower, 'stair') && !($accessProfile['stairs_allowed'] ?? true)) {
            $warnings[] = "⚠️ Safety Notice: Your access profile indicates stairs are not suitable. Please consider step-free alternatives or ask about accessible routes.";
        }

        $maxTransfer = (int)($accessProfile['max_transfer_m'] ?? 200);
        if (preg_match('/(\d+)\s*(m|meter|metre)/i', $message, $m)) {
            $dist = (int)$m[1];
            if ($dist > $maxTransfer) {
                $warnings[] = "⚠️ Transfer Warning: The distance ({$dist}m) exceeds your maximum transfer distance ({$maxTransfer}m). Consider requesting door-to-door transport.";
            }
        }
    }

    return $warnings;
}

function generateQuickActions($message) {
    $actions = [];
    $msgLower = strtolower($message);

    if (str_contains($msgLower, 'transport') || str_contains($msgLower, 'ride') || str_contains($msgLower, 'trip')) {
        $actions[] = 'Book Transport';
        $actions[] = 'View Pricing';
    }
    if (str_contains($msgLower, 'carer') || str_contains($msgLower, 'care') || str_contains($msgLower, 'support worker')) {
        $actions[] = 'Find a Carer';
        $actions[] = 'View Budget';
    }
    if (str_contains($msgLower, 'job') || str_contains($msgLower, 'work') || str_contains($msgLower, 'employ')) {
        $actions[] = 'Browse Jobs';
    }
    if (str_contains($msgLower, 'budget') || str_contains($msgLower, 'ndis') || str_contains($msgLower, 'plan')) {
        $actions[] = 'View Budget';
        $actions[] = 'View Invoices';
    }
    if (str_contains($msgLower, 'barrier') || str_contains($msgLower, 'accessible') || str_contains($msgLower, 'ramp')) {
        $actions[] = 'Report Barrier';
    }
    if (str_contains($msgLower, 'help') || str_contains($msgLower, 'human') || str_contains($msgLower, 'coordinator')) {
        $actions[] = 'Talk to Human';
    }

    return array_unique(array_slice($actions, 0, 3));
}

function assessConfidence($response, $toolsUsed) {
    if ($toolsUsed > 0) return 'high';
    $len = strlen($response);
    if ($len > 200) return 'medium';
    return 'general';
}

function callOpenAI($messages, $tools = null) {
    $apiKey = OPENAI_API_KEY;
    $baseUrl = rtrim(OPENAI_BASE_URL, '/');

    if (!$apiKey) {
        return ['error' => 'OpenAI API key not configured'];
    }

    $payload = [
        'model' => 'gpt-4o',
        'messages' => $messages,
        'max_tokens' => 1024,
        'temperature' => 0.7,
    ];
    if ($tools) {
        $payload['tools'] = $tools;
        $payload['tool_choice'] = 'auto';
    }

    $ch = curl_init($baseUrl . '/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return ['error' => 'OpenAI API error (HTTP ' . $httpCode . '): ' . substr($response, 0, 200)];
    }

    return json_decode($response, true);
}

function processChat($pdo, $userId, $sessionId, $userMessage) {
    $user = getUser($pdo, $userId);
    $accessProfile = getAccessProfile($pdo, $userId);

    $warnings = applyRulesEngine($pdo, $userId, $userMessage, $accessProfile);

    $history = getChatMessages($pdo, $sessionId);
    $messages = [['role' => 'system', 'content' => getSystemPrompt($user, $accessProfile)]];
    foreach (array_slice($history, -20) as $h) {
        $messages[] = ['role' => $h['role'], 'content' => $h['content']];
    }
    $messages[] = ['role' => 'user', 'content' => $userMessage];

    $tools = getToolDefinitions();
    $toolsUsed = 0;

    for ($i = 0; $i < 5; $i++) {
        $result = callOpenAI($messages, $tools);

        if (isset($result['error'])) {
            $content = "I'm sorry, I encountered an issue: " . $result['error'] . ". Please try again or contact support.";
            return ['content' => $content, 'quick_actions' => ['Talk to Human'], 'confidence' => 'general', 'warnings' => $warnings];
        }

        $choice = $result['choices'][0] ?? null;
        if (!$choice) {
            return ['content' => "I'm having trouble processing your request. Please try again.", 'quick_actions' => [], 'confidence' => 'general', 'warnings' => $warnings];
        }

        $msg = $choice['message'];

        if (!empty($msg['tool_calls'])) {
            $messages[] = $msg;
            foreach ($msg['tool_calls'] as $tc) {
                $fnName = $tc['function']['name'];
                $fnArgs = json_decode($tc['function']['arguments'] ?? '{}', true) ?: [];
                $toolResult = executeTool($pdo, $userId, $fnName, $fnArgs);
                $messages[] = ['role' => 'tool', 'tool_call_id' => $tc['id'], 'content' => $toolResult];
                $toolsUsed++;
            }
            continue;
        }

        $content = $msg['content'] ?? '';

        if ($warnings) {
            $content = implode("\n\n", $warnings) . "\n\n" . $content;
        }

        $quickActions = generateQuickActions($userMessage . ' ' . $content);
        $confidence = assessConfidence($content, $toolsUsed);

        if (count($history) === 0) {
            $titleWords = array_slice(explode(' ', $userMessage), 0, 5);
            $title = implode(' ', $titleWords);
            $pdo->prepare('UPDATE chat_sessions SET title = ? WHERE id = ?')->execute([$title, $sessionId]);
        }

        return [
            'content' => $content,
            'quick_actions' => $quickActions,
            'confidence' => $confidence,
            'warnings' => $warnings,
            'tools_used' => $toolsUsed,
        ];
    }

    return ['content' => 'I\'ve been thinking about this quite a bit. Let me try a simpler approach — could you rephrase your question?', 'quick_actions' => ['Talk to Human'], 'confidence' => 'general', 'warnings' => $warnings];
}
