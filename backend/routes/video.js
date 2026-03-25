const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { parseStory } = require('../services/storyProcessor');
const { generateAudio } = require('../services/ttsService');
const { createSceneVideo, stitchVideos } = require('../services/videoService');
const axios = require('axios');

const router = express.Router();

// Setup Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.post('/create-video', upload.array('images'), async (req, res, next) => {
    try {
        const { story } = req.body;
        const images = req.files;

        if (!story || typeof story !== 'string') {
            return res.status(400).json({ error: 'Story text is required.' });
        }
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'At least one image is required.' });
        }

        // 1. Process Story
        const scenes = parseStory(story);
        if (scenes.length === 0) {
            return res.status(400).json({ error: 'Could not parse scenes from story.' });
        }

        const sessionId = uuidv4();
        const sceneVideos = [];

        // Distribute images across scenes (repeat if not enough)
        for (let i = 0; i < scenes.length; i++) {
            const sceneText = scenes[i];
            const imagePath = images[i % images.length].path; // Cycle through images

            // 2. TTS
            console.log(`Generating audio for scene ${i + 1}: ${sceneText}`);
            const audioPath = await generateAudio(sceneText, sessionId, i);

            // 3. Image -> Video + Audio sync
            console.log(`Generating video for scene ${i + 1}`);
            const sceneVideoPath = await createSceneVideo(imagePath, audioPath, sessionId, i);
            sceneVideos.push(sceneVideoPath);
        }

        // 4. Stitch Videos
        console.log(`Stitching final video from ${sceneVideos.length} scenes...`);
        const finalVideoPath = await stitchVideos(sceneVideos, sessionId);
        const finalVideoUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(finalVideoPath)}`;

        res.json({
            success: true,
            videoUrl: finalVideoUrl,
            message: 'Video generated successfully!'
        });
    } catch (error) {
        next(error);
    }
});

router.post('/generate-image', async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const fullPrompt = `${prompt}, cute 3d cartoon style, vibrant colors, magical, high quality, masterpiece`;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1920&height=1080&nologo=true`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (err) {
        console.error('Image generation error:', err.message);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

module.exports = router;
