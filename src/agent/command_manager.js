/**
 * CommandManager handles the processing and execution of chat commands for GrokBot
 * Supports the enhanced memory retention and API recovery features
 */

export class CommandManager {
    constructor(bot, agent) {
        this.bot = bot;
        this.agent = agent;
        this.commands = new Map();
        this.prefix = '?';
    }

    /**
     * Register a command with the manager
     * @param {string} name - Command name (without prefix)
     * @param {object} command - Command definition object
     */
    registerCommand(name, command) {
        // Store the original command object
        this.commands.set(name.toLowerCase(), command);
    }

    /**
     * Process a chat message to see if it contains a command
     * @param {string} username - Sender's username
     * @param {string} message - The chat message to process
     * @returns {boolean} - Whether a command was found and executed
     */
    processMessage(username, message) {
        // Check if message starts with the command prefix
        if (!message.startsWith(this.prefix)) {
            return false;
        }

        // Parse command and arguments
        const parts = message.split(' ');
        const commandName = parts[0].substring(1).toLowerCase(); // Remove prefix
        const args = parts.slice(1);

        // Find the command
        const command = this.commands.get(commandName);
        if (!command) {
            this.bot.chat(`Unknown command: ${commandName}. Use ?help to see available commands.`);
            return false;
        }

        try {
            // Execute the command
            const response = command.perform
                ? command.perform(this.agent, ...args)
                : `Command ${commandName} has no perform method.`;

            // Handle promises if the command is async
            if (response instanceof Promise) {
                response
                    .then(result => this.sendResponse(result))
                    .catch(error => {
                        console.error(`Error executing command ${commandName}:`, error);
                        this.bot.chat(`Error executing command: ${error.message}`);
                    });
            } else {
                // Handle synchronous response
                this.sendResponse(response);
            }
            return true;
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            this.bot.chat(`Error executing command: ${error.message}`);
            return false;
        }
    }

    /**
     * Send a response message to the chat, handling multiline responses
     * @param {string} response - The response text
     */
    sendResponse(response) {
        if (!response) return;

        // Split multiline responses
        const lines = response.split('\n');
        for (const line of lines) {
            if (line.trim()) {
                this.bot.chat(line);
            }
        }
    }

    /**
     * Get help information for a specific command or list all commands
     * @param {string} commandName - Optional specific command to get help for
     * @returns {string} - Help information
     */
    getHelp(commandName) {
        if (commandName) {
            const command = this.commands.get(commandName.toLowerCase());
            if (!command) {
                return `Unknown command: ${commandName}`;
            }

            let helpText = `Command: ?${commandName}\n`;
            helpText += `Description: ${command.description || 'No description'}\n`;

            if (command.params) {
                helpText += 'Parameters:\n';
                for (const [name, param] of Object.entries(command.params)) {
                    helpText += `  ${name}: ${param.description || 'No description'}\n`;
                }
            }

            return helpText;
        }

        // List all commands
        let helpText = 'Available commands:\n';
        for (const [name, command] of this.commands.entries()) {
            helpText += `?${name}: ${command.description || 'No description'}\n`;
        }

        return helpText;
    }
}
