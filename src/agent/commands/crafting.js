/**
 * Crafting commands for GrokBot
 * Handles crafting, smelting and resource processing
 */

export const craftingQueries = [
    {
        name: '?craft',
        description: 'Craft an item if you have the materials',
        params: {
            'item': { type: 'string', description: 'Item name to craft' },
            'count': { type: 'number', description: 'Number of items to craft (default: 1)', optional: true }
        },
        perform: (agent, item, count) => {
            const craftCount = count ? parseInt(count) : 1;
            
            if (!agent.bot) {
                return "Crafting system not available.";
            }
            
            if (!item) {
                return "Please specify an item to craft.";
            }
            
            // Start crafting task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('craftItem', { 
                    itemName: item,
                    count: craftCount
                });
                return `Started crafting task for ${craftCount}x ${item}`;
            } else {
                return "Task system not available for crafting.";
            }
        }
    },
    {
        name: '?smelt',
        description: 'Smelt items in a furnace',
        params: {
            'item': { type: 'string', description: 'Item to smelt' },
            'count': { type: 'number', description: 'Number of items to smelt (default: all)', optional: true }
        },
        perform: (agent, item, count) => {
            if (!agent.bot) {
                return "Smelting system not available.";
            }
            
            if (!item) {
                return "Please specify an item to smelt.";
            }
            
            // Start smelting task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                const options = { itemName: item };
                if (count) {
                    options.count = parseInt(count);
                }
                
                agent.taskSystem.startTask('smeltItems', options);
                return `Started smelting task for ${item}${count ? ` (${count} items)` : ''}`;
            } else {
                return "Task system not available for smelting.";
            }
        }
    },
    {
        name: '?collect',
        description: 'Find and collect a specific resource',
        params: {
            'resource': { type: 'string', description: 'Resource to collect' },
            'amount': { type: 'number', description: 'Amount to collect (default: 16)', optional: true }
        },
        perform: (agent, resource, amount) => {
            const collectAmount = amount ? parseInt(amount) : 16;
            
            if (!agent.bot) {
                return "Collection system not available.";
            }
            
            if (!resource) {
                return "Please specify a resource to collect.";
            }
            
            // Start collection task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('collectResource', { 
                    resourceName: resource,
                    amount: collectAmount
                });
                return `Started collection task for ${collectAmount}x ${resource}`;
            } else {
                return "Task system not available for resource collection.";
            }
        }
    }
];
