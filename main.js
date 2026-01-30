// State variables
let allProducts = [];
let displayProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortConfig = { key: null, direction: null };

// DOM Elements
const tableBody = document.getElementById('productTableBody');
const searchInput = document.getElementById('searchInput');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const paginationControls = document.getElementById('paginationControls');
const pageInfo = document.getElementById('pageInfo');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    // Event Listeners
    searchInput.addEventListener('change', handleSearch); // Requirement: onChange
    // Adding 'input' event as well for better UX, but keeping strict 'change' requirement priority behavior
    // searchInput.addEventListener('input', handleSearch); 

    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        render();
    });
});

// --- API ---
async function fetchProducts() {
    try {
        const response = await fetch('https://api.escuelajs.co/api/v1/products');
        if (!response.ok) throw new Error('Network response was not ok');
        allProducts = await response.json();
        // Initial copy
        displayProducts = [...allProducts];
        render();
    } catch (error) {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Failed to load data. Please try again later.</td></tr>`;
    }
}

// --- Logic ---

function handleSearch(e) {
    const keyword = e.target.value.toLowerCase().trim();

    if (!keyword) {
        displayProducts = [...allProducts];
    } else {
        displayProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(keyword)
        );
    }

    // Re-apply sort if exists
    if (sortConfig.key) {
        applySort();
    }

    currentPage = 1;
    render();
}

function handleSort(key, direction) {
    sortConfig = { key, direction };
    applySort();
    render();
}

function applySort() {
    const { key, direction } = sortConfig;
    if (!key) return;

    displayProducts.sort((a, b) => {
        if (key === 'price') {
            return direction === 'asc' ? a.price - b.price : b.price - a.price;
        } else if (key === 'title') {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            if (titleA < titleB) return direction === 'asc' ? -1 : 1;
            if (titleA > titleB) return direction === 'asc' ? 1 : -1;
            return 0;
        }
    });
}

function render() {
    renderTable();
    renderPagination();
}

function renderTable() {
    tableBody.innerHTML = '';

    if (displayProducts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">Không tìm thấy sản phẩm nào.</td></tr>`;
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const productsToShow = displayProducts.slice(start, end);

    productsToShow.forEach(product => {
        // Safe image handling (API sometimes returns malformed URLs)
        let imageUrl = 'https://placehold.co/100?text=No+Image';
        if (product.images && product.images.length > 0) {
            // Clean up formatting issues like '["url"]' stringified arrays standard in some fake apis
            let rawUrl = product.images[0];
            if (rawUrl.startsWith('["') && rawUrl.endsWith('"]')) {
                try {
                    rawUrl = JSON.parse(rawUrl)[0];
                } catch (e) { }
            }
            if (rawUrl.startsWith('http')) {
                imageUrl = rawUrl;
            }
        }

        const tr = document.createElement('tr');
        tr.className = 'zebra-row border-b border-gray-700'; // Using zebra-row class defined in CSS

        tr.innerHTML = `
            <td class="p-4"><img src="${imageUrl}" alt="${product.title}" class="product-img shadow-sm" referrerpolicy="no-referrer" onerror="this.src='https://placehold.co/100?text=No+Image'"></td>
            <td class="p-4 font-semibold">${product.title}</td>
            <td class="p-4 text-sm opacity-90">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</td>
            <td class="p-4 font-bold text-lg">$${product.price}</td>
            <td class="p-4 text-sm italic">${product.category ? product.category.name : 'N/A'}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderPagination() {
    paginationControls.innerHTML = '';

    const totalPages = Math.ceil(displayProducts.length / itemsPerPage);

    if (totalPages <= 1) {
        pageInfo.textContent = '';
        return;
    }

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-blue-600'}`;
    prevBtn.textContent = 'Trước';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            render();
        }
    };
    paginationControls.appendChild(prevBtn);

    // Page Numbers (Simple version: Show Current, and basic range if needed, for now just simple numbers or abbreviated)
    // To keep it clean for 5,10,20 items on potentially large dataset, let's show: 1 ... Prev Current Next ... Last
    // Or just simple Prev [Current/Total] Next for simplicity as not requested specifically complex pager

    const pageSpan = document.createElement('span');
    pageSpan.className = 'px-4 py-1 font-medium';
    pageSpan.textContent = `Trang ${currentPage} / ${totalPages}`;
    paginationControls.appendChild(pageSpan);

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-blue-600'}`;
    nextBtn.textContent = 'Sau';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            render();
        }
    };
    paginationControls.appendChild(nextBtn);

    pageInfo.textContent = `Hiển thị ${productsToShowCount()} trên tổng số ${displayProducts.length} kết quả`;
}

function productsToShowCount() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, displayProducts.length);
    return end - start;
}
