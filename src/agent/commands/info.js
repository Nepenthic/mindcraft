/**
 * Information commands for GrokBot
 * Provides data about the bot's environment, inventory, and surroundings
 */

export const infoQueries = [
    {
        name: '?where',
        description: 'Show the current location of the bot',
        perform: (agent) => {
            if (!agent.bot || !agent.bot.entity) {
                return "Position data not available.";
            }
            
            const pos = agent.bot.entity.position;
            return `I am currently at position: X=${Math.floor(pos.x)}, Y=${Math.floor(pos.y)}, Z=${Math.floor(pos.z)}`;
        }
    },
    {
        name: '?inventory',
        description: 'Show the bot\'s current inventory contents',
        perform: (agent) => {
            if (!agent.bot || !agent.bot.inventory) {
                return "Inventory data not available.";
            }
            
            const items = agent.bot.inventory.items();
            if (items.length === 0) {
                return "My inventory is empty.";
            }
            
            // Group items by type and count
            const itemCounts = {};
            for (const item of items) {
                const name = item.name || "unknown";
                if (!itemCounts[name]) {
                    itemCounts[name] = 0;
                }
                itemCounts[name] += item.count || 1;
            }
            
            // Format the output
            let response = "## Inventory Contents\n\n";
            for (const [name, count] of Object.entries(itemCounts)) {
                response += `- ${name}: ${count}\n`;
            }
            
            return response;
        }
    },
    {
        name: '?scan',
        description: 'Scan the surrounding area for entities and blocks',
        params: {
            'radius': { type: 'number', description: 'Scan radius in blocks (default: 10)', optional: true }
        },
        perform: (agent, radius) => {
            const scanRadius = radius ? parseInt(radius) : 10;
            
            if (!agent.bot) {
                return "Environment data not available.";
            }
            
            // Scan for entities
            const nearbyEntities = Object.values(agent.bot.entities).filter(entity => {
                if (!entity || !entity.position || !agent.bot.entity) return false;
                
                const distance = entity.position.distanceTo(agent.bot.entity.position);
                return distance <= scanRadius && entity.name !== 'player';
            });
            
            // Get nearby players
            const nearbyPlayers = Object.values(agent.bot.players)
                .filter(player => player && player.entity && player.entity.position)
                .filter(player => player.entity.position.distanceTo(agent.bot.entity.position) <= scanRadius);
            
            // Format response
            let response = `## Environment Scan (Radius: ${scanRadius} blocks)\n\n`;
            
            if (nearbyPlayers.length > 0) {
                response += "### Nearby Players\n";
                for (const player of nearbyPlayers) {
                    const distance = Math.round(player.entity.position.distanceTo(agent.bot.entity.position));
                    response += `- ${player.username} (${distance} blocks away)\n`;
                }
                response += "\n";
            }
            
            if (nearbyEntities.length > 0) {
                // Group entities by type
                const entityCounts = {};
                for (const entity of nearbyEntities) {
                    const type = entity.name || "unknown";
                    if (!entityCounts[type]) {
                        entityCounts[type] = 0;
                    }
                    entityCounts[type]++;
                }
                
                response += "### Nearby Entities\n";
                for (const [type, count] of Object.entries(entityCounts)) {
                    response += `- ${type}: ${count}\n`;
                }
            } else {
                response += "No nearby entities detected.\n";
            }
            
            return response;
        }
    }
];
