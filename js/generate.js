document.addEventListener("DOMContentLoaded", function () {
    // Initialize
    const input = document.getElementById("qr-input");
    const clearBtn = document.getElementById("clear-input");

    // Clear input field on page load
    input.value = "";
    renderCreateHistory();

    // Event listener for the Enter key to trigger QR code generation
    input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            generateQRCode();
        }
    });

    // Event listener for clearing the input field
    clearBtn.addEventListener("click", function () {
        input.value = "";
        input.focus();
        toggleClearButton();
    });

    // Toggle visibility of the clear button
    function toggleClearButton() {
        if (input.value.trim() === "") {
            clearBtn.classList.add("hidden");
        } else {
            clearBtn.classList.remove("hidden");
        }
    }

    toggleClearButton(); // Run on page load

    // Add event listener to input for real-time updates
    input.addEventListener('input', toggleClearButton);
});


// Generate QR code
function generateQRCode() {
    let qrInput = document.getElementById('qr-input').value.trim();

    // Only add https:// if no protocol is present
    if (
        !qrInput.startsWith('http://') &&
        !qrInput.startsWith('https://')
    ) {
        qrInput = 'https://' + qrInput;
    }

    // Clear any previous QR code
    const qrCodeContainer = document.getElementById("qr-code");
    qrCodeContainer.innerHTML = ""; 

    // Ensure QR code text isn't empty
    if (qrInput === "") {
        alert("Please enter a valid text for the QR code!");
        return;
    }

    // Generate the QR code with the corrected URL
    new QRCode(qrCodeContainer, {
        text: qrInput,   // Use qrInput as the URL or text
        width: 200,
        height: 200
    });

    document.getElementById('qr-input').blur();

    // Show the export options (PNG, PDF, Clipboard)
    document.getElementById("export-png").hidden = false;
    document.getElementById("export-pdf").hidden = false;
    document.getElementById("copy-to-clipboard").hidden = false;
    document.getElementById("go-to-link").hidden = false;

    // Set the href and click handler for the "Go to Link" button
    const goToLinkBtn = document.getElementById("go-to-link");
    goToLinkBtn.href = qrInput;
    goToLinkBtn.onclick = function (e) {
        // Open the link in a new tab
        window.open(qrInput, "_blank");
        e.preventDefault();
    };

    // Save the creation to history (if necessary)
    addCreateHistory(qrInput);
}


// Get current time formatted for file name
function getCurrentTime() {
    const now = new Date();
    return (now.getMonth() + 1) + "-" + now.getDate() + "_" + now.getHours();
}

// Export QR code as PNG
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

// Export QR code as PDF
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

// Export to PNG when clicked
document.getElementById("export-png").addEventListener("click", function () {
    const inputText = document.getElementById("qr-input").value;
    exportToPNG(inputText);
});

// Export to PDF when clicked
document.getElementById("export-pdf").addEventListener("click", function () {
    const inputText = document.getElementById("qr-input").value;
    exportToPDF(inputText);
});

// Add history of QR codes generated
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

// Render the QR creation history
function renderCreateHistory() {
    const creates = JSON.parse(localStorage.getItem('createHistory') || "[]");
    const ul = document.getElementById('create-history');
    ul.innerHTML = '';

    creates.forEach((entry, index) => {
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

        // Add copy functionality
        const copyBtn = li.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                console.log("Copy clicked:", entry.text); // 🔍 Debug log
                navigator.clipboard.writeText(entry.text).then(() => {
                    showToast("Copied to clipboard!");
                }).catch(() => {
                    showToast("Failed to copy.");
                });
            });
        }

        // Add delete functionality
        const deleteBtn = li.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deleteHistoryEntry(index);
            });
        }
    });
}

// Delete an entry from history
function deleteHistoryEntry(index) {
    let creates = JSON.parse(localStorage.getItem('createHistory') || "[]");
    creates.splice(index, 1);
    localStorage.setItem('createHistory', JSON.stringify(creates));
    renderCreateHistory();
}

// Show toast message
function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");

    toastMessage.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}

// Clipboard copy for the QR code image
document.getElementById("copy-to-clipboard").addEventListener("click", function () {
    const qrCanvas = document.querySelector('#qr-code canvas');

    if (!qrCanvas) {
        console.error("QR canvas not found");
        return;
    }

    console.log("QR Canvas found. Creating blob...");

    qrCanvas.toBlob(blob => {
        if (!blob) {
            console.error("Failed to create image blob.");
            return;
        }

        console.log("Blob created successfully: ", blob);

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
