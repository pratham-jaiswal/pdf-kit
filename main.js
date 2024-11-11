const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const HummusRecipe = require("muhammara").Recipe;
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'resources', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
      devTools: false,
    },
  });

  win.loadFile("index.html");

  const menuTemplate = [
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => win.reload(),
        },
        {
          label: "Force Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => win.webContents.reloadIgnoringCache(),
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About PDFKit",
          click: () =>
            require("electron").shell.openExternal("https://github.com/pratham-jaiswal/pdf-kit/blob/main/README.md"),
        },
        {
          label: "Report an Issue",
          click: () =>
            require("electron").shell.openExternal(
              "https://github.com/pratham-jaiswal/pdf-kit/issues"
            ),
        },
        {
          label: "License",
          click: () =>
            require("electron").shell.openExternal("https://github.com/pratham-jaiswal/pdf-kit/blob/main/LICENSE"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("select-pdf", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "PDFs", extensions: ["pdf"] }],
  });
  if (!canceled) {
    return filePaths;
  }
});

ipcMain.handle("select-single-pdf", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "PDFs", extensions: ["pdf"] }],
  });
  if (!canceled && filePaths.length === 1) {
    return filePaths[0];
  }
});

ipcMain.handle("merge-pdfs", async (_, filePaths) => {
  const mergedPdf = await PDFDocument.create();
  for (const filePath of filePaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedPdfBytes = await mergedPdf.save();
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    defaultPath: path.join(app.getPath("desktop"), "merged.pdf"),
  });

  if (!canceled && filePath) {
    fs.writeFileSync(filePath, mergedPdfBytes);
    return filePath;
  }

  return null;
});

ipcMain.handle("get-pdf-preview", async (_, filePath) => {
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  const pdfImage = await page.renderToImage({ scale: 0.5 });
  return {
    imageDataUrl: pdfImage.toDataURL(),
    dimensions: { width, height },
  };
});

ipcMain.handle("secure-pdf", async (_, filePath, password) => {
  const { canceled, filePath: outputPath } = await dialog.showSaveDialog({
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    defaultPath: path.join(app.getPath("desktop"), "secured.pdf"),
  });

  if (canceled || !outputPath) {
    return null;
  }

  try {
    const pdfRecipe = new HummusRecipe(filePath, outputPath);
    pdfRecipe.encrypt({
      userPassword: password,
      ownerPassword: password,
      userProtectionFlag: 4,
    });
    pdfRecipe.endPDF();
    return outputPath;
  } catch (error) {
    console.error("Error encrypting PDF:", error);
    throw error;
  }
});

ipcMain.handle("remove-password", async (_, filePath, password) => {
  try {
    const { canceled, filePath: outputPath } = await dialog.showSaveDialog({
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      defaultPath: path.join(app.getPath("desktop"), "decrypted.pdf"),
    });

    if (canceled || !outputPath) {
      return null;
    }

    var muhammara = require("muhammara");
    muhammara.recrypt(filePath, outputPath, { password });

    return outputPath;
  } catch (error) {
    console.error("Error removing password:", error);
    throw error;
  }
});
