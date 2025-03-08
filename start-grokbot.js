// GrokBot Minecraft AI Assistant
// This script sets up and starts the Mindcraft bot with Grok integration

import { config } from 'dotenv';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Set essential environment variables if not in .env
process.env.XAI_API_KEY = process.env.XAI_API_KEY || 'xai-RYbhHjUPJuM88icHADt7g8mxlX9DifKkhmzRh72AtvqV9Bap5z9g5cYaq0QKC5POmgUHZ2RgFQYIjZ8i';
process.env.MINECRAFT_PORT = process.env.MINECRAFT_PORT || '25565';
process.env.MINECRAFT_HOST = process.env.MINECRAFT_HOST || '127.0.0.1';
process.env.MINECRAFT_USERNAME = process.env.MINECRAFT_USERNAME || 'GrokBot';

// Create a simple Grok profile
const grokProfile = {
    name: "GrokBot",
    username: "GrokBot",
    model: "grok-1",
    api: "xai"
};

// Write the profile to a temp file
const tempProfilePath = path.join(__dirname, 'temp-grokbot-profile.json');
fs.writeFileSync(tempProfilePath, JSON.stringify(grokProfile, null, 2));

console.log('Starting GrokBot with the following configuration:');
console.log('Minecraft Server:', process.env.MINECRAFT_HOST + ':' + process.env.MINECRAFT_PORT);
console.log('Bot Username:', process.env.MINECRAFT_USERNAME);
console.log('Using Grok AI model');

// Start the bot with our custom profile
const mainProcess = spawn('node', ['main.js', tempProfilePath], {
    stdio: 'inherit',
    env: process.env
});

mainProcess.on('error', (err) => {
    console.error('Failed to start GrokBot:', err);
});

mainProcess.on('close', (code) => {
    console.log(`GrokBot process exited with code ${code}`);
    // Clean up temp file
    if (fs.existsSync(tempProfilePath)) {
        fs.unlinkSync(tempProfilePath);
    }
});

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('Shutting down GrokBot...');
    if (fs.existsSync(tempProfilePath)) {
        fs.unlinkSync(tempProfilePath);
    }
    process.exit();
});
