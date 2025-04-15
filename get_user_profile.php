<?php
session_start();
include('connection.php');

if (!isset($_SESSION['user_id']) && !isset($_SESSION['student_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    $user_id = $_SESSION['user_id'] ?? $_SESSION['student_id'];

    $query = "SELECT 
              user_id, 
              first_name, 
              last_name, 
              gender, 
              email, 
              course, 
              user_address, 
              birthdate, 
              profile_image, 
              is_verified 
              FROM users 
              WHERE user_id = :user_id OR student_id = :user_id";
    
    $statement = $connection->prepare($query);
    $statement->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $statement->execute();
    
    $user = $statement->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        $user['first_name'] = $user['first_name'] ?? '';
        $user['last_name'] = $user['last_name'] ?? '';
        $user['gender'] = $user['gender'] ?? '';
        $user['email'] = $user['email'] ?? '';
        $user['course'] = $user['course'] ?? '';
        $user['user_address'] = $user['user_address'] ?? '';
        $user['birthdate'] = $user['birthdate'] ?? '';
        
        if (!empty($user['birthdate'])) {
            $user['birthdate'] = date('Y-m-d', strtotime($user['birthdate']));
        }
        
        $user['profile_image'] = $user['profile_image'] ?? 'default-profile.jpg';
        
        if (!empty($user['profile_image']) && !filter_var($user['profile_image'], FILTER_VALIDATE_URL)) {
            $base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . 
                        "://$_SERVER[HTTP_HOST]" . 
                        dirname($_SERVER['PHP_SELF']);
            $user['profile_image'] = rtrim($base_url, '/') . '/' . ltrim($user['profile_image'], '/');
        }
        
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['error' => 'Database error']);
}
?>