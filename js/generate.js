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
        // document.getElementById("export-svg").hidden = false;
        // document.getElementById("export-jpeg").hidden = false;
        // document.getElementById("export-gif").hidden = false;
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
        addRecentQRCode(inputText); // Add to recent after export
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
        addRecentQRCode(inputText); // Add to recent after export
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

document.getElementById("export-svg").addEventListener("click", function() {
    var inputText = document.getElementById("qr-input").value;
    exportToSVG(inputText);
});

document.getElementById("export-jpeg").addEventListener("click", function() {
    var inputText = document.getElementById("qr-input").value;
    exportToJPEG(inputText);
});

document.getElementById("export-gif").addEventListener("click", function() {
    var inputText = document.getElementById("qr-input").value;
    exportToGIF(inputText);
});

function exportToSVG(inputText) {
    var qrCodeContainer = document.getElementById("qr-code");
    var svgElement = qrCodeContainer.querySelector("svg");
    if (svgElement) {
        var serializer = new XMLSerializer();
        var svgData = serializer.serializeToString(svgElement);
        var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        var svgUrl = URL.createObjectURL(svgBlob);
        var link = document.createElement("a");
        link.href = svgUrl;
        link.download = `qr-code-${inputText}.svg`;
        link.click();
    }
}

function exportToJPEG(inputText) {
    var qrCodeContainer = document.getElementById("qr-code");
    var exportTime = getCurrentTime();
    html2canvas(qrCodeContainer).then(function(canvas) {
        var link = document.createElement("a");
        link.href = canvas.toDataURL("image/jpeg");
        link.download = `qr-code-${inputText}-${exportTime}.jpeg`;
        link.click();
    });
}

function exportToGIF(inputText) {
    var qrCodeContainer = document.getElementById("qr-code");
    var exportTime = getCurrentTime();
    html2canvas(qrCodeContainer).then(function(canvas) {
        var link = document.createElement("a");
        link.href = canvas.toDataURL("image/gif");
        link.download = `qr-code-${inputText}-${exportTime}.gif`;
        link.click();
    });
}
document.getElementById("copy-to-clipboard").addEventListener("click", function () {
        var inputText = document.getElementById("qr-input").value;
        if (inputText) {
            navigator.clipboard.writeText(inputText).then(function () {
                showToast("Copied to clipboard: " + inputText);
            }).catch(function (error) {
                console.error("Could not copy text: ", error);
            });
        }

    // Show toast notification
    function showToast(message) {
        var toast = document.getElementById("toast");
        var toastMessage = document.getElementById("toast-message");

        toastMessage.textContent = message;
        toast.classList.add("show");

        // Auto-hide after 3 seconds
        setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }

    // Manual close for toast
    document.getElementById("close-toast").addEventListener("click", function () {
        document.getElementById("toast").classList.remove("show");
    });
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

// Focus on the input field when the page loads
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("qr-input").focus();
    renderRecentQRCodes();
});




