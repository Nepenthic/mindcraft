import { spawn } from 'child_process';
import { existsSync, writeFileSync, appendFileSync } from 'fs';
import path from 'path';

// Configuration
const BOT_SCRIPT = 'start-grokbot.js';
const MAX_RESTARTS = 10;  // Maximum number of automatic restarts within TIME_WINDOW
const TIME_WINDOW = 3600000;  // 1 hour in milliseconds
const RESTART_DELAY = 5000;  // 5 seconds between restarts

// State tracking
let restarts = [];
let currentProcess = null;
let shuttingDown = false;

// Log function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    try {
        appendFileSync('grokbot-manager.log', logMessage);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

// Clean shutdown
function handleShutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    
    log('Manager shutting down...');
    
    if (currentProcess) {
        log('Sending shutdown signal to bot process...');
        currentProcess.kill('SIGTERM');
        
        // Force kill after 10 seconds if bot doesn't exit cleanly
        setTimeout(() => {
            if (currentProcess) {
                log('Forcing bot process to terminate...');
                currentProcess.kill('SIGKILL');
            }
            process.exit(0);
        }, 10000);
    } else {
        process.exit(0);
    }
}

// Register process signal handlers
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Check if we can restart based on restart history
function canRestart() {
    const now = Date.now();
    // Remove restarts older than TIME_WINDOW
    restarts = restarts.filter(time => now - time < TIME_WINDOW);
    
    return restarts.length < MAX_RESTARTS;
}

// Start the GrokBot process
function startBot() {
    if (shuttingDown) return;
    
    // Record this restart
    restarts.push(Date.now());
    
    log(`Starting GrokBot (restart #${restarts.length} in the last ${TIME_WINDOW/60000} minutes)...`);
    
    // Prepare environment variables that enhance task system compatibility
    const env = {
        ...process.env,
        MANAGED_MODE: 'true',
        ENABLE_MEMORY_RETENTION: 'true',
        ENABLE_API_RECOVERY: 'true',
        AUTO_RESTART: 'true',
        TASK_SYSTEM_PERSISTENT: 'true',
        MEMORY_AUTOSAVE_INTERVAL: '30000' // 30 seconds
    };
    
    // Spawn the bot process
    currentProcess = spawn('node', [BOT_SCRIPT], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: env,
        detached: false
    });
    
    // Set up event handlers
    currentProcess.on('exit', (code, signal) => {
        currentProcess = null;
        
        if (shuttingDown) {
            log('Bot process exited during shutdown.');
            return;
        }
        
        if (code === 0) {
            log('Bot process exited cleanly. Not restarting automatically.');
        } else {
            log(`Bot process exited with code ${code}, signal: ${signal}`);
            
            if (canRestart()) {
                log(`Scheduling restart in ${RESTART_DELAY/1000} seconds...`);
                setTimeout(startBot, RESTART_DELAY);
            } else {
                log(`Too many restarts (${restarts.length}) in the last ${TIME_WINDOW/60000} minutes. Not restarting automatically.`);
                log('Please check the bot logs and restart manually when issues are resolved.');
                process.exit(1);
            }
        }
    });
    
    currentProcess.on('error', (err) => {
        log(`Error starting bot process: ${err.message}`);
        
        if (canRestart()) {
            log(`Scheduling restart in ${RESTART_DELAY/1000} seconds...`);
            setTimeout(startBot, RESTART_DELAY);
        } else {
            log(`Too many restarts (${restarts.length}) in the last ${TIME_WINDOW/60000} minutes. Not restarting automatically.`);
            process.exit(1);
        }
    });
    
    // Handle restart messages from the bot
    if (currentProcess.on && currentProcess.send) {
        currentProcess.on('message', (message) => {
            log(`Received message from bot: ${JSON.stringify(message)}`);
            
            if (message.type === 'restart') {
                const reason = message.reason || 'unknown';
                log(`Received restart request from bot (reason: ${reason})`);
                
                if (currentProcess) {
                    // Send graceful shutdown signal first
                    currentProcess.send({ type: 'prepare_for_restart' });
                    
                    // Give the bot a moment to save state
                    setTimeout(() => {
                        if (currentProcess) {
                            currentProcess.kill('SIGTERM');
                        }
                        // Process exit handler will take care of restarting
                    }, 2000);
                }
            }
        });
    }
}

// Create a startup script for Windows
function createWindowsStartupScript() {
    const batchContent = `@echo off
echo Starting GrokBot Manager with Enhanced Memory and API Recovery...
node grokbot-manager.js
pause
`;
    
    try {
        writeFileSync('start-grokbot-manager.bat', batchContent);
        log('Created Windows startup script: start-grokbot-manager.bat');
    } catch (error) {
        log(`Failed to create Windows startup script: ${error.message}`);
    }
}

// Main execution
log('GrokBot Process Manager starting...');
log('Features: Enhanced Memory Retention and API Recovery');
createWindowsStartupScript();
startBot();
log('Manager running. Press Ctrl+C to shut down.');
