import { extractText } from './textExtractor'

export interface ExtractedFact {
  id: string
  predicate: string
  subject: string
  date: string | null
  source: string
  confidence: 'high' | 'medium' | 'low'
  status: 'asserted' | 'verified' | 'disputed'
  category: string
}

export interface ForensicReport {
  documentName: string
  documentHash: string
  ingestDate: string
  wordCount: number
  summary: string
  facts: ExtractedFact[]
  chronology: ExtractedFact[]
  contradictions: { factA: string; factB: string; explanation: string }[]
  legalReferences: { text: string; type: string }[]
  entities: { name: string; type: string; mentions: number }[]
  auditStatus: 'pass' | 'warnings' | 'fail'
  warnings: string[]
}

const months: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
}

const datePatterns = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
  /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})\b/gi,
]

const entityPatterns = [
  { regex: /\b(Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/g, type: 'person' },
  { regex: /\b([A-Z][a-zA-Z]+\s+(?:Ltd|Limited|PLC|LLP|Inc|Corp|Bank))\b/g, type: 'organisation' },
  { regex: /\b(Claimant|Defendant|Appellant|Respondent)\b/gi, type: 'party' },
  { regex: /\b(Financial Ombudsman Service|FCA|ICO|CPS|MoJ)\b/gi, type: 'regulator' },
]

const legalPatterns = [
  { regex: /\bConsumer Rights Act 2015\b/gi, type: 'statute' },
  { regex: /\bEquality Act 2010\b/gi, type: 'statute' },
  { regex: /\bData Protection Act 2018\b/gi, type: 'statute' },
  { regex: /\bUK GDPR\b/gi, type: 'regulation' },
  { regex: /\bCPR Part \d+\b/gi, type: 'procedure' },
  { regex: /\bsubject access request\b/gi, type: 'obligation' },
  { regex: /\bfinal response\b/gi, type: 'deadline' },
  { regex: /\bbreach of duty\b/gi, type: 'cause_of_action' },
  { regex: /\bdamages\b/gi, type: 'remedy' },
  { regex: /\bcompensation\b/gi, type: 'remedy' },
  { regex: /\bOmbudsman\b/gi, type: 'regulator' },
  { regex: /\bFCA\b/gi, type: 'regulator' },
  { regex: /\bICO\b/gi, type: 'regulator' },
  { regex: /\bstatement of truth\b/gi, type: 'formality' },
  { regex: /\bwitness statement\b/gi, type: 'document_type' },
  { regex: /\bDISP\b/gi, type: 'regulator_rule' },
  { regex: /\bConsumer Duty\b/gi, type: 'regulator_rule' },
]

const factPatterns = [
  { regex: /\bcomplaint\s+(?:was\s+)?(?:sent|made|filed|received|lodged)\b/gi, predicate: 'complaint_filed', category: 'event' },
  { regex: /\baccount\s+(?:was\s+)?(?:restricted|frozen|blocked|suspended|closed)\b/gi, predicate: 'account_restriction', category: 'event' },
  { regex: /\bsubject access request\s+(?:was\s+)?(?:submitted|sent|filed|made)\b/gi, predicate: 'sar_submitted', category: 'obligation' },
  { regex: /\bSAR\s+(?:was\s+)?(?:responded|response|reply answered)\b/gi, predicate: 'sar_responded', category: 'event' },
  { regex: /\bno\s+further\s+action\b/gi, predicate: 'admission_no_further_action', category: 'admission' },
  { regex: /\bachnowledged?\b/gi, predicate: 'acknowledgment_received', category: 'event' },
  { regex: /\bfinal response\b/gi, predicate: 'final_response_issued', category: 'event' },
  { regex: /\bpre[-\s]?action|letter before action\b/gi, predicate: 'pre_action_letter', category: 'communication' },
  { regex: /\btelephone call|phone call|spoke to|called\b/gi, predicate: 'telephone_call', category: 'event' },
  { regex: /\bescalat|referred\s+(?:to|up)\b/gi, predicate: 'complaint_escalated', category: 'event' },
  { regex: /\bbreach of|failed to|did not comply|refused to\b/gi, predicate: 'breach_alleged', category: 'contradiction' },
  { regex: /\bapolog|compensat|goodwill\s+gesture\b/gi, predicate: 'compensation_offered', category: 'event' },
  { regex: /\bdeadline|time limit|within\s+\d+\s+(?:day|month)\b/gi, predicate: 'deadline_specified', category: 'obligation' },
  { regex: /\bdetermin|decided?\s+(?:that|to)|resolved?\s+(?:that|to)\b/gi, predicate: 'determination_made', category: 'event' },
  { regex: /\breview|investigate|inquiry|enquiry\b/gi, predicate: 'review_conducted', category: 'event' },
  { regex: /\brecord|recording|transcript|minutes\b/gi, predicate: 'record_referenced', category: 'event' },
]

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(16).padStart(64, '0')
}

function parseDate(match: RegExpExecArray): string | null {
  try {
    const d = match[1]?.padStart(2, '0')
    const m = months[match[2]?.toLowerCase()] || match[2]?.padStart(2, '0')
    const y = match[3]?.length === 2 ? `20${match[3]}` : match[3]
    if (d && m && y) return `${y}-${m}-${d}`
  } catch { /* ignore */ }
  return null
}

export async function analyseDocument(file: File): Promise<ForensicReport> {
  const text = await extractText(file)
  const clean = text.replace(/\s+/g, ' ').trim()
  const words = clean.split(/\s+/).length

  if (words < 10) {
    throw new Error('Document contains too little text to analyse (less than 10 words)')
  }

  // 1. Extract dates
  const datesFound: { iso: string; raw: string; idx: number }[] = []
  for (const regex of datePatterns) {
    let m: RegExpExecArray | null
    while ((m = regex.exec(clean)) !== null) {
      const iso = parseDate(m)
      if (iso && !datesFound.some((d) => d.iso === iso)) {
        datesFound.push({ iso, raw: m[0], idx: m.index })
      }
    }
    regex.lastIndex = 0
  }

  // 2. Extract entities
  const entityMap = new Map<string, { type: string; positions: number[] }>()
  for (const { regex, type } of entityPatterns) {
    let m: RegExpExecArray | null
    while ((m = regex.exec(clean)) !== null) {
      const name = (m[2] || m[1] || m[0]).trim()
      if (name.length < 3) continue
      const key = name.toLowerCase()
      const existing = entityMap.get(key)
      if (existing) existing.positions.push(m.index)
      else entityMap.set(key, { type, positions: [m.index] })
    }
    regex.lastIndex = 0
  }

  // 3. Extract legal refs
  const legalRefs: { text: string; type: string }[] = []
  for (const { regex, type } of legalPatterns) {
    let m: RegExpExecArray | null
    while ((m = regex.exec(clean)) !== null) {
      if (!legalRefs.some((r) => r.text.toLowerCase() === m![0].toLowerCase())) {
        legalRefs.push({ text: m[0], type })
      }
    }
    regex.lastIndex = 0
  }

  // 4. Extract facts
  const facts: ExtractedFact[] = []
  let counter = 1
  for (const { regex, predicate, category } of factPatterns) {
    let m: RegExpExecArray | null
    while ((m = regex.exec(clean)) !== null) {
      const nearDate = datesFound.reduce(
        (best, d) => {
          const dist = Math.abs(d.idx - m!.index)
          return dist < best.dist ? { dist, date: d } : best
        },
        { dist: Infinity, date: null as (typeof datesFound)[0] | null }
      )

      const sentenceStart = Math.max(0, clean.lastIndexOf('.', m.index - 150) + 1)
      const sentenceEnd = clean.indexOf('.', m.index + 1)
      const sentence = clean.slice(sentenceStart, sentenceEnd > 0 ? sentenceEnd + 1 : m.index + 120).trim()

      const nearEntity = Array.from(entityMap.entries())
        .find(([, v]) => v.positions.some((p) => Math.abs(p - m!.index) < 400))

      facts.push({
        id: `F${String(counter++).padStart(3, '0')}`,
        predicate,
        subject: nearEntity ? nearEntity[0] : 'Unknown',
        date: nearDate.date && nearDate.dist < 600 ? nearDate.date.iso : null,
        source: sentence.length > 120 ? sentence.slice(0, 120) + '...' : sentence,
        confidence: nearDate.date && nearDate.dist < 600 ? 'high' : 'medium',
        status: category === 'admission' ? 'asserted' : category === 'contradiction' ? 'disputed' : 'verified',
        category,
      })
    }
    regex.lastIndex = 0
  }

  // 5. Chronology
  const chronology = [...facts].filter((f) => f.date).sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  // 6. Contradictions
  const contradictions: { factA: string; factB: string; explanation: string }[] = []
  const admissionFacts = facts.filter((f) => f.category === 'admission')
  const contradictionFacts = facts.filter((f) => f.category === 'contradiction')
  for (const a of admissionFacts) {
    for (const c of contradictionFacts) {
      if (a !== c) {
        contradictions.push({
          factA: `${a.id}: ${a.predicate.replace(/_/g, ' ')}`,
          factB: `${c.id}: ${c.predicate.replace(/_/g, ' ')}`,
          explanation: `Potential issue: "${a.predicate.replace(/_/g, ' ')}" coexists with "${c.predicate.replace(/_/g, ' ')}" — review whether the admission undermines the breach allegation or vice versa.`,
        })
      }
    }
  }

  // SAR timing check
  const sarSubmit = facts.find((f) => f.predicate === 'sar_submitted')
  const sarResponse = facts.find((f) => f.predicate === 'sar_responded')
  if (sarSubmit && sarResponse && sarSubmit.date && sarResponse.date) {
    const days = (new Date(sarResponse.date).getTime() - new Date(sarSubmit.date).getTime()) / (1000 * 60 * 60 * 24)
    if (days > 40) {
      contradictions.push({
        factA: `${sarSubmit.id}: SAR submitted`,
        factB: `${sarResponse.id}: SAR responded`,
        explanation: `SAR response took ${Math.round(days)} days. ICO guidance requires response within one calendar month (30 days). Potential breach of DPA 2018 / UK GDPR Article 12(3).`,
      })
    }
  }

  // 7. Warnings
  const warnings: string[] = []
  if (facts.length === 0) warnings.push('No extractable facts found — document may lack actionable content or be image-only')
  if (datesFound.length === 0) warnings.push('No dates detected — chronology cannot be constructed from this document')
  if (contradictions.length > 0) warnings.push(`${contradictions.length} issue(s) identified requiring legal review`)
  if (legalRefs.length === 0) warnings.push('No legal authorities referenced — may be informal correspondence')
  if (words < 50) warnings.push('Document is very short — analysis may be incomplete')

  // 8. Summary
  const eventCount = facts.filter((f) => f.category === 'event').length
  const admissionCount = facts.filter((f) => f.category === 'admission').length
  const obligationCount = facts.filter((f) => f.category === 'obligation').length
  const summary = `Analysed "${file.name}" (${words.toLocaleString()} words). Extracted ${facts.length} fact(s) from ${datesFound.length} date(s): ${eventCount} event(s), ${obligationCount} obligation(s), ${admissionCount} admission(s). Identified ${legalRefs.length} legal reference(s). Found ${contradictions.length} issue(s). Audit: ${warnings.length === 0 ? 'PASS' : 'WARNINGS'}.`

  return {
    documentName: file.name,
    documentHash: hashString(file.name + clean.slice(0, 500)),
    ingestDate: new Date().toISOString().split('T')[0],
    wordCount: words,
    summary,
    facts,
    chronology,
    contradictions,
    legalReferences: legalRefs,
    entities: Array.from(entityMap.entries())
      .map(([name, data]) => ({ name, type: data.type, mentions: data.positions.length }))
      .sort((a, b) => b.mentions - a.mentions),
    auditStatus: warnings.length === 0 ? 'pass' : 'warnings',
    warnings,
  }
}
