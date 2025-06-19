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
const switchCameraBtn = document.getElementById('switchCameraBtn');
// Test QR codes to try:
const testCodes = [
  "https://example.com", 
  "TEST123456", 
  "WIFI:S:MyNetwork;T:WPA;P:Password123;;"
];

// Add this at the TOP of your scripts.js
document.addEventListener('DOMContentLoaded', function() {
  // Fix tab switching
  document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
      showTab(e.target.getAttribute('data-tab'));
    }
  });

  // Fix header buttons
  document.body.addEventListener('click', function(e) {
    if (e.target.id === 'cart-icon' || e.target.id === 'user-icon') {
      showTab(e.target.id.replace('-icon', ''));
    }
  });

  // Prevent form submission refresh
  const searchForm = document.getElementById('find-product-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      findProduct();
    });
  }
});

// Make sure showTab is defined globally
window.showTab = function(tabName) {
  // ... your existing showTab implementation ...
}

// Add DOMContentLoaded wrapper
d// Replace your scanner code with:
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Html5Qrcode === 'function' && document.getElementById("reader")) {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { 
        fps: 10,
        qrbox: 250 
      },
      function(decodedText) {
        console.log("Scanned:", decodedText);
        // Handle scan result here
      },
      function(error) {
        console.log("Scan error:", error);
      }
    ).catch(error => {
      console.error("Scanner error:", error);
    });
  } else {
    console.log("Scanner not available");
  }
});

// Button functionality recovery
document.addEventListener('DOMContentLoaded', function() {
  // Delegate all button clicks
  document.body.addEventListener('click', function(e) {
    if (e.target.matches('.add-to-cart')) {
      // Add your cart functionality here
      console.log('Add to cart clicked');
    }
    // Add other button selectors as needed
  });
});
// Replace your scanner initialization with this:
const html5QrCode = new Html5Qrcode("reader");
const config = {
  fps: 15,
  qrbox: 250,
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true
  },
  rememberLastUsedCamera: true,
  supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
};

html5QrCode.start(
  cameraId,
  config,
  qrCodeSuccessCallback,
  qrCodeErrorCallback
).catch(err => {
  console.error("Scanner startup failed:", err);
});

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
                <img class="h-10 w-10 rounded" src="${item.image_url || 'https://via.placeholder.com/40'}" alt="">
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

function showProductDetails(barcode) {
    fetch(`/inventory/search?q=${barcode}`)
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) return;

        const p = data[0];

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
        img.src = p.image_url || 'https://via.placeholder.com/80';
        img.alt = p.name || 'Product Image';

        productDetailsModal.classList.remove('hidden');
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
// let scannerActive = false; // Removed duplicate declaration
let currentCameraIndex = 0;
let availableCameras = [];


async function startScanner() {
    if (scannerActive) return;
    console.log("Starting scanner...");

    scannerContainer.classList.remove('hidden');
    if (stopScannerBtn) stopScannerBtn.classList.remove('hidden');
    if (switchCameraBtn) switchCameraBtn.classList.remove('hidden');
    scannerActive = true;

    try {
        // Get all available cameras
        availableCameras = await Html5Qrcode.getCameras();
        if (availableCameras.length === 0) throw new Error("No cameras found");

        // Try to prefer built-in camera before Camo or virtual
        const preferredKeywords = ['integrated', 'built-in', 'hd', 'webcam'];
        const sortedCameras = availableCameras.sort((a, b) => {
            const aPref = preferredKeywords.some(k => a.label.toLowerCase().includes(k));
            const bPref = preferredKeywords.some(k => b.label.toLowerCase().includes(k));
            return bPref - aPref;
        });

        const cameraId = sortedCameras[currentCameraIndex || 0].id;
        console.log("Using camera:", cameraId);

        // Initialize scanner
        html5Scanner = new Html5Qrcode("scannerVideo");

        await html5Scanner.start(
            { deviceId: { exact: cameraId } },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.77,
                experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
            },
            (decodedText, result) => {
                const now = Date.now();
                if (!decodedText || decodedText === lastCode || decodedText.length < 8 || now - lastDetectedTime < 800) return;

                lastCode = decodedText;
                lastDetectedTime = now;

                // Flash effect
                const flashOverlay = document.getElementById('flashOverlay');
                if (flashOverlay) {
                    const ctx = flashOverlay.getContext('2d');
                    ctx.clearRect(0, 0, flashOverlay.width, flashOverlay.height);
                    ctx.fillStyle = 'rgba(80,255,80,0.4)';
                    ctx.fillRect(0, 0, flashOverlay.width, flashOverlay.height);
                    flashOverlay.style.display = 'block';
                    setTimeout(() => {
                        flashOverlay.style.display = 'none';
                        ctx.clearRect(0, 0, flashOverlay.width, flashOverlay.height);
                    }, 180);
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
    } catch (err) {
        console.error("Failed to start scanner:", err);
        showToast("Camera not available or permission denied.");
        stopScanner();
    }
}





function stopScanner() {
    if (html5Scanner && scannerActive) {
        html5Scanner.stop()
            .then(() => {
                scannerActive = false;
                scannerContainer.classList.add('hidden');
                if (stopScannerBtn) stopScannerBtn.classList.add('hidden');
                if (switchCameraBtn) switchCameraBtn.classList.add('hidden');
            })
            .catch(err => {
                console.warn("Stop error:", err.message);
            });
    }
}


async function switchCamera() {
    try {
        // Stop scanner cleanly before switching
        if (html5Scanner && html5Scanner.getState() === Html5QrcodeScannerState.SCANNING) {
            await html5Scanner.stop();
        }

        currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;

        setTimeout(() => {
            startScanner();
        }, 300);
    } catch (err) {
        console.error("Failed to switch camera:", err);
        showToast("Camera switch failed.");
    }
}



// Add this helper function
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

function loadInventoryList() {
    fetch('/inventory/count')
      .then(res => res.json())
      .then(data => {
          const list = document.getElementById('inventoryList');
          list.innerHTML = '';
          data.forEach(item => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td>${item.barcode}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.price}</td>
                <td>${item.category || ''}</td>
              `;
              list.appendChild(row);
          });
      });
}
// Load inventory list on page load

document.addEventListener('DOMContentLoaded', () => {
    loadInventoryList(); // 👈 on page load
});

function afterProductAdded() {
    loadInventoryList(); // 👈 after adding
    clearAddProductForm();
}

function qrCodeErrorCallback(error) {
  if (error.type === Html5QrcodeErrorTypes.UNKWOWN_ERROR) {
    console.warn("Scanning error, retrying...", error);
    // No need to stop scanner for common errors
  } else {
    console.error("Critical scanner error:", error);
    html5QrCode.stop();
  }
}

// Update camera selection handler
document.getElementById('camera-select').addEventListener('change', async function() {
  if (html5QrCode.isScanning) {
    await html5QrCode.stop();
  }
  
  // Add video constraints for better focus
  const constraints = {
    video: { 
      deviceId: this.value,
      focusMode: "continuous"
    }
  };
  
  startScanner(this.value, constraints);
});

// Add to your scripts.js
document.getElementById('qr-file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  
  Html5Qrcode.scanFile(file)
    .then(decodedText => {
      processScanResult(decodedText);
    })
    .catch(err => {
      console.error("File scan failed:", err);
    });
});

// Add to scanner initialization
console.log("Supported capabilities:", Html5Qrcode.getCapabilities());

// Run camera diagnostics
Html5Qrcode.getCameras().then(cameras => {
  cameras.forEach(cam => {
    console.log(`Camera: ${cam.label} | Resolution: ${cam.resolution || 'Unknown'}`);
  });
});