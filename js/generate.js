document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("qr-input").value = ""; // Clear input field on page load
    renderCreateHistory();
});

document.getElementById("qr-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        generateQRCode();
    }
});

function generateQRCode() {
    const input = document.getElementById("qr-input");
    const text = input.value.trim();

    const qrCodeContainer = document.getElementById("qr-code");
    qrCodeContainer.innerHTML = ""; // Clear previous QR code

    new QRCode(qrCodeContainer, {
        text: text,
        width: 200,
        height: 200
    });

    document.getElementById("export-png").hidden = false;
    document.getElementById("export-pdf").hidden = false;
    document.getElementById("copy-to-clipboard").hidden = false;

    addCreateHistory(text);
}

function getCurrentTime() {
    const now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "_" + now.getHours() + "-" + now.getMinutes();
}

function exportToPNG(inputText) {
    const qrCanvas = document.querySelector('#qr-code canvas');
    const exportTime = getCurrentTime();

    if (!qrCanvas) {
        console.error("QR canvas not found");
        return;
    }

    const link = document.createElement("a");
    link.href = qrCanvas.toDataURL("image/png");
    link.download = `qr-code-${inputText}-${exportTime}.png`;
    link.click();
}

function exportToPDF(inputText) {
    const qrCanvas = document.querySelector('#qr-code canvas');
    const exportTime = getCurrentTime();

    if (!qrCanvas) {
        console.error("QR canvas not found");
        return;
    }

    const imgData = qrCanvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Insert at (10,10) with 100x100 size in PDF units
    pdf.addImage(imgData, 'PNG', 10, 10, 100, 100);
    pdf.save(`qr-code-${inputText}-${exportTime}.pdf`);
}

document.getElementById("export-png").addEventListener("click", function () {
    const inputText = document.getElementById("qr-input").value;
    exportToPNG(inputText);
});

document.getElementById("export-pdf").addEventListener("click", function () {
    const inputText = document.getElementById("qr-input").value;
    exportToPDF(inputText);
});

document.getElementById("copy-to-clipboard").addEventListener("click", function () {
    const qrCanvas = document.querySelector('#qr-code canvas');

    if (!qrCanvas) {
        console.error("QR canvas not found");
        return;
    }

    qrCanvas.toBlob(blob => {
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

function addCreateHistory(text) {
    let creates = JSON.parse(localStorage.getItem('createHistory') || "[]");

    const alreadyExists = creates.some(entry => entry.text === text);
    if (!alreadyExists) {
        creates.push({
            text,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('createHistory', JSON.stringify(creates));
        renderCreateHistory();
    }
}

function renderCreateHistory() {
    const creates = JSON.parse(localStorage.getItem('createHistory') || "[]");
    const ul = document.getElementById('create-history');
    ul.innerHTML = '';

    creates.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            <i class="fa-solid fa-qrcode" style="margin-right: 8px;"></i>
            <a href="${entry.text}" target="_blank">${entry.text}</a>
            <small>(${new Date(entry.timestamp).toLocaleString()})</small>
        `;
        ul.appendChild(li);
    });
}
