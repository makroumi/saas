// DOM Elements (from your provided DOM Elements.txt - unchanged)
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
const switchCameraBtn = document.getElementById('switchCameraBtn'); // Ensure this is defined for the barcode scanner

// Initialize category elements
const categoryOptions = document.getElementsByName('categoryOption');
const selectCategoryWrapper = document.getElementById('selectCategoryWrapper');
const addCategoryWrapper = document.getElementById('addCategoryWrapper');
const categorySelect = document.getElementById('category');
const newCategoryInput = document.getElementById('newCategoryInput');


// Global camera state variables for PRODUCT PHOTO
let productCameraStream = null;
let availableProductCameras = [];
let currentProductCameraIndex = 0;
let productCameraActive = false; // True when stream is successfully playing
let isProductCameraStarting = false; // Flag to prevent re-entry during async start
let hasInitializedProductCameras = false; // Flag to ensure camera list is only fetched once

// --- PRODUCT PHOTO CAMERA FUNCTIONS ---

/**
 * Initializes the list of available product cameras, prioritizing the integrated webcam.
 * This function should ideally be called once.
 */
async function initializeProductCameras() {
    if (hasInitializedProductCameras) {
        return; // Already initialized, no need to re-fetch unless explicitly reset
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableProductCameras = devices.filter(d => d.kind === 'videoinput');

        if (availableProductCameras.length === 0) {
            throw new Error("No video input devices found.");
        }

        // Prioritize:
        // 1. Integrated Webcam (non-virtual, non-back)
        // 2. Other physical cameras (non-virtual, non-back)
        // 3. Back/Environment camera (non-virtual)
        // 4. Virtual cameras (Camo, OBS) - last resort
        
        let preferredCameraId = null;
        
        // Step 1: Look for integrated webcam
        const integratedWebcam = availableProductCameras.find(d => 
            !/back|environment|virtual|camo|obs/i.test(d.label) && 
            /integrated|webcam|front/i.test(d.label)
        );
        if (integratedWebcam) {
            preferredCameraId = integratedWebcam.id;
        } else {
            // Step 2: Look for any other non-virtual, non-back physical camera
            const otherPhysicalCamera = availableProductCameras.find(d => 
                !/back|environment|virtual|camo|obs/i.test(d.label)
            );
            if (otherPhysicalCamera) {
                preferredCameraId = otherPhysicalCamera.id;
            } else {
                // Step 3: Look for back/environment camera
                const backCamera = availableProductCameras.find(d => 
                    !/virtual|camo|obs/i.test(d.label) && 
                    /back|environment/i.test(d.label)
                );
                if (backCamera) {
                    preferredCameraId = backCamera.id;
                } else {
                    // Step 4: Fallback to any available camera, including virtual
                    preferredCameraId = availableProductCameras[0].id;
                }
            }
        }

        currentProductCameraIndex = availableProductCameras.findIndex(d => d.id === preferredCameraId);
        if (currentProductCameraIndex === -1) { // Should not happen with fallback, but a safeguard
            currentProductCameraIndex = 0;
        }

        hasInitializedProductCameras = true;
        console.log("Product cameras initialized. Preferred camera:", availableProductCameras[currentProductCameraIndex].label);

    } catch (err) {
        console.error("Error initializing product cameras:", err);
        showToast("Could not find any cameras: " + err.message);
        availableProductCameras = []; // Clear list on error
        hasInitializedProductCameras = false;
    }
}

/**
 * Starts the product photo camera stream using the camera at currentProductCameraIndex.
 * @returns {boolean} True if camera started successfully, false otherwise.
 */
async function startProductPhotoCamera() {
    if (isProductCameraStarting) {
        console.warn("Product camera start already in progress. Ignoring request.");
        return false;
    }
    isProductCameraStarting = true;

    const cameraContainerEl = document.getElementById('camera-container');
    const videoElement = document.getElementById('product-camera-preview');
    
    // Ensure camera container is visible before attempting to start camera
    if (cameraContainerEl) cameraContainerEl.classList.remove('hidden');

    try {
        // Stop any existing stream cleanly before attempting a new one
        if (productCameraStream) {
            stopProductPhotoCamera();
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for resource release
        }

        if (availableProductCameras.length === 0) {
            await initializeProductCameras(); // Re-initialize if list is empty
            if (availableProductCameras.length === 0) {
                throw new Error("No cameras available after initialization.");
            }
        }

        const selectedCamera = availableProductCameras[currentProductCameraIndex];
        console.log("Starting product photo camera. Using device:", selectedCamera.label, selectedCamera.deviceId);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera.deviceId } }
        });

        if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.load(); // Reset video element state
            await videoElement.play();
            productCameraStream = stream;
            productCameraActive = true;
            console.log("Product camera started successfully.");
            isProductCameraStarting = false; // Release lock on success
            return true;
        } else {
            stream.getTracks().forEach(track => track.stop()); // Stop stream if video element not found
            throw new Error("Product video element (ID: product-camera-preview) not found in DOM.");
        }

    } catch (err) {
        console.error("Error starting product photo camera:", err);
        showToast("Failed to start camera: " + err.message + ". Please check permissions.");
        stopProductPhotoCamera(); // Ensure stream is stopped even on error
        if (cameraContainerEl) cameraContainerEl.classList.add('hidden'); // Hide container on error
        isProductCameraStarting = false; // Release lock on error
        return false;
    }
}

/**
 * Stops the product photo camera stream and releases resources.
 */
function stopProductPhotoCamera() {
    const videoElement = document.getElementById('product-camera-preview');
    if (videoElement) {
        videoElement.pause(); // Pause playback
        // Stop all tracks on the stream and clear srcObject
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
        // Also ensure the global stream reference is cleared
        if (productCameraStream) {
            productCameraStream.getTracks().forEach(track => track.stop());
            productCameraStream = null;
        }
    }
    productCameraActive = false;
    // Do NOT reset isProductCameraStarting here to avoid race conditions with start attempts.
    // It's handled by startProductPhotoCamera's success/failure and initial "take photo" click.
    console.log("Product photo camera stopped.");
}

/**
 * Cycles through available product cameras and attempts to start the next one.
 * Handles retrying if a camera fails to start.
 */
async function switchProductPhotoCamera() {
    if (isProductCameraStarting) {
        console.warn("Camera switch already in progress. Ignoring request.");
        return;
    }

    if (availableProductCameras.length < 2) {
        showToast("No other cameras available to switch.");
        return;
    }

    let initialIndex = currentProductCameraIndex;
    let successfullySwitched = false;

    // Try to switch until a camera starts or all have been attempted
    for (let i = 0; i < availableProductCameras.length; i++) {
        currentProductCameraIndex = (currentProductCameraIndex + 1) % availableProductCameras.length;
        
        // Ensure the camera container is visible before attempting to start
        document.getElementById('camera-container')?.classList.remove('hidden');

        console.log(`Attempting to switch to camera index: ${currentProductCameraIndex} for product photo. (Device: ${availableProductCameras[currentProductCameraIndex].label})`);
        
        // Call startProductPhotoCamera directly. It handles its own locking and error reporting.
        if (await startProductPhotoCamera()) {
            successfullySwitched = true;
            showToast(`Switched to camera: ${availableProductCameras[currentProductCameraIndex].label}`);
            break; // Exit loop if successful
        }
        // If startProductPhotoCamera failed, it will have released its lock (isProductCameraStarting=false)
        // and hidden the container, allowing the next iteration or final cleanup.
    }

    if (!successfullySwitched) {
        showToast("Could not switch to another camera. All available cameras failed to start.");
        document.getElementById('camera-container')?.classList.add('hidden'); // Ensure container is hidden if all attempts fail
    }
}


// --- MODIFIED: captureProductPhoto ---
function captureProductPhoto() {
    const videoElement = document.getElementById('product-camera-preview');
    if (!productCameraStream || !videoElement || !productCameraActive) {
        showToast("Product camera not active to capture photo.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    document.getElementById('product-image-preview').src = imageData;
    console.log("captureProductPhoto: Captured image data (first 50 chars):", imageData.substring(0, 50) + "..."); 

    // Hide camera container, show image preview container
    document.getElementById('camera-container').classList.add('hidden');
    document.getElementById('image-preview-container').classList.remove('hidden');
    console.log("captureProductPhoto: image-preview-container visible:", !document.getElementById('image-preview-container').classList.contains('hidden')); 

    // Store in hidden form field
    document.getElementById('product-image-data').value = imageData;

    stopProductPhotoCamera(); // Stop the product photo camera after capturing
    showToast("Photo captured!");

    // Show "Use This Photo" and "Retake Photo" buttons, hide "Take Photo" button
    document.getElementById('use-this-photo-btn')?.classList.remove('hidden');
    document.getElementById('retake-product-photo-btn')?.classList.remove('hidden');
    document.getElementById('take-photo-trigger-btn')?.classList.add('hidden');
    console.log("captureProductPhoto: Buttons state: Use This Photo visible, Retake visible, Take Photo hidden");
}

// --- MODIFIED: retakeProductPhoto ---
async function retakeProductPhoto() {
    console.log("retakeProductPhoto: Called."); 
    // Explicitly hide the preview container before retaking the photo
    document.getElementById('image-preview-container').classList.add('hidden');
    // Clear the previous image data from the hidden input
    document.getElementById('product-image-data').value = '';
    document.getElementById('product-image-preview').src = '#'; // Clear image preview source

    // Ensure initial "Take Photo" button is hidden when we are in a retake flow
    document.getElementById('take-photo-trigger-btn')?.classList.add('hidden');
    
    // Make capture-related buttons visible again for retake
    document.getElementById('use-this-photo-btn')?.classList.remove('hidden');
    document.getElementById('retake-product-photo-btn')?.classList.remove('hidden');

    // Re-initialize cameras if needed and then start the camera
    if (!hasInitializedProductCameras) {
        await initializeProductCameras();
    }
    await startProductPhotoCamera(); // Start the camera for retake
    console.log("retakeProductPhoto: Camera re-started for retake.");
}

// --- END PRODUCT PHOTO CAMERA FUNCTIONS ---


// Category toggle function (original, untouched)
function toggleCategoryFields() {
    const selectOption = document.querySelector('input[name="categoryOption"][value="select"]:checked');
    
    if (!selectCategoryWrapper || !addCategoryWrapper) return;
    
    if (selectOption) {
        selectCategoryWrapper.classList.remove('hidden');
        addCategoryWrapper.classList.add('hidden');
        if (newCategoryInput) newCategoryInput.value = '';
    } else {
        selectCategoryWrapper.classList.add('hidden');
        addCategoryWrapper.classList.remove('hidden');
        if (categorySelect) categorySelect.value = '';
    }
}

// Only run if we're on the Add Product page (original, untouched)
if (categoryOptions.length > 0) {
    categoryOptions.forEach(option => {
        option.addEventListener('change', () => {
            if (option.value === 'select') {
                selectCategoryWrapper.classList.remove('hidden');
                addCategoryWrapper.classList.add('hidden');
                newCategoryInput.value = ''; // Clear new category input
            } else {
                selectCategoryWrapper.classList.add('hidden');
                addCategoryWrapper.classList.remove('hidden');
                categorySelect.value = ''; // Clear selected category
            }
        });
    });
}

// Fixed loadCategories function (original, untouched)
async function loadCategories() {
    if (!categorySelect) return;
    
    try {
        const response = await fetch('/inventory/categories');
        const data = await response.json();
        
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        if (data.categories && Array.isArray(data.categories)) {
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Failed to load categories');
    }
}

// Temporary data for search suggestions (original, untouched)
const searchData = [
    { name: "Premium Widget", sku: "WIDG-001", category: "Electronics" },
    { name: "Basic Widget", sku: "WIDG-002", category: "Electronics" },
    { name: "Deluxe Gadget", sku: "GADG-101", category: "Electronics" },
    { name: "Perishable Item A", sku: "PER-001", category: "Food" },
    { name: "Perishable Item B", sku: "PER-002", category: "Food" },
    { name: "Assembly Tool Set", sku: "TOOL-305", category: "Tools" }
];


// --- DOMContentLoaded Listener (Crucial for Tabs and Init) ---
document.addEventListener('DOMContentLoaded', function() {
    // --- TAB SWITCHING LOGIC (ORIGINAL, NO CHANGES HERE) ---
    // Tab switching buttons
    tabButtons.forEach(button => {
        // IMPORTANT: Use removeEventListener/addEventListener to prevent duplicate listeners
        const tabId = button.getAttribute('onclick').match(/'(.*?)'/)[1];
        const handler = () => showTab(tabId);
        button.removeEventListener('click', handler); // Remove any existing
        button.addEventListener('click', handler);    // Add fresh
    });
    if (mobileTabSelect) {
        const handler = function() { showTab(this.value); };
        mobileTabSelect.removeEventListener('change', handler);
        mobileTabSelect.addEventListener('change', handler);
    }

    // --- SYNC SETTINGS (ORIGINAL, NO CHANGES) ---
    if (syncSettingsBtn) syncSettingsBtn.addEventListener('click', toggleSyncSettings);
    if (closeSyncSettings) closeSyncSettings.addEventListener('click', toggleSyncSettings);
    if (cancelSyncSettings) cancelSyncSettings.addEventListener('click', toggleSyncSettings);
    if (saveSyncSettings) saveSyncSettings.addEventListener('click', saveSyncSettingsHandler);
    if (testConnectionBtn) testConnectionBtn.addEventListener('click', testConnection);

    // --- INVENTORY COUNT (ORIGINAL, NO CHANGES) ---
    if (manualEntryForm) manualEntryForm.addEventListener('submit', fetchProductInfo);
    if (addStockBtn) addStockBtn.addEventListener('click', showAddStockModal);
    if (removeStockBtn) removeStockBtn.addEventListener('click', showRemoveStockModal);
    if (addStockForm) addStockForm.addEventListener('submit', addStockHandler);
    if (removeStockForm) removeStockForm.addEventListener('submit', removeStockHandler);
    if (addReason) addReason.addEventListener('change', function() {
        addNotesContainer.classList.toggle('hidden', this.value !== 'other');
    });

    // --- SEARCH FUNCTIONALITY (ORIGINAL, NO CHANGES) ---
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchInput);
    }

    // --- IMAGE UPLOAD (ORIGINAL, NO CHANGES TO DRAG/DROP) ---
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload); // For file input change
    }
    if (removeImageBtn) removeImageBtn.addEventListener('click', removeImage);
    
    // --- PRODUCT ADD FORM (ORIGINAL, NO CHANGES TO CATEGORY TOGGLE) ---
    // Initialize category functionality
    toggleCategoryFields();

    // --- BARCODE SCANNER (ORIGINAL, NO CHANGES EXCEPT btn def) ---
    if (startScannerBtn) startScannerBtn.addEventListener('click', startScanner);
    if (stopScannerBtn) stopScannerBtn.addEventListener('click', stopScanner);
    if (switchCameraBtn) switchCameraBtn.addEventListener('click', switchCamera); // Barcode scanner's switch button

    // --- PRODUCT ADD FORM SUBMISSION (ORIGINAL, NO CHANGES) ---
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct); // Correctly references your handler
    }
      
    initDragAndDrop(); // Initialize drag and drop logic

    // --- PRODUCT PHOTO CAMERA BUTTONS (CRITICAL FIXES HERE) ---
    const takePhotoTriggerButton = document.getElementById('take-photo-trigger-btn');
    if (takePhotoTriggerButton) {
        takePhotoTriggerButton.removeEventListener('click', handleProductPhotoTrigger);
        takePhotoTriggerButton.addEventListener('click', handleProductPhotoTrigger);
    }

    const capturePhotoButton = document.getElementById('capture-product-photo-btn');
    if (capturePhotoButton) {
        capturePhotoButton.removeEventListener('click', captureProductPhoto);
        capturePhotoButton.addEventListener('click', captureProductPhoto);
    }

    const switchProductCameraButton = document.getElementById('switch-camera-btn-product');
    if (switchProductCameraButton) {
        switchProductCameraButton.removeEventListener('click', switchProductPhotoCamera); 
        switchProductCameraButton.addEventListener('click', switchProductPhotoCamera); 
    }
    
    const cancelProductCameraButton = document.getElementById('cancel-product-camera-btn');
    if (cancelProductCameraButton) {
        const handler = () => {
            stopProductPhotoCamera(); 
            document.getElementById('camera-container')?.classList.add('hidden'); 
            // NEW: Ensure initial "Take Photo" button is visible and others hidden
            document.getElementById('take-photo-trigger-btn')?.classList.remove('hidden');
            document.getElementById('image-preview-container')?.classList.add('hidden'); // Hide preview
            document.getElementById('use-this-photo-btn')?.classList.add('hidden');
            document.getElementById('retake-product-photo-btn')?.classList.add('hidden');
        };
        cancelProductCameraButton.removeEventListener('click', handler);
        cancelProductCameraButton.addEventListener('click', handler);
    }

    const retakePhotoButton = document.getElementById('retake-product-photo-btn');
    if (retakePhotoButton) {
        retakePhotoButton.removeEventListener('click', retakeProductPhoto);
        retakePhotoButton.addEventListener('click', retakeProductPhoto);
    }

    const useThisPhotoButton = document.getElementById('use-this-photo-btn');
    // MODIFIED: This handler now keeps the preview visible and hides only the "Use This Photo" button.
    if (useThisPhotoButton && retakePhotoButton) { // Ensure both exist to avoid errors
        const handler = () => {
            console.log("useThisPhotoButton: Clicked."); 
            // Ensure the image preview container is visible
            document.getElementById('image-preview-container')?.classList.remove('hidden'); 
            // Hide only the "Use This Photo" button as its action is complete
            useThisPhotoButton.classList.add('hidden');
            // Ensure "Retake Photo" button remains visible
            retakePhotoButton.classList.remove('hidden'); 
            // Hide the initial "Take Photo" button
            document.getElementById('take-photo-trigger-btn')?.classList.add('hidden');

            showToast("Photo accepted for product. Proceed with form details!");
            console.log("useThisPhotoButton: image-preview-container visible:", !document.getElementById('image-preview-container')?.classList.contains('hidden')); 
            console.log("useThisPhotoButton: Use This Photo button hidden:", useThisPhotoButton.classList.contains('hidden')); 
            console.log("useThisPhotoButton: Retake Photo button visible:", !retakePhotoButton.classList.contains('hidden')); 
            console.log("useThisPhotoButton: Hidden product-image-data value length:", document.getElementById('product-image-data').value.length); 
        };
        useThisPhotoButton.removeEventListener('click', handler);
        useThisPhotoButton.addEventListener('click', handler);
    }


    // --- INITIAL LOAD FOR TABS (FIXED) ---
    // Correctly activate the first tab on load without interfering with camera setup
    showTab('count-inventory'); // Or whatever your default starting tab is
    loadInventoryList(); // Load inventory for search/count tab
});

// --- MODIFIED: handleProductPhotoTrigger ---
async function handleProductPhotoTrigger() {
    console.log("handleProductPhotoTrigger: Clicked Take Photo trigger button."); 
    // Clear any previous image data and preview
    document.getElementById('product-image-data').value = '';
    document.getElementById('product-image-preview').src = '#';

    // Hide all photo-related containers and buttons initially
    document.getElementById('image-preview-container')?.classList.add('hidden');
    document.getElementById('camera-container')?.classList.add('hidden');
    document.getElementById('use-this-photo-btn')?.classList.add('hidden');
    document.getElementById('retake-product-photo-btn')?.classList.add('hidden');
    document.getElementById('take-photo-trigger-btn')?.classList.add('hidden'); // Hide self

    if (!hasInitializedProductCameras) {
        await initializeProductCameras();
    }
    
    if (availableProductCameras.length > 0) {
        await startProductPhotoCamera(); // Start the camera, which makes camera-container visible
        console.log("handleProductPhotoTrigger: Camera started. Camera container visible.");
    } else {
        showToast("No cameras found to start for product photo.");
        // If no cameras, ensure 'Take Photo' button is still visible for retries
        document.getElementById('take-photo-trigger-btn')?.classList.remove('hidden');
    }
}


// --- MODIFIED: showTab ---
function showTab(tabId) {
    tabContents.forEach(t => t.classList.add('hidden'));
    document.getElementById(tabId)?.classList.remove('hidden');

    const addProductTabContent = document.getElementById('add-product');
    // Logic for leaving 'add-product' tab
    if (addProductTabContent && !addProductTabContent.classList.contains('hidden') && tabId !== 'add-product') {
        stopProductPhotoCamera(); // Stop the stream
        // Hide all photo-related UI when leaving add-product tab
        document.getElementById('camera-container')?.classList.add('hidden');
        document.getElementById('image-preview-container')?.classList.add('hidden');
        document.getElementById('take-photo-trigger-btn')?.classList.remove('hidden'); // Show initial take photo button
        document.getElementById('use-this-photo-btn')?.classList.add('hidden'); // Hide these buttons
        document.getElementById('retake-product-photo-btn')?.classList.add('hidden');
        document.getElementById('product-image-data').value = ''; // Clear image data
        document.getElementById('product-image-preview').src = '#'; // Clear image preview source
    }
    // And ensure barcode scanner is stopped if not in count-inventory
    if (tabId !== 'count-inventory' && scannerActive) {
        stopScanner();
    }


    tabButtons.forEach(btn => {
        btn.classList.remove('active-tab', 'text-indigo-600');
        btn.classList.add('text-gray-700');
    });

    const activeBtn = Array.from(tabButtons).find(btn => btn.getAttribute('onclick')?.includes(tabId));
    if (activeBtn) {
        activeBtn.classList.add('active-tab', 'text-indigo-600');
        activeBtn.classList.remove('text-gray-700');
    }

    if (mobileTabSelect) mobileTabSelect.value = tabId;

    if (tabId === 'search-inventory') {
        document.getElementById('searchInput').value = '';
        searchInventory(); // Ensure inventory list is loaded/reloaded
    } else if (tabId === 'add-product') {
        loadCategories();
        // Reset photo UI when entering add-product tab
        document.getElementById('camera-container')?.classList.add('hidden');
        document.getElementById('image-preview-container')?.classList.add('hidden');
        document.getElementById('take-photo-trigger-btn')?.classList.remove('hidden');
        document.getElementById('product-image-data').value = ''; // Clear any previous image data
        document.getElementById('product-image-preview').src = '#'; // Clear image preview source
        document.getElementById('use-this-photo-btn')?.classList.add('hidden'); // Ensure hidden
        document.getElementById('retake-product-photo-btn')?.classList.add('hidden'); // Ensure hidden

        // Do NOT call startProductPhotoCamera() here directly. It should only activate
        // when the user clicks the "Take Photo" button within the tab.
    } else if (tabId === 'alerts') {
        showAlertTab('low-stock'); // Default to low-stock alerts
    }
}


// --- REST OF YOUR ORIGINAL JS FUNCTIONS (UNCHANGED, EXCEPT resetAddProductForm) ---

function toggleSyncSettings() {
    syncSettingsPanel.classList.toggle('hidden');
}

function testConnection() {
    connectionStatus.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-red-800', 'text-green-800');
    connectionStatus.classList.add('bg-gray-100', 'text-gray-800');
    connectionStatus.querySelector('span').textContent = 'Testing...';
    connectionStatus.querySelector('.rounded-full').classList.add('bg-gray-500');
    
    setTimeout(() => {
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

function fetchProductInfo(e) {
    e.preventDefault();
    const barcode = barcodeInput.value.trim();
    if (!barcode) return;
    
    productInfoSection.classList.add('hidden');
    showToast('Looking up product...');
    
    fetch(`/api/barcode/${barcode}`)
        .then(res => res.json())
        .then(productData => {
            if (productData && productData.name) {
                fetch(`/inventory/search?q=${barcode}`)
                    .then(res => res.json())
                    .then(localResults => {
                        if (localResults.length > 0) {
                            displayProductInfo(localResults[0]);
                        } else {
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
                                body: JSON.stringify(productData)
                            })
                            .then(() => {
                                displayProductInfo(newProduct);
                                showToast('Product added to inventory!');
                            });
                        }
                    });
            } else {
                fetch(`/inventory/search?q=${barcode}`)
                    .then(res => res.json())
                    .then(results => {
                        if (!Array.isArray(results)) throw new Error("Invalid response for barcode lookup");
                        console.log("Barcode lookup results:", results);
                    })
                    .catch(err => {
                        console.error("Barcode check error:", err);
                        showToast("Error validating barcode. Please try again.");
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
    
    const img = document.getElementById('productImage');
    if (product.image_url) {
        img.src = product.image_url;
    } else {
        // Correct way to use Flask's url_for in JS is to have the template render it directly
        // Ensure you have a placeholder.png in static/images
        img.src = "/static/images/placeholder.png"; // Fallback to a static path
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

    showToast('Stock removed successfully');

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
                <img class="h-10 w-10 rounded" src="${item.image_url || 'https://placehold.co/40x40/cccccc/ffffff?text=NO+IMG'}" alt="">
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
        console.log(`Search Result: ${item.name}, Image URL: ${item.image_url}`); // Debugging log
      });
    })
    .catch(error => {
      console.error('Error fetching inventory:', error);
      showLoader(false);
    });
}

// --- MODIFIED: saveProduct ---
function saveProduct(productData) {
    // If product_image is a base64 string, prepare FormData
    if (productData.product_image && productData.product_image.startsWith('data:image')) {
        const formData = new FormData();

        // Append the image as a Blob, correctly named for Flask
        formData.append('product_image', dataURLtoBlob(productData.product_image), 'product_photo.jpeg'); // Fixed filename for consistency
        console.log("saveProduct: Appending product_image to FormData. Size:", dataURLtoBlob(productData.product_image).size);

        // Append other product data to FormData
        for (const key in productData) {
            if (key !== 'product_image') { // Skip the base64 string as it's handled separately
                formData.append(key, productData[key]);
            }
        }
        console.log("saveProduct: FormData created for image upload.");

        return fetch('/inventory/add', {
            method: 'POST',
            body: formData // FormData automatically sets 'Content-Type': 'multipart/form-data'
        })
        .then(res => {
            if (!res.ok) {
                console.error("saveProduct: Server response not OK. Status:", res.status, "Text:", res.statusText);
                throw new Error(`Server error: ${res.statusText}`);
            }
            return res.json();
        });
    }

    // Fallback: if no image data (or not base64), send as JSON
    console.log("saveProduct: No base64 image, sending as JSON.");
    return fetch('/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
    }).then(res => res.json());
}

// Convert base64 string to Blob (original, untouched)
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}


// --- MODIFIED: handleAddProduct ---
function handleAddProduct(e) {
  e.preventDefault();
  const form = document.getElementById('addProductForm');
  const fd   = new FormData(form);
  const name = fd.get('name');
  if (!name) {
    showToast('Product name is required');
    return;
  }

  const barcode = fd.get('barcode') || `MANUAL_${Date.now()}`;

  // First ensure no duplicate
  // IMPORTANT: The barcode check below is a frontend check. The backend also has a check.
  // It's good to have both for user experience, but the backend is the source of truth.
  fetch(`/inventory/search?q=${barcode}`)
    .then(res => res.json())
    .then(localResults => {
      if (localResults.length > 0) {
        showToast('Product with this barcode already exists');
        return;
      }

      const productData = {
        barcode:     barcode,
        name:        name,
        category:    fd.get('categoryOption') === 'select'
                     ? (fd.get('category') || 'Uncategorized')
                     : (fd.get('newCategory') || 'Uncategorized'),
        quantity:    parseInt(fd.get('initialStock'))    || 0,
        cost:        parseFloat(fd.get('unitCost'))      || 0,
        price:       parseFloat(fd.get('sellingPrice'))  || 0,
        expiry:      fd.get('expiryDate')                || '',
        threshold:   parseInt(fd.get('reorderThreshold'))|| 0,
        distributor: '',
        manufacturer:'',
        synced:      false,
        // Get the image data from the hidden input
        product_image: document.getElementById('product-image-data').value || '',
        description: fd.get('description')               || ''
      };

      console.log("handleAddProduct: Product data before saving:", productData); 
      console.log("handleAddProduct: Product image data length (from hidden input):", productData.product_image ? productData.product_image.length : 0); 


      // CALL our unified saveProduct, which returns parsed JSON
      saveProduct(productData)
        .then(data => {
          if (data.status === 'ok') {
            showToast('Product added successfully');
            resetAddProductForm(); // This will clear and reset the photo UI
            showTab('search-inventory'); // Direct to search after adding
            searchInventory(); // Re-load inventory to show new product with image
          } else {
            showToast('Error adding product: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(err => {
          console.error('handleAddProduct: Add product error:', err);
          showToast('Network error: ' + err.message);
        });
    })
    .catch(err => {
      console.error('handleAddProduct: Barcode check error (outside saveProduct):', err);
      showToast('Error checking barcode during add product');
    });
}

function selectSuggestion(sku) {
    searchInput.value = sku;
    searchSuggestions.classList.add('hidden');
    
    showLoader(true);
    
    setTimeout(() => {
        showLoader(false);
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
      document.getElementById('detailsExpiryDate').value = p.expiry || '';
      document.getElementById('detailsDescription').value = p.description || 'No description available.';
      
      
      const img = document.getElementById('detailsProductImage');
      if (p.image_url) {
          img.src = p.image_url;
      } else {
          img.src = "/static/images/placeholder.png"; // Fallback to a static path
      }
      img.alt = p.name || 'Product Image';

      window.currentBarcode = p.barcode;

      logProductScan(p.barcode, p.quantity);

      loadStockHistory(p.barcode, document.getElementById('stockHistoryRange').value);

      productDetailsModal.classList.remove('hidden');
    })
    .catch(err => console.error('Error fetching product details:', err));
}


function logProductScan(barcode, currentStock) {
  fetch('/inventory/log-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode: barcode, current_qty: currentStock })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Scan log response:', data);
      loadStockHistory(barcode, document.getElementById('stockHistoryRange').value);
    })
    .catch(err => {
      console.error('Error logging scan:', err);
    });
}

function getTimeUnitForRange(range) {
  switch (range) {
    case '24hours': return 'hour';
    case 'week':     return 'day';
    case 'month':    return 'day';
    case '3months':  return 'week';
    case '6months':  return 'month';
    case 'year':    return 'month'; // Corrected: should be month for year view
    case '5years':   return 'year';
    case '10years':  return 'year';
    default:         return 'day';
  }
}

function getRangeMin(range) {
  const now = new Date();
  switch (range) {
    case '24hours': return new Date(now - 24 * 60 * 60 * 1000);
    case 'week':    return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case 'month':   return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '3months': return new Date(now - 90 * 24 * 60 * 60 * 1000);
    case '6months': return new Date(now - 180 * 24 * 60 * 60 * 1000);
    case 'year':    return new Date(now - 365 * 24 * 60 * 60 * 1000);
    case '5years':  return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    case '10years': return new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    default:        return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}

function generateSimulatedStockHistory(range) {
  const points = [];
  const now = new Date();
  const start = getRangeMin(range);
  const unit = getTimeUnitForRange(range);
  let current = new Date(start);
  
  while (current <= now) {
    points.push({
      date: current.toISOString(),
      quantity: Math.floor(Math.random() * 100)
    });
    
    if (unit === 'hour') current.setHours(current.getHours() + 1);
    else if (unit === 'day') current.setDate(current.getDate() + 1);
    else if (unit === 'week') current.setDate(current.getDate() + 7);
    else if (unit === 'month') current.setMonth(current.getMonth() + 1);
    else if (unit === 'year') current.setFullYear(current.getFullYear() + 1);
  }
  return points;
}

function loadStockHistory(barcode, range) {
  fetch(`/inventory/stock-history?barcode=${barcode}`)
    .then(res => res.json())
    .then(data => {
      const rangeMin = getRangeMin(range);
      const now = new Date();
      
      let filteredData = Array.isArray(data) 
        ? data.filter(record => {
            const dt = new Date(record.date);
            return dt >= rangeMin && dt <= now;
          })
        : [];

      if (filteredData.length === 0) {
        filteredData = generateSimulatedStockHistory(range);
      }

      const canvas = document.getElementById("stockHistoryChart");
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      
      if (window.stockHistoryChart instanceof Chart) {
        window.stockHistoryChart.destroy();
      }
      
      const labels = filteredData.map(record => record.date);
      const quantities = filteredData.map(record => record.quantity);
      
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
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    min: rangeMin,
                    max: now,
                    time: {
                        unit: getTimeUnitForRange(range),
                        displayFormats: {
                        hour: 'MMM D, HH:mm',
                        day: 'MMM D',
                        week: 'MMM D',
                        month: 'MMM', // Corrected format for month/year
                        year: 'YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantity'
                    }
                }
            }
        }
      });
    })
    .catch(err => {
      console.error("Error loading stock history:", err);
    });
}

function editProduct() {
    document.getElementById('productDetailsDisplay').classList.add('hidden');
    document.getElementById('productDetailsEdit').classList.remove('hidden');
    
    document.getElementById('editProductName').value = document.getElementById('detailsProductName').textContent;
    document.getElementById('editExpiryDate').value = document.getElementById('detailsExpiryDate').value;
    document.getElementById('editDescription').value = document.getElementById('detailsDescription').textContent; // Use textContent for consistency
}

function cancelEditProduct() {
    document.getElementById('productDetailsEdit').classList.add('hidden');
    document.getElementById('productDetailsDisplay').classList.remove('hidden');
}

function showAlertTab(tabId) {
    alertTabContents.forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`${tabId}-alerts`).classList.remove('hidden');
    
    alertTabs.forEach(tab => {
        tab.classList.remove('active-tab');
        tab.classList.remove('text-indigo-600');
        tab.classList.add('text-gray-700');
    });
    
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
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    fileUpload.value = '';
    imagePreviewContainer.classList.add('hidden');
}

// --- MODIFIED: resetAddProductForm ---
function resetAddProductForm() {
    console.log("resetAddProductForm: Called."); 
    document.getElementById('addProductForm').reset();
    
    // Clear image related elements
    document.getElementById('image-preview-container')?.classList.add('hidden');
    document.getElementById('product-image-data').value = '';
    document.getElementById('product-image-preview').src = '#'; // Clear actual image source
    
    stopProductPhotoCamera(); // Stop the product camera stream
    document.getElementById('camera-container')?.classList.add('hidden'); // Hide camera view

    // Reset button visibility to initial state for a new product entry
    document.getElementById('take-photo-trigger-btn')?.classList.remove('hidden'); // Show "Take Photo" button
    document.getElementById('use-this-photo-btn')?.classList.add('hidden'); // Hide "Use This Photo"
    document.getElementById('retake-product-photo-btn')?.classList.add('hidden'); // Hide "Retake Photo"
    console.log("resetAddProductForm: Photo UI reset to initial state.");
}

function scanNewBarcode() {
    // This button should likely trigger the main scanner modal if it's for product lookup
    // For now, it just shows a toast as it's not fully integrated with a separate scanner for this specific input
    showToast('Barcode scanner for manual entry would activate here.');
    // You could call startScanner() here if you want to reuse the count-inventory scanner modal
}

function resetOrderForm() {
    document.getElementById('placeOrderForm').reset();
    document.getElementById('orderProductInfo').classList.add('hidden');
    showTab('alerts'); // Navigates to alerts tab after resetting order form
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(hideToast, 5000);
}

function hideToast() {
    toast.classList.add('hidden');
}

// Barcode Scanner Controls (Original, untouched)
let lastCode = null;
let lastDetectedTime = 0;
let currentCameraIndex = 0;
let availableCameras = []; // This is for the barcode scanner cameras
let html5Scanner = null;
let scannerActive = false;
let cameraErrorCount = 0;

// Automatically start scanner when scannerContainer is shown (original, untouched)
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


async function startScanner() {
    if (scannerActive) return;
    console.log("Starting scanner...");

    scannerContainer.classList.remove('hidden');
    if (stopScannerBtn) stopScannerBtn.classList.remove('hidden');
    if (switchCameraBtn) switchCameraBtn.classList.remove('hidden');
    scannerActive = true;
    cameraErrorCount = 0;

    try {
        availableCameras = await Html5Qrcode.getCameras();
        if (availableCameras.length === 0) throw new Error("No cameras found");

        availableCameras.sort((a, b) => {
            const aIsCamo = a.label.toLowerCase().includes('camo');
            const bIsCamo = b.label.toLowerCase().includes('camo');
            return aIsCamo ? 1 : bIsCamo ? -1 : 0;
        });

        if (isProduction() && availableCameras[currentCameraIndex].label.toLowerCase().includes('camo')) {
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
        }

        const cameraId = availableCameras[currentCameraIndex].id;
        console.log("Using camera:", cameraId, availableCameras[currentCameraIndex].label);

        html5Scanner = new Html5Qrcode("scannerVideo");

        await html5Scanner.start(
            cameraId,
            {
                fps: 10,
                aspectRatio: 1.777778
            },
            (decodedText) => {
                const now = Date.now();
                if (!decodedText || decodedText === lastCode || decodedText.length < 8 || now - lastDetectedTime < 800) return;

                lastCode = decodedText;
                lastDetectedTime = now;

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

        const videoElement = scannerVideo.querySelector('video');
        if (videoElement) {
            videoElement.style.objectFit = 'cover';
        }
    } catch (err) {
        console.error("Failed to start barcode scanner camera:", err);
        cameraErrorCount++;
        
        if (availableCameras.length > 1 && cameraErrorCount < availableCameras.length) { // Ensure there are other cameras to try
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
            setTimeout(startScanner, 500);
        } else {
            showToast("Camera error: " + (err.message || "Failed to start any barcode scanner camera"));
            stopScanner();
        }
    }
}

function stopScanner() {
    scannerActive = false;
    
    if (html5Scanner) {
        html5Scanner.stop().catch(err => {
            if (!err.message.includes('not running')) {
                console.warn("Stop error:", err);
            }
        });
        html5Scanner = null; // Clear instance
    }
    
    scannerContainer.classList.add('hidden');
    if (stopScannerBtn) stopScannerBtn.classList.add('hidden');
    if (switchCameraBtn) switchCameraBtn.classList.add('hidden');
}

function switchCamera() { // Barcode scanner switch camera
    if (!availableCameras.length) {
        showToast("No cameras available");
        return;
    }

    if (isProduction()) {
        let nextIndex = (currentCameraIndex + 1) % availableCameras.length;
        let iterations = 0;
        while (availableCameras[nextIndex].label.toLowerCase().includes('camo') && iterations < availableCameras.length) {
            nextIndex = (nextIndex + 1) % availableCameras.length;
            iterations++;
        }
        currentCameraIndex = nextIndex;
    } else {
        if (availableCameras[currentCameraIndex].label.toLowerCase().includes('camo')) {
            const nonCamoIndex = availableCameras.findIndex(cam =>
                !cam.label.toLowerCase().includes('camo') &&
                !cam.label.toLowerCase().includes('virtual')
            );
            currentCameraIndex = nonCamoIndex > -1 ? nonCamoIndex : (currentCameraIndex + 1) % availableCameras.length;
        } else {
            const camoIndex = availableCameras.findIndex(cam => 
                cam.label.toLowerCase().includes('camo')
            );
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
      const tbody = document.getElementById('searchResultsBody');
      // No change here for searchResultsTable visibility on initial load if data is empty
      // As per previous, searchInventory handles the empty state
      document.getElementById('searchResultsTable').classList.remove('hidden');
      tbody.innerHTML = '';

      if (!data || data.length === 0) {
        document.getElementById('searchResultsTable').classList.add('hidden');
        document.getElementById('searchEmpty').classList.remove('hidden');
        return;
      }


      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded" src="${item.image_url || 'https://placehold.co/40x40/cccccc/ffffff?text=NO+IMG'}" alt="">
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
      console.error('Error loading inventory list:', error);
      showToast('Failed to load inventory list. Please try again.');
    });
}

function afterProductAdded() {
  loadInventoryList();
  clearAddProductForm();
}

function toggleEditProduct() {
  const isEditing = window.isEditing || false;

  const inlineFields = [
    'detailsProductName',
    'detailsProductCategory',
    'detailsCurrentStock',
    'detailsReorderThreshold',
    'detailsUnitCost',
    'detailsSellingPrice'
  ];
  inlineFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.contentEditable = !isEditing;
      el.classList.toggle('bg-yellow-50', !isEditing);
    }
  });

  const expiryEl = document.getElementById('detailsExpiryDate');
  const descEl = document.getElementById('detailsDescription');
  
  if (expiryEl) {
    if (!isEditing) {
      expiryEl.removeAttribute('readonly');
      expiryEl.classList.add('bg-yellow-50');
    } else {
      expiryEl.setAttribute('readonly', 'true');
      expiryEl.classList.remove('bg-yellow-50');
    }
  }
  
  if (descEl) {
    if (!isEditing) {
      descEl.removeAttribute('readonly');
      descEl.classList.add('bg-yellow-50');
    } else {
      descEl.setAttribute('readonly', 'true');
      descEl.classList.remove('bg-yellow-50');
    }
  }

  const btn = document.getElementById('toggleEditBtn');
  if (!isEditing) {
    btn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
  } else {
    btn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Product';
    saveEditedProduct();
  }

  window.isEditing = !isEditing;
}

function saveProductEdit() {
    const updatedName = document.getElementById('editProductName').value;
    const updatedExpiry = document.getElementById('editExpiryDate').value;
    const updatedDesc = document.getElementById('editDescription').value;
    
    console.log("Updated Name:", updatedName);
    console.log("Updated Expiry:", updatedExpiry);
    console.log("Updated Description:", updatedDesc);
    
    document.getElementById('detailsProductName').textContent = updatedName;
    document.getElementById('detailsExpiryDate').value = updatedExpiry;
    document.getElementById('detailsDescription').value = updatedDesc;

    document.getElementById('productDetailsEdit').classList.add('hidden');
    document.getElementById('productDetailsDisplay').classList.remove('hidden');
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
    expiry: document.getElementById('detailsExpiryDate').value,
    description: document.getElementById('detailsDescription').value.trim()
  };

  console.log("Preparing to save. detailsDescription =", product.description);

  fetch('/inventory/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
  .then(res => res.json())
  .then(data => {
    console.log("Saved:", data);
    if (data.status === 'ok') {
      document.getElementById('detailsDescription').value = product.description;
      loadStockHistory(product.barcode, document.getElementById('stockHistoryRange').value);
      showToast('Product updated successfully!');
    } else {
        showToast('Error updating product: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => {
      console.error('Failed to save changes:', err);
      showToast('Network error during save: ' + err.message);
  });
}

function addStockHandler(event) {
  event.preventDefault();
  const addQuantity = parseInt(document.getElementById('addQuantity').value);
  const barcode = barcodeInput ? barcodeInput.value.trim() : ''; 
  const reason = document.getElementById('addReason').value;
  const notes = document.getElementById('addNotes').value;
  const expiryDate = document.getElementById('addExpiryDate') ? document.getElementById('addExpiryDate').value : '';

  adjustStock(barcode, addQuantity);

  const currentStockEl = document.getElementById('currentStock');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  if (currentStockEl && lastUpdatedEl) {
    const currentStock = parseInt(currentStockEl.textContent);
    currentStockEl.textContent = currentStock + addQuantity;
    lastUpdatedEl.textContent = new Date().toLocaleString();
  }
  
  const data = {
    barcode: barcode,
    quantity: addQuantity,
    reason: reason,
    notes: notes,
    expiryDate: expiryDate
  };

  fetch('/inventory/add', { // This endpoint is not for adding stock history but for adding/updating product.
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(result => {
      console.log("Server response:", result);
    })
    .catch(err => console.error("Error sending add stock data:", err));
  
  closeAddStockModal();
}

function closeProductDetails() {
    document.getElementById('productDetailsModal').classList.add('hidden');
    // Ensure product details are no longer editable if the modal is closed
    if (window.isEditing) {
        toggleEditProduct(); // Revert to display mode
    }
}

// Preview Image function (original, untouched)
function previewImage(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').classList.remove('hidden');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// removeImage function (original, untouched)
// This function needs to clear the hidden base64 input as well.
function removeImage() {
    const fileUploadEl = document.getElementById('file-upload');
    if (fileUploadEl) fileUploadEl.value = '';
    
    const imagePreviewEl = document.getElementById('imagePreview');
    if (imagePreviewEl) imagePreviewEl.src = '#'; // Clear image source
    
    const imagePreviewContainerEl = document.getElementById('imagePreviewContainer');
    if (imagePreviewContainerEl) imagePreviewContainerEl.classList.add('hidden');

    const productImageDataInput = document.getElementById('product-image-data');
    if (productImageDataInput) productImageDataInput.value = ''; // Crucial: clear hidden base64 data
}


// checkCameraPermissions function (original, untouched)
async function checkCameraPermissions() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
    } catch (error) {
        console.error('Camera permissions denied:', error);
        showToast('Camera access is required. Please enable camera permissions.');
        return false;
    }
}

// window.addEventListener('beforeunload', () => { (original, untouched)
window.addEventListener('beforeunload', () => {
    if (productCameraStream) {
        productCameraStream.getTracks().forEach(track => track.stop());
        productCameraStream = null;
    }
    if (html5Scanner && scannerActive) { // Also stop barcode scanner if active
        html5Scanner.stop().catch(err => console.warn("Barcode scanner stop on unload error:", err));
    }
});

// Drag and drop functions (original, untouched)
function initDragAndDrop() {
    const dropzoneEl = document.getElementById('dropzone');
    if (!dropzoneEl) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzoneEl.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzoneEl.addEventListener(eventName, highlight, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropzoneEl.addEventListener(eventName, unhighlight, false);
    });

    dropzoneEl.addEventListener('drop', handleDrop, false);
    
    dropzoneEl.addEventListener('click', () => {
        document.getElementById('file-upload').click();
    });
}

// --- END ORIGINAL JS FUNCTIONS ---
