// Build a restructured sectioned.json where each top-level section contains
// all slides from a vote destination through to the next question/vote point.
// This minimizes API calls by making each section self-contained.

const path = require('path')
const script = require('./script.json')
const sections = require('./sectioned.json')

// Build a lookup from tag -> passage
const tagToPassage = {}
script.passages.forEach(p => {
  if (p.tags && p.tags[0]) {
    tagToPassage[p.tags[0]] = p
  }
})

// Build a lookup from pid -> passage
const pidToPassage = {}
script.passages.forEach(p => {
  pidToPassage[p.pid] = p
})

// Follow single-link chains from a given tag, collecting all tags in order,
// until we hit a passage with multiple links (a question/vote), no links (terminal),
// or a special tag like gift-shop
function followChain(startTag) {
  const chain = [startTag]
  let current = tagToPassage[startTag]

  while (current && current.links && current.links.length === 1) {
    const nextPid = current.links[0].pid
    const nextPassage = pidToPassage[nextPid]
    if (!nextPassage || !nextPassage.tags || !nextPassage.tags[0]) break
    const nextTag = nextPassage.tags[0]
    chain.push(nextTag)
    current = nextPassage
  }

  return chain
}

// Find all tags that are vote destinations (appear as pollItem tags)
// These are the tags the frontend will request after a vote resolves
function findVoteDestinations() {
  const destinations = new Set()

  // The start tag is always needed
  destinations.add('start')

  script.passages.forEach(p => {
    // Passages with multiple links are vote/question points
    // Their link destinations are vote destinations
    if (p.links && p.links.length > 1) {
      p.links.forEach(link => {
        const dest = pidToPassage[link.pid]
        if (dest && dest.tags && dest.tags[0]) {
          destinations.add(dest.tags[0])
        }
      })
    }
  })

  // Also add the gift-shop conditional destinations
  destinations.add('destroy-humans')
  destinations.add('keep-studying')
  destinations.add('turn-off')
  destinations.add('become-artist')

  return destinations
}

// Build the restructured sections
const destinations = findVoteDestinations()
const restructured = {}

console.log('Vote destinations:', [...destinations].sort().join(', '))
console.log('')

destinations.forEach(tag => {
  const chain = followChain(tag)
  console.log(`${tag}: ${chain.join(' -> ')}`)

  // Concatenate all slide arrays from the chain
  const slides = []
  chain.forEach(t => {
    if (sections[t] && sections[t].slides) {
      slides.push(...sections[t].slides)
    } else {
      console.warn(`  WARNING: no section data for tag "${t}"`)
    }
  })

  restructured[tag] = slides
})

// Verify each section ends with a question or is terminal
console.log('')
console.log('--- Validation ---')
Object.entries(restructured).forEach(([tag, slides]) => {
  const lastSlide = slides[slides.length - 1]
  const lastType = lastSlide ? lastSlide.type : 'EMPTY'
  const isTerminal = ['destroy-humans', 'keep-studying', 'turn-off'].includes(tag)
  const endsWithGiftShop = followChain(tag).includes('gift-shop')

  if (lastType === 'question') {
    console.log(`  ${tag}: OK (ends with question, ${slides.length} slides)`)
  } else if (isTerminal) {
    console.log(`  ${tag}: OK (terminal section, ${slides.length} slides)`)
  } else if (endsWithGiftShop) {
    console.log(`  ${tag}: OK (ends at gift-shop auto-branch, ${slides.length} slides)`)
  } else {
    console.log(`  ${tag}: NOTE - ends with type "${lastType}" (${slides.length} slides)`)
  }
})

// Write output
const fs = require('fs')
const outPath = path.resolve(__dirname, 'sectioned-restructured.json')
fs.writeFileSync(outPath, JSON.stringify(restructured, null, 2) + '\n')
console.log(`\nWrote ${outPath} with ${Object.keys(restructured).length} sections`)
