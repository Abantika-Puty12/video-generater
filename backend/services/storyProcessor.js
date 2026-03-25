function parseStory(storyText) {
    if (!storyText) return [];

    // Split by common sentence terminators (. ! ?)
    const regex = /[^.!?]+[.!?]*/g;
    const matches = storyText.match(regex);

    if (!matches) {
        return [storyText.trim()];
    }

    // Clean up sentences
    return matches
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

module.exports = { parseStory };
