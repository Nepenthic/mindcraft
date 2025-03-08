(async (bot) => {

    // Mining out a 10x10 area around the bot
    const botPosition = bot.entity.position; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startX = Math.floor(botPosition.x) - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startZ = Math.floor(botPosition.z) - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let x = startX; x <= startX + 9; x++) {
        for (let z = startZ; z <= startZ + 9; z++) {
            for (let y = botPosition.y - 1; y >= botPosition.y - 10; y--) {
                const block = bot.blockAt(new Vec3(x, y, z)); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                if (block && block.name !== 'air') {
                    await bot.dig(block); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                }
            }
        }
    }

log(bot, 'Code finished.');

})