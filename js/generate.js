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
        new QRCode(qrCodeContainer, {
            text: inputText,
            width: 200,
            height: 200
        });

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
    });
}

function exportToPDF(inputText) {
    var qrCodeContainer = document.getElementById("qr-code");
    var exportTime = getCurrentTime();
    
    html2canvas(qrCodeContainer).then(canvas => {
        var imgData = canvas.toDataURL("image/png");
        var { jsPDF } = window.jspdf;
        var pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 10, 10, 100, 100);
        pdf.save(`qr-code-${inputText}-${exportTime}.pdf`);
    }).catch(err => {
        console.error("Error generating PDF: ", err);
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

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("qr-input").value = ""; // Clear input field on page load
});
