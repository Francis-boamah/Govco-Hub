const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the main directory
app.use(express.static('../'));

// API endpoint to check if file exists
app.get('/api/check-file/:courseCode', (req, res) => {
    const { courseCode } = req.params;
    const { level, semester, category } = req.query;

    let filePath = path.join(__dirname, '../pastquestions');
    
    if (level === '100') {
        filePath = path.join(filePath, `level ${level}`, `semester ${semester}`, `${courseCode}.PDF`);
    } else {
        filePath = path.join(filePath, `level ${level}`, `semester ${semester}`, category, `${courseCode}.PDF`);
    }

    const exists = fs.existsSync(filePath);
    res.json({ exists, filePath });
});

// API endpoint to download files
app.get('/api/download/:courseCode', (req, res) => {
    const { courseCode } = req.params;
    const { level, semester, category } = req.query;

    // Construct file path based on parameters
    let filePath = path.join(__dirname, '../pastquestions');
    
    if (level === '100') {
        filePath = path.join(filePath, `level ${level}`, `semester ${semester}`, `${courseCode}.PDF`);
    } else {
        filePath = path.join(filePath, `level ${level}`, `semester ${semester}`, category, `${courseCode}.PDF`);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${courseCode}.PDF"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

app.listen(PORT, () => {
    console.log(`Past Questions Server running on http://localhost:${PORT}`);
    console.log('Make sure your PDF files are in the pastquestions/ directory with the correct structure');
});

