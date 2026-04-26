// Generate sectioned-v2.json from script-v2.json.
//
// For each tagged passage (a "section head"):
//   - Walk the chain through any untagged single-link merge passages
//   - Split each passage's text into paragraph slides (split on blank lines)
//   - Type slides as 'heading' | 'content' | 'question'
//   - Sum emotion props (and inline {{trait}}True{{/trait}} tags) across the
//     chain into a per-section emotions counter
//
// Untagged passages have no top-level entry; they only appear inside chains.
// Some content will appear in multiple sections by design (merge passages
// reached from multiple branches).

const fs = require('fs')
const path = require('path')

const SCRIPT_PATH = path.resolve(__dirname, '..', 'script-v2.json')
const OUT_PATH = path.resolve(__dirname, 'sectioned-v2.json')

const EMOTIONS = ['angry', 'afraid', 'comforted', 'independent']
const INLINE_TAG = /\{\{(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g
const CHOICE_MARKUP = /\[\[[^\]]*\]\]/g
const EJS_BLOCK = /<%[\s\S]*?%>/g

const script = JSON.parse(fs.readFileSync(SCRIPT_PATH, 'utf8'))
const pidToPassage = Object.fromEntries(script.passages.map(p => [p.pid, p]))

function uniqueNext(passage) {
  const seen = new Set()
  const out = []
  for (const l of passage.links || []) {
    if (!seen.has(l.pid)) { seen.add(l.pid); out.push(l.pid) }
  }
  return out
}

function emotionsFor(passage) {
  const out = new Set()
  for (const e of EMOTIONS) {
    if (passage.props && passage.props[e] === 'True') out.add(e)
  }
  const text = passage.text || ''
  let m
  INLINE_TAG.lastIndex = 0
  while ((m = INLINE_TAG.exec(text))) {
    if (EMOTIONS.includes(m[1]) && m[2].trim() === 'True') out.add(m[1])
  }
  return out
}

function cleanText(text) {
  return text
    .replace(INLINE_TAG, '')
    .replace(CHOICE_MARKUP, '')
    .replace(EJS_BLOCK, '')
}

function splitParagraphs(text) {
  return cleanText(text)
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

function makeSlide(type, slideText, text) {
  return {
    type,
    image: '',
    video: '',
    overlay: false,
    'slide-text': slideText,
    text
  }
}

// Walk from a section head through every single-link passage (whether tagged
// or not) until reaching a vote (multi-link) or a terminal (no links). The
// stopping passage is included in the chain so its question text is in the
// section. Tagged passages traversed mid-chain still get their own top-level
// section, so their content is intentionally duplicated.
function buildChain(head) {
  const chain = [head]
  let current = head
  while (true) {
    const nexts = uniqueNext(current)
    if (nexts.length !== 1) break
    const next = pidToPassage[nexts[0]]
    if (!next) break
    chain.push(next)
    current = next
  }
  return chain
}

const sections = {}
const sectionHeads = script.passages.filter(p => p.tags && p.tags[0])

for (const head of sectionHeads) {
  const tag = head.tags[0]
  const chain = buildChain(head)
  const finalPassage = chain[chain.length - 1]
  const finalIsQuestion = uniqueNext(finalPassage).length > 1

  const slides = []
  slides.push(makeSlide('heading', head.name, ''))

  for (let i = 0; i < chain.length; i++) {
    const p = chain[i]
    const paragraphs = splitParagraphs(p.text)
    const isLastPassage = i === chain.length - 1
    for (let j = 0; j < paragraphs.length; j++) {
      const isLastParagraph = j === paragraphs.length - 1
      const type = (isLastPassage && isLastParagraph && finalIsQuestion) ? 'question' : 'content'
      slides.push(makeSlide(type, '', paragraphs[j]))
    }
  }

  const emotions = { angry: 0, afraid: 0, comforted: 0, independent: 0 }
  for (const p of chain) {
    for (const e of emotionsFor(p)) emotions[e]++
  }

  if (sections[tag]) {
    console.warn(`WARNING: duplicate tag "${tag}" — pid ${head.pid} overrides earlier section`)
  }
  sections[tag] = { slides, emotions }
}

fs.writeFileSync(OUT_PATH, JSON.stringify(sections, null, 2) + '\n')

console.log(`Wrote ${OUT_PATH}`)
console.log(`Sections: ${Object.keys(sections).length}`)
console.log('')
console.log('--- Validation ---')
let issues = 0
for (const [tag, sec] of Object.entries(sections)) {
  const last = sec.slides[sec.slides.length - 1]
  const lastType = last ? last.type : 'EMPTY'
  const slideCount = sec.slides.length
  const emoSum = Object.values(sec.emotions).reduce((a, b) => a + b, 0)
  const emoStr = emoSum > 0
    ? Object.entries(sec.emotions).filter(([_, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(',')
    : '—'
  console.log(`  ${tag.padEnd(22)} ${slideCount} slides, ends in '${lastType}', emotions: ${emoStr}`)
  if (slideCount < 2) { console.warn(`    WARN: only ${slideCount} slide(s)`); issues++ }
}
console.log('')
console.log(issues === 0 ? 'OK — no issues' : `${issues} issue(s) flagged above`)
