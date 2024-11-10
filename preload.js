const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectPDF: () => ipcRenderer.invoke('select-pdf'),
  selectSinglePDF: () => ipcRenderer.invoke('select-single-pdf'),
  mergePDFs: (filePaths) => ipcRenderer.invoke('merge-pdfs', filePaths),
  getPdfPreview: (filePath) => ipcRenderer.invoke('get-pdf-preview', filePath),
  securePDF: (filePath, password) => ipcRenderer.invoke('secure-pdf', filePath, password),
  removePassword: (filePath, password) => ipcRenderer.invoke('remove-password', filePath, password),
  convertPDFToImage: (filePath) => ipcRenderer.invoke('convert-pdf-to-image', filePath),
  convertImageToPDF: (imagePaths) => ipcRenderer.invoke('convert-image-to-pdf', imagePaths),
});