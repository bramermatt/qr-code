document.addEventListener('DOMContentLoaded', async () => {
    const codeReader = new ZXing.BrowserQRCodeReader();
    let selectedDeviceId;
    let scanning = false;
    migrateOldHistory();
    renderScanHistory();


    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(devices);  // See if cameras are listed
    navigator.permissions.query({ name: 'camera' }).then(result => console.log(result));



document.getElementById('start-scan').addEventListener('click', async () => {
    scanning = true;
    document.getElementById('start-scan').hidden = true;
    document.getElementById('stop-scan').hidden = false;
    const videoElement = document.getElementById('qr-video');
    document.getElementById('scan-result').textContent = "";

    try {
        // Force permission prompt
        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await codeReader.listVideoInputDevices();
        console.log("Video devices:", devices);

        if (devices.length === 0) {
            alert("No camera found.");
            return;
        }

        selectedDeviceId = devices[0].deviceId;

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
});


    document.getElementById('stop-scan').addEventListener('click', () => {
        scanning = false;
        document.getElementById('start-scan').hidden = false;
        document.getElementById('stop-scan').hidden = true;
        codeReader.reset();
        const videoElement = document.getElementById('qr-video');
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    });

    function handleScanResult(text) {
        const resultContainer = document.getElementById('scan-result');
        resultContainer.innerHTML = `<a href="${text}" target="_blank">${text}</a>`;
        addScanHistory(text);
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
    scans.forEach(entry => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = entry.text;
        link.textContent = entry.text;
        link.target = "_blank";

        const timestamp = new Date(entry.timestamp).toLocaleString();

        li.appendChild(link);
        li.innerHTML += ` <small>(${timestamp})</small>`;
        ul.appendChild(li);
    });
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