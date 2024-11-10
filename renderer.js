const secureButton = document.getElementById("secureButton");
const securePassword = document.getElementById("securePassword");
const securePDFDisplay = document.getElementById("securePDFDisplay");

const removePasswordButton = document.getElementById("removePasswordButton");
const removePasswordField = document.getElementById("removePasswordField");
const removePasswordPDFDisplay = document.getElementById(
  "removePasswordPDFDisplay"
);

const pdfList = document.getElementById("pdfList");
const addPDFButton = document.getElementById("addPDFButton");
const mergeButton = document.getElementById("mergeButton");
const sidebarOptions = document.querySelectorAll(".sidebar-option");
const toolContents = document.querySelectorAll(".tool-content");
let selectedPDFs = [];
let securePDFPath = null;
let removePasswordPDFPath = null;

sidebarOptions.forEach((option) => {
  option.addEventListener("click", () => {
    if (option.classList.contains("active")) {
      return;
    }

    sidebarOptions.forEach((opt) => opt.classList.remove("active"));
    toolContents.forEach((content) => content.classList.remove("active"));

    option.classList.add("active");
    const tool = option.getAttribute("data-tool");
    document.getElementById(`${tool}Tool`).classList.add("active");

    selectedPDFs = [];

    pdfList.innerHTML = "";
    securePDFDisplay.innerHTML = "";
    removePasswordPDFDisplay.innerHTML = "";

    securePassword.classList.add("hidden");
    removePasswordField.classList.add("hidden");
  });
});

addPDFButton.addEventListener("click", async () => {
  const filePaths = await window.electronAPI.selectPDF();
  if (filePaths && filePaths.length) {
    filePaths.forEach((filePath) => addPDF(filePath));
  }
});

mergeButton.addEventListener("click", async () => {
  if (selectedPDFs.length > 1) {
    const filePaths = selectedPDFs.map((pdf) => pdf.filePath);
    const outputPath = await window.electronAPI.mergePDFs(filePaths);
    alert(`PDFs merged! File saved to: ${outputPath}`);
  } else {
    alert("Please select at least two PDFs to merge.");
  }
});

function addPDF(filePath) {
  const fileName = filePath.split(/[/\\]/).pop();
  selectedPDFs.push({ filePath, fileName });

  updatePDFList();
}

function updatePDFList() {
  pdfList.innerHTML = "";
  selectedPDFs.forEach((pdf, index) => {
    const pdfItem = document.createElement("div");
    pdfItem.classList.add("pdf-card");
    pdfItem.draggable = true;

    const pdfImage = document.createElement("div");
    pdfImage.classList.add("pdf-image");
    pdfImage.textContent = "📄";

    const pdfName = document.createElement("div");
    pdfName.classList.add("pdf-name");
    pdfName.textContent = pdf.fileName;

    pdfItem.appendChild(pdfImage);
    pdfItem.appendChild(pdfName);

    pdfItem.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
    });

    pdfItem.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    pdfItem.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData("text"), 10);
      const droppedIndex = index;

      [selectedPDFs[draggedIndex], selectedPDFs[droppedIndex]] = [
        selectedPDFs[droppedIndex],
        selectedPDFs[draggedIndex],
      ];

      updatePDFList();
    });

    pdfList.appendChild(pdfItem);
  });
}

function displayPDF(file, displayElement) {
  displayElement.innerHTML = "";

  const pdfCard = document.createElement("div");
  pdfCard.classList.add("pdf-card");

  const pdfImage = document.createElement("div");
  pdfImage.classList.add("pdf-image");
  pdfImage.textContent = "📄";

  const pdfName = document.createElement("div");
  pdfName.classList.add("pdf-name");
  pdfName.textContent = file.name;

  pdfCard.appendChild(pdfImage);
  pdfCard.appendChild(pdfName);

  displayElement.appendChild(pdfCard);
}

document
  .getElementById("selectSecurePDFButton")
  .addEventListener("click", async () => {
    securePDFPath = await window.electronAPI.selectSinglePDF();
    if (securePDFPath) {
      displayPDF(
        { name: securePDFPath.split(/[/\\]/).pop(), path: securePDFPath },
        securePDFDisplay
      );
      securePassword.classList.remove("hidden"); // Show password field
    } else {
      securePassword.classList.add("hidden"); // Hide password field
    }
    updateButtonLabel(
      document.getElementById("selectSecurePDFButton"),
      securePDFPath
    );
  });

document
  .getElementById("selectRemovePasswordPDFButton")
  .addEventListener("click", async () => {
    removePasswordPDFPath = await window.electronAPI.selectSinglePDF();
    if (removePasswordPDFPath) {
      displayPDF(
        {
          name: removePasswordPDFPath.split(/[/\\]/).pop(),
          path: removePasswordPDFPath,
        },
        removePasswordPDFDisplay
      );
      removePasswordField.classList.remove("hidden"); // Show password field
    } else {
      removePasswordField.classList.add("hidden"); // Hide password field
    }
    updateButtonLabel(
      document.getElementById("selectRemovePasswordPDFButton"),
      removePasswordPDFPath
    );
  });

secureButton.addEventListener("click", async () => {
  if (securePDFPath) {
    const password = securePassword.value;
    const outputPath = await window.electronAPI.securePDF(
      securePDFPath,
      password
    );
    alert(`Secured PDF saved to: ${outputPath}`);
  } else {
    alert("Please select a PDF to secure.");
  }
});

document
  .getElementById("selectRemovePasswordPDFButton")
  .addEventListener("click", async () => {
    removePasswordPDFPath = await window.electronAPI.selectSinglePDF();
    if (removePasswordPDFPath) {
      displayPDF(
        {
          name: removePasswordPDFPath.split(/[/\\]/).pop(),
          path: removePasswordPDFPath,
        },
        removePasswordPDFDisplay
      );
    }
    updateButtonLabel(
      document.getElementById("selectRemovePasswordPDFButton"),
      removePasswordPDFPath
    );
  });

removePasswordButton.addEventListener("click", async () => {
  if (removePasswordPDFPath) {
    const password = removePasswordField.value;
    const outputPath = await window.electronAPI.removePassword(
      removePasswordPDFPath,
      password
    );
    alert(`Password removed, file saved to: ${outputPath}`);
  } else {
    alert("Please select a PDF to remove the password.");
  }
});

function updateButtonLabel(button, file) {
  button.textContent = file ? "Replace PDF" : "Select PDF";
}
