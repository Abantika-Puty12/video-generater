import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

const App = () => {
  const [story, setStory] = useState('');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleImageUpload = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...selectedFiles]);
    }
  };

  const clearImages = () => setImages([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!story.trim() || images.length === 0) {
      setError('Please provide a story and at least one image.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setVideoUrl(null);

    const formData = new FormData();
    formData.append('story', story);
    images.forEach((img) => formData.append('images', img));

    try {
      const response = await axios.post('http://localhost:5000/api/create-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data && response.data.videoUrl) {
        setVideoUrl(response.data.videoUrl);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setImages((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = "AI_Cartoon_Video.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed", error);
      alert("Download failed. You can also try right-clicking the video and selecting 'Save Video As...'");
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const blob = await response.blob();
      const file = new File([blob], `ai_scene_${Date.now()}.jpg`, { type: 'image/jpeg' });

      setImages((prev) => [...prev, file]);
      setImagePrompt('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate AI image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="glass-panel">
      <h1>AI Cartoon Maker</h1>
      <p className="subtitle">Transform your story and images into a magical video.</p>

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      {!videoUrl && !isGenerating && (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="story">Your Story</label>
            <textarea
              id="story"
              placeholder="Once upon a time in a magical forest... (Separate sentences with periods to create scenes)"
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Upload Images for Scenes</label>
            <div
              className="dropzone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <div className="icon">📁</div>
              <p>Click or drag and drop images here</p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>

            {images.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {images.length} file(s) selected.{' '}
                  <span style={{ color: 'var(--accent-color)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); clearImages(); }}>Clear</span>
                </p>
                <div className="image-previews">
                  {images.map((img, idx) => (
                    <img key={idx} src={URL.createObjectURL(img)} alt={`preview-${idx}`} className="image-preview" />
                  ))}
                </div>
              </div>
            )}


          </div>

          <button type="submit" className="primary-btn" disabled={!story || images.length === 0}>
            ✨ Create Magic Video
          </button>
        </form>
      )}

      {isGenerating && (
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>Generating your masterpiece...</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            Applying AI voice and stitching scenes together.
          </p>
        </div>
      )}

      {videoUrl && (
        <div className="video-result">
          <h3>🎉 Your Video is Ready!</h3>
          <video controls src={videoUrl} autoPlay loop></video>
          <div className="video-actions">
            <button className="secondary-btn" onClick={() => handleDownload(videoUrl)}>
              ⬇ Download
            </button>
            <button className="secondary-btn" onClick={() => { setVideoUrl(null); setStory(''); clearImages(); }}>
              🔄 Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
