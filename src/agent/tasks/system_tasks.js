/**
 * GrokBot System Tasks
 * 
 * This module provides system-level tasks that handle memory management,
 * API health monitoring, and automatic recovery for GrokBot.
 * 
 * These tasks integrate with the established task system architecture
 * to provide autonomous operation with proper error handling and recovery.
 */

import { Task } from '../tasks.js';
import fs from 'fs';
import path from 'path';

/**
 * Task for saving and managing GrokBot's memory
 */
export class MemorySaveTask extends Task {
    static taskName = 'memorySave';
    
    constructor(bot, options = {}) {
        super(bot);
        this.interval = options.interval || 60000; // Default 1 minute
        this.backupFrequency = options.backupFrequency || 5; // Create a backup every 5 saves
        this.saveCount = 0;
        this.lastSaveTime = 0;
        this.memoryPath = options.memoryPath || `./bots/${bot.username}/memory.json`;
        this.backupDir = options.backupDir || `./bots/${bot.username}/memory_backups`;
    }
    
    async init() {
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(this.backupDir)) {
            try {
                fs.mkdirSync(this.backupDir, { recursive: true });
            } catch (error) {
                console.error(`Failed to create backup directory: ${error.message}`);
            }
        }
        
        return true;
    }
    
    async tick() {
        const currentTime = Date.now();
        
        // Check if it's time to save
        if (currentTime - this.lastSaveTime >= this.interval) {
            try {
                // Save memory
                await this.saveMemory();
                
                // Update state
                this.lastSaveTime = currentTime;
                this.saveCount++;
                
                // Create a backup if needed
                if (this.saveCount % this.backupFrequency === 0) {
                    this.createBackup();
                }
            } catch (error) {
                console.error(`Memory save error: ${error.message}`);
            }
        }
        
        return true; // Keep the task running
    }
    
    async saveMemory() {
        if (!this.bot.agent || !this.bot.agent.memory) {
            console.warn("Memory system not initialized, can't save");
            return;
        }
        
        try {
            await this.bot.agent.memory.save();
            console.log(`Saved memory to: ${this.memoryPath}`);
        } catch (error) {
            console.error(`Failed to save memory: ${error.message}`);
        }
    }
    
    createBackup() {
        if (!fs.existsSync(this.memoryPath)) {
            return;
        }
        
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `memory_${timestamp}.json`);
            
            fs.copyFileSync(this.memoryPath, backupPath);
            console.log(`Created memory backup: ${backupPath}`);
            
            // Prune old backups (keep latest 10)
            this.pruneBackups(10);
        } catch (error) {
            console.error(`Failed to create backup: ${error.message}`);
        }
    }
    
    pruneBackups(maxBackups) {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('memory_') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    time: fs.statSync(path.join(this.backupDir, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time); // Sort by time, newest first
            
            // Remove oldest backups
            for (let i = maxBackups; i < files.length; i++) {
                fs.unlinkSync(files[i].path);
                console.log(`Pruned old backup: ${files[i].name}`);
            }
        } catch (error) {
            console.error(`Failed to prune backups: ${error.message}`);
        }
    }
    
    async cancel() {
        // Save memory one last time before canceling
        await this.saveMemory();
        return true;
    }
}

/**
 * Task for monitoring API health and handling recovery
 */
export class ApiHealthMonitorTask extends Task {
    static taskName = 'apiHealthMonitor';
    
    constructor(bot, options = {}) {
        super(bot);
        this.checkInterval = options.checkInterval || 30000; // Default 30 seconds
        this.failureThreshold = options.failureThreshold || 5; // Number of failures before restart
        this.cooldownPeriod = options.cooldownPeriod || 300000; // 5 minutes
        this.lastCheckTime = 0;
        this.restartRequested = false;
    }
    
    async init() {
        return true;
    }
    
    async tick() {
        const currentTime = Date.now();
        
        // Only check periodically
        if (currentTime - this.lastCheckTime >= this.checkInterval) {
            this.lastCheckTime = currentTime;
            
            // Get API health status
            if (this.bot.agent && 
                this.bot.agent.prompter && 
                this.bot.agent.prompter.chat_model && 
                this.bot.agent.prompter.chat_model.getHealthStatus) {
                
                const healthStatus = this.bot.agent.prompter.chat_model.getHealthStatus();
                
                // Log status
                console.log(`API Health Status: ${healthStatus.status}`);
                
                // Check if we need to request a restart
                if (healthStatus.status === "failed" && !this.restartRequested) {
                    console.warn("API health critical - requesting restart");
                    this.requestRestart("api_failure");
                    this.restartRequested = true;
                }
                
                // Reset restart flag if API is healthy again
                if (healthStatus.status === "healthy" && this.restartRequested) {
                    this.restartRequested = false;
                }
            }
        }
        
        return true; // Keep the task running
    }
    
    requestRestart(reason) {
        try {
            // Save any important state before restarting
            if (this.bot.agent && this.bot.agent.memory) {
                this.bot.agent.memory.save();
            }
            
            // Send restart message to process if in managed mode
            if (process.send) {
                process.send({
                    type: 'restart',
                    reason: reason,
                    timestamp: Date.now()
                });
                console.log("Restart request sent to process manager");
            } else {
                console.log("Not running in managed mode, restart request cannot be sent");
            }
        } catch (error) {
            console.error(`Failed to request restart: ${error.message}`);
        }
    }
    
    async cancel() {
        return true;
    }
}

/**
 * Factory function to create and register system tasks
 * @param {Object} bot - The mineflayer bot instance
 * @param {Object} options - Configuration options
 */
export function registerSystemTasks(bot, options = {}) {
    // Register memory save task
    const memorySaveTask = new MemorySaveTask(bot, {
        interval: options.memorySaveInterval || 60000,
        backupFrequency: options.backupFrequency || 5
    });
    
    // Register API health monitor task
    const apiHealthTask = new ApiHealthMonitorTask(bot, {
        checkInterval: options.apiCheckInterval || 30000,
        failureThreshold: options.apiFailureThreshold || 5
    });
    
    // Add tasks to task system if available
    if (bot.taskSystem) {
        console.log("Registering system tasks with task system");
        bot.taskSystem.registerTask(MemorySaveTask.taskName, memorySaveTask);
        bot.taskSystem.registerTask(ApiHealthMonitorTask.taskName, apiHealthTask);
        
        // Start the tasks
        bot.taskSystem.startTask(MemorySaveTask.taskName, {}, { isPersistent: true, priority: 'system' });
        bot.taskSystem.startTask(ApiHealthMonitorTask.taskName, {}, { isPersistent: true, priority: 'system' });
    } else {
        console.warn("Task system not available, system tasks not registered");
    }
    
    return {
        memorySaveTask,
        apiHealthTask
    };
}
