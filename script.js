/* global PDFLib */

(function () {
  const fileInput = document.getElementById('file');
  const convertBtn = document.getElementById('convertBtn');
  const downloadLink = document.getElementById('downloadLink');
  const previewSection = document.getElementById('previewSection');
  const previewFrame = document.getElementById('previewFrame');
  const autoRotate = document.getElementById('autoRotate');
  const toast = document.getElementById('toast');

  let inputBytes = null;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    inputBytes = await file.arrayBuffer();
    convertBtn.disabled = false;
    downloadLink.hidden = true;
    previewSection.hidden = true;
  });

  convertBtn.addEventListener('click', async () => {
    if (!inputBytes) return;
    convertBtn.disabled = true;
    try {
      const outBytes = await convertToHalfLetter(inputBytes, {
        autoRotate: autoRotate.checked,
      });

      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const baseName = (fileInput.files && fileInput.files[0] && fileInput.files[0].name) ? fileInput.files[0].name.replace(/\.pdf$/i, '') : 'label';
      const outName = `${baseName}-half-letter.pdf`;

      downloadLink.href = url;
      downloadLink.download = outName;
      downloadLink.hidden = false;
      previewSection.hidden = false;
      previewFrame.src = url + '#view=FitH';

      // Auto-download
      setTimeout(() => downloadLink.click(), 10);
      setTimeout(() => URL.revokeObjectURL(url), 15000);

      showToast('Generated! Congrats on the sale bun!');
      fireConfetti();
    } catch (err) {
      alert('Conversion failed: ' + err.message);
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      convertBtn.disabled = false;
    }
  });

  /**
   * Convert an input PDF (containing a 4x5 shipping label) into a US Letter (8.5x11)
   * page with the label placed on the top or bottom half. Optionally duplicates on
   * both halves.
   *
   * - If autoRotate is enabled, the label page is rotated to best fit the half page.
   * - Scaling preserves aspect ratio and maximizes size inside half page margins.
   */
  async function convertToHalfLetter(inputArrayBuffer, options) {
    const { autoRotate } = options;

    const { PDFDocument, rgb, degrees } = PDFLib;

    const srcDoc = await PDFDocument.load(inputArrayBuffer);
    const outDoc = await PDFDocument.create();

    // US Letter size in points (1pt = 1/72in)
    const letterWidth = 8.5 * 72;
    const letterHeight = 11 * 72;

    // Half page height
    const halfHeight = letterHeight / 2;

    // Import the first page only (label PDFs are usually 1 page)
    const [embeddedPage] = await outDoc.embedPages([srcDoc.getPage(0)]);
    const sourceWidth = embeddedPage.width;
    const sourceHeight = embeddedPage.height;

    // Auto-rotate: ensure the longer dimension aligns with the longer target dimension
    let rotation = 0;
    if (autoRotate) {
      const targetW = letterWidth;
      const targetH = halfHeight;
      const sourceIsLandscape = sourceWidth > sourceHeight;
      const targetIsLandscape = targetW > targetH;
      if (sourceIsLandscape !== targetIsLandscape) {
        rotation = 90; // rotate clockwise for better fit
      }
    }

    // Compute scale to fit within half page with ~10% margin overall
    const marginFraction = 0.20; // leaves ~5% on each side
    const maxW = letterWidth * (1 - marginFraction);
    const maxH = halfHeight * (1 - marginFraction);
    const effectiveW = rotation % 180 === 0 ? sourceWidth : sourceHeight;
    const effectiveH = rotation % 180 === 0 ? sourceHeight : sourceWidth;
    const scale = Math.min(maxW / effectiveW, maxH / effectiveH);
    const drawWidth = sourceWidth * scale;   // dimensions before rotation
    const drawHeight = sourceHeight * scale; // dimensions before rotation
    const renderW = rotation % 180 === 0 ? drawWidth : drawHeight;
    const renderH = rotation % 180 === 0 ? drawHeight : drawWidth;
    const offsetX = (letterWidth - renderW) / 2; // center horizontally

    // Create one page output
    const page = outDoc.addPage([letterWidth, letterHeight]);

    // Helper to draw the label into a half region
    const drawHalf = (yBottom) => {
      const centerY = yBottom + (halfHeight - renderH) / 2;
      if (rotation % 180 === 0) {
        page.drawPage(embeddedPage, {
          x: offsetX,
          y: centerY,
          width: drawWidth,
          height: drawHeight,
        });
      } else {
        // When rotating 90°, we need to position using the unrotated width/height
        page.drawPage(embeddedPage, {
          x: offsetX + renderW, // anchor then rotate clockwise around bottom-left
          y: centerY,
          width: drawWidth,
          height: drawHeight,
          rotate: degrees(90),
        });
      }
    };

    // Draw on the top half (y starts at halfHeight)
    drawHalf(halfHeight);

    // Optional divider line for clarity when cutting
    page.drawRectangle({
      x: 0,
      y: halfHeight - 0.25,
      width: letterWidth,
      height: 0.5,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.6,
    });

    return await outDoc.save();
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function fireConfetti() {
    if (typeof confetti !== 'function') return;
    confetti({
      particleCount: 160,
      spread: 360,
      startVelocity: 55,
      ticks: 220,
      gravity: 0.9,
      origin: { x: 0.5, y: 0.5 },
      zIndex: 10000,
    });
  }
})();


