<?php
session_start();
include('connection.php');



$required_fields = ['first_name', 'last_name', 'email', 'course', 'user_address'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing required fields',
        'missing_fields' => $missing_fields
    ]);
    exit;
}

$profile_image_path = null;
if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] == 0) {
    $upload_dir = 'profiles/';
    
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $filename = uniqid() . '_' . basename($_FILES['profile_image']['name']);
    $target_path = $upload_dir . $filename;
    
    if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $target_path)) {
        $profile_image_path = $target_path;
        
        $stmt_old = $connection->prepare("SELECT profile_image FROM users WHERE user_id = :user_id");
        $stmt_old->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
        $stmt_old->execute();
        $old_image = $stmt_old->fetchColumn();
        
        if ($old_image && $old_image !== 'default-profile.jpg' && file_exists($old_image)) {
            unlink($old_image);
        }
        
        error_log("Profile image uploaded successfully: " . $target_path);
    } else {
        error_log("Failed to move uploaded file. Temp path: " . $_FILES['profile_image']['tmp_name']);
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to upload profile image', 
            'debug' => $_FILES['profile_image']
        ]);
        exit;
    }
}

try {
    $connection->beginTransaction();

    // Prepare the update query
    $query = "UPDATE users 
              SET first_name = :first_name, 
                  last_name = :last_name, 
                  email = :email, 
                  course = :course, 
                  user_address = :user_address";
    
    // Add profile image to query if uploaded
    if ($profile_image_path) {
        $query .= ", profile_image = :profile_image";
    }
    
    $query .= " WHERE user_id = :user_id";
    
    $stmt = $connection->prepare($query);
    
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $course = trim($_POST['course'] ?? '');
    $user_address = trim($_POST['user_address'] ?? '');
    
    error_log("Updating profile for user ID: " . $_SESSION['user_id']);
    error_log("First Name: " . $first_name);
    error_log("Last Name: " . $last_name);
    error_log("Email: " . $email);
    error_log("Course: " . $course);
    error_log("User Address: " . $user_address);
    
    $stmt->bindParam(':first_name', $first_name);
    $stmt->bindParam(':last_name', $last_name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':course', $course);
    $stmt->bindParam(':user_address', $user_address);
    $stmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
    
    if ($profile_image_path) {
        $stmt->bindParam(':profile_image', $profile_image_path);
    }
    
    $update_result = $stmt->execute();
    
    error_log("Update query execution result: " . ($update_result ? 'Success' : 'Failure'));
    
    $affected_rows = $stmt->rowCount();
    error_log("Affected rows: " . $affected_rows);
    
    $connection->commit();
    
    $full_image_path = null;
    if ($profile_image_path) {
        $base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . 
                    "://$_SERVER[HTTP_HOST]" . 
                    rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
        $full_image_path = $base_url . '/' . ltrim($profile_image_path, '/');
        
        error_log("Full image path: " . $full_image_path);
    }
    
    $verify_query = "SELECT * FROM users WHERE user_id = :user_id";
    $verify_stmt = $connection->prepare($verify_query);
    $verify_stmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
    $verify_stmt->execute();
    $updated_user = $verify_stmt->fetch(PDO::FETCH_ASSOC);
    
    unset($updated_user['password']); // Remove sensitive information
    
    echo json_encode([
        'success' => true, 
        'message' => 'Profile updated successfully',
        'profile_image' => $full_image_path,
        'updated_user' => $updated_user,
        'debug' => [
            'uploaded_path' => $profile_image_path,
            'full_path' => $full_image_path,
            'affected_rows' => $affected_rows,
            'post_data' => $_POST
        ]
    ]);
} catch (PDOException $e) {
    // Rollback transaction
    $connection->rollBack();
    
    error_log("Profile update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage(),
        'debug' => [
            'error_message' => $e->getMessage(),
            'error_code' => $e->getCode(),
            'post_data' => $_POST
        ]
    ]);
}
?>