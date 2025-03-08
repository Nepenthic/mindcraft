(async (bot) => {

    // Mining out a 10x10 area around the current position
    const botPosition = bot.entity.position; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startX = Math.floor(botPosition.x - 5); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startZ = Math.floor(botPosition.z - 5); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startY = Math.floor(botPosition.y - 10); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let x = startX; x < startX + 10; x++) {
        for (let z = startZ; z < startZ + 10; z++) {
            for (let y = startY; y < botPosition.y; y++) {
                const block = bot.blockAt(new Vec3(x, y, z)); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                if (block && block.name === 'stone') {
                    await bot.dig(block); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                }
            }
        }
    }

log(bot, 'Code finished.');

})