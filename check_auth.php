<?php
session_start();

$authenticated = isset($_SESSION['user_id']) || isset($_SESSION['student_id']);

header('Content-Type: application/json');
echo json_encode([
    'authenticated' => $authenticated,
    'session_details' => [
        'user_id_set' => isset($_SESSION['user_id']),
        'student_id_set' => isset($_SESSION['student_id'])
    ]
]);
?>