$(document).ready(function() {

    loadStudents();
    
    $('#registerForm').on('submit', function(e) {
        handleRegistration(e, this);
    });
    
    // Load user statistics
    loadUserStats();

    // Refresh stats every minute
    setInterval(loadUserStats, 60000);
    
    function loadStudents() {
        $.ajax({
            url: 'get_user.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log('Data fetched:', data);
                $("#tableBody").empty();
                
                if (!Array.isArray(data)) {
                    if (data.error) {
                        alert("Error: " + data.error);
                    } else if (data.info) {
                        $("#tableBody").html('<tr><td colspan="10" class="text-center">No students found</td></tr>');
                    }
                    return;
                }
                
                data.forEach(function(item) {
                    let age = calculateAge(item.birthdate);
                    let profileImageHtml = item.profile_image 
                        ? `<img src="${item.profile_image}" alt="Profile Image" style="width:50px;height:50px;border-radius:50%;">`
                        : 'N/A';
                
                    var row = `
                    <tr>
                        <td>${item.student_id}</td>
                        <td>${item.first_name}</td>
                        <td>${item.last_name}</td>
                        <td>${item.email}</td>
                        <td>${item.gender}</td>
                        <td>${item.course}</td>
                        <td>${item.user_address || 'N/A'}</td>
                        <td>${age}</td>
                        <td class="profile-image-cell" data-student-id="${item.student_id}">${profileImageHtml}</td>
                        <td class="action-buttons">
                            <button class="btn btn-sm btn-info edit-btn" data-toggle="modal" data-target="#exampleModal"
                                data-id="${item.student_id}" 
                                data-first-name="${item.first_name}" 
                                data-last-name="${item.last_name}" 
                                data-email="${item.email}" 
                                data-gender="${item.gender}" 
                                data-course="${item.course}" 
                                data-address="${item.user_address || ''}" 
                                data-birthdate="${item.birthdate}"
                                data-profile-image="${item.profile_image || ''}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.student_id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    `;
                    $("#tableBody").append(row);
                });
                
                addEventListeners();
            },
            error: function(xhr, status, error) {
                console.error('Error fetching students:', error);
                alert("Error loading students: " + error);
            }
        });
    }
    
    function calculateAge(birthdate) {
        if (!birthdate) return 'N/A';
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    
    $("#ProfileImage").on('change', function(event) {
        const file = event.target.files[0];
        
        $("#imagePreview").attr('src', '').hide();
        $("#imagePreviewContainer").hide();
        $("#currentImage").attr('src', '').hide();
        $("#currentImageContainer").hide();
        
        if (file) {
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validImageTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, or GIF)');
                $(this).val(''); // Clear the file input
                return;
            }
            
            // Check file size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File is too large. Maximum file size is 5MB.');
                $(this).val(''); // Clear the file input
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                $("#imagePreview")
                    .attr('src', e.target.result)
                    .css('display', 'block');
                $("#imagePreviewContainer").show();
                
                console.log('Image preview loaded:', file.name);
            };
            
            reader.onerror = function() {
                console.error('Error reading file');
                alert('Error reading file. Please try again.');
            };
            
            // Read the file
            reader.readAsDataURL(file);
        }
    });
    
    function addEventListeners() {
        function setupEditButtons() {
            $(".edit-btn").off('click').on("click", function() {
                $("#ProfileImage").val(''); // Clear file input
                $("#imagePreview").attr('src', '').hide(); // Clear and hide preview
                $("#imagePreviewContainer").hide(); // Hide preview container
                $("#currentImage").attr('src', '').hide(); // Clear and hide current image
                $("#currentImageContainer").hide(); // Hide current image container
                
                let studentId = $(this).data('id');
                let firstName = $(this).data('first-name');
                let lastName = $(this).data('last-name');
                let email = $(this).data('email');
                let gender = $(this).data('gender');
                let course = $(this).data('course');
                let address = $(this).data('address');
                let birthdate = $(this).data('birthdate');
                let profileImage = $(this).data('profile-image');
                
                
                $("#btnSaveUser").data('student-id', studentId);
                
                $("#student_id").val(studentId);
                $("#firstName").val(firstName);
                $("#lastName").val(lastName);
                $("#Email").val(email);
                $("#Gender").val(gender);
                $("#Course").val(course);
                $("#Address").val(address);
                $("#Birthdate").val(birthdate);
                
                if (profileImage) {
                    console.log("Setting current image:", profileImage);
                    $("#currentImageContainer")
                        .show()
                        .css('display', 'block');
                    $("#currentImage")
                        .attr("src", profileImage)
                        .show()
                        .css('display', 'block')
                        .on('error', function() {
                            console.error("Failed to load image:", profileImage);
                            $(this).hide();
                            $("#currentImageContainer").hide();
                        })
                        .on('load', function() {
                            console.log("Image loaded successfully:", profileImage);
                        });
                } else {
                    console.log("No profile image available");
                    $("#currentImageContainer").hide();
                    $("#currentImage").hide();
                }
                
                // Update modal title
                $("#exampleModalLabel").text("Edit Student");
            });
        }
        
        $("#exampleModal").on("show.bs.modal", function(event) {
            // Check if this is a new student or edit
            const editButton = $(event.relatedTarget);
            const isEditMode = editButton.hasClass('edit-btn');
            
            if (!isEditMode) {
                $("#newUserForm")[0].reset();
                
                $("#student_id").val('');
                $("#firstName").val('');
                $("#lastName").val('');
                $("#Email").val('');
                $("#Gender").val('');
                $("#Course").val('');
                $("#Address").val('');
                $("#Birthdate").val('');
                
                // Reset image-related elements
                $("#currentImageContainer").hide();
                $("#currentImage")
                    .attr("src", "")
                    .hide();
                $("#imagePreviewContainer").hide();
                $("#imagePreview")
                    .attr("src", "")
                    .hide();
                
                // Update modal title
                $("#exampleModalLabel").text("Add New Student");
                
                // Ensure file input is cleared
                $("#ProfileImage").val('');
                
                // Remove any data attributes that might persist
                $("#btnSaveUser").removeData('student-id');
            } else {
                // Ensure edit buttons are set up correctly
                setupEditButtons();
            }
        });
        
        // Initial setup of edit buttons
        setupEditButtons();
        
        $(".delete-btn").on("click", function() {
            let studentId = $(this).data('id');
            $("#delete_student_id").val(studentId);
            $("#deleteModal").modal('show');
        });
    }
    
    $("#btnCreateStudent").on("click", function() {
        $("#exampleModal").modal('show');
    });
    
    $("#btnSaveUser").on("click", function() {
        console.log("btnSaveUser clicked");
    
        if (
          !$("#firstName").val() ||
          !$("#lastName").val() ||
          !$("#Email").val()  || 
          !$("#Gender").val() ||
          !$("#Course").val() ||
          !$("#Birthdate").val()
        ) {
            alert("Please fill in all required fields");
            return;
        }

        let studentId = $("#student_id").val();
        let isNewStudent = !studentId;
        
        if (isNewStudent && !$("#ProfileImage")[0].files[0]) {
            alert("Please select a profile image");
            return;
        }
        
        let url = isNewStudent ? 'users_create.php' : 'users_update.php';
        let formData = new FormData($("#newUserForm")[0]);
        
        console.log("Submitting form data to:", url);
        
        $.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            data: formData,
            processData: false,
            contentType: false,
            success: function(result) {
                console.log("AJAX response:", result);
                if (result.res === "success") {
                    alert("Student saved successfully!");
                    $("#exampleModal").modal("hide");
                    
                    loadStudents();
                } else {
                    alert(result.error || "Unknown error occurred");
                }
            },
            error: function(xhr, status, error) {
                console.error("AJAX error:", error);
                console.error("Response:", xhr.responseText);
                alert("Server error occurred. Check console for details.");
            }
        });
    });
    
    function updateStudentImage(studentId, newImagePath) {
        let imageCell = $(`.profile-image-cell[data-student-id="${studentId}"]`);
        if (imageCell.length) {
            imageCell.html(`<img src="${newImagePath}" alt="Profile Image" style="width:50px;height:50px;border-radius:50%;">`);
        } else {
            loadStudents();
        }
    }
    
    $("#confirmDelete").on("click", function() {
        let studentId = $("#delete_student_id").val();
        $.ajax({
            url: 'users_delete.php',
            type: "POST",
            dataType: "json",
            data: { student_id: studentId },
            success: function(result) {
                if (result.res === "success") {
                    alert("Student deleted successfully!");
                    $("#deleteModal").modal("hide");
                    loadStudents();
                } else {
                    alert(result.error || "Unknown error occurred");
                }
            },
            error: function(xhr, status, error) {
                console.error('Delete error:', error);
                console.error("Response:", xhr.responseText);
                alert("Server error occurred. Check console for details.");
            }
        });
    });
    
    function loadUserStats() {
        $.ajax({
            url: 'get_user_stats.php',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.total_users) {
                    $('.stat-number').eq(0).text(data.total_users);
                }
                if (data.verified_users) {
                    $('.stat-number').eq(1).text(data.verified_users);
                }
            },
            error: function() {
                console.error('Error fetching user statistics');
            }
        });
    }
});

function handleRegistration(e, form) {
    e.preventDefault();
    
    $.ajax({
        type: 'POST',
        url: 'register.php',
        data: $(form).serialize(),
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                $('#message').html('<div class="alert alert-success">' + response.message + '</div>');
                $(form)[0].reset();
            } else {
                $('#message').html('<div class="alert alert-danger">' + response.message + '</div>');
            }
        },
        error: function() {
            $('#message').html('<div class="alert alert-danger">An error occurred. Please try again.</div>');
        }
    });
}

function updateSystemHealth() {
    const valueDiv = document.getElementById('health-value');
    const indicator = document.querySelector('.status-indicator');
    
    // If elements don't exist, create them
    if (!valueDiv || !indicator) {
        const systemHealth = document.querySelector('.system-health');
        if (systemHealth) {
            // Create value div if it doesn't exist
            if (!valueDiv) {
                const healthValue = document.createElement('div');
                healthValue.id = 'health-value';
                healthValue.className = 'health-value';
                healthValue.textContent = 'Checking...';
                systemHealth.insertBefore(healthValue, systemHealth.querySelector('.health-details'));
            }
            
            if (!indicator) {
                const statusIndicator = document.createElement('div');
                statusIndicator.className = 'status-indicator';
                systemHealth.insertBefore(statusIndicator, systemHealth.querySelector('.health-details'));
            }
            
            valueDiv = document.getElementById('health-value');
            indicator = document.querySelector('.status-indicator');
        }
    }

    if (valueDiv && indicator) {
        // Set initial state
        valueDiv.textContent = 'Checking...';
        valueDiv.className = 'health-value';
        indicator.className = 'status-indicator';

        fetch('system_health.php')
            .then(response => response.json())
            .then(data => {
                valueDiv.className = 'health-value ' + (data.status === 'healthy' ? 'healthy' : 'warning');
                valueDiv.textContent = data.status === 'healthy' ? 'Good' : 'Warning';
                
                // Update status indicator
                indicator.className = 'status-indicator ' + (data.status === 'healthy' ? 'healthy' : '');
                
                let detailsHtml = '<div class="health-item"><strong>Status:</strong> ' + 
                    (data.status === 'healthy' ? '<span>✓</span>' : 
                     '<span class="warning">✗</span>') + '</div>';
                
                // Add check details
                Object.entries(data.checks).forEach(([key, value]) => {
                    detailsHtml += `<div class="health-item"><strong>${key.replace('_', ' ').toUpperCase()}</strong>: ${value ? '<span>✓</span>' : '<span class="warning">✗</span>'}</div>`;
                });
                
                Object.entries(data.details).forEach(([key, value]) => {
                    if (key !== 'status') {
                        detailsHtml += `<div class="health-item"><strong>${key.replace('_', ' ').toUpperCase()}</strong>: ${value}</div>`;
                    }
                });
                
                document.querySelector('.health-details').innerHTML = detailsHtml;
            })
            .catch(error => {
                console.error('Error checking system health:', error);
                valueDiv.className = 'health-value warning';
                valueDiv.textContent = 'Error';
                indicator.className = 'status-indicator';
                document.querySelector('.health-details').innerHTML = '<div class="health-item">Error checking system health</div>';
            })
            .finally(() => {
                if (!valueDiv.textContent) {
                    valueDiv.textContent = 'Unknown';
                    valueDiv.className = 'health-value warning';
                }
            });
    }
}

// Update system health every 30 seconds
setInterval(updateSystemHealth, 30000);

// Initial update
updateSystemHealth();

// Clock functionality
function updateClock() {
    const now = new Date();
    const clock = document.getElementById('live-clock');
    const dateDisplay = document.getElementById('date-display');
    const dayGreeting = document.getElementById('day-greeting');

    if (!clock || !dateDisplay || !dayGreeting) {
        console.error('Missing clock elements');
        return;
    }

    // Time formatting
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    // Time display
    clock.textContent = `${hours}:${minutes}:${seconds}`;
    dateDisplay.textContent = `${dayName}, ${monthName} ${date}, ${year}`;

    let greeting = 'Good Morning';
    const currentHour = now.getHours();
    if (currentHour >= 12 && currentHour < 17) {
        greeting = 'Good Afternoon';
    } else if (currentHour >= 17 || currentHour < 5) {
        greeting = 'Good Evening';
    }
    dayGreeting.textContent = greeting;
}

$(document).ready(function() {
    updateClock();
    setInterval(updateClock, 1000);
});

function fetchUsers() {
    fetch('get_useruser.php') 
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const userList = document.getElementById('user-list');
            if (!userList) {
                console.error('User list element not found');
                return;
            }
            
            userList.innerHTML = ''; // Clear existing rows
            
            data.forEach(user => {
                const row = document.createElement('tr');
                
                // Create status badge
                const statusBadge = document.createElement('span');
                statusBadge.className = `status-badge ${user.is_verified === 1 ? 'yellow' : 'violet'}`;
                statusBadge.textContent = user.is_verified === 1 ? 'Verified' : 'Not Verified';
                
                row.innerHTML = `
                    <td>${user.first_name}</td>
                    <td>${user.last_name}</td>
                    <td>${user.course}</td>
                    <td>${user.user_address}</td>
                    <td class="status-cell"></td>
                `;
                
                const statusCell = row.lastElementChild;
                statusCell.appendChild(statusBadge);
                statusCell.style.textAlign = 'center';
                
                userList.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            showToast('Error loading user data', 'danger');
        });
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Remove toast after it closes
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

$(document).ready(function() {
    fetchUsers();
});


function checkAuthentication() {
    fetch('check_auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                // Redirect to login if not authenticated
                window.location.href = 'login.php';
            } else {
                // If authenticated, proceed with loading profile
                fetchCurrentUserProfile();
            }
        })
        .catch(error => {
            console.error('Authentication check failed:', error);
            window.location.href = 'login.php';
        });
}

function handleProfileModalOpen() {
    // Show loading state
    const form = document.getElementById('profile-edit-form');
    if (form) {
        form.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }

    const modal = new bootstrap.Modal(document.getElementById('profile-edit-modal'));
    modal.show();

    fetchCurrentUserProfile();
}

function fetchCurrentUserProfile() {
    fetch('get_user_profile.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {
            if (!user || user.error) {
                console.error('Profile fetch error:', user);
                showToast('Error fetching profile', 'danger');
                return;
            }

            // Update sidebar profile
            const sidebarName = document.getElementById('sidebar-profile-name');
            if (sidebarName) {
                sidebarName.textContent = `${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`;
            }
            
            // Update profile image
            const profileImage = document.getElementById('sidebar-profile-image');
            if (profileImage) {
                profileImage.src = user.profile_image || 'default-profile.jpg';
                profileImage.onerror = function() {
                    console.error('Failed to load profile image');
                    this.src = 'default-profile.jpg';
                };
            }

            // Populate form with data
            populateProfileForm(user);
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            showToast('Error loading profile data', 'danger');
        });
}

// Function to populate profile form with user data
function populateProfileForm(user) {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

    // Build form HTML with only the specified fields
    form.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-4">
                <div class="profile-edit-form-group">
                    <label>First Name</label>
                    <input type="text" id="edit-first-name" name="first_name" value="${user.first_name || ''}" required class="form-control">
                </div>
            </div>
            <div class="col-md-4">
                <div class="profile-edit-form-group">
                    <label>Last Name</label>
                    <input type="text" id="edit-last-name" name="last_name" value="${user.last_name || ''}" required class="form-control">
                </div>
            </div>
            <div class="col-md-4">
                <div class="profile-edit-form-group">
                    <label>Email Address</label>
                    <input type="email" id="edit-email" name="email" value="${user.email || ''}" required class="form-control">
                </div>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-4">
                <div class="profile-edit-form-group">
                    <label>Course</label>
                    <input type="text" id="edit-course" name="course" value="${user.course || ''}" required class="form-control">
                </div>
            </div>
            <div class="col-md-4">
                <div class="profile-edit-form-group">
                    <label>Address</label>
                    <input type="text" id="edit-address" name="user_address" value="${user.user_address || ''}" required class="form-control">
                </div>
            </div>
            <div class="col-md-4">
                <div class="profile-edit-form-group">
                    <label>Profile Image</label>
                    <input type="file" id="edit-profile-image" name="profile_image" accept="image/*" class="form-control">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12 text-center">
                <button type="submit" class="profile-modal-submit btn btn-primary btn-lg">Save Changes</button>
            </div>
        </div>
    `;

    form.className = 'needs-validation';

    form.addEventListener('submit', handleProfileSubmit);
}

function handleProfileSubmit(event) {
    event.preventDefault();
    
    // Show loading state
    const form = event.target;
    const submitButton = form.querySelector('.profile-modal-submit');
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Saving...
    `;

    const formData = new FormData(form);
    
    // Add CSRF token if needed
    formData.append('action', 'update_profile');

    // Show loading state in form
    form.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Saving...</span>
            </div>
            <p class="mt-3">Updating your profile...</p>
        </div>
    `;

    // Send update request
    fetch('update_profile.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show success message
            showToast('Profile updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('profile-edit-modal'));
            modal.hide();
            
            // Refresh page to show updated data
            window.location.reload();
        } else {
            throw new Error(data.message || 'Failed to update profile');
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showToast('Error updating profile: ' + error.message, 'danger');
        
        // Reset form and button
        form.innerHTML = `
            <div class="text-center py-5">
                <div class="alert alert-danger">
                    Failed to update profile. Please try again.
                </div>
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">
                    Try Again
                </button>
            </div>
        `;
    })
    .finally(() => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    });
}

$(document).ready(function() {
    document.getElementById('profile-edit-form').addEventListener('submit', handleProfileSubmit);
    
    document.getElementById('profile-section').addEventListener('click', function() {
        handleProfileModalOpen();
    });
    
    checkAuthentication();
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred. Please try again.', 'danger');
});