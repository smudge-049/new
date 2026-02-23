// ===== Admin Panel Module =====

// Admin state
let adminStats = null;
let pendingReports = [];
let allUsers = [];
let duplicateItems = [];

// ===== Admin Dashboard Functions =====

async function fetchAdminDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            adminStats = await response.json();
            renderAdminStats();
        } else {
            throw new Error('Failed to fetch admin stats');
        }
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        showAdminError('Failed to load dashboard statistics');
    }
}

function renderAdminStats() {
    if (!adminStats) return;
    
    document.getElementById('totalUsers').textContent = adminStats.totalUsers || 0;
    document.getElementById('totalListings').textContent = adminStats.totalListings || 0;
    document.getElementById('pendingReports').textContent = adminStats.pendingReports || 0;
    document.getElementById('blockedUsers').textContent = adminStats.blockedUsers || 0;
    document.getElementById('activeMarketplace').textContent = adminStats.activeMarketplace || 0;
    document.getElementById('activeLostFound').textContent = adminStats.activeLostFound || 0;
}

// ===== Reports Management =====

async function fetchPendingReports() {
    try {
        const response = await fetch('/api/admin/reports?status=Pending', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            pendingReports = await response.json();
            renderPendingReports();
        } else {
            throw new Error('Failed to fetch reports');
        }
    } catch (error) {
        console.error('Error fetching reports:', error);
        showAdminError('Failed to load pending reports');
    }
}

function renderPendingReports() {
    const container = document.getElementById('reportsContainer');
    
    if (pendingReports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No pending reports</h3>
                <p>All reports have been reviewed!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingReports.map(report => `
        <div class="report-card" data-report-id="${report.id}">
            <div class="report-header">
                <div>
                    <span class="report-type">${report.reason}</span>
                    <h4>Report #${report.id.substring(0, 8)}</h4>
                </div>
                <span class="report-date">${formatDate(report.created_at)}</span>
            </div>
            
            <div class="report-body">
                <div class="report-section">
                    <label>Reported By:</label>
                    <p>${report.reporter_name} (${report.reporter_email})</p>
                </div>
                
                ${report.reported_user_id ? `
                    <div class="report-section">
                        <label>Reported User:</label>
                        <p>${report.reported_user_name} (${report.reported_user_email})</p>
                        <button class="btn-link" onclick="adminModule.viewUserProfile('${report.reported_user_id}')">
                            View Profile
                        </button>
                    </div>
                ` : ''}
                
                ${report.reported_item_id ? `
                    <div class="report-section">
                        <label>Reported Item:</label>
                        <p>${report.item_title} (${report.item_type})</p>
                        <button class="btn-link" onclick="adminModule.viewReportedItem('${report.reported_item_id}', '${report.item_type}')">
                            View Item
                        </button>
                    </div>
                ` : ''}
                
                <div class="report-section">
                    <label>Description:</label>
                    <p>${report.description || 'No additional details provided'}</p>
                </div>
            </div>
            
            <div class="report-actions">
                <button class="btn btn-danger" onclick="adminModule.takeAction('${report.id}', 'block')">
                    <i class="fas fa-ban"></i> Take Action
                </button>
                <button class="btn btn-secondary" onclick="adminModule.dismissReport('${report.id}')">
                    <i class="fas fa-times"></i> Dismiss
                </button>
                <button class="btn btn-primary" onclick="adminModule.reviewReport('${report.id}')">
                    <i class="fas fa-eye"></i> Review
                </button>
            </div>
        </div>
    `).join('');
}

async function takeActionOnReport(reportId, action) {
    try {
        const response = await fetch(`/api/admin/reports/${reportId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ action })
        });
        
        if (response.ok) {
            showAdminSuccess(`Action taken successfully`);
            await fetchPendingReports();
            await fetchAdminDashboardStats();
        } else {
            const error = await response.json();
            showAdminError(error.message);
        }
    } catch (error) {
        console.error('Error taking action:', error);
        showAdminError('Failed to process action');
    }
}

async function dismissReport(reportId) {
    if (!confirm('Are you sure you want to dismiss this report?')) return;
    
    try {
        const response = await fetch(`/api/admin/reports/${reportId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ status: 'Dismissed' })
        });
        
        if (response.ok) {
            showAdminSuccess('Report dismissed');
            await fetchPendingReports();
        } else {
            throw new Error('Failed to dismiss report');
        }
    } catch (error) {
        console.error('Error dismissing report:', error);
        showAdminError('Failed to dismiss report');
    }
}

async function resolveReport(reportId, adminNotes) {
    try {
        const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ adminNotes })
        });
        
        if (response.ok) {
            showAdminSuccess('Report resolved');
            await fetchPendingReports();
            await fetchAdminDashboardStats();
        } else {
            throw new Error('Failed to resolve report');
        }
    } catch (error) {
        console.error('Error resolving report:', error);
        showAdminError('Failed to resolve report');
    }
}

// ===== User Management =====

async function fetchAllUsers(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/users?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            allUsers = await response.json();
            renderUsersList();
        } else {
            throw new Error('Failed to fetch users');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        showAdminError('Failed to load users');
    }
}

function renderUsersList() {
    const container = document.getElementById('usersContainer');
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No users found</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Listings</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allUsers.map(user => `
                    <tr class="${user.is_blocked ? 'blocked-user' : ''}">
                        <td>${user.student_id}</td>
                        <td>
                            <div class="user-info">
                                <img src="${user.profile_image_url || '/assets/default-avatar.png'}" 
                                     alt="${user.full_name}" class="user-avatar-small">
                                <span>${user.full_name}</span>
                                ${user.is_verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td>${user.department || 'N/A'}</td>
                        <td>${user.total_listings || 0}</td>
                        <td>
                            <div class="rating">
                                <i class="fas fa-star"></i>
                                ${user.rating ? user.rating.toFixed(1) : 'N/A'}
                                ${user.total_reviews ? `(${user.total_reviews})` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="status-badge ${user.is_blocked ? 'status-blocked' : 'status-active'}">
                                ${user.is_blocked ? 'Blocked' : 'Active'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick="adminModule.viewUserProfile('${user.id}')" 
                                        title="View Profile">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${!user.is_blocked ? `
                                    <button class="btn-icon btn-danger" 
                                            onclick="adminModule.blockUser('${user.id}')" 
                                            title="Block User">
                                        <i class="fas fa-ban"></i>
                                    </button>
                                ` : `
                                    <button class="btn-icon btn-success" 
                                            onclick="adminModule.unblockUser('${user.id}')" 
                                            title="Unblock User">
                                        <i class="fas fa-check"></i>
                                    </button>
                                `}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function blockUser(userId, reason) {
    if (!confirm('Are you sure you want to block this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/block`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            showAdminSuccess('User blocked successfully');
            await fetchAllUsers();
            await fetchAdminDashboardStats();
        } else {
            throw new Error('Failed to block user');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        showAdminError('Failed to block user');
    }
}

async function unblockUser(userId) {
    if (!confirm('Are you sure you want to unblock this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/unblock`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            showAdminSuccess('User unblocked successfully');
            await fetchAllUsers();
            await fetchAdminDashboardStats();
        } else {
            throw new Error('Failed to unblock user');
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        showAdminError('Failed to unblock user');
    }
}

async function verifyUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            showAdminSuccess('User verified successfully');
            await fetchAllUsers();
        } else {
            throw new Error('Failed to verify user');
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        showAdminError('Failed to verify user');
    }
}

// ===== Duplicate Items Management =====

async function findDuplicateItems() {
    try {
        const response = await fetch('/api/admin/duplicates', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            duplicateItems = await response.json();
            renderDuplicateItems();
        } else {
            throw new Error('Failed to fetch duplicates');
        }
    } catch (error) {
        console.error('Error fetching duplicates:', error);
        showAdminError('Failed to load duplicate items');
    }
}

function renderDuplicateItems() {
    const container = document.getElementById('duplicatesContainer');
    
    if (duplicateItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No duplicates found</h3>
                <p>All items appear to be unique!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = duplicateItems.map(group => `
        <div class="duplicate-group">
            <h4>Potential Duplicates (${group.items.length} items)</h4>
            <div class="duplicate-items-grid">
                ${group.items.map(item => `
                    <div class="duplicate-item-card">
                        <div class="item-image-small">
                            ${item.image_url ? 
                                `<img src="${item.image_url}" alt="${item.title}">` : 
                                `<i class="fas fa-box"></i>`
                            }
                        </div>
                        <div class="item-info">
                            <h5>${item.title}</h5>
                            <p class="item-price">Rs ${item.price.toLocaleString()}</p>
                            <p class="item-meta">
                                By: ${item.seller_name}<br>
                                Posted: ${formatDate(item.created_at)}
                            </p>
                        </div>
                        <div class="duplicate-actions">
                            <button class="btn btn-sm btn-primary" 
                                    onclick="adminModule.viewItem('${item.id}', 'marketplace')">
                                View
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="adminModule.deleteItem('${item.id}', 'marketplace')">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function deleteItem(itemId, itemType) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
    
    try {
        const endpoint = itemType === 'marketplace' 
            ? `/api/admin/marketplace-items/${itemId}` 
            : `/api/admin/lost-found-items/${itemId}`;
            
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            showAdminSuccess('Item deleted successfully');
            await findDuplicateItems();
            await fetchAdminDashboardStats();
        } else {
            throw new Error('Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showAdminError('Failed to delete item');
    }
}

// ===== Activity Logs =====

async function fetchActivityLogs(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/activity-logs?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const logs = await response.json();
            renderActivityLogs(logs);
        } else {
            throw new Error('Failed to fetch activity logs');
        }
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        showAdminError('Failed to load activity logs');
    }
}

function renderActivityLogs(logs) {
    const container = document.getElementById('activityLogsContainer');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No activity logs</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="activity-logs">
            ${logs.map(log => `
                <div class="log-entry">
                    <div class="log-icon ${getLogIconClass(log.action_type)}">
                        <i class="fas ${getLogIcon(log.action_type)}"></i>
                    </div>
                    <div class="log-content">
                        <p class="log-description">${log.description}</p>
                        <p class="log-meta">
                            By: ${log.admin_name} | 
                            ${formatDate(log.created_at)} | 
                            IP: ${log.ip_address}
                        </p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getLogIcon(actionType) {
    const icons = {
        'user_block': 'fa-ban',
        'user_unblock': 'fa-check',
        'item_delete': 'fa-trash',
        'report_resolve': 'fa-check-circle',
        'user_verify': 'fa-certificate',
        'duplicate_remove': 'fa-clone'
    };
    return icons[actionType] || 'fa-info-circle';
}

function getLogIconClass(actionType) {
    const classes = {
        'user_block': 'log-icon-danger',
        'user_unblock': 'log-icon-success',
        'item_delete': 'log-icon-danger',
        'report_resolve': 'log-icon-success',
        'user_verify': 'log-icon-primary',
        'duplicate_remove': 'log-icon-warning'
    };
    return classes[actionType] || 'log-icon-default';
}

// ===== Utility Functions =====

function showAdminError(message) {
    const toast = document.createElement('div');
    toast.className = 'admin-toast admin-toast-error';
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showAdminSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'admin-toast admin-toast-success';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== Initialize Admin Panel =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin
    const currentUser = window.authModule?.getCurrentUser();
    if (!currentUser || !currentUser.is_admin) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load initial data
    await fetchAdminDashboardStats();
    await fetchPendingReports();
    
    // Set up tab navigation
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Load tab-specific data
            if (tabId === 'users') fetchAllUsers();
            if (tabId === 'duplicates') findDuplicateItems();
            if (tabId === 'activity') fetchActivityLogs();
        });
    });
});

// Export admin module
window.adminModule = {
    fetchAdminDashboardStats,
    fetchPendingReports,
    takeActionOnReport,
    dismissReport,
    resolveReport,
    fetchAllUsers,
    blockUser,
    unblockUser,
    verifyUser,
    findDuplicateItems,
    deleteItem,
    fetchActivityLogs,
    takeAction: takeActionOnReport,
    reviewReport: resolveReport,
    viewUserProfile: (userId) => window.location.href = `profile.html?id=${userId}`,
    viewReportedItem: (itemId, itemType) => {
        // Open item detail modal
        console.log('View item:', itemId, itemType);
    },
    viewItem: (itemId, itemType) => {
        // Open item detail modal
        console.log('View item:', itemId, itemType);
    }
};
