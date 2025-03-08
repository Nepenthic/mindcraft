/**
 * Building commands for GrokBot
 * Handles structure building, placement, and terraforming
 */

export const buildingQueries = [
    {
        name: '?build',
        description: 'Build a structure with specified parameters',
        params: {
            'structure': { type: 'string', description: 'Type of structure to build (house, tower, wall, farm)' },
            'size': { type: 'string', description: 'Size of the structure (small, medium, large)', optional: true }
        },
        perform: (agent, structure, size) => {
            const structureSize = size || 'medium';
            
            if (!agent.bot) {
                return "Building system not available.";
            }
            
            if (!structure) {
                return "Please specify a structure to build.";
            }
            
            // Start building task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('buildStructure', { 
                    structureType: structure,
                    size: structureSize
                });
                return `Started building task for a ${structureSize} ${structure}`;
            } else {
                return "Task system not available for building.";
            }
        }
    },
    {
        name: '?place',
        description: 'Place a specific block or item',
        params: {
            'item': { type: 'string', description: 'Item to place (furnace, chest, torch, etc)' },
            'count': { type: 'number', description: 'Number of items to place (default: 1)', optional: true }
        },
        perform: (agent, item, count) => {
            const placeCount = count ? parseInt(count) : 1;
            
            if (!agent.bot) {
                return "Placement system not available.";
            }
            
            if (!item) {
                return "Please specify an item to place.";
            }
            
            // Determine which placement task to use based on item type
            let taskName = 'placeBlock';
            if (item.toLowerCase() === 'furnace') {
                taskName = 'placeFurnace';
            } else if (item.toLowerCase() === 'chest') {
                taskName = 'placeChest';
            } else if (item.toLowerCase() === 'farm') {
                taskName = 'buildFarm';
            }
            
            // Start placement task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask(taskName, { 
                    itemName: item,
                    count: placeCount
                });
                return `Started placement task for ${placeCount}x ${item}`;
            } else {
                return "Task system not available for item placement.";
            }
        }
    },
    {
        name: '?mine',
        description: 'Mine blocks of a specific type',
        params: {
            'block': { type: 'string', description: 'Type of block to mine' },
            'count': { type: 'number', description: 'Number of blocks to mine (default: 16)', optional: true }
        },
        perform: (agent, block, count) => {
            const mineCount = count ? parseInt(count) : 16;
            
            if (!agent.bot) {
                return "Mining system not available.";
            }
            
            if (!block) {
                return "Please specify a block type to mine.";
            }
            
            // Start mining task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('mineBlock', { 
                    blockType: block,
                    count: mineCount
                });
                return `Started mining task for ${mineCount}x ${block}`;
            } else {
                return "Task system not available for mining.";
            }
        }
    },
    {
        name: '?dig',
        description: 'Dig an area or create a specific excavation',
        params: {
            'shape': { type: 'string', description: 'Shape to dig (hole, trench, foundation)' },
            'size': { type: 'number', description: 'Size parameter (width or radius in blocks)', optional: true },
            'depth': { type: 'number', description: 'Depth in blocks', optional: true }
        },
        perform: (agent, shape, size, depth) => {
            const digSize = size ? parseInt(size) : 3;
            const digDepth = depth ? parseInt(depth) : 2;
            
            if (!agent.bot) {
                return "Digging system not available.";
            }
            
            if (!shape) {
                return "Please specify a shape to dig.";
            }
            
            // Start digging task if task system is available
            if (agent.taskSystem && agent.taskSystem.startTask) {
                agent.taskSystem.startTask('digArea', { 
                    shape: shape,
                    size: digSize,
                    depth: digDepth
                });
                return `Started digging task for a ${shape} (size: ${digSize}, depth: ${digDepth})`;
            } else {
                return "Task system not available for digging.";
            }
        }
    }
];
