document.addEventListener('DOMContentLoaded', async () => {
    const codeReader = new ZXing.BrowserQRCodeReader();
    let selectedDeviceId;
    let scanning = false;

    migrateOldHistory();
    renderScanHistory();

    const cameraSelect = document.getElementById("camera-select");
    const startScanBtn = document.getElementById("start-scan");
    const stopScanBtn = document.getElementById("stop-scan");
    const videoElement = document.getElementById('qr-video');

    // Populate camera dropdown
    const devices = await codeReader.listVideoInputDevices();
    devices.forEach(device => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text = device.label || `Camera ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(option);
    });

    selectedDeviceId = devices.length > 1 ? devices[1]?.deviceId : devices[0]?.deviceId;

    // Handle camera change
    cameraSelect.addEventListener("change", async (e) => {
        selectedDeviceId = e.target.value;
        if (scanning) {
            await startCameraScan(); // restart stream with new camera
        }
    });

    // Start scan
    startScanBtn.addEventListener('click', async () => {
        scanning = true;
        startScanBtn.hidden = true;
        stopScanBtn.hidden = false;
        cameraSelect.hidden = false; // Keep camera selector visible
        videoElement.hidden = false;

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
        const resultContainer = document.getElementById('scan-result');
        resultContainer.innerHTML = `<a href="${formattedText}" target="_blank">${formattedText}</a>`;

        document.getElementById("export-png").hidden = false;
        document.getElementById("export-pdf").hidden = false;
        document.getElementById("copy-to-clipboard").hidden = false;
        document.getElementById("go-to-link").hidden = false;

        const goToLinkBtn = document.getElementById("go-to-link");
        goToLinkBtn.href = formattedText;
        goToLinkBtn.onclick = (e) => {
            window.open(formattedText, "_blank");
            e.preventDefault();
        };

        addScanHistory(formattedText);
    }

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

    function renderScanHistory() {
        let scans = JSON.parse(localStorage.getItem('scanHistory') || "[]");
        const ul = document.getElementById('scan-history');
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

    function deleteScanHistoryEntry(index) {
        let scans = JSON.parse(localStorage.getItem('scanHistory') || "[]");
        scans.splice(index, 1);
        localStorage.setItem('scanHistory', JSON.stringify(scans));
        renderScanHistory();
    }

    renderScanHistory();
});



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


// Copy QR code to clipboard functionality
document.getElementById("copy-to-clipboard").addEventListener("click", function () {
    var qrCodeContainer = document.getElementById("qr-code");
    var range = document.createRange();
    range.selectNode(qrCodeContainer);
    window.getSelection().removeAllRanges(); // Clear previous selections
    window.getSelection().addRange(range);

    try {
        document.execCommand('copy');
        alert("QR code copied to clipboard!");
    } catch (err) {
        console.error("Failed to copy QR code: ", err);
        alert("Failed to copy QR code. Please try again.");
    }

    window.getSelection().removeAllRanges(); // Clear selection after copying
});



function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");

    toastMessage.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}


document.getElementById("copy-to-clipboard").addEventListener("click", function () {
    const qrCanvas = document.querySelector('#qr-code canvas');

    if (!qrCanvas) {
        console.error("QR canvas not found");
        return;
    }

    console.log("QR Canvas found. Creating blob..."); // 🔍 Debug log

    qrCanvas.toBlob(blob => {
        if (!blob) {
            console.error("Failed to create image blob.");
            return;
        }

        console.log("Blob created successfully: ", blob); // 🔍 Debug log

        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => {
            console.log("QR code copied to clipboard!");
            showToast("QR code copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy image: ", err);
            showToast("Failed to copy QR code.");
        });
    }, "image/png");
});


document.addEventListener("DOMContentLoaded", function () {
    // Get elements
    const startScanBtn = document.getElementById("start-scan");
    const cameraSelect = document.getElementById("camera-select");
    const cameraSelectLabel = document.getElementById("camera-select-label");

    // Start scan button click event
    startScanBtn.addEventListener("click", function () {
        // Show the camera select dropdown
        cameraSelect.classList.remove("hidden");
        cameraSelectLabel.classList.remove("hidden");

        // You can add logic here to start the camera scanning if necessary
        startCameraScan();
    });

    // Function to start the camera scan (you can add your camera initialization logic here)
    function startCameraScan() {
        console.log("Starting camera scan...");
        // Example: Scan logic goes here (like accessing the camera, etc.)
    }
});
