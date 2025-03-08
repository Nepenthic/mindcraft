/**
 * Miscellaneous commands for GrokBot
 * Handles utility functions and system operations
 */

export const miscQueries = [
    {
        name: '?restart',
        description: 'Restart the GrokBot process',
        perform: (agent) => {
            // Send restart signal if running in managed mode
            if (process.send) {
                process.send({
                    type: 'restart',
                    reason: 'user_requested',
                    timestamp: Date.now()
                });
                return "Restarting GrokBot...";
            } else {
                return "Cannot restart - not running in managed mode. Please restart manually.";
            }
        }
    },
    {
        name: '?shutdown',
        description: 'Safely shut down GrokBot',
        perform: (agent) => {
            if (agent.handleShutdown) {
                // Call the agent's shutdown handler
                setTimeout(() => {
                    agent.handleShutdown();
                }, 1000);
                return "Shutting down GrokBot safely...";
            } else {
                // Fallback
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
                return "Shutting down GrokBot...";
            }
        }
    },
    {
        name: '?status',
        description: 'Show current bot status and performance metrics',
        perform: (agent) => {
            if (!agent.bot) {
                return "Bot status not available.";
            }
            
            // Get bot uptime
            const uptimeMs = process.uptime() * 1000;
            const hours = Math.floor(uptimeMs / 3600000);
            const minutes = Math.floor((uptimeMs % 3600000) / 60000);
            const seconds = Math.floor((uptimeMs % 60000) / 1000);
            const uptime = `${hours}h ${minutes}m ${seconds}s`;
            
            // Get health and food level if available
            const health = agent.bot.health !== undefined ? `${agent.bot.health}/20` : "Unknown";
            const food = agent.bot.food !== undefined ? `${agent.bot.food}/20` : "Unknown";
            
            // Get memory usage
            const memoryUsage = process.memoryUsage();
            const memoryUsageMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memoryTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
            
            // Get active tasks if task system is available
            let activeTasks = "No task system available.";
            if (agent.bot.taskSystem && agent.bot.taskSystem.activeTasks) {
                if (agent.bot.taskSystem.activeTasks.length === 0) {
                    activeTasks = "No active tasks.";
                } else {
                    activeTasks = agent.bot.taskSystem.activeTasks.map(task => 
                        `${task.name} (priority: ${task.priority || 'normal'})`
                    ).join(", ");
                }
            }
            
            let response = `## GrokBot Status Report\n\n`;
            response += `Uptime: ${uptime}\n`;
            response += `Health: ${health}\n`;
            response += `Food: ${food}\n`;
            response += `Memory Usage: ${memoryUsageMB}MB / ${memoryTotalMB}MB\n`;
            response += `Active Tasks: ${activeTasks}\n`;
            
            // Get API status if available
            if (agent.prompter && agent.prompter.chat_model && agent.prompter.chat_model.getHealthStatus) {
                const apiHealth = agent.prompter.chat_model.getHealthStatus();
                response += `API Status: ${apiHealth.status || "Unknown"}\n`;
            }
            
            return response;
        }
    }
];
