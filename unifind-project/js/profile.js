// ===== Profile Page Module =====

// Profile state
let userProfile = null;
let userListings = [];
let userFavorites = [];

// ===== Initialize Profile Page =====
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
        // Redirect to home if not logged in
        alert('Please log in to view your profile');
        window.location.href = 'index.html';
        return;
    }
    
    // Load profile data
    loadUserProfile();
    loadUserListings();
    loadUserFavorites();
    
    // Set up event listeners
    setupEventListeners();
});

// ===== Load User Profile =====
async function loadUserProfile() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        userProfile = currentUser;
        renderProfile();
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

// ===== Render Profile =====
function renderProfile() {
    if (!userProfile) return;
    
    // Update profile header
    document.getElementById('profileUserName').textContent = userProfile.full_name || 'User';
    document.getElementById('profileUserEmail').textContent = userProfile.email || '';
    document.getElementById('profileUserPhone').textContent = userProfile.phone_number || 'Not provided';
    document.getElementById('profileUserStudentId').textContent = userProfile.student_id || 'Not provided';
    
    // Update avatar
    const avatarUrl = userProfile.profile_picture || 'https://via.placeholder.com/150';
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('headerUserAvatar').src = avatarUrl;
    
    // Update stats
    document.getElementById('totalListings').textContent = userProfile.total_listings || 0;
    document.getElementById('activeSales').textContent = userProfile.active_sales || 0;
    document.getElementById('totalSold').textContent = userProfile.total_sold || 0;
}

// ===== Load User Listings =====
async function loadUserListings() {
    try {
        // Mock data - replace with actual API call
        userListings = [];
        renderListings();
    } catch (error) {
        console.error('Error loading listings:', error);
        showError('Failed to load listings');
    }
}

// ===== Load User Favorites =====
async function loadUserFavorites() {
    try {
        // Mock data - replace with actual API call
        userFavorites = [];
        renderFavorites();
    } catch (error) {
        console.error('Error loading favorites:', error);
        showError('Failed to load favorites');
    }
}

// ===== Render Listings =====
function renderListings() {
    const container = document.getElementById('myListingsGrid');
    
    if (!userListings || userListings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No listings yet</p></div>';
        return;
    }
    
    container.innerHTML = userListings.map(item => `
        <div class="item-card">
            <img src="${item.image_url || 'https://via.placeholder.com/300x200'}" alt="${item.title}">
            <div class="item-info">
                <h3>${item.title}</h3>
                <p class="item-price">NPR ${item.price}</p>
                <span class="item-status ${item.status.toLowerCase()}">${item.status}</span>
            </div>
        </div>
    `).join('');
}

// ===== Render Favorites =====
function renderFavorites() {
    const container = document.getElementById('favoritesGrid');
    
    if (!userFavorites || userFavorites.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>No favorites yet</p></div>';
        return;
    }
    
    container.innerHTML = userFavorites.map(item => `
        <div class="item-card">
            <img src="${item.image_url || 'https://via.placeholder.com/300x200'}" alt="${item.title}">
            <div class="item-info">
                <h3>${item.title}</h3>
                <p class="item-price">NPR ${item.price}</p>
                <button class="btn btn-sm btn-danger" onclick="removeFavorite(${item.id})">
                    <i class="fas fa-heart-broken"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Edit profile button
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }
    
    // Edit profile form
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditProfile);
    }
    
    // Cancel edit button
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }
    
    // Close edit modal
    const closeBtn = document.getElementById('closeEditModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }
}

// ===== Switch Tabs =====
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ===== Edit Profile Modal =====
function openEditModal() {
    const modal = document.getElementById('editProfileModal');
    
    // Pre-fill form with current data
    if (userProfile) {
        document.getElementById('editFullName').value = userProfile.full_name || '';
        document.getElementById('editPhoneNumber').value = userProfile.phone_number || '';
        document.getElementById('editBio').value = userProfile.bio || '';
    }
    
    modal.style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// ===== Handle Edit Profile =====
async function handleEditProfile(e) {
    e.preventDefault();
    
    const formData = {
        full_name: document.getElementById('editFullName').value,
        phone_number: document.getElementById('editPhoneNumber').value,
        bio: document.getElementById('editBio').value
    };
    
    try {
        // Mock update - replace with actual API call
        userProfile = { ...userProfile, ...formData };
        localStorage.setItem('currentUser', JSON.stringify(userProfile));
        
        renderProfile();
        closeEditModal();
        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
    }
}

// ===== Remove Favorite =====
async function removeFavorite(itemId) {
    if (!confirm('Remove this item from favorites?')) return;
    
    try {
        // Mock removal - replace with actual API call
        userFavorites = userFavorites.filter(item => item.id !== itemId);
        renderFavorites();
        showSuccess('Removed from favorites');
    } catch (error) {
        console.error('Error removing favorite:', error);
        showError('Failed to remove favorite');
    }
}

// ===== Utility Functions =====
function showSuccess(message) {
    alert(message); // Replace with better notification system
}

function showError(message) {
    alert('Error: ' + message); // Replace with better notification system
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('editProfileModal');
    if (e.target === modal) {
        closeEditModal();
    }
});
