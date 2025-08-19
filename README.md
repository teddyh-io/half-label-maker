Half‑Split Label PDF Converter
================================

Small static site that accepts a label PDF (e.g., 4x5 USPS) and outputs a US Letter (8.5x11) PDF with the label on one half of the page. Optionally duplicate on both halves for easy cutting.

How to use
----------
1. Open `index.html` in a modern browser.
2. Choose your label PDF.
3. Optionally enable "Duplicate label on both halves" and/or "Auto-rotate".
4. Click Convert and download the result.

Notes
-----
- Uses `pdf-lib` from a CDN; everything runs in your browser.
- All sizes are in PDF points (1 pt = 1/72 inch). Letter is 612x792 points.
- The label is centered within the half page with a small margin.


