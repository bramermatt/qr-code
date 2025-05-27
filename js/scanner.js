document.addEventListener('DOMContentLoaded', async () => {
    // ZXing QR code reader
    const codeReader = new ZXing.BrowserQRCodeReader();
    let selectedDeviceId;
    let scanning = false;

    migrateOldHistory();
    renderScanHistory();

    // DOM elements
    const startScanBtn = document.getElementById("start-scan");
    const stopScanBtn = document.getElementById("stop-scan");
    const videoElement = document.getElementById('qr-video');
    const scanResult = document.getElementById('scan-result');

    // Get available cameras and select the first one
    const devices = await codeReader.listVideoInputDevices();
    selectedDeviceId = devices[1]?.deviceId;

    // Start scan
    startScanBtn.addEventListener('click', async () => {
        scanning = true;
        startScanBtn.hidden = true;
        stopScanBtn.hidden = false;
        videoElement.hidden = false;
        scanResult.textContent = "";
        await startCameraScan();
    });

    // Stop scan
    stopScanBtn.addEventListener('click', () => {
        scanning = false;
        startScanBtn.hidden = false;
        stopScanBtn.hidden = true;
        videoElement.hidden = true;
        codeReader.reset();
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    });

    // Start camera and scan
    async function startCameraScan() {
        try {
            // Stop existing stream before starting new one
            if (videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            await codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
                if (result) {
                    handleScanResult(result.text);
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error("QR Decode error:", err);
                }
            });
            videoElement.hidden = false;
        } catch (e) {
            console.error("Camera access error:", e);
            alert("Could not access the camera. Please check permissions and HTTPS.");
        }
    }

    // Handle scan result
    function handleScanResult(text) {
        let formattedText = text.trim();
        if (!formattedText.startsWith('http://') && !formattedText.startsWith('https://')) {
            formattedText = 'https://www.' + formattedText;
        }

        // Stop scanning
        scanning = false;
        startScanBtn.hidden = false;
        stopScanBtn.hidden = true;
        videoElement.hidden = true;
        codeReader.reset();
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }

        // Display result
        scanResult.innerHTML = `<a href="${formattedText}" target="_blank">${formattedText}</a>`;

        // Add to scan history
        addScanHistory(formattedText);
    }

    // Add scan to history
    function addScanHistory(text) {
        let scans = JSON.parse(localStorage.getItem('scanHistory') || "[]");
        const alreadyExists = scans.some(entry => entry.text === text);
        if (!alreadyExists) {
            const entry = {
                text: text,
                timestamp: new Date().toISOString()
            };
            scans.push(entry);
            localStorage.setItem('scanHistory', JSON.stringify(scans));
            renderScanHistory();
        }
    }

    // Render scan history
    function renderScanHistory() {
        let scans = JSON.parse(localStorage.getItem('scanHistory') || "[]");
        const ul = document.getElementById('scan-history');
        if (!ul) return;
        ul.innerHTML = '';
        scans.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = "group flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md shadow hover:bg-gray-100 dark:hover:bg-gray-700";
            li.innerHTML = `
                <div class="flex items-center space-x-2 overflow-hidden">
                    <i class="fa-solid fa-qrcode text-gray-500"></i>
                    <a href="${entry.text}" target="_blank" class="truncate">${entry.text}</a>
                    <small class="text-gray-400 truncate pr-2">(${new Date(entry.timestamp).toLocaleString()})</small>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="copy-btn text-blue-500 hover:text-blue-700 group-hover:inline" data-index="${index}" title="Copy to clipboard">
                        <i class="fa fa-copy"></i>
                    </button>
                    <button class="delete-btn text-red-500 hover:text-red-700 group-hover:inline" data-index="${index}" title="Delete">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            `;
            ul.appendChild(li);

            li.querySelector('.copy-btn')?.addEventListener('click', () => {
                navigator.clipboard.writeText(entry.text).then(() => {
                    showToast("Copied to clipboard!");
                }).catch(() => {
                    showToast("Failed to copy.");
                });
            });

            li.querySelector('.delete-btn')?.addEventListener('click', () => {
                deleteScanHistoryEntry(index);
            });
        });
    }

    // Delete scan history entry
    function deleteScanHistoryEntry(index) {
        let scans = JSON.parse(localStorage.getItem('scanHistory') || "[]");
        scans.splice(index, 1);
        localStorage.setItem('scanHistory', JSON.stringify(scans));
        renderScanHistory();
    }
});

// Migrate old history (string array to object array)
function migrateOldHistory() {
    let scans = JSON.parse(localStorage.getItem('scanHistory') || "[]");
    if (scans.length > 0 && typeof scans[0] === "string") {
        const updated = scans.map(text => ({
            text,
            timestamp: new Date().toISOString()
        }));
        localStorage.setItem('scanHistory', JSON.stringify(updated));
    }
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}
