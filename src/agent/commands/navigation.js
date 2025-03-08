/**
 * Navigation commands for GrokBot
 * Handles movement, pathfinding, and exploration
 */

export const navQueries = [
    {
        name: '?goto',
        description: 'Move to specific coordinates or a saved location',
        params: {
            'x/name': { type: 'string/number', description: 'X coordinate or saved location name' },
            'y': { type: 'number', description: 'Y coordinate (optional if providing location name)', optional: true },
            'z': { type: 'number', description: 'Z coordinate (optional if providing location name)', optional: true }
        },
        perform: (agent, x, y, z) => {
            // Check if first param is a name or coordinate
            if (isNaN(parseInt(x))) {
                // It's a name, try to recall from memory
                if (!agent.memory) {
                    return "Memory system not initialized.";
                }
                
                const coords = agent.memory.recallPlace(x);
                if (!coords) {
                    return `No location named "${x}" found in memory.`;
                }
                
                // Start movement task to coordinates from memory
                if (agent.taskSystem && agent.taskSystem.startTask) {
                    agent.taskSystem.startTask('goto', { 
                        x: coords[0], 
                        y: coords[1], 
                        z: coords[2],
                        locationName: x
                    });
                    return `Moving to saved location "${x}" at (${coords[0]}, ${coords[1]}, ${coords[2]})`;
                } else {
                    return "Task system not available for navigation.";
                }
            } else {
                // It's a coordinate, parse and navigate
                const targetX = parseInt(x);
                const targetY = y ? parseInt(y) : null;
                const targetZ = z ? parseInt(z) : null;
                
                if (targetY === null || targetZ === null) {
                    return "Please provide all three coordinates (x, y, z).";
                }
                
                // Start movement task to coordinates
                if (agent.taskSystem && agent.taskSystem.startTask) {
                    agent.taskSystem.startTask('goto', { 
                        x: targetX, 
                        y: targetY, 
                        z: targetZ 
                    });
                    return `Moving to coordinates (${targetX}, ${targetY}, ${targetZ})`;
                } else {
                    return "Task system not available for navigation.";
                }
            }
        }
    },
    {
        name: '?explore',
        description: 'Explore the surrounding area',
        params: {
            'radius': { type: 'number', description: 'Exploration radius in blocks (default: 30)', optional: true }
        },
        perform: (agent, radius) => {
            const exploreRadius = radius ? parseInt(radius) : 30;
            
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('explore', { radius: exploreRadius });
                return `Exploring with radius of ${exploreRadius} blocks`;
            } else {
                return "Task system not available for exploration.";
            }
        }
    },
    {
        name: '?follow',
        description: 'Follow a player',
        params: {
            'player': { type: 'string', description: 'Username of player to follow' },
            'distance': { type: 'number', description: 'Distance to maintain (default: 3)', optional: true }
        },
        perform: (agent, player, distance) => {
            const followDistance = distance ? parseInt(distance) : 3;
            
            if (!player) {
                return "Please specify a player to follow.";
            }
            
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('follow', { 
                    target: player,
                    distance: followDistance
                });
                return `Following player ${player} at distance of ${followDistance} blocks`;
            } else {
                return "Task system not available for following.";
            }
        }
    },
    {
        name: '?stop',
        description: 'Stop current movement or task',
        perform: (agent) => {
            if (agent.bot && agent.bot.pathfinder) {
                agent.bot.pathfinder.stop();
            }
            
            if (agent.taskSystem && agent.taskSystem.cancelAllTasks) {
                agent.taskSystem.cancelAllTasks();
                return "Stopped all current tasks and movement.";
            } else {
                return "Stopped movement.";
            }
        }
    }
];
