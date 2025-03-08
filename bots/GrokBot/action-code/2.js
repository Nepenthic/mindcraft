(async (bot) => {

    // Mining out a 10x10 area around the bot
    const botPosition = bot.entity.position; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startX = Math.floor(botPosition.x) - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startZ = Math.floor(botPosition.z) - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const endX = startX + 10; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const endZ = startZ + 10; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let x = startX; x <= endX; x++) {
        for (let z = startZ; z <= endZ; z++) {
            for (let y = Math.floor(botPosition.y) - 1; y >= Math.floor(botPosition.y) - 10; y--) {
                let block = bot.blockAt(new Vec3(x, y, z)); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                if (block.name === 'stone') {
                    await bot.dig(block); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                }
            }
        }
    }

log(bot, 'Code finished.');

})