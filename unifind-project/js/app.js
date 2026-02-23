// ===== Global State =====
let currentSection = 'marketplace';
let marketplaceItems = [];
let lostFoundItems = [];
let currentFilter = 'all';
let currentLFFilter = 'all';

// ===== API Functions =====
async function fetchMarketplaceItems() {
    try {
        const response = await fetch('tables/marketplace_items?limit=100&sort=-created_at');
        const data = await response.json();
        marketplaceItems = data.data || [];
        renderMarketplaceItems();
    } catch (error) {
        console.error('Error fetching marketplace items:', error);
        showEmptyState('marketplace', 'Failed to load items. Please refresh the page.');
    }
}

async function fetchLostFoundItems() {
    try {
        const response = await fetch('tables/lost_found_items?limit=100&sort=-created_at');
        const data = await response.json();
        lostFoundItems = data.data || [];
        renderLostFoundItems();
    } catch (error) {
        console.error('Error fetching lost & found items:', error);
        showEmptyState('lost-found', 'Failed to load items. Please refresh the page.');
    }
}

async function createMarketplaceItem(itemData) {
    try {
        const response = await fetch('tables/marketplace_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const newItem = await response.json();
        marketplaceItems.unshift(newItem);
        renderMarketplaceItems();
        return newItem;
    } catch (error) {
        console.error('Error creating marketplace item:', error);
        throw error;
    }
}

async function createLostFoundItem(itemData) {
    try {
        const response = await fetch('tables/lost_found_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const newItem = await response.json();
        lostFoundItems.unshift(newItem);
        renderLostFoundItems();
        return newItem;
    } catch (error) {
        console.error('Error creating lost & found item:', error);
        throw error;
    }
}

// ===== Render Functions =====
function renderMarketplaceItems() {
    const container = document.getElementById('marketplaceItems');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    // Filter items
    let filteredItems = marketplaceItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery) || 
                             item.description.toLowerCase().includes(searchQuery);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        const matchesFilter = currentFilter === 'all' || item.status === currentFilter;
        return matchesSearch && matchesCategory && matchesFilter;
    });
    
    if (filteredItems.length === 0) {
        showEmptyState('marketplace', 'No items found. Try adjusting your filters or be the first to post!');
        return;
    }
    
    container.innerHTML = filteredItems.map(item => createMarketplaceCard(item)).join('');
    
    // Add click listeners
    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.dataset.id;
            const item = marketplaceItems.find(i => i.id === itemId);
            if (item) showMarketplaceDetail(item);
        });
    });
}

function renderLostFoundItems() {
    const container = document.getElementById('lostFoundItems');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    // Filter items
    let filteredItems = lostFoundItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery) || 
                             item.description.toLowerCase().includes(searchQuery);
        const matchesFilter = currentLFFilter === 'all' || 
                             item.type === currentLFFilter || 
                             item.status === currentLFFilter;
        return matchesSearch && matchesFilter;
    });
    
    if (filteredItems.length === 0) {
        showEmptyState('lost-found', 'No items found. Try adjusting your filters or post a lost/found item!');
        return;
    }
    
    container.innerHTML = filteredItems.map(item => createLostFoundCard(item)).join('');
    
    // Add click listeners
    document.querySelectorAll('.lf-item-card').forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.dataset.id;
            const item = lostFoundItems.find(i => i.id === itemId);
            if (item) showLostFoundDetail(item);
        });
    });
}

function createMarketplaceCard(item) {
    const imageHtml = item.image_url 
        ? `<img src="${item.image_url}" alt="${item.title}">`
        : `<i class="fas fa-box"></i>`;
    
    const statusClass = item.status === 'Available' ? 'status-available' : 'status-sold';
    const dateStr = formatDate(item.posted_date || item.created_at);
    
    return `
        <div class="item-card" data-id="${item.id}">
            <div class="item-image">${imageHtml}</div>
            <div class="item-content">
                <div class="item-header">
                    <div>
                        <span class="item-category">${item.category}</span>
                        <h3 class="item-title">${item.title}</h3>
                    </div>
                    <span class="item-price">Rs ${item.price.toLocaleString()}</span>
                </div>
                <p class="item-description">${item.description}</p>
                <div class="item-meta">
                    <span class="item-seller">
                        <i class="fas fa-user"></i> ${item.seller_name}
                    </span>
                    <span class="status-badge ${statusClass}">${item.status}</span>
                </div>
                <div class="item-meta">
                    <span class="item-date">${dateStr}</span>
                    <span style="color: var(--gray); font-size: 0.85rem;">
                        <i class="fas fa-tag"></i> ${item.condition}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function createLostFoundCard(item) {
    const imageHtml = item.image_url 
        ? `<img src="${item.image_url}" alt="${item.title}">`
        : `<i class="fas fa-question-circle"></i>`;
    
    const statusClass = item.type === 'Lost' ? 'status-lost' : 'status-found';
    const typeIcon = item.type === 'Lost' ? 'fa-exclamation-circle' : 'fa-check-circle';
    const dateStr = formatDate(item.date);
    const itemClass = `lf-item-card ${item.type.toLowerCase()} ${item.status === 'Resolved' ? 'resolved' : ''}`;
    
    return `
        <div class="${itemClass}" data-id="${item.id}">
            <div class="item-image">${imageHtml}</div>
            <div class="item-content">
                <span class="item-category">${item.category}</span>
                <h3 class="item-title">${item.title}</h3>
                <div class="lf-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${item.location}</span>
                </div>
                <p class="item-description">${item.description}</p>
                <div class="item-meta">
                    <span class="item-seller">
                        <i class="fas fa-user"></i> ${item.contact_name}
                    </span>
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${typeIcon}"></i> ${item.type}
                    </span>
                </div>
                <div class="item-meta">
                    <span class="item-date">${dateStr}</span>
                    ${item.status === 'Resolved' ? '<span class="status-badge status-resolved">Resolved</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function showEmptyState(section, message) {
    const container = section === 'marketplace' 
        ? document.getElementById('marketplaceItems')
        : document.getElementById('lostFoundItems');
    
    const icon = section === 'marketplace' ? 'fa-store' : 'fa-search';
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <h3>${message}</h3>
            <p>Click the "Post Item" button to add something!</p>
        </div>
    `;
}

// ===== Detail View Functions =====
function showMarketplaceDetail(item) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    const imageHtml = item.image_url 
        ? `<img src="${item.image_url}" alt="${item.title}">`
        : `<i class="fas fa-box"></i>`;
    
    const statusClass = item.status === 'Available' ? 'status-available' : 'status-sold';
    const dateStr = formatDate(item.posted_date || item.created_at);
    
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-image">${imageHtml}</div>
            <div class="detail-info">
                <h2>${item.title}</h2>
                <p class="detail-price">Rs ${item.price.toLocaleString()}</p>
                
                <div class="detail-section">
                    <h4>Category</h4>
                    <p>${item.category}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Condition</h4>
                    <p>${item.condition}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Status</h4>
                    <p><span class="status-badge ${statusClass}">${item.status}</span></p>
                </div>
                
                <div class="detail-section">
                    <h4>Description</h4>
                    <p>${item.description}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Posted Date</h4>
                    <p>${dateStr}</p>
                </div>
                
                <div class="contact-info">
                    <h4>Contact Seller</h4>
                    <div class="contact-item">
                        <i class="fas fa-user"></i>
                        <span>${item.seller_name}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${item.seller_contact}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function showLostFoundDetail(item) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    const imageHtml = item.image_url 
        ? `<img src="${item.image_url}" alt="${item.title}">`
        : `<i class="fas fa-question-circle"></i>`;
    
    const statusClass = item.type === 'Lost' ? 'status-lost' : 'status-found';
    const dateStr = formatDate(item.date);
    const postedDateStr = formatDate(item.posted_date || item.created_at);
    
    content.innerHTML = `
        <div class="detail-grid">
            <div class="detail-image">${imageHtml}</div>
            <div class="detail-info">
                <h2>${item.title}</h2>
                <p><span class="status-badge ${statusClass}">${item.type}</span></p>
                
                <div class="detail-section">
                    <h4>Category</h4>
                    <p>${item.category}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Location</h4>
                    <p><i class="fas fa-map-marker-alt" style="color: var(--danger-color);"></i> ${item.location}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Date ${item.type}</h4>
                    <p>${dateStr}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Status</h4>
                    <p><span class="status-badge ${item.status === 'Resolved' ? 'status-resolved' : statusClass}">${item.status}</span></p>
                </div>
                
                <div class="detail-section">
                    <h4>Description</h4>
                    <p>${item.description}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Posted Date</h4>
                    <p>${postedDateStr}</p>
                </div>
                
                <div class="contact-info">
                    <h4>Contact Information</h4>
                    <div class="contact-item">
                        <i class="fas fa-user"></i>
                        <span>${item.contact_name}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${item.contact_info}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// ===== Modal Functions =====
function openPostModal() {
    const modal = document.getElementById('postModal');
    const formSelector = document.getElementById('formSelector');
    const marketplaceForm = document.getElementById('marketplaceForm');
    const lostFoundForm = document.getElementById('lostFoundForm');
    
    // Reset all forms
    marketplaceForm.reset();
    lostFoundForm.reset();
    marketplaceForm.style.display = 'none';
    lostFoundForm.style.display = 'none';
    formSelector.style.display = 'block';
    
    modal.classList.add('active');
}

function closePostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('active');
}

// ===== Form Handlers =====
function handleMarketplaceSubmit(e) {
    e.preventDefault();
    
    const itemData = {
        title: document.getElementById('mp-title').value,
        description: document.getElementById('mp-description').value,
        price: parseFloat(document.getElementById('mp-price').value),
        category: document.getElementById('mp-category').value,
        condition: document.getElementById('mp-condition').value,
        seller_name: document.getElementById('mp-seller-name').value,
        seller_contact: document.getElementById('mp-seller-contact').value,
        image_url: document.getElementById('mp-image-url').value || '',
        status: 'Available',
        posted_date: new Date().toISOString()
    };
    
    createMarketplaceItem(itemData)
        .then(() => {
            closePostModal();
            alert('Item posted successfully!');
        })
        .catch(error => {
            alert('Failed to post item. Please try again.');
        });
}

function handleLostFoundSubmit(e) {
    e.preventDefault();
    
    const itemData = {
        title: document.getElementById('lf-title').value,
        description: document.getElementById('lf-description').value,
        type: document.querySelector('input[name="lf-type"]:checked').value,
        category: document.getElementById('lf-category').value,
        location: document.getElementById('lf-location').value,
        date: document.getElementById('lf-date').value,
        contact_name: document.getElementById('lf-contact-name').value,
        contact_info: document.getElementById('lf-contact-info').value,
        image_url: document.getElementById('lf-image-url').value || '',
        status: 'Active',
        posted_date: new Date().toISOString()
    };
    
    createLostFoundItem(itemData)
        .then(() => {
            closePostModal();
            alert('Item posted successfully!');
        })
        .catch(error => {
            alert('Failed to post item. Please try again.');
        });
}

// ===== Utility Functions =====
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function switchSection(section) {
    currentSection = section;
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    if (section === 'marketplace') {
        document.getElementById('marketplace-section').classList.add('active');
        renderMarketplaceItems();
    } else {
        document.getElementById('lost-found-section').classList.add('active');
        renderLostFoundItems();
    }
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    fetchMarketplaceItems();
    fetchLostFoundItems();
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });
    
    // Post button
    document.getElementById('postItemBtn').addEventListener('click', openPostModal);
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closePostModal);
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    document.getElementById('cancelMarketplace').addEventListener('click', closePostModal);
    document.getElementById('cancelLostFound').addEventListener('click', closePostModal);
    
    // Close modal on outside click
    document.getElementById('postModal').addEventListener('click', (e) => {
        if (e.target.id === 'postModal') closePostModal();
    });
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') closeDetailModal();
    });
    
    // Form selectors
    document.querySelectorAll('.selector-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const formType = btn.dataset.form;
            document.getElementById('formSelector').style.display = 'none';
            
            if (formType === 'marketplace') {
                document.getElementById('marketplaceForm').style.display = 'block';
                document.getElementById('modalTitle').textContent = 'Post Marketplace Item';
            } else {
                document.getElementById('lostFoundForm').style.display = 'block';
                document.getElementById('modalTitle').textContent = 'Post Lost & Found Item';
            }
        });
    });
    
    // Form submissions
    document.getElementById('marketplaceForm').addEventListener('submit', handleMarketplaceSubmit);
    document.getElementById('lostFoundForm').addEventListener('submit', handleLostFoundSubmit);
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', () => {
        if (currentSection === 'marketplace') {
            renderMarketplaceItems();
        } else {
            renderLostFoundItems();
        }
    });
    
    document.getElementById('categoryFilter').addEventListener('change', () => {
        renderMarketplaceItems();
    });
    
    // Marketplace filters
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderMarketplaceItems();
        });
    });
    
    // Lost & Found filters
    document.querySelectorAll('[data-lf-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-lf-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLFFilter = btn.dataset.lfFilter;
            renderLostFoundItems();
        });
    });
    
    // Set default date to today for lost & found form
    document.getElementById('lf-date').valueAsDate = new Date();
});
