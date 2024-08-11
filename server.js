const express = require('express');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const heicConvert = require('heic-convert');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

app.get('/images', async (req, res) => {
    const imgFolder = path.join(__dirname, 'public', 'img');
    try {
        const files = await readdir(imgFolder);
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp', '.tiff', '.ico', '.raw'];
        const images = [];
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (allowedExtensions.includes(ext)) {
                images.push(file);
            } else if (ext === '.heic') {
                // Convert HEIC to JPEG
                const buffer = await readFile(path.join(imgFolder, file));
                const jpegBuffer = await heicConvert({
                    buffer,
                    format: 'JPEG'
                });
                // Save the converted JPEG image
                const newFileName = file.replace('.heic', '.jpg');
                fs.writeFileSync(path.join(imgFolder, newFileName), jpegBuffer);
                images.push(newFileName);
                // Remove the original HEIC file from the list
                await unlink(path.join(imgFolder, file));
            }
        }
        res.json(images);
    } catch (err) {
        console.error('Error reading directory:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/img/:filename', (req, res) => {
    const filename = req.params.filename;
    const imgPath = path.join(__dirname, 'public', 'img', filename);
    res.sendFile(imgPath);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
