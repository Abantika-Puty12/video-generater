const googleTTS = require('google-tts-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Generates TTS audio for a given text.
 * @param {string} text - The text to speak
 * @param {string} sessionId - ID for this generation
 * @param {number} sceneIndex - Index of the scene
 * @returns {Promise<string>} Path to the generated audio file
 */
async function generateAudio(text, sessionId, sceneIndex) {
    try {
        // We use googleTTS.getAudioUrl to get the URL, then download it
        const url = googleTTS.getAudioUrl(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
        });

        const audioPath = path.join(__dirname, `../uploads/audio_${sessionId}_${sceneIndex}.mp3`);

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(audioPath);
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) resolve(audioPath);
            });
        });
    } catch (err) {
        console.error('Error in TTS:', err);
        throw err;
    }
}

module.exports = { generateAudio };
