/**
 * Task System for GrokBot
 * Manages task registration, execution, and cancellation
 */

import pkg from 'mineflayer-pathfinder';
const { pathfinder, goals, Movements } = pkg;
import fs from 'fs';
import path from 'path';
import minecraftData from 'minecraft-data';
import { Vec3 } from 'vec3';
import settings from '../../settings.js';

// Structure definitions - templates for basic structures
const STRUCTURE_TEMPLATES = {
    house: {
        dimensions: { width: 5, length: 5, height: 4 },
        materials: {
            foundation: 'cobblestone',
            walls: 'planks',
            roof: 'planks',
            door: 'wooden_door'
        }
    },
    tower: {
        dimensions: { width: 3, length: 3, height: 8 },
        materials: {
            foundation: 'cobblestone',
            walls: 'cobblestone',
            roof: 'planks',
            door: 'wooden_door'
        }
    },
    wall: {
        dimensions: { width: 1, length: 10, height: 3 },
        materials: {
            foundation: 'cobblestone',
            walls: 'cobblestone'
        }
    }
};

// Building Task implementation
class BuildTask {
    static taskName = 'build';

    static async execute(bot, data, taskId) {
        const { type, position } = data;
        const [x, y, z] = position;
        
        // Check if structure type is valid
        if (!STRUCTURE_TEMPLATES[type]) {
            bot.chat(`I don't know how to build a ${type}.`);
            return;
        }
        
        bot.chat(`Starting to build a ${type} at (${x}, ${y}, ${z})`);
        
        try {
            // Navigate to building location
            await this.navigateToLocation(bot, x, y, z);
            
            // Start building the structure
            await this.buildStructure(bot, type, x, y, z);
            
            bot.chat(`Finished building the ${type}!`);
        } catch (error) {
            console.error(`Error building ${type}:`, error);
            bot.chat(`I had some trouble building the ${type}. ${error.message}`);
        }
    }
    
    static async navigateToLocation(bot, x, y, z) {
        // Create a goal to navigate near the building site
        const goal = new goals.GoalNear(x, y, z, 2);
        bot.pathfinder.setGoal(goal);
        
        // Wait for bot to reach the location (simple implementation)
        return new Promise(resolve => {
            setTimeout(() => resolve(), 5000);
        });
    }
    
    static async buildStructure(bot, type, x, y, z) {
        const template = STRUCTURE_TEMPLATES[type];
        const { dimensions, materials } = template;
        
        // Build foundation
        bot.chat(`Laying the foundation...`);
        
        // Simple demonstration of building
        const blockX = x;
        const blockY = y;
        const blockZ = z;
        
        // Find the appropriate material in inventory
        const blockItem = bot.inventory.items().find(item => 
            item.name.includes(materials.foundation));
            
        if (!blockItem) {
            bot.chat(`I don't have ${materials.foundation} to build with!`);
            return;
        }
        
        // Equip the block
        await bot.equip(blockItem, 'hand');
        
        // Place a single block as demonstration
        const refPos = new Vec3(blockX, blockY - 1, blockZ);
        const placeVec = new Vec3(0, 1, 0);
        
        try {
            const refBlock = bot.blockAt(refPos);
            if (refBlock.name !== 'air') {
                await bot.placeBlock(refBlock, placeVec);
                bot.chat(`Placed a ${blockItem.name} block.`);
            }
        } catch (error) {
            console.error('Error placing block:', error);
        }
    }
}

export class TaskSystem {
    constructor(bot) {
        this.bot = bot;
        this.registeredTasks = new Map();
        this.activeTasks = [];
        this.taskIdCounter = 0;
        this.stateSaveInterval = 300000; // Save state every 5 minutes
        this.lastSaveTime = Date.now();
        this.stateFile = './grokbot_state.json';
        this.changelogFile = './changelog.txt';
        
        // Assume pathfinder is already loaded in the bot initialization
        // We don't need to load it here as it should be done in mcdata.js
        
        // Load previous state if available
        this.loadState();
        
        // Initialize default movement settings
        this.initializeMovements();
        
        // Set up event listeners for task management
        this._setupEventListeners();
        
        // Start the auto-save interval
        this._startAutoSave();
        
        console.log("TaskSystem initialized");
        
        // Register building tasks directly
        this.registerTask('build', BuildTask);
        console.log(`Registered building task: build`);
    }
    
    initializeMovements() {
        // Create default movements settings optimized for navigation
        const mcData = minecraftData(this.bot.version);
        
        // Configure movement settings
        this.movements = new Movements(this.bot, mcData);
        
        this.movements.allowSprinting = true;
        this.movements.canDig = true;
        this.movements.allow1by1towers = true;
        this.movements.scafoldingBlocks = [];
        
        // Add common blocks from the environment for scaffolding
        for (const block of ['dirt', 'cobblestone', 'stone']) {
            const blockEnum = mcData.blocksByName[block];
            if (blockEnum) {
                this.movements.scafoldingBlocks.push(blockEnum.id);
            }
        }
        
        // Apply movements to pathfinder
        this.bot.pathfinder.setMovements(this.movements);
    }
    
    _setupEventListeners() {
        // Listen for successful movements
        this.bot.on('goal_reached', () => {
            console.log('Goal reached, checking for active navigation tasks');
            this._checkNavigationTasks();
        });
        
        // Listen for pathfinding failures
        this.bot.on('path_update', (results) => {
            if (results.status === 'noPath') {
                console.log('Could not find path, attempting recovery');
                this._handlePathfindingFailure();
            }
        });
        
        // Handle bot physics changes (getting stuck)
        this.bot.on('physicsTick', () => {
            this._checkStuckStatus();
        });
    }
    
    _checkStuckStatus() {
        // Simple stuck detection based on movement
        const now = Date.now();
        
        if (!this.lastPosition) {
            this.lastPosition = this.bot.entity.position.clone();
            this.lastMovementTime = now;
            this.stuckCounter = 0;
            return;
        }
        
        // Check if we've moved
        const dist = this.bot.entity.position.distanceTo(this.lastPosition);
        
        // If bot is actively trying to move but hasn't moved
        if (this.activeTasks.some(task => task.type.includes('goto') || task.type.includes('explore') || task.type === 'follow')) {
            if (dist < 0.05 && now - this.lastMovementTime > 2000) {
                this.stuckCounter++;
                
                // Attempt recovery if stuck for several ticks
                if (this.stuckCounter > 10) {
                    console.log('Bot appears to be stuck, attempting recovery');
                    this._handleStuckRecovery();
                    this.stuckCounter = 0;
                }
            } else {
                this.stuckCounter = 0;
                this.lastMovementTime = now;
            }
        }
        
        this.lastPosition = this.bot.entity.position.clone();
    }
    
    _handleStuckRecovery() {
        // Try to unstuck by jumping and looking around
        this.bot.setControlState('jump', true);
        setTimeout(() => this.bot.setControlState('jump', false), 500);
        
        // Look around to find potential new paths
        this.bot.look(this.bot.entity.yaw + Math.PI/2, 0);
        
        // Retry the current path with a small timeout
        setTimeout(() => {
            // If we have an active navigation task, retry it
            const navTask = this.activeTasks.find(task => 
                task.type === 'goto' || task.type === 'explore' || task.type === 'follow');
            
            if (navTask) {
                console.log('Retrying navigation task');
                this._executeTask(navTask.type, navTask.data, navTask.id);
            }
        }, 1000);
        
        // Send message to indicate we were stuck but trying to recover
        this.bot.chat("I'm stuck! Trying to find a way out...");
    }
    
    _handlePathfindingFailure() {
        console.log('Pathfinding failed, trying alternative approach');
        
        // Try a different approach by adjusting movement settings temporarily
        const tempMovements = Object.assign({}, this.movements);
        tempMovements.canDig = true;
        tempMovements.maxDropDown = 5;
        
        this.bot.pathfinder.setMovements(tempMovements);
        
        // Retry the current path
        const navTask = this.activeTasks.find(task => 
            task.type === 'goto' || task.type === 'explore' || task.type === 'follow');
        
        if (navTask) {
            console.log('Retrying with adjusted movement settings');
            this._executeTask(navTask.type, navTask.data, navTask.id);
        }
        
        // Reset movements after 5 seconds
        setTimeout(() => {
            this.bot.pathfinder.setMovements(this.movements);
        }, 5000);
    }
    
    _checkNavigationTasks() {
        // Check if any navigation tasks are complete
        for (let i = this.activeTasks.length - 1; i >= 0; i--) {
            const task = this.activeTasks[i];
            
            if (task.type === 'goto' && this._isAtDestination(task.data)) {
                console.log(`Reached destination (${task.data.x}, ${task.data.y}, ${task.data.z})`);
                this.bot.chat(`I've reached ${task.data.locationName || 'the destination'}.`);
                this.activeTasks.splice(i, 1);
            }
        }
    }
    
    _isAtDestination(destination) {
        // Check if we're close enough to the destination
        const pos = this.bot.entity.position;
        const threshold = 1.5; // blocks
        
        return Math.abs(pos.x - destination.x) < threshold && 
               Math.abs(pos.y - destination.y) < threshold && 
               Math.abs(pos.z - destination.z) < threshold;
    }
    
    registerTask(taskName, taskHandler) {
        this.registeredTasks.set(taskName, taskHandler);
        console.log(`Registered task handler: ${taskName}`);
    }
    
    startTask(taskType, taskData, options = {}) {
        const taskId = this.taskIdCounter++;
        
        // Store task in active tasks list
        this.activeTasks.push({
            id: taskId,
            type: taskType,
            data: taskData,
            startTime: Date.now(),
            options: options
        });
        
        console.log(`Starting task ${taskType} with ID ${taskId}`);
        
        // Log the task start
        this.logAction(`Started task: ${taskType} (${JSON.stringify(taskData)})`);
        
        // Execute the task
        this._executeTask(taskType, taskData, taskId);
        
        return taskId;
    }
    
    cancelTask(taskId) {
        const taskIndex = this.activeTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const task = this.activeTasks[taskIndex];
            console.log(`Cancelling task ${task.type} with ID ${taskId}`);
            
            // Stop any active movements if it's a navigation task
            if (task.type === 'goto' || task.type === 'explore' || task.type === 'follow') {
                this.bot.pathfinder.stop();
            }
            
            // Remove from active tasks
            this.activeTasks.splice(taskIndex, 1);
            return true;
        }
        
        return false;
    }
    
    cancelAllTasks() {
        console.log('Cancelling all tasks');
        
        // Stop pathfinder
        this.bot.pathfinder.stop();
        
        // Clear all tasks
        this.activeTasks = [];
    }
    
    _executeTask(taskType, taskData, taskId) {
        console.log(`Executing task ${taskType}`);
        
        switch (taskType) {
            case 'goto':
                this._executeGotoTask(taskData);
                break;
                
            case 'explore':
                this._executeExploreTask(taskData);
                break;
                
            case 'follow':
                this._executeFollowTask(taskData);
                break;
                
            case 'buildStructure':
                this._executeBuildStructureTask(taskData);
                break;
                
            case 'placeFurnace':
                this._executePlaceFurnaceTask(taskData);
                break;
                
            case 'placeChest':
                this._executePlaceChestTask(taskData);
                break;
                
            case 'buildFarm':
                this._executeBuildFarmTask(taskData);
                break;
                
            case 'mineBlock':
                this._executeMineBlockTask(taskData);
                break;
                
            default:
                // Check if we have a registered handler for this task type
                const handler = this.registeredTasks.get(taskType);
                
                if (handler) {
                    try {
                        handler.execute(this.bot, taskData, taskId);
                    } catch (error) {
                        console.error(`Error executing task ${taskType}:`, error);
                        this.logAction(`Task error: ${taskType} - ${error.message}`);
                    }
                } else {
                    console.warn(`No handler registered for task type: ${taskType}`);
                    this.bot.chat(`I don't know how to ${taskType}. Sorry!`);
                }
        }
    }
    
    _executeGotoTask(data) {
        // Extract destination
        const { x, y, z } = data;
        
        // Create a goal
        const goal = new goals.GoalBlock(x, y, z);
        
        // Navigate to the goal
        console.log(`Navigating to (${x}, ${y}, ${z})`);
        this.bot.pathfinder.setGoal(goal);
    }
    
    _executeExploreTask(data) {
        const radius = data.radius || 30;
        
        // Generate a random position within the radius
        const randomAngle = Math.random() * 2 * Math.PI;
        const randomRadius = Math.random() * radius;
        
        const currentPos = this.bot.entity.position;
        const exploreX = Math.floor(currentPos.x + Math.cos(randomAngle) * randomRadius);
        const exploreZ = Math.floor(currentPos.z + Math.sin(randomAngle) * randomRadius);
        
        // Use current Y coordinate as a starting point
        const exploreY = currentPos.y;
            
        console.log(`Exploring to (${exploreX}, ${exploreY}, ${exploreZ})`);
        
        // Navigate to the random position
        const goal = new goals.GoalNear(exploreX, exploreY, exploreZ, 2);
        this.bot.pathfinder.setGoal(goal);
        
        // Let the user know what we're doing
        this.bot.chat(`Exploring in the direction of (${exploreX}, ${exploreY}, ${exploreZ})`);
        
        // Log the action
        this.logAction(`Started exploration with radius ${radius}`);
    }
    
    _executeFollowTask(data) {
        const target = data.target;
        const distance = data.distance || 3;
        
        // Find the player
        const playerEntity = this.bot.players[target]?.entity;
        
        if (!playerEntity) {
            console.log(`Player ${target} not found, cannot follow`);
            this.bot.chat(`I can't see ${target}, so I can't follow them.`);
            return;
        }
        
        // Create a follow goal
        const goal = new goals.GoalFollow(playerEntity, distance);
        
        // Navigate to the goal
        console.log(`Following player ${target} at distance ${distance}`);
        this.bot.pathfinder.setGoal(goal);
        
        // Let the user know what we're doing
        this.bot.chat(`I'm following ${target} now.`);
    }
    
    _executeBuildStructureTask(data) {
        const { structureType, size } = data;
        
        // Get the bot's current position
        const pos = this.bot.entity.position;
        
        // Define build position a few blocks in front of the bot
        const buildPos = [
            Math.floor(pos.x + 5 * Math.sin(this.bot.entity.yaw)),
            Math.floor(pos.y),
            Math.floor(pos.z + 5 * Math.cos(this.bot.entity.yaw))
        ];
        
        this.bot.chat(`I'll build a ${size} ${structureType} right in front of me.`);
        
        // Use the build task handler
        const handler = this.registeredTasks.get('build');
        
        if (handler) {
            handler.execute(this.bot, {
                type: structureType,
                position: buildPos,
                size: size
            }, this.taskIdCounter++);
            
            this.logAction(`Started building a ${size} ${structureType} at ${buildPos.join(',')}`);
        } else {
            this.bot.chat("I can't find my building instructions right now.");
            console.error("Build task handler not registered");
        }
    }
    
    _executePlaceFurnaceTask(data) {
        this.bot.chat(`I'll place a furnace nearby.`);
        
        // Log the action
        this.logAction(`Started placing furnace`);
        
        // Implementation will be similar to building but with furnace placement specifics
        // For now, we'll use a simplified placeholder
        this.bot.chat("Furnace placement not fully implemented yet.");
    }
    
    _executePlaceChestTask(data) {
        this.bot.chat(`I'll place a chest nearby.`);
        
        // Log the action
        this.logAction(`Started placing chest`);
        
        // Implementation will be similar to building but with chest placement specifics
        // For now, we'll use a simplified placeholder
        this.bot.chat("Chest placement not fully implemented yet.");
    }
    
    _executeBuildFarmTask(data) {
        this.bot.chat(`I'll build a farm for you.`);
        
        // Log the action
        this.logAction(`Started building farm`);
        
        // Implementation will be similar to building but with farm specifics
        // For now, we'll use a simplified placeholder
        this.bot.chat("Farm building not fully implemented yet.");
    }
    
    _executeMineBlockTask(data) {
        const { blockType, count } = data;
        
        this.bot.chat(`I'll mine ${count}x ${blockType} for you.`);
        
        // Log the action
        this.logAction(`Started mining ${count}x ${blockType}`);
        
        // Implementation will involve finding blocks and mining them
        // For now, we'll use a simplified placeholder
        this.bot.chat("Mining functionality not fully implemented yet.");
    }
    
    // State management methods
    saveState() {
        try {
            // Create state object
            const state = {
                position: {
                    x: this.bot.entity.position.x,
                    y: this.bot.entity.position.y,
                    z: this.bot.entity.position.z
                },
                inventory: this.bot.inventory.items().map(item => ({
                    name: item.name,
                    count: item.count,
                    slot: item.slot
                })),
                activeTasks: this.activeTasks,
                timestamp: Date.now()
            };
            
            // Save state to file
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
            console.log(`Saved state to ${this.stateFile}`);
            this.lastSaveTime = Date.now();
            
            return true;
        } catch (error) {
            console.error('Error saving state:', error);
            return false;
        }
    }
    
    loadState() {
        try {
            // Check if state file exists
            if (!fs.existsSync(this.stateFile)) {
                console.log('No saved state found.');
                return false;
            }
            
            // Load state from file
            const stateData = fs.readFileSync(this.stateFile, 'utf8');
            const state = JSON.parse(stateData);
            
            console.log('Loaded saved state from', new Date(state.timestamp).toLocaleString());
            
            // Restore active tasks (this will happen after the bot spawns)
            this.bot.once('spawn', () => {
                // Wait a bit for the bot to fully initialize
                setTimeout(() => {
                    this._restoreState(state);
                }, 2000);
            });
            
            return true;
        } catch (error) {
            console.error('Error loading state:', error);
            return false;
        }
    }
    
    _restoreState(state) {
        console.log('Restoring bot state...');
        
        // Announce the restoration
        this.bot.chat("I'm back! Restoring my previous state...");
        
        // Restore active tasks if any
        if (state.activeTasks && state.activeTasks.length > 0) {
            this.bot.chat(`I was working on ${state.activeTasks.length} tasks before I left.`);
            
            // Re-execute the most recent task
            const recentTask = state.activeTasks[state.activeTasks.length - 1];
            if (recentTask) {
                this.bot.chat(`Resuming my ${recentTask.type} task...`);
                this._executeTask(recentTask.type, recentTask.data, recentTask.id);
            }
        }
    }
    
    _startAutoSave() {
        // Set up auto-save interval
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastSaveTime >= this.stateSaveInterval) {
                this.saveState();
            }
        }, 60000); // Check every minute
    }
    
    // Changelog management
    logAction(action) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${action}\n`;
            
            // Create the file if it doesn't exist
            if (!fs.existsSync(this.changelogFile)) {
                fs.writeFileSync(this.changelogFile, '# GrokBot Changelog\n\n');
            }
            
            // Append the log entry
            fs.appendFileSync(this.changelogFile, logEntry);
            console.log(`Logged action: ${action}`);
            
            return true;
        } catch (error) {
            console.error('Error logging action:', error);
            return false;
        }
    }
}
