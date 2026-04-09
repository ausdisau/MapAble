<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$userId = currentUserId();
$userRole = $_SESSION['user_role'] ?? '';

if ($userRole !== 'carer') {
    jsonResponse(['error' => 'Unauthorized'], 403);
}

$worker = getWorkerByUserId($pdo, $userId);
if (!$worker) {
    jsonResponse(['error' => 'Worker profile not found'], 404);
}

$_rawInput = file_get_contents('php://input');
$_jsonInput = json_decode($_rawInput, true);

function requireApiCsrf() {
    global $_jsonInput;
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if ($_jsonInput && isset($_jsonInput['csrf_token'])) {
        $token = $_jsonInput['csrf_token'];
    }
    if (empty($token) || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        jsonResponse(['error' => 'Invalid or missing CSRF token'], 403);
    }
}

if ($uri === '/api/worker/shift/start' && $method === 'POST') {
    requireApiCsrf();
    $input = $_jsonInput ?: $_POST;
    $bookingId = $input['booking_id'] ?? '';
    if (!$bookingId) {
        jsonResponse(['error' => 'booking_id required'], 400);
    }
    $booking = getBookingById($pdo, $bookingId);
    if (!$booking || $booking['worker_id'] !== $worker['id']) {
        jsonResponse(['error' => 'Booking not found or not assigned to you'], 403);
    }
    $existing = getWorkerActiveShift($pdo, $worker['id']);
    if ($existing) {
        jsonResponse(['error' => 'You already have an active shift'], 400);
    }
    $session = startWorkerShift($pdo, $worker['id'], $booking['participant_id'], $bookingId);
    jsonResponse(['success' => true, 'session' => $session]);
}

if ($uri === '/api/worker/shift/end' && $method === 'POST') {
    requireApiCsrf();
    $input = $_jsonInput ?: $_POST;
    $sessionId = $input['session_id'] ?? '';
    $hours = (float)($input['hours'] ?? 0);
    $notes = $input['notes'] ?? null;
    if (!$sessionId || $hours <= 0) {
        jsonResponse(['error' => 'session_id and hours required'], 400);
    }
    $session = endWorkerShift($pdo, $sessionId, $hours, $notes, $worker['id']);
    if (!$session) jsonResponse(['error' => 'Session not found or not yours'], 403);
    jsonResponse(['success' => true, 'session' => $session]);
}

if ($uri === '/api/worker/booking/accept' && $method === 'POST') {
    requireApiCsrf();
    $input = $_jsonInput ?: $_POST;
    $bookingId = $input['booking_id'] ?? '';
    if (!$bookingId) jsonResponse(['error' => 'booking_id required'], 400);
    acceptBooking($pdo, $bookingId, $worker['id']);
    jsonResponse(['success' => true]);
}

if ($uri === '/api/worker/booking/decline' && $method === 'POST') {
    requireApiCsrf();
    $input = $_jsonInput ?: $_POST;
    $bookingId = $input['booking_id'] ?? '';
    if (!$bookingId) jsonResponse(['error' => 'booking_id required'], 400);
    declineBooking($pdo, $bookingId, $worker['id']);
    jsonResponse(['success' => true]);
}

if ($uri === '/api/worker/booking/start-shift' && $method === 'POST') {
    requireApiCsrf();
    $input = $_jsonInput ?: $_POST;
    $bookingId = $input['booking_id'] ?? '';
    if (!$bookingId) jsonResponse(['error' => 'booking_id required'], 400);
    $booking = getBookingById($pdo, $bookingId);
    if (!$booking || $booking['worker_id'] !== $worker['id']) {
        jsonResponse(['error' => 'Booking not found or not assigned to you'], 403);
    }
    $existing = getWorkerActiveShift($pdo, $worker['id']);
    if ($existing) jsonResponse(['error' => 'You already have an active shift'], 400);
    $session = startWorkerShift($pdo, $worker['id'], $booking['participant_id'], $bookingId);
    acceptBooking($pdo, $bookingId, $worker['id']);
    jsonResponse(['success' => true, 'session' => $session]);
}

if ($uri === '/api/worker/shifts/export' && $method === 'GET') {
    $filters = [
        'status' => $_GET['status'] ?? null,
        'date_from' => $_GET['date_from'] ?? null,
        'date_to' => $_GET['date_to'] ?? null,
    ];
    $shifts = getWorkerShifts($pdo, $worker['id'], array_filter($filters));
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="shifts_export_' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Date', 'Participant', 'Start', 'End', 'Hours', 'Rate', 'Tier', 'NDIS Code', 'Total', 'Status', 'Notes']);
    foreach ($shifts as $s) {
        fputcsv($out, [
            $s['date'], $s['participant_name'], $s['start_time'], $s['end_time'] ?? '',
            $s['actual_hours'] ?? '', $s['hourly_rate'] ?? '', $s['tier_applied'] ?? '',
            $s['ndis_item_code'] ?? '', $s['total_charge'] ?? '', $s['status'], $s['shift_notes'] ?? ''
        ]);
    }
    fclose($out);
    exit;
}

jsonResponse(['error' => 'Not found'], 404);
