require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const videoRoutes = require('./routes/video');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for serving generated videos and assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', videoRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
