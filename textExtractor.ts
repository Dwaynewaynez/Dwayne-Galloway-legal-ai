// Browser-safe text extraction — works entirely client-side
// No server needed, nothing leaves the browser

export async function extractText(file: File): Promise<string> {
  const type = file.type || ''
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  console.log('[Forensic] Processing file:', file.name, 'type:', type, 'size:', file.size)

  // TEXT FILES — direct string decode
  if (type.includes('text') || type.includes('json') || name.endsWith('.txt') || name.endsWith('.eml') || name.endsWith('.msg') || name.endsWith('.csv')) {
    console.log('[Forensic] Decoding as text...')
    const text = new TextDecoder('utf-8').decode(buffer)
    console.log('[Forensic] Text decoded:', text.length, 'chars')
    return text
  }

  // PDF FILES — extract text using PDF.js
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    console.log('[Forensic] Processing PDF...')
    return extractPdfText(buffer)
  }

  // WORD DOCUMENTS — extract from DOCX XML
  if (type.includes('word') || type.includes('officedocument') || name.endsWith('.docx') || name.endsWith('.doc')) {
    console.log('[Forensic] Processing Word document...')
    return extractWordText(buffer)
  }

  // UNKNOWN — try as text fallback
  console.log('[Forensic] Unknown type, trying text fallback...')
  try {
    const raw = new TextDecoder('utf-8').decode(buffer)
    const cleaned = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ').replace(/\s+/g, ' ')
    if (cleaned.length > 50 && /[A-Za-z]{10,}/.test(cleaned)) {
      return cleaned
    }
  } catch (e) {
    console.error('[Forensic] Text fallback failed:', e)
  }

  throw new Error(`Cannot extract text from "${file.name}". Supported: PDF, TXT, DOCX, EML.`)
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Dynamic import — only loads PDF.js when needed
    const pdfjs = await import('pdfjs-dist')

    // Set worker source (loads from CDN)
    const version = (pdfjs as any).version || '4.10.38'
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`

    console.log('[Forensic] PDF.js loaded, version:', version)

    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
    console.log('[Forensic] PDF opened, pages:', pdf.numPages)

    let text = ''
    const pageCount = Math.min(pdf.numPages, 30)

    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
        if (pageText.trim()) text += pageText + '\n'
      } catch (pageErr) {
        console.warn('[Forensic] Error on page', i, ':', pageErr)
      }
    }

    if (!text.trim()) {
      throw new Error('PDF contains no extractable text — it may be a scanned image. Try a text-based PDF.')
    }

    console.log('[Forensic] PDF text extracted:', text.length, 'chars')
    return text
  } catch (err: any) {
    console.error('[Forensic] PDF extraction failed:', err)
    // Fallback: try raw text extraction from PDF structure
    try {
      const raw = new TextDecoder('utf-8').decode(buffer)
      const textMatches = raw.match(/\(([^)]{3,500})\)/g)
      if (textMatches && textMatches.length > 5) {
        return textMatches.map((m) => m.slice(1, -1)).join(' ')
      }
    } catch { /* ignore */ }
    throw new Error(`PDF parsing failed: ${err.message || 'Unknown error'}`)
  }
}

function extractWordText(buffer: ArrayBuffer): string {
  try {
    const raw = new TextDecoder('utf-8').decode(buffer)

    // DOCX files are ZIP archives containing XML — look for text content
    const textMatches = raw.match(/<w:t>([^<]+)<\/w:t>/g)
    if (textMatches && textMatches.length > 0) {
      return textMatches.map((m) => m.replace(/<\/?w:t>/g, '')).join(' ')
    }

    // Fallback: extract printable text
    const cleaned = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ')
    const printable = cleaned.match(/[A-Za-z0-9\s.,;:!?'"()-]{10,}/g)
    if (printable && printable.length > 10) {
      return printable.join(' ')
    }

    throw new Error('Could not extract text from Word document')
  } catch (err: any) {
    throw new Error(`Word document parsing failed: ${err.message || 'Unknown error'}`)
  }
}
