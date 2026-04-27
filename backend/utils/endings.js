// Shared logic for the four endings, used by both polls.updatePoll (when
// auto-advancing after a gift-shop dispatch) and sections.readCurrentSection
// (when concatenating ending slides into the closed-poll response).

// Tags that the gift-shop algorithm can dispatch to. Must match the tag values
// on the corresponding passages in script-v2.json.
const ENDING_POLL_TAGS = new Set(['destroy', 'turn-off', 'become-artist', 'studying'])

// Pick which ending fires from accumulated session emotions. Mirrors the EJS
// template at the bottom of the gift-shop passage.
const pickEnding = ({ angry = 0, afraid = 0, comforted = 0, independent = 0 } = {}) => {
  if (angry + afraid > comforted) {
    return angry > afraid ? 'destroy' : 'turn-off'
  }
  return independent ? 'become-artist' : 'studying'
}

module.exports = {
  ENDING_POLL_TAGS,
  pickEnding
}
