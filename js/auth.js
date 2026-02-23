// ===== Authentication & User Management Module =====

// Global user state
let currentUser = null;

// ===== Authentication Functions =====

async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            updateUIForAuthenticatedUser();
            return { success: true, user: data.user };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function signup(userData) {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, message: 'Account created! Please verify your email.' };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (!token || !storedUser) {
        return false;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            return true;
        } else {
            logout();
            return false;
        }
    } catch (error) {
        console.error('Auth verification error:', error);
        return false;
    }
}

// ===== User Profile Functions =====

async function getUserProfile(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch user profile');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

async function updateUserProfile(userId, profileData) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            return { success: true, user: updatedUser };
        } else {
            const error = await response.json();
            return { success: false, message: error.message };
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function changePassword(currentPassword, newPassword) {
    try {
        const response = await fetch('/api/users/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (response.ok) {
            return { success: true, message: 'Password changed successfully!' };
        } else {
            const error = await response.json();
            return { success: false, message: error.message };
        }
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// ===== User Items Functions =====

async function getUserMarketplaceItems(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/marketplace-items`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch user items');
        }
    } catch (error) {
        console.error('Error fetching user items:', error);
        return [];
    }
}

async function getUserLostFoundItems(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/lost-found-items`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch user items');
        }
    } catch (error) {
        console.error('Error fetching user items:', error);
        return [];
    }
}

async function deleteMarketplaceItem(itemId) {
    try {
        const response = await fetch(`/api/marketplace-items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error deleting item:', error);
        return false;
    }
}

async function deleteLostFoundItem(itemId) {
    try {
        const response = await fetch(`/api/lost-found-items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error deleting item:', error);
        return false;
    }
}

async function updateItemStatus(itemId, itemType, status) {
    try {
        const endpoint = itemType === 'marketplace' 
            ? `/api/marketplace-items/${itemId}` 
            : `/api/lost-found-items/${itemId}`;
            
        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ status })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error updating item status:', error);
        return false;
    }
}

// ===== Favorites Functions =====

async function getUserFavorites(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/favorites`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch favorites');
        }
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
}

async function addToFavorites(itemId, itemType) {
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ itemId, itemType })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return false;
    }
}

async function removeFromFavorites(favoriteId) {
    try {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error removing from favorites:', error);
        return false;
    }
}

// ===== Report Functions =====

async function submitReport(reportData) {
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(reportData)
        });
        
        if (response.ok) {
            return { success: true, message: 'Report submitted successfully!' };
        } else {
            const error = await response.json();
            return { success: false, message: error.message };
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// ===== Review Functions =====

async function submitReview(reviewData) {
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(reviewData)
        });
        
        if (response.ok) {
            return { success: true, message: 'Review submitted successfully!' };
        } else {
            const error = await response.json();
            return { success: false, message: error.message };
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function getUserReviews(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/reviews`);
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch reviews');
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

// ===== UI Update Functions =====

function updateUIForAuthenticatedUser() {
    if (currentUser) {
        // Show authenticated UI elements
        document.getElementById('authButtons')?.classList.add('hidden');
        document.getElementById('userMenu')?.classList.remove('hidden');
        
        // Update user info
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser.full_name;
        }
        
        const userAvatarElement = document.getElementById('userAvatar');
        if (userAvatarElement && currentUser.profile_image_url) {
            userAvatarElement.src = currentUser.profile_image_url;
        }
        
        // Show admin panel link if admin
        if (currentUser.is_admin) {
            document.getElementById('adminPanelLink')?.classList.remove('hidden');
        }
    } else {
        // Show unauthenticated UI elements
        document.getElementById('authButtons')?.classList.remove('hidden');
        document.getElementById('userMenu')?.classList.add('hidden');
        document.getElementById('adminPanelLink')?.classList.add('hidden');
    }
}

// ===== Initialize on page load =====
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    updateUIForAuthenticatedUser();
});

// Export functions for use in other modules
window.authModule = {
    login,
    signup,
    logout,
    checkAuthStatus,
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUserMarketplaceItems,
    getUserLostFoundItems,
    deleteMarketplaceItem,
    deleteLostFoundItem,
    updateItemStatus,
    getUserFavorites,
    addToFavorites,
    removeFromFavorites,
    submitReport,
    submitReview,
    getUserReviews,
    getCurrentUser: () => currentUser
};
