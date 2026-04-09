<?php

function getUser($pdo, $id) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getUserByUsername($pdo, $username) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    return $stmt->fetch();
}

function updateUserProfile($pdo, $id, $data) {
    $fields = [];
    $values = [];
    foreach (['full_name', 'email', 'location'] as $col) {
        if (isset($data[$col])) {
            $fields[] = "$col = ?";
            $values[] = $data[$col];
        }
    }
    if (empty($fields)) return getUser($pdo, $id);
    $values[] = $id;
    $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
    return getUser($pdo, $id);
}

function updateUserAvatar($pdo, $id, $avatar) {
    $pdo->prepare('UPDATE users SET avatar = ? WHERE id = ?')->execute([$avatar, $id]);
    return getUser($pdo, $id);
}

function getWorkers($pdo) {
    return $pdo->query('SELECT w.*, u.full_name, u.email, u.location, u.bio, u.languages, u.skills, u.phone_number, u.role
        FROM workers w JOIN users u ON w.user_id = u.id ORDER BY w.rating DESC')->fetchAll();
}

function getWorker($pdo, $id) {
    $stmt = $pdo->prepare('SELECT w.*, u.full_name, u.email, u.location, u.bio, u.languages, u.skills, u.phone_number, u.role, u.username
        FROM workers w JOIN users u ON w.user_id = u.id WHERE w.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function updateWorkerPhoto($pdo, $id, $photo) {
    $pdo->prepare('UPDATE workers SET photo = ? WHERE id = ?')->execute([$photo, $id]);
    return getWorker($pdo, $id);
}

function getBookings($pdo) {
    return $pdo->query('SELECT * FROM bookings ORDER BY date DESC')->fetchAll();
}

function getBookingById($pdo, $bookingId) {
    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = ?');
    $stmt->execute([$bookingId]);
    return $stmt->fetch();
}

function createBooking($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO bookings (participant_id, worker_id, service_type, date, start_time, end_time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$data['participant_id'], $data['worker_id'], $data['service_type'],
        $data['date'], $data['start_time'], $data['end_time'] ?? null, $data['notes'] ?? null]);
    return $stmt->fetch();
}

function getJobs($pdo) {
    return $pdo->query('SELECT * FROM jobs ORDER BY title')->fetchAll();
}

function getJob($pdo, $id) {
    $stmt = $pdo->prepare('SELECT * FROM jobs WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function createJob($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO jobs (posted_by, title, description, location, job_type, salary, requirements, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *');
    $reqs = is_array($data['requirements']) ? '{' . implode(',', array_map(fn($r) => '"' . $r . '"', $data['requirements'])) . '}' : $data['requirements'];
    $stmt->execute([$data['posted_by'], $data['title'], $data['description'], $data['location'],
        $data['job_type'], $data['salary'] ?? null, $reqs, $data['category']]);
    return $stmt->fetch();
}

function getTransportRequests($pdo) {
    return $pdo->query('SELECT * FROM transport_requests ORDER BY date DESC')->fetchAll();
}

function createTransportRequest($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO transport_requests (participant_id, worker_id, pickup_location, dropoff_location, date, time, wheelchair_required, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$data['participant_id'], $data['worker_id'] ?? null, $data['pickup_location'],
        $data['dropoff_location'], $data['date'], $data['time'], $data['wheelchair_required'] ? 'true' : 'false', $data['notes'] ?? null]);
    return $stmt->fetch();
}

function getMessages($pdo) {
    return $pdo->query('SELECT m.*, u.full_name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id ORDER BY timestamp DESC')->fetchAll();
}

function createMessage($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?) RETURNING *');
    $stmt->execute([$data['sender_id'], $data['receiver_id'], $data['body']]);
    return $stmt->fetch();
}

function getPricingTiers($pdo, $serviceType) {
    $stmt = $pdo->prepare('SELECT * FROM pricing_tiers WHERE service_type = ? ORDER BY min_usage');
    $stmt->execute([$serviceType]);
    return $stmt->fetchAll();
}

function calculateCareRate($pdo, $participantId, $month) {
    $monthStart = date('Y-m-01', strtotime($month));
    $monthEnd = date('Y-m-t', strtotime($month));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(actual_hours), 0) as total_hours FROM service_sessions
        WHERE participant_id = ? AND status = 'completed' AND date >= ? AND date <= ?");
    $stmt->execute([$participantId, $monthStart, $monthEnd]);
    $totalHours = (float)$stmt->fetch()['total_hours'];
    if ($totalHours >= 31) return ['rate' => 65.00, 'tier' => 'High Support', 'hours' => $totalHours];
    if ($totalHours >= 11) return ['rate' => 68.00, 'tier' => 'Standard Care', 'hours' => $totalHours];
    return ['rate' => 70.23, 'tier' => 'Basic Care', 'hours' => $totalHours];
}

function calculateTransportRate($pdo, $participantId, $month) {
    $monthStart = date('Y-m-01', strtotime($month));
    $monthEnd = date('Y-m-t', strtotime($month));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(distance_km), 0) as total_km FROM transport_trips
        WHERE participant_id = ? AND status = 'completed' AND date >= ? AND date <= ?");
    $stmt->execute([$participantId, $monthStart, $monthEnd]);
    $totalKm = (float)$stmt->fetch()['total_km'];
    if ($totalKm >= 301) return ['rate' => 0.85, 'tier' => 'High Mobility', 'km' => $totalKm];
    if ($totalKm >= 101) return ['rate' => 0.90, 'tier' => 'Standard Mobility', 'km' => $totalKm];
    return ['rate' => 0.99, 'tier' => 'Basic Mobility', 'km' => $totalKm];
}

function createServiceSession($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO service_sessions (booking_id, worker_id, participant_id, start_time, end_time, actual_hours, hourly_rate, tier_applied, ndis_item_code, total_charge, shift_notes, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$data['booking_id'] ?? null, $data['worker_id'], $data['participant_id'],
        $data['start_time'], $data['end_time'] ?? null, $data['actual_hours'] ?? null,
        $data['hourly_rate'] ?? null, $data['tier_applied'] ?? null, $data['ndis_item_code'] ?? null,
        $data['total_charge'] ?? null, $data['shift_notes'] ?? null, $data['status'] ?? 'in_progress', $data['date']]);
    return $stmt->fetch();
}

function getServiceSessions($pdo, $participantId) {
    $stmt = $pdo->prepare('SELECT ss.*, u.full_name as worker_name FROM service_sessions ss
        LEFT JOIN workers w ON ss.worker_id = w.id LEFT JOIN users u ON w.user_id = u.id
        WHERE ss.participant_id = ? ORDER BY ss.date DESC');
    $stmt->execute([$participantId]);
    return $stmt->fetchAll();
}

function createTransportTrip($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO transport_trips (transport_request_id, worker_id, participant_id, distance_km, per_km_rate, tier_applied, accessible_vehicle, accessible_surcharge, tolls, total_charge, ndis_item_code, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$data['transport_request_id'] ?? null, $data['worker_id'], $data['participant_id'],
        $data['distance_km'] ?? null, $data['per_km_rate'] ?? null, $data['tier_applied'] ?? null,
        $data['accessible_vehicle'] ? 'true' : 'false', $data['accessible_surcharge'] ?? 0,
        $data['tolls'] ?? 0, $data['total_charge'] ?? null, $data['ndis_item_code'] ?? null,
        $data['status'] ?? 'in_progress', $data['date']]);
    return $stmt->fetch();
}

function getTransportTrips($pdo, $participantId) {
    $stmt = $pdo->prepare('SELECT tt.*, u.full_name as worker_name FROM transport_trips tt
        LEFT JOIN workers w ON tt.worker_id = w.id LEFT JOIN users u ON w.user_id = u.id
        WHERE tt.participant_id = ? ORDER BY tt.date DESC');
    $stmt->execute([$participantId]);
    return $stmt->fetchAll();
}

function getInvoices($pdo, $participantId) {
    $stmt = $pdo->prepare('SELECT * FROM invoices WHERE participant_id = ? ORDER BY generated_at DESC');
    $stmt->execute([$participantId]);
    return $stmt->fetchAll();
}

function getGstRate($ndisItemCode, $serviceType) {
    $gstFreeNdisCodes = [
        '01_011_0107_1_1',
        '01_015_0107_1_1',
        '01_002_0107_1_1',
        '04_104_0125_6_1',
        '07_001_0106_8_3',
        '09_011_0117_6_3',
        '15_037_0117_1_3',
    ];
    if (in_array($ndisItemCode, $gstFreeNdisCodes)) {
        return 0.0;
    }
    $gstNdisPrefixes = ['02_'];
    foreach ($gstNdisPrefixes as $prefix) {
        if (str_starts_with($ndisItemCode, $prefix)) {
            return 0.10;
        }
    }
    if ($serviceType === 'transport') {
        return 0.10;
    }
    return 0.0;
}

function generateInvoice($pdo, $participantId, $periodStart, $periodEnd) {
    $stmt = $pdo->prepare("SELECT ss.*, u.full_name as worker_name FROM service_sessions ss
        LEFT JOIN workers w ON ss.worker_id = w.id LEFT JOIN users u ON w.user_id = u.id
        WHERE ss.participant_id = ? AND ss.status = 'completed' AND ss.date >= ? AND ss.date <= ?");
    $stmt->execute([$participantId, $periodStart, $periodEnd]);
    $sessions = $stmt->fetchAll();

    $stmt2 = $pdo->prepare("SELECT tt.*, u.full_name as worker_name FROM transport_trips tt
        LEFT JOIN workers w ON tt.worker_id = w.id LEFT JOIN users u ON w.user_id = u.id
        WHERE tt.participant_id = ? AND tt.status = 'completed' AND tt.date >= ? AND tt.date <= ?");
    $stmt2->execute([$participantId, $periodStart, $periodEnd]);
    $trips = $stmt2->fetchAll();

    $lineItems = [];
    $subtotalExGst = 0;
    $totalGst = 0;
    foreach ($sessions as $s) {
        $sub = (float)($s['total_charge'] ?? 0);
        $ndisCode = $s['ndis_item_code'] ?? '01_011_0107_1_1';
        $gstRate = getGstRate($ndisCode, 'care');
        $gstAmt = round($sub * $gstRate, 2);
        $lineItems[] = [
            'type' => 'care',
            'description' => 'Care Session - ' . ($s['worker_name'] ?? 'Worker'),
            'date' => $s['date'],
            'quantity' => (float)($s['actual_hours'] ?? 0),
            'unit' => 'hours',
            'rate' => (float)($s['hourly_rate'] ?? 0),
            'subtotal' => $sub,
            'gst_rate' => $gstRate,
            'gst_amount' => $gstAmt,
            'total_inc_gst' => $sub + $gstAmt,
            'gst_free' => $gstRate === 0.0,
            'ndisItemCode' => $ndisCode,
        ];
        $subtotalExGst += $sub;
        $totalGst += $gstAmt;
    }
    foreach ($trips as $t) {
        $sub = (float)($t['total_charge'] ?? 0);
        $ndisCode = $t['ndis_item_code'] ?? '02_051_0108_1_1';
        $gstRate = getGstRate($ndisCode, 'transport');
        $gstAmt = round($sub * $gstRate, 2);
        $lineItems[] = [
            'type' => 'transport',
            'description' => 'Transport Trip - ' . ($t['worker_name'] ?? 'Driver'),
            'date' => $t['date'],
            'quantity' => (float)($t['distance_km'] ?? 0),
            'unit' => 'km',
            'rate' => (float)($t['per_km_rate'] ?? 0),
            'subtotal' => $sub,
            'gst_rate' => $gstRate,
            'gst_amount' => $gstAmt,
            'total_inc_gst' => $sub + $gstAmt,
            'gst_free' => $gstRate === 0.0,
            'ndisItemCode' => $ndisCode,
        ];
        $subtotalExGst += $sub;
        $totalGst += $gstAmt;
    }

    $totalIncGst = $subtotalExGst + $totalGst;

    $providerStmt = $pdo->prepare("SELECT id FROM users WHERE role = 'provider' LIMIT 1");
    $providerStmt->execute();
    $provider = $providerStmt->fetch();

    $ins = $pdo->prepare('INSERT INTO invoices (participant_id, provider_id, period_start, period_end, total_amount, gst_amount, total_inc_gst, ndis_claimable, status, line_items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *');
    $ins->execute([$participantId, $provider['id'] ?? null, $periodStart, $periodEnd,
        $subtotalExGst, $totalGst, $totalIncGst, $subtotalExGst, 'draft', json_encode($lineItems)]);
    return $ins->fetch();
}

function getParticipantBudgets($pdo, $participantId) {
    $stmt = $pdo->prepare('SELECT * FROM participant_budgets WHERE participant_id = ? ORDER BY category');
    $stmt->execute([$participantId]);
    return $stmt->fetchAll();
}

function updateBudgetUsage($pdo, $participantId, $category, $amount) {
    $pdo->prepare('UPDATE participant_budgets SET total_used = total_used + ? WHERE participant_id = ? AND category = ?')
        ->execute([$amount, $participantId, $category]);
}

function createReview($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO reviews (participant_id, worker_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$data['participant_id'], $data['worker_id'], $data['booking_id'] ?? null, $data['rating'], $data['comment'] ?? null]);
    $review = $stmt->fetch();
    $avg = $pdo->prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE worker_id = ?');
    $avg->execute([$data['worker_id']]);
    $stats = $avg->fetch();
    $pdo->prepare('UPDATE workers SET rating = ?, review_count = ? WHERE id = ?')
        ->execute([round($stats['avg_rating'], 2), $stats['cnt'], $data['worker_id']]);
    return $review;
}

function getReviewsForWorker($pdo, $workerId) {
    $stmt = $pdo->prepare('SELECT r.*, u.full_name as reviewer_name FROM reviews r
        JOIN users u ON r.participant_id = u.id WHERE r.worker_id = ? ORDER BY r.created_at DESC');
    $stmt->execute([$workerId]);
    return $stmt->fetchAll();
}

function getAccessProfile($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT * FROM access_context_profiles WHERE user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function upsertAccessProfile($pdo, $userId, $data) {
    $existing = getAccessProfile($pdo, $userId);
    if ($existing) {
        $pdo->prepare('UPDATE access_context_profiles SET mobility_aids = ?, max_transfer_m = ?, stairs_allowed = ?,
            sensory_preferences = ?, communication_mode = ?, assistance_preferences = ?, consent_scopes = ?, updated_at = NOW()
            WHERE user_id = ?')->execute([
            json_encode($data['mobility_aids'] ?? []), $data['max_transfer_m'] ?? 200,
            ($data['stairs_allowed'] ?? true) ? 'true' : 'false',
            json_encode($data['sensory_preferences'] ?? []), $data['communication_mode'] ?? 'text',
            json_encode($data['assistance_preferences'] ?? []), json_encode($data['consent_scopes'] ?? []), $userId]);
    } else {
        $pdo->prepare('INSERT INTO access_context_profiles (user_id, mobility_aids, max_transfer_m, stairs_allowed,
            sensory_preferences, communication_mode, assistance_preferences, consent_scopes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)')->execute([
            $userId, json_encode($data['mobility_aids'] ?? []), $data['max_transfer_m'] ?? 200,
            ($data['stairs_allowed'] ?? true) ? 'true' : 'false',
            json_encode($data['sensory_preferences'] ?? []), $data['communication_mode'] ?? 'text',
            json_encode($data['assistance_preferences'] ?? []), json_encode($data['consent_scopes'] ?? [])]);
    }
    return getAccessProfile($pdo, $userId);
}

function createChatSession($pdo, $userId) {
    $stmt = $pdo->prepare("INSERT INTO chat_sessions (user_id, title, channel) VALUES (?, 'New conversation', 'web') RETURNING *");
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function getUserChatSessions($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY started_at DESC');
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function getChatMessages($pdo, $sessionId) {
    $stmt = $pdo->prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC');
    $stmt->execute([$sessionId]);
    return $stmt->fetchAll();
}

function deleteChatSession($pdo, $sessionId) {
    $pdo->prepare('DELETE FROM chat_messages WHERE session_id = ?')->execute([$sessionId]);
    $pdo->prepare('DELETE FROM chat_sessions WHERE id = ?')->execute([$sessionId]);
}

function saveChatMessage($pdo, $sessionId, $role, $content, $toolCalls = null, $quickActions = null, $confidence = null) {
    $stmt = $pdo->prepare('INSERT INTO chat_messages (session_id, role, content, tool_calls, quick_actions, confidence)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$sessionId, $role, $content, $toolCalls ? json_encode($toolCalls) : null,
        $quickActions ? json_encode($quickActions) : null, $confidence]);
    return $stmt->fetch();
}

function getCommunityReports($pdo) {
    return $pdo->query('SELECT * FROM community_reports ORDER BY created_at DESC')->fetchAll();
}

function createCommunityReport($pdo, $data) {
    $stmt = $pdo->prepare('INSERT INTO community_reports (reporter_user_id, location_ref, barrier_type, severity, description)
        VALUES (?, ?, ?, ?, ?) RETURNING *');
    $stmt->execute([$data['reporter_user_id'], $data['location_ref'], $data['barrier_type'],
        $data['severity'], $data['description'] ?? null]);
    return $stmt->fetch();
}

function pgArrayToPhp($pgArray) {
    if (!$pgArray || $pgArray === '{}') return [];
    $pgArray = trim($pgArray, '{}');
    if (empty($pgArray)) return [];
    return array_map(fn($v) => trim($v, '"'), explode(',', $pgArray));
}

function getWorkerByUserId($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT w.*, u.full_name, u.email, u.location, u.bio, u.languages, u.skills, u.phone_number, u.role, u.username, u.avatar
        FROM workers w JOIN users u ON w.user_id = u.id WHERE w.user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function getWorkerBookings($pdo, $workerId, $status = null) {
    $sql = 'SELECT b.*, u.full_name as participant_name, u.email as participant_email
        FROM bookings b JOIN users u ON b.participant_id = u.id WHERE b.worker_id = ?';
    $params = [$workerId];
    if ($status) {
        $sql .= ' AND b.status = ?';
        $params[] = $status;
    }
    $sql .= ' ORDER BY b.date DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function getWorkerShifts($pdo, $workerId, $filters = []) {
    $sql = 'SELECT ss.*, u.full_name as participant_name
        FROM service_sessions ss
        JOIN users u ON ss.participant_id = u.id
        WHERE ss.worker_id = ?';
    $params = [$workerId];
    if (!empty($filters['status'])) {
        $sql .= ' AND ss.status = ?';
        $params[] = $filters['status'];
    }
    if (!empty($filters['date_from'])) {
        $sql .= ' AND ss.date >= ?';
        $params[] = $filters['date_from'];
    }
    if (!empty($filters['date_to'])) {
        $sql .= ' AND ss.date <= ?';
        $params[] = $filters['date_to'];
    }
    $sql .= ' ORDER BY ss.date DESC, ss.start_time DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function getWorkerEarnings($pdo, $workerId, $periodStart, $periodEnd) {
    $stmt = $pdo->prepare("SELECT
        COALESCE(SUM(actual_hours), 0) as total_hours,
        COALESCE(SUM(total_charge), 0) as total_earnings,
        COUNT(*) as shift_count
        FROM service_sessions
        WHERE worker_id = ? AND status = 'completed' AND date >= ? AND date <= ?");
    $stmt->execute([$workerId, $periodStart, $periodEnd]);
    return $stmt->fetch();
}

function updateWorkerProfile($pdo, $workerId, $data) {
    $workerFields = [];
    $workerValues = [];
    $allowedWorker = ['title', 'hourly_rate', 'transport_capable', 'transport_type', 'wheelchair_accessible', 'insurance_expiry', 'first_aid_expiry', 'wwcc_number', 'wwcc_expiry', 'screening_number', 'screening_expiry'];
    foreach ($allowedWorker as $col) {
        if (array_key_exists($col, $data)) {
            $workerFields[] = "$col = ?";
            if (in_array($col, ['transport_capable', 'wheelchair_accessible'])) {
                $workerValues[] = $data[$col] ? 'true' : 'false';
            } else {
                $workerValues[] = $data[$col];
            }
        }
    }
    if (array_key_exists('specializations', $data) && is_array($data['specializations'])) {
        $workerFields[] = 'specializations = ?';
        $workerValues[] = empty($data['specializations']) ? '{}' : '{' . implode(',', array_map(fn($s) => '"' . $s . '"', $data['specializations'])) . '}';
    }
    if (!empty($workerFields)) {
        $workerValues[] = $workerId;
        $pdo->prepare('UPDATE workers SET ' . implode(', ', $workerFields) . ' WHERE id = ?')->execute($workerValues);
    }

    $worker = getWorkerById($pdo, $workerId);
    if ($worker) {
        $userFields = [];
        $userValues = [];
        foreach (['bio', 'languages', 'phone_number'] as $col) {
            if (isset($data[$col])) {
                $userFields[] = "$col = ?";
                $userValues[] = $data[$col];
            }
        }
        if (!empty($userFields)) {
            $userValues[] = $worker['user_id'];
            $pdo->prepare('UPDATE users SET ' . implode(', ', $userFields) . ' WHERE id = ?')->execute($userValues);
        }
    }
    return getWorkerByUserId($pdo, $worker['user_id']);
}

function getWorkerById($pdo, $workerId) {
    $stmt = $pdo->prepare('SELECT * FROM workers WHERE id = ?');
    $stmt->execute([$workerId]);
    return $stmt->fetch();
}

function setWorkerAvailability($pdo, $workerId, $slots) {
    $pdo->prepare('DELETE FROM worker_availability WHERE worker_id = ?')->execute([$workerId]);
    $stmt = $pdo->prepare('INSERT INTO worker_availability (id, worker_id, day_of_week, start_time, end_time, is_recurring) VALUES (?, ?, ?, ?, ?, true)');
    foreach ($slots as $slot) {
        $id = bin2hex(random_bytes(16));
        $stmt->execute([$id, $workerId, $slot['day_of_week'], $slot['start_time'], $slot['end_time']]);
    }
}

function getWorkerAvailability($pdo, $workerId) {
    $stmt = $pdo->prepare('SELECT * FROM worker_availability WHERE worker_id = ? ORDER BY day_of_week, start_time');
    $stmt->execute([$workerId]);
    return $stmt->fetchAll();
}

function addWorkerBlockout($pdo, $workerId, $date, $reason) {
    $id = bin2hex(random_bytes(16));
    $stmt = $pdo->prepare('INSERT INTO worker_blockouts (id, worker_id, date, reason) VALUES (?, ?, ?, ?)');
    $stmt->execute([$id, $workerId, $date, $reason]);
}

function removeWorkerBlockout($pdo, $id, $workerId) {
    $stmt = $pdo->prepare('DELETE FROM worker_blockouts WHERE id = ? AND worker_id = ?');
    $stmt->execute([$id, $workerId]);
    return $stmt->rowCount() > 0;
}

function getWorkerBlockouts($pdo, $workerId) {
    $stmt = $pdo->prepare('SELECT * FROM worker_blockouts WHERE worker_id = ? ORDER BY date');
    $stmt->execute([$workerId]);
    return $stmt->fetchAll();
}

function acceptBooking($pdo, $bookingId, $workerId) {
    $stmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ? AND worker_id = ?");
    $stmt->execute([$bookingId, $workerId]);
    return $stmt->rowCount() > 0;
}

function declineBooking($pdo, $bookingId, $workerId) {
    $stmt = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND worker_id = ?");
    $stmt->execute([$bookingId, $workerId]);
    return $stmt->rowCount() > 0;
}

function getWorkerComplianceAlerts($pdo, $workerId) {
    $stmt = $pdo->prepare('SELECT wwcc_expiry, first_aid_expiry, insurance_expiry, screening_clearance_status, screening_expiry FROM workers WHERE id = ?');
    $stmt->execute([$workerId]);
    $w = $stmt->fetch();
    if (!$w) return [];
    $alerts = [];
    $now = time();
    $warn30 = $now + (30 * 86400);
    $fields = [
        'wwcc_expiry' => 'WWCC',
        'first_aid_expiry' => 'First Aid Certificate',
        'insurance_expiry' => 'Insurance',
        'screening_expiry' => 'Screening',
    ];
    foreach ($fields as $col => $label) {
        if (!empty($w[$col])) {
            $exp = strtotime($w[$col]);
            if ($exp && $exp < $now) {
                $alerts[] = ['field' => $col, 'label' => $label, 'expiry' => $w[$col], 'level' => 'expired'];
            } elseif ($exp && $exp < $warn30) {
                $alerts[] = ['field' => $col, 'label' => $label, 'expiry' => $w[$col], 'level' => 'warning'];
            }
        }
    }
    if (!empty($w['screening_clearance_status']) && $w['screening_clearance_status'] !== 'cleared') {
        $alerts[] = ['field' => 'screening_clearance_status', 'label' => 'Screening Status', 'status' => $w['screening_clearance_status'], 'level' => 'warning'];
    }
    return $alerts;
}

function getWorkerTodayBookings($pdo, $workerId) {
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT b.*, u.full_name as participant_name
        FROM bookings b JOIN users u ON b.participant_id = u.id
        WHERE b.worker_id = ? AND b.date = ? AND b.status IN ('confirmed', 'pending')
        ORDER BY b.start_time");
    $stmt->execute([$workerId, $today]);
    return $stmt->fetchAll();
}

function getWorkerActiveShift($pdo, $workerId) {
    $stmt = $pdo->prepare("SELECT ss.*, u.full_name as participant_name
        FROM service_sessions ss JOIN users u ON ss.participant_id = u.id
        WHERE ss.worker_id = ? AND ss.status = 'in_progress'
        ORDER BY ss.start_time DESC LIMIT 1");
    $stmt->execute([$workerId]);
    return $stmt->fetch();
}

function endWorkerShift($pdo, $sessionId, $hours, $notes, $workerId) {
    $stmt = $pdo->prepare("SELECT * FROM service_sessions WHERE id = ? AND worker_id = ?");
    $stmt->execute([$sessionId, $workerId]);
    $session = $stmt->fetch();
    if (!$session) return null;
    $rate = (float)($session['hourly_rate'] ?? 0);
    $total = round($hours * $rate, 2);
    $pdo->prepare("UPDATE service_sessions SET status = 'completed', end_time = ?, actual_hours = ?, total_charge = ?, shift_notes = ? WHERE id = ? AND worker_id = ?")
        ->execute([date('H:i'), $hours, $total, $notes, $sessionId, $workerId]);
    $stmt2 = $pdo->prepare("SELECT * FROM service_sessions WHERE id = ?");
    $stmt2->execute([$sessionId]);
    return $stmt2->fetch();
}

function startWorkerShift($pdo, $workerId, $participantId, $bookingId = null) {
    $month = date('Y-m');
    $rateInfo = calculateCareRate($pdo, $participantId, $month);
    $data = [
        'booking_id' => $bookingId,
        'worker_id' => $workerId,
        'participant_id' => $participantId,
        'start_time' => date('H:i'),
        'end_time' => null,
        'actual_hours' => null,
        'hourly_rate' => $rateInfo['rate'],
        'tier_applied' => $rateInfo['tier'],
        'ndis_item_code' => '01_011_0107_1_1',
        'total_charge' => null,
        'shift_notes' => null,
        'status' => 'in_progress',
        'date' => date('Y-m-d'),
    ];
    return createServiceSession($pdo, $data);
}

function getWorkerUpcomingBookings($pdo, $workerId, $limit = 5) {
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT b.*, u.full_name as participant_name
        FROM bookings b JOIN users u ON b.participant_id = u.id
        WHERE b.worker_id = ? AND b.date >= ? AND b.status IN ('confirmed', 'pending')
        ORDER BY b.date, b.start_time LIMIT ?");
    $stmt->execute([$workerId, $today, $limit]);
    return $stmt->fetchAll();
}

function getWorkerRecentReviews($pdo, $workerId, $limit = 3) {
    $stmt = $pdo->prepare('SELECT r.*, u.full_name as reviewer_name FROM reviews r
        JOIN users u ON r.participant_id = u.id WHERE r.worker_id = ? ORDER BY r.created_at DESC LIMIT ?');
    $stmt->execute([$workerId, $limit]);
    return $stmt->fetchAll();
}

function getWorkerActiveBookingsCount($pdo, $workerId) {
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM bookings WHERE worker_id = ? AND status IN ('confirmed', 'pending')");
    $stmt->execute([$workerId]);
    return (int)$stmt->fetch()['cnt'];
}
