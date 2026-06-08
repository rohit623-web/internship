const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (Replace with your Atlas URI or local string)
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('Database connection error:', err));

// Project Schema & Model
const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    techStack: String
});
const Project = mongoose.model('Project', projectSchema);

// API Route to fetch projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed Route (Run once to populate sample data if database is empty)
app.get('/api/seed', async (req, res) => {
    const count = await Project.countDocuments();
    if (count === 0) {
        await Project.insertMany([
            { title: "Personal Portfolio Website", description: "A full-stack portfolio to showcase projects.", techStack: "Node.js, Express, MongoDB" },
            { title: "Task Management App", description: "Web app for tracking tasks with user auth.", techStack: "React, Node.js, WebSockets" }
        ]);
        return res.send('Database seeded with initial projects!');
    }
    res.send('Database already has data.');
});

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});