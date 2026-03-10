<?php
require_once __DIR__ . '/includes/config.php';

echo "Seeding database...\n";

$existingUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
if ($existingUsers > 0) {
    echo "Database already has {$existingUsers} users. Skipping seed.\n";
    exit(0);
}

$users = [
    ['demo_participant', 'hashed_password', 'Jordan Lee', 'jordan@mapable.au', 'participant', 'Sydney, NSW', 'Participant with mobility support needs. Active NDIS plan holder.', 'NDIS-12345678', '2025-01-01', '2026-01-01', '0412345678'],
    ['alex_m', 'hashed_password', 'Alex Mehmet', 'alex@mapable.au', 'carer', 'Sydney, NSW', 'Experienced disability support worker specializing in community access and personal care.', null, null, null, '0423456789'],
    ['sarah_w', 'hashed_password', 'Sarah Wilson', 'sarah@mapable.au', 'carer', 'Melbourne, VIC', 'Certified support worker with 5 years experience in high-needs care.', null, null, null, '0434567890'],
    ['michael_c', 'hashed_password', 'Michael Chen', 'michael@mapable.au', 'carer', 'Brisbane, QLD', 'Transport specialist and community access worker.', null, null, null, '0445678901'],
    ['emma_d', 'hashed_password', 'Emma Davis', 'emma@mapable.au', 'carer', 'Sydney, NSW', 'Mental health and wellbeing support worker.', null, null, null, '0456789012'],
    ['tom_b', 'hashed_password', 'Tom Baker', 'tom@mapable.au', 'carer', 'Perth, WA', 'Specialist in acquired brain injury support.', null, null, null, '0467890123'],
    ['provider_admin', 'hashed_password', 'MapAble Admin', 'admin@mapable.au', 'provider', 'Sydney, NSW', 'Provider administrator.', null, null, null, '0400000000'],
];

$userIds = [];
foreach ($users as $u) {
    $stmt = $pdo->prepare("INSERT INTO users (username, password, full_name, email, role, location, bio, ndis_number, plan_start_date, plan_end_date, phone_number, languages, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{\"English\"}', '{\"Communication\"}') RETURNING id");
    $stmt->execute([$u[0], $u[1], $u[2], $u[3], $u[4], $u[5], $u[6], $u[7], $u[8], $u[9], $u[10]]);
    $userIds[$u[0]] = $stmt->fetch()['id'];
}
echo "Created " . count($userIds) . " users\n";

$workers = [
    [$userIds['alex_m'], 'Senior Support Worker', '{\"Personal Care\",\"Community Access\",\"Meal Preparation\"}', 55.00, true, 'Sedan', true, true, 4.8, 23, 'Weekdays & Weekends', 'ABN-11111', '2026-06-01', '2026-12-01', 'WWCC-1234', '2026-06-01'],
    [$userIds['sarah_w'], 'High Needs Support Specialist', '{\"High Needs Care\",\"Medication Management\",\"Physiotherapy Support\"}', 68.00, false, null, false, true, 4.9, 15, 'Weekdays', 'ABN-22222', '2026-09-01', '2027-01-01', 'WWCC-2345', '2027-01-01'],
    [$userIds['michael_c'], 'Transport & Community Worker', '{\"Transport\",\"Community Access\",\"Social Activities\"}', 50.00, true, 'Wheelchair Van', true, true, 4.6, 31, 'Mon-Fri 7am-6pm', 'ABN-33333', '2026-08-01', '2026-11-01', 'WWCC-3456', '2026-11-01'],
    [$userIds['emma_d'], 'Mental Health Support Worker', '{\"Mental Health\",\"Counseling Support\",\"Daily Living\"}', 62.00, false, null, false, true, 4.7, 18, 'Flexible', 'ABN-44444', '2026-07-01', '2026-10-01', 'WWCC-4567', '2026-10-01'],
    [$userIds['tom_b'], 'ABI Specialist', '{\"Brain Injury\",\"Rehabilitation\",\"Independent Living\"}', 72.00, true, 'Modified Vehicle', true, true, 4.5, 12, 'Weekdays', 'ABN-55555', '2026-05-01', '2026-08-01', 'WWCC-5678', '2026-08-01'],
];

$workerIds = [];
foreach ($workers as $w) {
    $stmt = $pdo->prepare("INSERT INTO workers (user_id, title, specializations, hourly_rate, transport_capable, transport_type, wheelchair_accessible, ndis_verified, rating, review_count, availability, abn, first_aid_expiry, insurance_expiry, wwcc_number, wwcc_expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id");
    $stmt->execute($w);
    $workerIds[] = $stmt->fetch()['id'];
}
echo "Created " . count($workerIds) . " workers\n";

$jobs = [
    [$userIds['provider_admin'], 'Personal Care Assistant', 'Provide personal care support to participants including hygiene, grooming, and meal preparation. Must be compassionate and reliable.', 'Sydney, NSW', 'Part-time', '$28-$35/hr', '{\"NDIS Worker Screening\",\"First Aid Certificate\",\"Manual Handling\"}', 'Care'],
    [$userIds['provider_admin'], 'Community Access Support Worker', 'Accompany participants to community activities, social events, and appointments. Help build social connections and confidence.', 'Melbourne, VIC', 'Casual', '$25-$32/hr', '{\"NDIS Worker Screening\",\"Valid Driver License\",\"Own Vehicle\"}', 'Support'],
    [$userIds['provider_admin'], 'Disability Transport Driver', 'Provide safe and accessible transport for NDIS participants. Must have wheelchair-accessible vehicle or willingness to use fleet.', 'Brisbane, QLD', 'Full-time', '$55,000-$65,000/yr', '{\"NDIS Worker Screening\",\"Heavy Vehicle License\",\"Wheelchair Training\"}', 'Transport'],
    [$userIds['provider_admin'], 'Support Coordinator', 'Help participants understand and implement their NDIS plans. Connect them with appropriate services and supports.', 'Perth, WA', 'Full-time', '$65,000-$80,000/yr', '{\"NDIS Worker Screening\",\"Relevant Qualification\",\"2+ Years Experience\"}', 'Employment'],
    [$userIds['provider_admin'], 'Behaviour Support Practitioner', 'Develop and implement behaviour support plans for participants. Work collaboratively with families and other professionals.', 'Sydney, NSW', 'Contract', '$75-$95/hr', '{\"Psychology Degree\",\"NDIS Registration\",\"Behaviour Support Qualification\"}', 'Care'],
];
foreach ($jobs as $j) {
    $pdo->prepare("INSERT INTO jobs (posted_by, title, description, location, job_type, salary, requirements, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        ->execute($j);
}
echo "Created " . count($jobs) . " jobs\n";

$participantId = $userIds['demo_participant'];
$budgets = [
    [$participantId, 'daily_living', 25000, 4500, '2025-01-01', '2026-01-01'],
    [$participantId, 'transport', 8000, 1200, '2025-01-01', '2026-01-01'],
    [$participantId, 'capacity_building', 15000, 2800, '2025-01-01', '2026-01-01'],
];
foreach ($budgets as $b) {
    $pdo->prepare("INSERT INTO participant_budgets (participant_id, category, total_allocated, total_used, period_start, period_end) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute($b);
}
echo "Created budgets\n";

$sessions = [
    [null, $workerIds[0], $participantId, '08:00', '12:00', 4.0, 70.23, 'Basic Care', '01_011_0107_1_1', 280.92, 'Personal care and morning routine assistance', 'completed', '2025-12-01'],
    [null, $workerIds[1], $participantId, '09:00', '15:00', 6.0, 68.00, 'Standard Care', '01_011_0107_1_1', 408.00, 'Physiotherapy support and exercises', 'completed', '2025-12-05'],
    [null, $workerIds[3], $participantId, '10:00', '13:00', 3.0, 70.23, 'Basic Care', '01_011_0107_1_1', 210.69, 'Mental health check-in and activity', 'completed', '2025-12-10'],
];
foreach ($sessions as $s) {
    $pdo->prepare("INSERT INTO service_sessions (booking_id, worker_id, participant_id, start_time, end_time, actual_hours, hourly_rate, tier_applied, ndis_item_code, total_charge, shift_notes, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        ->execute($s);
}
echo "Created service sessions\n";

$tripsData = [
    [null, $workerIds[0], $participantId, 15.5, 0.99, 'Basic Mobility', false, 0, 0, 15.35, '02_051_0108_1_1', 'completed', '2025-12-02'],
    [null, $workerIds[2], $participantId, 28.0, 0.99, 'Basic Mobility', true, 4.20, 3.50, 35.42, '02_051_0108_1_1', 'completed', '2025-12-06'],
    [null, $workerIds[4], $participantId, 42.0, 0.90, 'Standard Mobility', false, 0, 0, 37.80, '02_051_0108_1_1', 'completed', '2025-12-12'],
];
foreach ($tripsData as $t) {
    $pdo->prepare("INSERT INTO transport_trips (transport_request_id, worker_id, participant_id, distance_km, per_km_rate, tier_applied, accessible_vehicle, accessible_surcharge, tolls, total_charge, ndis_item_code, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        ->execute($t);
}
echo "Created transport trips\n";

$reviews = [
    [$participantId, $workerIds[0], null, 5, 'Alex is wonderful! Very patient and caring. Always goes above and beyond.'],
    [$participantId, $workerIds[1], null, 5, 'Sarah is highly skilled and professional. Excellent physiotherapy support.'],
    [$participantId, $workerIds[2], null, 4, 'Michael is a reliable driver. The wheelchair van is always clean and well-maintained.'],
    [$participantId, $workerIds[3], null, 5, 'Emma is incredibly supportive. She really understands mental health.'],
    [$participantId, $workerIds[4], null, 4, 'Tom has great experience with brain injury support. Very knowledgeable.'],
];
foreach ($reviews as $r) {
    $pdo->prepare("INSERT INTO reviews (participant_id, worker_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)")
        ->execute($r);
}
echo "Created reviews\n";

$messages = [
    [$userIds['alex_m'], $participantId, 'Hi Jordan! Just confirming our appointment tomorrow at 8am. See you then!'],
    [$participantId, $userIds['alex_m'], 'Thanks Alex! Looking forward to it. Can we include a trip to the shops?'],
    [$userIds['alex_m'], $participantId, 'Absolutely! I will plan for the shopping trip after our morning routine.'],
    [$userIds['michael_c'], $participantId, 'Hi Jordan, your transport for Friday is confirmed. I will be there at 9:30am.'],
    [$participantId, $userIds['michael_c'], 'Thanks Michael! Will need the wheelchair ramp please.'],
];
foreach ($messages as $m) {
    $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)")
        ->execute($m);
}
echo "Created messages\n";

echo "\nSeed complete! Database is ready.\n";
echo "Demo login: demo_participant / hashed_password\n";
echo "Carer login: alex_m / hashed_password\n";
