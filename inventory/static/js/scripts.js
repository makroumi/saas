// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const mobileTabSelect = document.getElementById('mobileTabSelect');
const syncSettingsBtn = document.getElementById('syncSettingsBtn');
const syncSettingsPanel = document.getElementById('syncSettingsPanel');
const closeSyncSettings = document.getElementById('closeSyncSettings');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const connectionStatus = document.getElementById('connectionStatus');
const saveSyncSettings = document.getElementById('saveSyncSettings');
const cancelSyncSettings = document.getElementById('cancelSyncSettings');
const barcodeInput = document.getElementById('barcodeInput');
const manualEntryForm = document.getElementById('manualEntryForm');
const productInfoSection = document.getElementById('productInfoSection');
const addStockBtn = document.getElementById('addStockBtn');
const removeStockBtn = document.getElementById('removeStockBtn');
const addStockModal = document.getElementById('addStockModal');
const removeStockModal = document.getElementById('removeStockModal');
const addStockForm = document.getElementById('addStockForm');
const removeStockForm = document.getElementById('removeStockForm');
const addReason = document.getElementById('addReason');
const addNotesContainer = document.getElementById('addNotesContainer');
const removeQuantity = document.getElementById('removeQuantity');
const removeStockError = document.getElementById('removeStockError');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const searchResultsTable = document.getElementById('searchResultsTable');
const searchLoading = document.getElementById('searchLoading');
const searchEmpty = document.getElementById('searchEmpty');
const dropzone = document.getElementById('dropzone');
const fileUpload = document.getElementById('file-upload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const alertTabs = document.querySelectorAll('.alert-tab');
const alertTabContents = document.querySelectorAll('.alert-tab-content');
const acknowledgeAllBtn = document.getElementById('acknowledgeAllBtn');
const createBulkOrderBtn = document.getElementById('createBulkOrderBtn');
const productDetailsModal = document.getElementById('productDetailsModal');
const scannerContainer = document.getElementById('scannerContainer');
const scannerVideo = document.getElementById('scannerVideo');
const startScannerBtn = document.getElementById('startScannerBtn');
const stopScannerBtn = document.getElementById('stopScannerBtn');


// Temporary data for search suggestions
const searchData = [
    { name: "Premium Widget", sku: "WIDG-001", category: "Electronics" },
    { name: "Basic Widget", sku: "WIDG-002", category: "Electronics" },
    { name: "Deluxe Gadget", sku: "GADG-101", category: "Electronics" },
    { name: "Perishable Item A", sku: "PER-001", category: "Food" },
    { name: "Perishable Item B", sku: "PER-002", category: "Food" },
    { name: "Assembly Tool Set", sku: "TOOL-305", category: "Tools" }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    if (mobileTabSelect) {
        mobileTabSelect.addEventListener('change', function() {
            showTab(this.value);
        });
    }

    // Sync settings panel
    if (syncSettingsBtn) syncSettingsBtn.addEventListener('click', toggleSyncSettings);
    if (closeSyncSettings) closeSyncSettings.addEventListener('click', toggleSyncSettings);
    if (cancelSyncSettings) cancelSyncSettings.addEventListener('click', toggleSyncSettings);
    if (saveSyncSettings) saveSyncSettings.addEventListener('click', saveSyncSettingsHandler);
    if (testConnectionBtn) testConnectionBtn.addEventListener('click', testConnection);

    // Inventory count
    if (manualEntryForm) manualEntryForm.addEventListener('submit', fetchProductInfo);
    if (addStockBtn) addStockBtn.addEventListener('click', showAddStockModal);
    if (removeStockBtn) removeStockBtn.addEventListener('click', showRemoveStockModal);
    if (addStockForm) addStockForm.addEventListener('submit', addStockHandler);
    if (removeStockForm) removeStockForm.addEventListener('submit', removeStockHandler);
    if (addReason) addReason.addEventListener('change', function() {
        addNotesContainer.classList.toggle('hidden', this.value !== 'other');
    });

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchInput);
    }

    // Image upload
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, unhighlight, false);
        });

        dropzone.addEventListener('drop', handleDrop, false);
    }

    if (removeImageBtn) removeImageBtn.addEventListener('click', removeImage);

    // Scanner
    if (startScannerBtn) startScannerBtn.addEventListener('click', startScanner);
    if (stopScannerBtn) stopScannerBtn.addEventListener('click', stopScanner);
    if (switchCameraBtn) switchCameraBtn.addEventListener('click', switchCamera);
});

// Functions
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    // Update tab button styles
    tabButtons.forEach(btn => {
        btn.classList.remove('active-tab', 'text-indigo-600');
        btn.classList.add('text-gray-700');
    });

    const activeBtn = Array.from(tabButtons).find(btn => btn.getAttribute('onclick')?.includes(tabId));
    if (activeBtn) {
        activeBtn.classList.add('active-tab', 'text-indigo-600');
        activeBtn.classList.remove('text-gray-700');
    }

    // Sync mobile tab dropdown if exists
    if (mobileTabSelect) mobileTabSelect.value = tabId;

    // 🧠 Auto-load full inventory if "Search Inventory" tab is opened
    if (tabId === 'search-inventory') {
        document.getElementById('searchInput').value = ''; // clear input
        searchInventory(); // load everything
    }
}


function toggleSyncSettings() {
    syncSettingsPanel.classList.toggle('hidden');
}

function testConnection() {
    // Simulate API connection test
    connectionStatus.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-red-800', 'text-green-800');
    connectionStatus.classList.add('bg-gray-100', 'text-gray-800');
    connectionStatus.querySelector('span').textContent = 'Testing...';
    connectionStatus.querySelector('.rounded-full').classList.add('bg-gray-500');
    
    setTimeout(() => {
        // Simulate successful connection (random for demo)
        const isSuccess = Math.random() > 0.3;
        
        if (isSuccess) {
            connectionStatus.classList.remove('bg-gray-100', 'text-gray-800');
            connectionStatus.classList.add('bg-green-100', 'text-green-800');
            connectionStatus.querySelector('span').textContent = 'Connection successful';
            connectionStatus.querySelector('.rounded-full').classList.remove('bg-gray-500');
            connectionStatus.querySelector('.rounded-full').classList.add('bg-green-500');
        } else {
            connectionStatus.classList.remove('bg-gray-100', 'text-gray-800');
            connectionStatus.classList.add('bg-red-100', 'text-red-800');
            connectionStatus.querySelector('span').textContent = 'Connection failed';
            connectionStatus.querySelector('.rounded-full').classList.remove('bg-gray-500');
            connectionStatus.querySelector('.rounded-full').classList.add('bg-red-500');
        }
    }, 1500);
}

function saveSyncSettingsHandler() {
    showToast('Sync settings saved successfully');
    toggleSyncSettings();
}

// Update the fetchProductInfo function in scripts.js
// Update the fetchProductInfo function
function fetchProductInfo(e) {
    e.preventDefault();
    const barcode = barcodeInput.value.trim();
    if (!barcode) return;
    
    // Show loading state
    productInfoSection.classList.add('hidden');
    showToast('Looking up product...');
    
    // First try public databases
    fetch(`/api/barcode/${barcode}`)
        .then(res => res.json())
        .then(productData => {
            if (productData && productData.name) {
                // Check if product exists in our inventory
                fetch(`/inventory/search?q=${barcode}`)
                    .then(res => res.json())
                    .then(localResults => {
                        if (localResults.length > 0) {
                            // Product exists in inventory
                            displayProductInfo(localResults[0]);
                        } else {
                            // Add new product to inventory
                            const newProduct = {
                                barcode: barcode,
                                name: productData.name,
                                category: productData.category || 'Uncategorized',
                                quantity: 0,
                                image_url: productData.image_url || ''
                            };
                            
                            fetch('/inventory/add', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(newProduct)
                            })
                            .then(() => {
                                displayProductInfo(newProduct);
                                showToast('Product added to inventory!');
                            });
                        }
                    });
            } else {
                // If not found in public databases, check local inventory
                fetch(`/inventory/search?q=${barcode}`)
                    .then(res => res.json())
                    .then(localResults => {
                        if (localResults.length > 0) {
                            displayProductInfo(localResults[0]);
                        } else {
                            showToast('Product not found in any database');
                        }
                    });
            }
        })
        .catch(error => {
            showToast('Error looking up product');
            console.error('Lookup error:', error);
        });
}

function displayProductInfo(product) {
    productInfoSection.classList.remove('hidden');
    document.getElementById('productName').textContent = product.name || 'New Product';
    document.getElementById('productSKU').textContent = 'SKU: ' + (product.barcode || 'N/A');
    document.getElementById('productCategory').textContent = 'Category: ' + (product.category || 'N/A');
    document.getElementById('productCost').textContent = 'Unit Cost: $' + (product.cost || '0.00');
    document.getElementById('currentStock').textContent = product.quantity || '0';
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    
    // Use the image if available
    const img = document.getElementById('productImage');
    if (product.image_url) {
        img.src = product.image_url;
    } else {
        img.src = "{{ url_for('static', filename='images/placeholder.png') }}";
    }
}

function showAddStockModal() {
    addStockModal.classList.remove('hidden');
}

function closeAddStockModal() {
    addStockModal.classList.add('hidden');
    addStockForm.reset();
}

function showRemoveStockModal() {
    removeStockModal.classList.remove('hidden');
}

function closeRemoveStockModal() {
    removeStockModal.classList.add('hidden');
    removeStockForm.reset();
    removeStockError.classList.add('hidden');
}

function addStockHandler(e) {
    e.preventDefault();
    const addQuantity = parseInt(document.getElementById('addQuantity').value);
    const barcode = barcodeInput.value.trim();
    closeAddStockModal();
    adjustStock(barcode, addQuantity);

    // Update the UI (in a real app, we'd refresh from the API)
    const currentStock = parseInt(document.getElementById('currentStock').textContent);
    document.getElementById('currentStock').textContent = currentStock + addQuantity;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

function removeStockHandler(e) {
    e.preventDefault();
    const removeQty = parseInt(document.getElementById('removeQuantity').value);
    const barcode = barcodeInput.value.trim();
    const currentStock = parseInt(document.getElementById('currentStock').textContent);

    if (removeQty > currentStock) {
        removeStockError.classList.remove('hidden');
        return;
    }

    closeRemoveStockModal();
    adjustStock(barcode, -removeQty);

    // Here you would make an API call to /api/inventory/remove-stock
    showToast('Stock removed successfully');

    // Update the UI (in a real app, we'd refresh from the API)
    document.getElementById('currentStock').textContent = currentStock - removeQty;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

function handleSearchInput() {
  const query = document.getElementById('searchInput').value.trim();
  searchInventory(query);
}

function showLoader(show) {
  document.getElementById('searchLoading').classList.toggle('hidden', !show);
  document.getElementById('searchEmpty').classList.add('hidden');
  document.getElementById('searchResultsTable').classList.add('hidden');
}

function searchInventory(query = '') {
  showLoader(true);

  fetch(`/inventory/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      showLoader(false);

      const table = document.getElementById('searchResultsTable');
      const empty = document.getElementById('searchEmpty');
      const tbody = document.getElementById('searchResultsBody');
      tbody.innerHTML = '';

      if (!data.length) {
        table.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
      }

      table.classList.remove('hidden');
      empty.classList.add('hidden');

      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded" src="${item.image_url || 'https://picsum.photos/40'}" alt="">
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${item.name || 'Unnamed Product'}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.barcode || ''}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              ${item.quantity || 0} in stock
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.category || ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onclick="showProductDetails('${item.barcode}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Details</button>
            <button onclick="showTab('place-order')" class="text-green-600 hover:text-green-900">Order</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error fetching inventory:', error);
      showLoader(false);
    });
}



function selectSuggestion(sku) {
    // In a real app, this would trigger fetching the full product details
    searchInput.value = sku;
    searchSuggestions.classList.add('hidden');
    
    // Show loading state
    searchResultsTable.classList.add('hidden');
    searchEmpty.classList.add('hidden');
    searchLoading.classList.remove('hidden');
    
    // Simulate API call delay
    setTimeout(() => {
        searchLoading.classList.add('hidden');
        searchResultsTable.classList.remove('hidden');
    }, 800);
}

// Called when a product is scanned to show its details.
function showProductDetails(barcode) {
  fetch(`/inventory/search?q=${barcode}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) return;
      const p = data[0];

      // Populate the product details modal with the fetched product data.
      document.getElementById('detailsProductName').textContent = p.name || 'Unnamed Product';
      document.getElementById('detailsProductSKU').textContent = `SKU: ${p.barcode}`;
      document.getElementById('detailsProductCategory').textContent = p.category || '-';
      document.getElementById('detailsCurrentStock').textContent = p.quantity || '0';
      document.getElementById('detailsReorderThreshold').textContent = p.threshold || '-';
      document.getElementById('detailsUnitCost').textContent = p.cost ? `$${p.cost}` : '-';
      document.getElementById('detailsSellingPrice').textContent = p.price ? `$${p.price}` : '-';
      document.getElementById('detailsLastUpdated').textContent = new Date().toLocaleString();
      document.getElementById('detailsExpiryDate').textContent = p.expiry || '-';
      document.getElementById('detailsDescription').textContent = p.description || 'No description available.';
      
      const img = document.getElementById('detailsProductImage');
      img.src = p.image_url || 'https://picsum.photos/80';
      img.alt = p.name || 'Product Image';

      // Save the current barcode for later use.
      window.currentBarcode = p.barcode;

      // Log the scan event so that the current timestamp and stock are recorded.
      logProductScan(p.barcode, p.quantity);

      // Load the stock history for this product into the chart.
      // The range comes from your dropdown (e.g. "day", "week", etc.).
      loadStockHistory(p.barcode, document.getElementById('stockHistoryRange').value);

      // Show the product details modal.
      productDetailsModal.classList.remove('hidden');
    })
    .catch(err => console.error('Error fetching product details:', err));
}


// Logs a scan event by sending the current stock to the Flask endpoint.
function logProductScan(barcode, currentStock) {
  fetch('/inventory/log-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode: barcode, current_qty: currentStock })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Scan log response:', data);
      // Optionally refresh the chart after logging.
      // (This call may be redundant if you're already calling loadStockHistory() in showProductDetails.)
      loadStockHistory(barcode, document.getElementById('stockHistoryRange').value);
    })
    .catch(err => {
      console.error('Error logging scan:', err);
    });
}


// This function generates simulated data in case no logged history exists.
// (Useful for development until real stock history accumulates.)
function generateSimulatedStockHistory(range) {
  const points = [];
  const now = new Date();

  switch (range) {
    case '24hours':
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getTime() - ((11 - i) * 2 * 60 * 60 * 1000));
        points.push({ date: date.toISOString(), quantity: Math.floor(Math.random() * 100) });
      }
      break;
    case 'day':
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getTime() - ((5 - i) * 4 * 60 * 60 * 1000));
        points.push({ date: date.toISOString(), quantity: Math.floor(Math.random() * 100) });
      }
      break;
    case 'week':
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - ((6 - i) * 24 * 60 * 60 * 1000));
        points.push({ date: date.toISOString(), quantity: Math.floor(Math.random() * 100) });
      }
      break;
    case 'month':
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (29 - i));
        points.push({ date: date.toISOString(), quantity: Math.floor(Math.random() * 100) });
      }
      break;
    default:
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - ((6 - i) * 24 * 60 * 60 * 1000));
        points.push({ date: date.toISOString(), quantity: Math.floor(Math.random() * 100) });
      }
      break;
  }

  return points;
}


// Loads stock history data from your Flask endpoint and updates (or creates) the chart.
function loadStockHistory(barcode, range) {
  fetch(`/inventory/stock-history?barcode=${barcode}`)
    .then(res => res.json())
    .then(data => {
      // Check if the returned data is valid – if not, use simulated data.
      if (!Array.isArray(data) || data.length === 0) {
        console.warn("No stock history found, using simulated data.");
        data = generateSimulatedStockHistory(range);
      }
      
      // Map the fetched (or simulated) data into arrays.
      const labels = data.map(record => record.date);
      const quantities = data.map(record => record.quantity);
      
      const canvas = document.getElementById("stockHistoryChart");
      if (!canvas) {
        console.error("Could not find stockHistoryChart canvas.");
        return;
      }
      const ctx = canvas.getContext("2d");
      
      // If a chart already exists, try to update its data; otherwise create a new chart.
      if (window.stockHistoryChart) {
        // If the chart instance is valid, update its data.
        if (window.stockHistoryChart.data &&
            window.stockHistoryChart.data.datasets &&
            window.stockHistoryChart.data.datasets.length > 0) {
          window.stockHistoryChart.data.labels = labels;
          window.stockHistoryChart.data.datasets[0].data = quantities;
          window.stockHistoryChart.update();
        } else {
          console.error("Chart instance data structure is invalid. Recreating chart.");
          // Destroy chart if possible.
          if (typeof window.stockHistoryChart.destroy === "function") {
            window.stockHistoryChart.destroy();
          } else {
            console.warn("Chart instance does not have a destroy method; recreating without destroying.");
          }
          window.stockHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Stock Quantity',
                data: quantities,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
              }]
            },
            options: {
              scales: {
                x: {
                  type: 'time',
                  time: {
                    parser: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
                    tooltipFormat: 'll HH:mm',
                    unit: 'day',
                    displayFormats: {
                      day: 'MMM D'
                    }
                  },
                  title: { display: true, text: 'Date' }
                },
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Quantity' }
                }
              }
            }
          });
        }
      } else {
        // No chart exists yet – create a new one.
        window.stockHistoryChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Stock Quantity',
              data: quantities,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false
            }]
          },
          options: {
            scales: {
              x: {
                type: 'time',
                time: {
                  parser: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
                  tooltipFormat: 'll HH:mm',
                  unit: 'day',
                  displayFormats: {
                    day: 'MMM D'
                  }
                },
                title: { display: true, text: 'Date' }
              },
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Quantity' }
              }
            }
          }
        });
      }
    })
    .catch(err => {
      console.error("Failed to load stock history:", err);
    });
}

function closeProductDetails() {
    productDetailsModal.classList.add('hidden');
}

function editProduct() {
    closeProductDetails();
    showTab('add-product');
    // In a real app, we would populate the form with the product data
}

function showAlertTab(tabId) {
    // Hide all alert tab contents
    alertTabContents.forEach(tab => tab.classList.add('hidden'));
    
    // Show selected alert tab content
    document.getElementById(`${tabId}-alerts`).classList.remove('hidden');
    
    // Update active tab styling
    alertTabs.forEach(tab => {
        tab.classList.remove('active-tab');
        tab.classList.remove('text-indigo-600');
        tab.classList.add('text-gray-700');
    });
    
    // Find and activate the clicked tab
    const clickedTab = Array.from(alertTabs).find(tab => tab.getAttribute('onclick').includes(tabId));
    if (clickedTab) {
        clickedTab.classList.add('active-tab', 'text-indigo-600');
        clickedTab.classList.remove('text-gray-700');
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropzone.classList.add('active');
}

function unhighlight() {
    dropzone.classList.remove('active');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
        fileUpload.files = files;
        handleFileUpload();
    }
}

function handleFileUpload() {
    const file = fileUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    fileUpload.value = '';
    imagePreviewContainer.classList.add('hidden');
}

function resetAddProductForm() {
    document.getElementById('addProductForm').reset();
    imagePreviewContainer.classList.add('hidden');
    showTab('search-inventory');
}

function scanNewBarcode() {
    showToast('Barcode scanner would activate here');
}

function resetOrderForm() {
    document.getElementById('placeOrderForm').reset();
    document.getElementById('orderProductInfo').classList.add('hidden');
    showTab('alerts');
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(hideToast, 5000);
}

function hideToast() {
    toast.classList.add('hidden');
}

// Barcode Scanner Controls
let currentCamera = 'environment';
let html5Scanner = null;
let scannerActive = false;

// Ensure QuaggaJS is loaded before using
function ensureQuaggaReady(cb) {
    if (window.Quagga) {
        quaggaReady = true;
        cb();
    } else {
        const check = setInterval(() => {
            if (window.Quagga) {
                clearInterval(check);
                quaggaReady = true;
                cb();
            }
        }, 100);
    }
}

// Automatically start scanner when scannerContainer is shown
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (!scannerContainer.classList.contains('hidden') && !scannerActive) {
                startScanner();
            }
        }
    });
});
if (scannerContainer) {
    observer.observe(scannerContainer, { attributes: true });
}


let lastCode = null;
let lastDetectedTime = 0;
let currentCameraIndex = 0;
let availableCameras = [];
let cameraErrorCount = 0; // Track consecutive errors

async function startScanner() {
    if (scannerActive) return;
    console.log("Starting scanner...");

    scannerContainer.classList.remove('hidden');
    if (stopScannerBtn) stopScannerBtn.classList.remove('hidden');
    if (switchCameraBtn) switchCameraBtn.classList.remove('hidden');
    scannerActive = true;
    cameraErrorCount = 0; // Reset error count on new start

    try {
        availableCameras = await Html5Qrcode.getCameras();
        if (availableCameras.length === 0) throw new Error("No cameras found");

        // Sort cameras: prioritize device cameras, put Camo last
        availableCameras.sort((a, b) => {
            const aIsCamo = a.label.toLowerCase().includes('camo');
            const bIsCamo = b.label.toLowerCase().includes('camo');
            return aIsCamo ? 1 : bIsCamo ? -1 : 0;
        });

        // Skip Camo in production
        if (isProduction() && availableCameras[currentCameraIndex].label.toLowerCase().includes('camo')) {
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
        }

        const cameraId = availableCameras[currentCameraIndex].id;
        console.log("Using camera:", cameraId, availableCameras[currentCameraIndex].label);

        html5Scanner = new Html5Qrcode("scannerVideo");

        await html5Scanner.start(
            cameraId,  // Use simplified camera selection
            {
                fps: 10,
                aspectRatio: 1.777778 // 16:9 aspect ratio
            },
            (decodedText) => {
                const now = Date.now();
                if (!decodedText || decodedText === lastCode || decodedText.length < 8 || now - lastDetectedTime < 800) return;

                lastCode = decodedText;
                lastDetectedTime = now;

                // Flash effect
                const flashOverlay = document.getElementById('flashOverlay');
                if (flashOverlay) {
                    const ctx = flashOverlay.getContext('2d');
                    ctx.fillStyle = 'rgba(80,255,80,0.4)';
                    ctx.fillRect(0, 0, flashOverlay.width, flashOverlay.height);
                    flashOverlay.style.display = 'block';
                    setTimeout(() => flashOverlay.style.display = 'none', 180);
                }

                stopScanner();
                barcodeInput.value = decodedText;
                fetchProductInfo({ preventDefault: () => {} });
                showToast("Barcode scanned: " + decodedText);
            },
            (errorMessage) => {
                console.warn("Scanner error:", errorMessage);
            }
        );

        // Fix video aspect ratio
        const videoElement = scannerVideo.querySelector('video');
        if (videoElement) {
            videoElement.style.objectFit = 'cover';
        }
    } catch (err) {
        console.error("Failed to start camera:", err);
        cameraErrorCount++;
        
        if (cameraErrorCount < availableCameras.length) {
            // Try next camera automatically
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
            setTimeout(startScanner, 500);
        } else {
            showToast("Camera error: " + (err.message || "Failed to start any camera"));
            stopScanner();
        }
    }
}

function stopScanner() {
    scannerActive = false; // Set immediately to prevent race conditions
    
    if (html5Scanner) {
        html5Scanner.stop().catch(err => {
            // Ignore "not running" errors
            if (!err.message.includes('not running')) {
                console.warn("Stop error:", err);
            }
        });
    }
    
    scannerContainer.classList.add('hidden');
    if (stopScannerBtn) stopScannerBtn.classList.add('hidden');
    if (switchCameraBtn) switchCameraBtn.classList.add('hidden');
}

function switchCamera() {
    if (!availableCameras.length) {
        showToast("No cameras available");
        return;
    }

    // In production, always skip camo devices.
    if (isProduction()) {
        let nextIndex = (currentCameraIndex + 1) % availableCameras.length;
        let iterations = 0;
        while (availableCameras[nextIndex].label.toLowerCase().includes('camo') && iterations < availableCameras.length) {
            nextIndex = (nextIndex + 1) % availableCameras.length;
            iterations++;
        }
        currentCameraIndex = nextIndex;
    } else {
        // In development mode, if we're currently on a camo camera, switch to first available non-camo.
        if (availableCameras[currentCameraIndex].label.toLowerCase().includes('camo')) {
            const nonCamoIndex = availableCameras.findIndex(cam =>
                !cam.label.toLowerCase().includes('camo') &&
                !cam.label.toLowerCase().includes('virtual')
            );
            // If a non-camo camera is found, use it; otherwise, fallback to cycling normally.
            currentCameraIndex = nonCamoIndex > -1 ? nonCamoIndex : (currentCameraIndex + 1) % availableCameras.length;
        } else {
            // If the current camera is not camo, then check if a camo is available.
            const camoIndex = availableCameras.findIndex(cam => 
                cam.label.toLowerCase().includes('camo')
            );
            // If found, switch to the camo camera; otherwise, cycle normally.
            currentCameraIndex = camoIndex > -1 ? camoIndex : (currentCameraIndex + 1) % availableCameras.length;
        }
    }

    stopScanner();
    setTimeout(startScanner, 500);
}

function isProduction() {
    return !window.location.host.includes('localhost') && 
           !window.location.host.includes('127.0.0.1');
}


// helper function
function adjustStock(barcode, adjustment) {
    fetch('/inventory/adjust-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            barcode: barcode, 
            adjustment: adjustment 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update the UI
            document.getElementById('currentStock').textContent = data.new_quantity;
            document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
            showToast('Stock updated successfully');
        } else {
            showToast('Error: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        showToast('Network error: ' + error.message);
    });
}

// Load the full inventory list with all product details plus the action buttons
function loadInventoryList() {
  fetch('/inventory/count')
    .then(res => res.json())
    .then(data => {
      // Ensure your HTML table's <tbody> for full inventory has the id "inventoryList"
      const tbody = document.getElementById('searchResultsBody');
        // Ensure the search results table becomes visible
      document.getElementById('searchResultsTable').classList.remove('hidden');
      tbody.innerHTML = '';

      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.barcode}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.category || ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onclick="showProductDetails('${item.barcode}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Details</button>
            <button onclick="showTab('place-order')" class="text-green-600 hover:text-green-900">Order</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading inventory list:', error);
      showToast('Failed to load inventory list. Please try again.');
    });
}

// Called after a product is added so the inventory updates immediately
function afterProductAdded() {
  loadInventoryList();
  clearAddProductForm();
}

document.addEventListener('DOMContentLoaded', () => {
    loadInventoryList(); // 👈 on page load
});

function afterProductAdded() {
    loadInventoryList(); // 👈 after adding
    clearAddProductForm();
}

function toggleEditProduct() {
  const isEditing = window.isEditing || false;
  const fields = [
    'detailsProductName',
    'detailsProductCategory',
    'detailsCurrentStock',
    'detailsReorderThreshold',
    'detailsUnitCost',
    'detailsSellingPrice',
    'detailsExpiryDate',
    'detailsDescription'
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.contentEditable = !isEditing;
    if (el) el.classList.toggle('bg-yellow-50', !isEditing);
  });

  const btn = document.getElementById('toggleEditBtn');
  if (!isEditing) {
    btn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
  } else {
    btn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Product';
    saveEditedProduct(); // on save
  }

  window.isEditing = !isEditing;
}

function saveEditedProduct() {
  const product = {
    barcode: window.currentBarcode,
    name: document.getElementById('detailsProductName').textContent.trim(),
    category: document.getElementById('detailsProductCategory').textContent.trim(),
    quantity: parseInt(document.getElementById('detailsCurrentStock').textContent.trim()) || 0,
    threshold: parseInt(document.getElementById('detailsReorderThreshold').textContent.trim()) || 0,
    cost: parseFloat(document.getElementById('detailsUnitCost').textContent.replace(/[^0-9.]/g, '')) || 0,
    price: parseFloat(document.getElementById('detailsSellingPrice').textContent.replace(/[^0-9.]/g, '')) || 0,
    expiry: document.getElementById('detailsExpiryDate').textContent.trim(),
    description: document.getElementById('detailsDescription').textContent.trim()
  };

  fetch('/inventory/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
    .then(res => res.json())
    .then(data => {
      console.log('Saved:', data);
      if (data.status === 'ok') {
        loadStockHistory(product.barcode, document.getElementById('stockHistoryRange').value);
      }
    })
    .catch(err => console.error('Failed to save changes:', err));
}
