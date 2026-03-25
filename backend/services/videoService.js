const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const path = require('path');
const fs = require('fs');

/**
 * Creates an animated video from a static image and audio clip.
 */
function createSceneVideo(imagePath, audioPath, sessionId, sceneIndex) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(__dirname, `../uploads/scene_${sessionId}_${sceneIndex}.mp4`);

        // We calculate duration dynamically if possible, or just let ffmpeg use audio length.
        // We will create a "Zoom / Pan / Ken Burns" effect, or at least scale to standard HD.
        ffmpeg()
            .input(imagePath)
            .inputOptions(['-loop 1'])
            .input(audioPath)
            .complexFilter([
                // Scale image to fit within 1920x1080 maintaining aspect ratio perfectly
                {
                    filter: 'scale',
                    options: '1920:1080:force_original_aspect_ratio=decrease',
                    inputs: '0:v',
                    outputs: 'scaled_image'
                },
                // Pad with black bars so it never cuts off parts of the image on mobile or laptop
                {
                    filter: 'pad',
                    options: '1920:1080:(ow-iw)/2:(oh-ih)/2:black',
                    inputs: 'scaled_image',
                    outputs: 'v_out'
                }
            ])
            .outputOptions([
                '-map [v_out]', // use the filtered video
                '-map 1:a',     // use the audio stream from input 1
                '-c:v libx264', // H.264 video codec
                '-tune stillimage',
                '-c:a aac',     // AAC audio codec
                '-b:a 192k',
                '-pix_fmt yuv420p',
                '-shortest'     // end the video when the shortest stream (audio) ends
            ])
            .output(outputPath)
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error(`Error generating scene video ${sceneIndex}:`, err);
                reject(err);
            })
            .run();
    });
}

/**
 * Stitches multiple mp4 files into a single final video.
 */
function stitchVideos(videoPaths, sessionId) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(__dirname, `../uploads/final_${sessionId}.mp4`);

        // To safely concatenate files of same specs, we write a intermediate text file for concat muxer
        const listPath = path.join(__dirname, `../uploads/list_${sessionId}.txt`);
        const fileContent = videoPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');

        fs.writeFileSync(listPath, fileContent);

        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions([
                '-c copy' // direct stream copy is much faster if all specs match
            ])
            .output(outputPath)
            .on('end', () => {
                // Return just the file path
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error stitching videos:', err);
                reject(err);
            })
            .run();
    });
}

module.exports = { createSceneVideo, stitchVideos };
