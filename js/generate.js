document.getElementById("qr-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        generateQRCode();
    }
});

function generateQRCode() {
    var inputText = document.getElementById("qr-input").value;
    if (inputText) {
        var qrCodeContainer = document.getElementById("qr-code");
        qrCodeContainer.innerHTML = ""; // Clear previous QR code
        new QRCode(qrCodeContainer, inputText);
        addRecentQRCode(inputText);

        // Show export buttons
        document.getElementById("export-png").hidden = false;
        document.getElementById("export-pdf").hidden = false;
        document.getElementById("copy-to-clipboard").hidden = false;
    }
}

function getCurrentTime() {
    var now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "_" + now.getHours() + "-" + now.getMinutes();
}

function exportToPNG(inputText) {
    var qrCodeContainer = document.getElementById("qr-code");
    var exportTime = getCurrentTime();
    html2canvas(qrCodeContainer).then(function(canvas) {
        var link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `qr-code-${inputText}-${exportTime}.png`;
        link.click();
        addRecentQRCode(inputText);
    });
}

function exportToPDF(inputText) {
    var qrCodeContainer = document.getElementById("qr-code");
    var exportTime = getCurrentTime();
    html2canvas(qrCodeContainer).then(function(canvas) {
        var imgData = canvas.toDataURL("image/png");
        var pdf = new window.jsPDF();
        pdf.addImage(imgData, 'PNG', 10, 10);
        pdf.save(`qr-code-${inputText}-${exportTime}.pdf`);
        addRecentQRCode(inputText);
    });
}

document.getElementById("export-png").addEventListener("click", function() {
    var inputText = document.getElementById("qr-input").value;
    exportToPNG(inputText);
});

document.getElementById("export-pdf").addEventListener("click", function() {
    var inputText = document.getElementById("qr-input").value;
    exportToPDF(inputText);
});

document.getElementById("copy-to-clipboard").addEventListener("click", function () {
    var qrCodeContainer = document.getElementById("qr-code");
    
    html2canvas(qrCodeContainer).then(canvas => {
        canvas.toBlob(blob => {
            if (!blob) {
                console.error("Failed to create image blob.");
                return;
            }

            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
                showToast("QR code copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy image: ", err);
            });
        }, "image/png");
    }).catch(err => {
        console.error("html2canvas failed: ", err);
    });
});

function showToast(message) {
    var toast = document.getElementById("toast");
    var toastMessage = document.getElementById("toast-message");

    toastMessage.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}

document.getElementById("close-toast").addEventListener("click", function () {
    document.getElementById("toast").classList.remove("show");
});

function addRecentQRCode(inputText) {
    var recentQRCodes = getRecentQRCodes();
    if (!recentQRCodes.includes(inputText)) {
        recentQRCodes.push(inputText);
        setRecentQRCodes(recentQRCodes);
        renderRecentQRCodes();
    }
}

function getRecentQRCodes() {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split("=");
        if (cookie[0] === "recentQRCodes") {
            return JSON.parse(decodeURIComponent(cookie[1]));
        }
    }
    return [];
}

function setRecentQRCodes(recentQRCodes) {
    document.cookie = "recentQRCodes=" + encodeURIComponent(JSON.stringify(recentQRCodes)) + "; path=/";
}

function deleteRecentQRCode(inputText) {
    var recentQRCodes = getRecentQRCodes();
    var index = recentQRCodes.indexOf(inputText);
    if (index !== -1) {
        recentQRCodes.splice(index, 1);
        setRecentQRCodes(recentQRCodes);
        renderRecentQRCodes();
    }
}

function renderRecentQRCodes() {
    var recentQRCodes = getRecentQRCodes();
    var recentList = document.getElementById("recent-list");
    recentList.innerHTML = "";
    recentQRCodes.forEach(function(inputText) {
        var listItem = document.createElement("li");
        listItem.textContent = inputText;

        var exportPNGButton = document.createElement("button");
        exportPNGButton.textContent = "Export PNG";
        exportPNGButton.addEventListener("click", function() {
            exportToPNG(inputText);
        });

        var exportPDFButton = document.createElement("button");
        exportPDFButton.textContent = "Export PDF";
        exportPDFButton.addEventListener("click", function() {
            exportToPDF(inputText);
        });

        var deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.addEventListener("click", function() {
            deleteRecentQRCode(inputText);
        });

        listItem.appendChild(exportPNGButton);
        listItem.appendChild(exportPDFButton);
        listItem.appendChild(deleteButton);
        recentList.appendChild(listItem);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("qr-input").focus();
    renderRecentQRCodes();
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("qr-input").value = ""; // Clear input field on page load
});
