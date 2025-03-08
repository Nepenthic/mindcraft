(async (bot) => {

    
    // I am mining out a 10x10 area around the bot's current position.
    const position = world.getPosition(bot); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startX = position.x - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startZ = position.z - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let x = startX; x < startX + 10; x++) {
        for (let z = startZ; z < startZ + 10; z++) {
            for (let y = position.y - 2; y <= position.y + 1; y++) {
                // Avoid mining straight down
                if (y < position.y) {
                    const block = bot.blockAt(new Vec3(x, y, z)); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                    if (block && block.name === 'stone') {
                        await skills.mine(bot, x, y, z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                    }
                } else {
                    await skills.mine(bot, x, y, z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                }
            }
        }
    }

log(bot, 'Code finished.');

})