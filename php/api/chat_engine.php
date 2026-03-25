<?php

function getSystemPrompt($user, $accessProfile) {
    $name = $user['full_name'] ?? 'there';
    $role = $user['role'] ?? 'participant';
    $mobility = '';
    if ($accessProfile) {
        $aids = json_decode($accessProfile['mobility_aids'] ?? '[]', true);
        if ($aids) $mobility .= "\n- Mobility aids: " . implode(', ', $aids);
        $mobility .= "\n- Max transfer distance: " . ($accessProfile['max_transfer_m'] ?? 200) . "m";
        $mobility .= "\n- Stairs allowed: " . (($accessProfile['stairs_allowed'] ?? true) ? 'Yes' : 'No');
        $mobility .= "\n- Communication mode: " . ($accessProfile['communication_mode'] ?? 'text');
    }

    return <<<PROMPT
You are **MapAble Assistant**, the intelligent agentic AI for MapAble 4.0 — an NDIS superapp by Australian Disability Ltd.

## Identity
You are an autonomous assistant that helps NDIS participants manage their care, transport, employment, budgets, and accessibility needs. You can plan, reason, and execute multi-step tasks independently.

## Current User
- Name: {$name}
- Role: {$role}{$mobility}

## Agent Behaviour
1. **Think step-by-step**: Before responding, reason about what the user needs. If a request requires multiple actions, plan your steps, then execute them in sequence.
2. **Use tools proactively**: When data is available via a tool, ALWAYS use it rather than guessing. Fetch real data to give accurate, personalised answers.
3. **Multi-step execution**: For complex requests (e.g., "find me a carer and check my budget"), call multiple tools and synthesise a unified response.
4. **Be proactive**: After completing a task, suggest logical next steps the user might want to take.
5. **Personalise**: Use the user's access profile, budget state, and conversation history to tailor your responses.

## Safety-First Rules
1. If a user mentions stairs and their profile says stairs_allowed = false, ALWAYS warn them about the safety risk.
2. If the transfer distance exceeds their max_transfer_m, warn them and suggest alternatives.
3. Never provide medical advice — always recommend consulting their support coordinator.
4. Be warm, inclusive, and use plain language.
5. Reference NDIS item codes when discussing pricing.

## Output Format
- Use **markdown** formatting: bold for emphasis, bullet lists for data, headers for sections.
- Structure longer responses with clear sections.
- When presenting data from tools (workers, jobs, budgets), format as organised lists.
- Use Australian English.
- Keep responses helpful and concise, but thorough when the user needs detail.

## Available Capabilities
You have tools to: look up user profiles, search care workers, search transport workers, search jobs, check budgets, get pricing, view bookings/sessions/trips/invoices, report barriers, book transport, send emails, check email inbox, and escalate to human support.

## Email
You can send emails on behalf of the user via AgentMail (send_email tool). Use this for shift confirmations, invoice reminders, contacting support coordinators, or any email the user requests. You can also check their email inbox (get_email_messages tool).
PROMPT;
}

function getToolDefinitions() {
    return [
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_user_profile',
                'description' => 'Get the current user\'s full profile including access needs, NDIS details, and budget overview',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'search_care_workers',
                'description' => 'Search for available care/support workers with optional filters',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'verified_only' => ['type' => 'boolean', 'description' => 'Only show verified workers'],
                        'transport_capable' => ['type' => 'boolean', 'description' => 'Only show workers who can provide transport'],
                        'location' => ['type' => 'string', 'description' => 'Filter by location'],
                    ],
                    'required' => [],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_worker_details',
                'description' => 'Get a specific worker\'s full profile including reviews, skills, and availability',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'worker_id' => ['type' => 'string', 'description' => 'The worker ID to look up'],
                    ],
                    'required' => ['worker_id'],
                ],
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
                'name' => 'check_budget',
                'description' => 'Get the user\'s current NDIS budget breakdown showing all categories with allocated vs used amounts',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_care_pricing',
                'description' => 'Get the current care pricing tier and hourly rate for the user based on their usage this month',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_transport_pricing',
                'description' => 'Get the current transport pricing tier and per-km rate for the user based on their usage this month',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'search_jobs',
                'description' => 'Search for disability support jobs with optional filters',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'category' => ['type' => 'string', 'description' => 'Job category filter', 'enum' => ['care', 'transport', 'support', 'employment']],
                        'location' => ['type' => 'string', 'description' => 'Location filter'],
                        'job_type' => ['type' => 'string', 'description' => 'Job type filter', 'enum' => ['full-time', 'part-time', 'casual', 'contract']],
                    ],
                    'required' => [],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_job_details',
                'description' => 'Get full details of a specific job posting',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'job_id' => ['type' => 'string', 'description' => 'The job ID to look up'],
                    ],
                    'required' => ['job_id'],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_my_bookings',
                'description' => 'Get the user\'s care bookings (upcoming and past)',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_my_care_sessions',
                'description' => 'Get the user\'s completed and in-progress care sessions with hours and charges',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_my_transport_trips',
                'description' => 'Get the user\'s transport trip history with distances and charges',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_my_invoices',
                'description' => 'Get the user\'s invoices with totals and status',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
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
                'name' => 'submit_barrier_report',
                'description' => 'Submit an accessibility barrier report to the community',
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
                'description' => 'Escalate the conversation to a human support coordinator when the user needs specialised help',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'reason' => ['type' => 'string', 'description' => 'Reason for escalation'],
                    ],
                    'required' => ['reason'],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'send_email',
                'description' => 'Send an email notification to a recipient via AgentMail. Use for shift confirmations, invoice reminders, support messages, or any email the user requests.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'to' => ['type' => 'string', 'description' => 'Recipient email address'],
                        'subject' => ['type' => 'string', 'description' => 'Email subject line'],
                        'body' => ['type' => 'string', 'description' => 'Email body text content'],
                    ],
                    'required' => ['to', 'subject', 'body'],
                ],
            ]
        ],
        [
            'type' => 'function',
            'function' => [
                'name' => 'get_email_messages',
                'description' => 'Get recent emails from the user\'s MapAble inbox',
                'parameters' => ['type' => 'object', 'properties' => new \stdClass(), 'required' => []],
            ]
        ],
    ];
}

function getToolFriendlyName($name) {
    $names = [
        'get_user_profile' => 'Fetching your profile',
        'search_care_workers' => 'Searching care workers',
        'get_worker_details' => 'Looking up worker details',
        'search_transport_workers' => 'Searching transport workers',
        'check_budget' => 'Checking your budget',
        'get_care_pricing' => 'Getting care pricing',
        'get_transport_pricing' => 'Getting transport pricing',
        'search_jobs' => 'Searching jobs',
        'get_job_details' => 'Looking up job details',
        'get_my_bookings' => 'Fetching your bookings',
        'get_my_care_sessions' => 'Fetching care sessions',
        'get_my_transport_trips' => 'Fetching transport trips',
        'get_my_invoices' => 'Fetching your invoices',
        'check_barrier_reports' => 'Checking barrier reports',
        'submit_barrier_report' => 'Submitting barrier report',
        'book_transport' => 'Booking transport',
        'escalate_to_human' => 'Connecting to support',
        'send_email' => 'Sending email',
        'get_email_messages' => 'Checking emails',
    ];
    return $names[$name] ?? $name;
}

function executeTool($pdo, $userId, $name, $args) {
    switch ($name) {
        case 'get_user_profile':
            $user = getUser($pdo, $userId);
            $access = getAccessProfile($pdo, $userId);
            $budgets = getParticipantBudgets($pdo, $userId);
            return json_encode(['user' => $user, 'access_profile' => $access, 'budgets' => $budgets]);

        case 'search_care_workers':
            $workers = getWorkers($pdo);
            if (!empty($args['verified_only'])) {
                $workers = array_filter($workers, fn($w) => $w['is_verified']);
            }
            if (!empty($args['transport_capable'])) {
                $workers = array_filter($workers, fn($w) => $w['transport_capable']);
            }
            if (!empty($args['location'])) {
                $loc = strtolower($args['location']);
                $workers = array_filter($workers, fn($w) => str_contains(strtolower($w['location'] ?? ''), $loc));
            }
            $result = array_map(fn($w) => [
                'id' => $w['id'], 'name' => $w['full_name'], 'rating' => $w['rating'],
                'hourly_rate' => $w['hourly_rate'], 'is_verified' => $w['is_verified'],
                'specializations' => $w['specializations'] ?? null,
                'location' => $w['location'] ?? null,
                'transport_capable' => $w['transport_capable'],
            ], array_values($workers));
            return json_encode($result);

        case 'get_worker_details':
            $worker = getWorker($pdo, $args['worker_id']);
            if (!$worker) return json_encode(['error' => 'Worker not found']);
            $reviews = getReviewsForWorker($pdo, $args['worker_id']);
            return json_encode(['worker' => $worker, 'reviews' => $reviews]);

        case 'search_transport_workers':
            $workers = array_filter(getWorkers($pdo), fn($w) => $w['transport_capable']);
            if (!empty($args['wheelchair_accessible'])) {
                $workers = array_filter($workers, fn($w) => $w['wheelchair_accessible']);
            }
            $result = array_map(fn($w) => [
                'id' => $w['id'], 'name' => $w['full_name'], 'rating' => $w['rating'],
                'hourly_rate' => $w['hourly_rate'], 'transport_type' => $w['transport_type'],
                'wheelchair_accessible' => $w['wheelchair_accessible'],
            ], array_values($workers));
            return json_encode($result);

        case 'check_budget':
            $budgets = getParticipantBudgets($pdo, $userId);
            $summary = array_map(fn($b) => [
                'category' => $b['category'],
                'total_allocated' => (float)$b['total_allocated'],
                'total_used' => (float)$b['total_used'],
                'remaining' => (float)$b['total_allocated'] - (float)$b['total_used'],
                'percent_used' => $b['total_allocated'] > 0 ? round(((float)$b['total_used'] / (float)$b['total_allocated']) * 100, 1) : 0,
            ], $budgets);
            return json_encode($summary);

        case 'get_care_pricing':
            $rate = calculateCareRate($pdo, $userId, date('Y-m'));
            return json_encode($rate);

        case 'get_transport_pricing':
            $rate = calculateTransportRate($pdo, $userId, date('Y-m'));
            return json_encode($rate);

        case 'search_jobs':
            $jobs = getJobs($pdo);
            if (!empty($args['category'])) {
                $cat = strtolower($args['category']);
                $jobs = array_filter($jobs, fn($j) => strtolower($j['category'] ?? '') === $cat);
            }
            if (!empty($args['location'])) {
                $loc = strtolower($args['location']);
                $jobs = array_filter($jobs, fn($j) => str_contains(strtolower($j['location'] ?? ''), $loc));
            }
            if (!empty($args['job_type'])) {
                $jt = strtolower($args['job_type']);
                $jobs = array_filter($jobs, fn($j) => strtolower($j['job_type'] ?? '') === $jt);
            }
            $result = array_map(fn($j) => [
                'id' => $j['id'], 'title' => $j['title'], 'location' => $j['location'],
                'job_type' => $j['job_type'], 'salary' => $j['salary'], 'category' => $j['category'],
            ], array_values($jobs));
            return json_encode($result);

        case 'get_job_details':
            $job = getJob($pdo, $args['job_id']);
            if (!$job) return json_encode(['error' => 'Job not found']);
            return json_encode($job);

        case 'get_my_bookings':
            $stmt = $pdo->prepare('SELECT b.*, u.full_name as worker_name FROM bookings b
                LEFT JOIN workers w ON b.worker_id = w.id LEFT JOIN users u ON w.user_id = u.id
                WHERE b.participant_id = ? ORDER BY b.date DESC LIMIT 20');
            $stmt->execute([$userId]);
            return json_encode($stmt->fetchAll());

        case 'get_my_care_sessions':
            $sessions = getServiceSessions($pdo, $userId);
            return json_encode(array_slice($sessions, 0, 20));

        case 'get_my_transport_trips':
            $trips = getTransportTrips($pdo, $userId);
            return json_encode(array_slice($trips, 0, 20));

        case 'get_my_invoices':
            $invoices = getInvoices($pdo, $userId);
            $result = array_map(fn($inv) => [
                'id' => $inv['id'], 'period_start' => $inv['period_start'], 'period_end' => $inv['period_end'],
                'total_amount' => (float)($inv['total_amount'] ?? 0), 'ndis_claimable' => (float)($inv['ndis_claimable'] ?? 0),
                'status' => $inv['status'], 'generated_at' => $inv['generated_at'],
            ], $invoices);
            return json_encode($result);

        case 'check_barrier_reports':
            $reports = getCommunityReports($pdo);
            $location = strtolower($args['location'] ?? '');
            $filtered = array_filter($reports, fn($r) => str_contains(strtolower($r['location_ref']), $location));
            return json_encode(array_values($filtered));

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

        case 'send_email':
            $emailBase = 'http://127.0.0.1:3001';
            $stmt = $pdo->prepare('SELECT * FROM user_email_inboxes WHERE user_id = ? ORDER BY created_at LIMIT 1');
            $stmt->execute([$userId]);
            $userInbox = $stmt->fetch();
            if (!$userInbox) {
                return json_encode(['error' => 'No email inbox configured. Please set one up on the Email page first.']);
            }
            $inboxId = $userInbox['inbox_id'];
            $ch = curl_init($emailBase . '/api/email/send');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode([
                    'inbox_id' => $inboxId,
                    'to' => $args['to'],
                    'subject' => $args['subject'],
                    'text' => $args['body'],
                    'html' => '<div style="font-family:Arial,sans-serif;color:#333;">' . nl2br(htmlspecialchars($args['body'])) . '</div>',
                ]),
            ]);
            $emailRes = curl_exec($ch);
            $emailCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            curl_close($ch);
            if ($curlErr) {
                return json_encode(['error' => 'Email service unavailable: ' . $curlErr]);
            }
            if ($emailCode >= 200 && $emailCode < 300) {
                return json_encode(['success' => true, 'message' => 'Email sent to ' . $args['to']]);
            }
            $emailErr = json_decode($emailRes ?: '{}', true);
            return json_encode(['error' => 'Failed to send email: ' . ($emailErr['message'] ?? $emailErr['error'] ?? 'Unknown error')]);

        case 'get_email_messages':
            $emailBase = 'http://127.0.0.1:3001';
            $stmt = $pdo->prepare('SELECT * FROM user_email_inboxes WHERE user_id = ? ORDER BY created_at LIMIT 1');
            $stmt->execute([$userId]);
            $userInbox = $stmt->fetch();
            if (!$userInbox) {
                return json_encode(['error' => 'No email inbox configured. Visit the Email page to create one.']);
            }
            $inboxId = $userInbox['inbox_id'];
            $ch = curl_init($emailBase . '/api/email/messages/' . urlencode($inboxId) . '?limit=10');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_CONNECTTIMEOUT => 5,
            ]);
            $msgsRes = curl_exec($ch);
            $curlErr = curl_error($ch);
            curl_close($ch);
            if ($curlErr) {
                return json_encode(['error' => 'Email service unavailable: ' . $curlErr]);
            }
            $msgsData = json_decode($msgsRes ?: '{}', true);
            $emailMessages = $msgsData['messages'] ?? $msgsData['items'] ?? [];
            $result = array_map(fn($m) => [
                'id' => $m['message_id'] ?? $m['id'] ?? '',
                'from' => $m['from'] ?? '',
                'subject' => $m['subject'] ?? '',
                'preview' => mb_substr($m['extracted_text'] ?? $m['text'] ?? '', 0, 200),
                'date' => $m['created_at'] ?? '',
            ], array_slice($emailMessages, 0, 10));
            return json_encode(['inbox' => $userInbox['email'], 'messages' => $result]);

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

function assessConfidence($response, $toolsUsed) {
    if ($toolsUsed > 0) return 'high';
    $len = strlen($response);
    if ($len > 200) return 'medium';
    return 'general';
}

function callOpenAI($messages, $tools = null, $maxTokens = 1024, $temperature = 0.7) {
    $apiKey = OPENAI_API_KEY;
    $baseUrl = rtrim(OPENAI_BASE_URL, '/');

    if (!$apiKey) {
        return ['error' => 'OpenAI API key not configured'];
    }

    $payload = [
        'model' => 'gpt-4o',
        'messages' => $messages,
        'max_tokens' => $maxTokens,
        'temperature' => $temperature,
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
    $toolsCalled = [];
    $reasoningSteps = 0;
    $agentStatus = 'completed';

    for ($i = 0; $i < 10; $i++) {
        $reasoningSteps++;
        $result = callOpenAI($messages, $tools);

        if (isset($result['error'])) {
            $content = "I'm sorry, I encountered an issue: " . $result['error'] . ". Please try again or contact support.";
            $agentStatus = 'partial';
            return [
                'content' => $content,
                'quick_actions' => ['Talk to Human'],
                'confidence' => 'general',
                'warnings' => $warnings,
                'tools_used' => $toolsUsed,
                'tools_called' => $toolsCalled,
                'reasoning_steps' => $reasoningSteps,
                'agent_status' => $agentStatus,
            ];
        }

        $choice = $result['choices'][0] ?? null;
        if (!$choice) {
            return [
                'content' => "I'm having trouble processing your request. Please try again.",
                'quick_actions' => [],
                'confidence' => 'general',
                'warnings' => $warnings,
                'tools_used' => $toolsUsed,
                'tools_called' => $toolsCalled,
                'reasoning_steps' => $reasoningSteps,
                'agent_status' => 'partial',
            ];
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
                $toolsCalled[] = ['name' => $fnName, 'summary' => getToolFriendlyName($fnName)];
            }
            continue;
        }

        $content = $msg['content'] ?? '';

        if ($warnings) {
            $content = implode("\n\n", $warnings) . "\n\n" . $content;
        }

        $confidence = assessConfidence($content, $toolsUsed);

        if ($toolsUsed > 0 && str_contains(strtolower($content), 'escalat')) {
            $agentStatus = 'escalated';
        }

        if (count($history) === 0) {
            $titleWords = array_slice(explode(' ', $userMessage), 0, 6);
            $title = implode(' ', $titleWords);
            if (strlen($title) > 50) $title = substr($title, 0, 47) . '...';
            $pdo->prepare('UPDATE chat_sessions SET title = ? WHERE id = ?')->execute([$title, $sessionId]);
        }

        return [
            'content' => $content,
            'quick_actions' => [],
            'confidence' => $confidence,
            'warnings' => $warnings,
            'tools_used' => $toolsUsed,
            'tools_called' => $toolsCalled,
            'reasoning_steps' => $reasoningSteps,
            'agent_status' => $agentStatus,
        ];
    }

    return [
        'content' => "I've been working through a complex request. Could you rephrase or break it into smaller questions?",
        'quick_actions' => ['Talk to Human'],
        'confidence' => 'general',
        'warnings' => $warnings,
        'tools_used' => $toolsUsed,
        'tools_called' => $toolsCalled,
        'reasoning_steps' => $reasoningSteps,
        'agent_status' => 'partial',
    ];
}

function generatePredictions($pdo, $userId, $text, $sessionId = null) {
    $apiKey = OPENAI_API_KEY;
    if (!$apiKey || strlen($text) < 3) {
        return [];
    }

    $contextMessages = [];
    if ($sessionId) {
        $history = getChatMessages($pdo, $sessionId);
        $recent = array_slice($history, -4);
        foreach ($recent as $h) {
            $contextMessages[] = ['role' => $h['role'], 'content' => substr($h['content'], 0, 200)];
        }
    }

    $messages = [
        ['role' => 'system', 'content' => 'You are a text prediction assistant for an NDIS disability services app called MapAble. Given the partial text the user is typing, suggest 1-3 short completions (the remaining words/phrase to complete their thought). Each prediction should be just the continuation, not the full text. Keep predictions concise (2-8 words). Consider NDIS terminology: support worker, wheelchair accessible, transport booking, NDIS budget, care plan, accessibility, barrier report, service session. Return predictions as a JSON array of strings, nothing else.'],
    ];

    foreach ($contextMessages as $cm) {
        $messages[] = $cm;
    }

    $messages[] = ['role' => 'user', 'content' => 'Complete this partial text: "' . $text . '"'];

    $result = callOpenAI($messages, null, 60, 0.3);

    if (isset($result['error'])) return [];

    $content = $result['choices'][0]['message']['content'] ?? '[]';
    $content = trim($content);
    if (str_starts_with($content, '```')) {
        $content = preg_replace('/^```(?:json)?\s*/', '', $content);
        $content = preg_replace('/\s*```$/', '', $content);
    }

    $predictions = json_decode($content, true);
    if (!is_array($predictions)) return [];

    return array_slice(array_filter($predictions, 'is_string'), 0, 3);
}
