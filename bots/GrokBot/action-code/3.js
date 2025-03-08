(async (bot) => {

    // Mining out a 10x10 area around the bot's current position
    const botPosition = bot.entity.position; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startX = botPosition.x - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startZ = botPosition.z - 5; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let x = startX; x <= startX + 9; x++) {
        for (let z = startZ; z <= startZ + 9; z++) {
            for (let y = botPosition.y - 10; y <= botPosition.y - 1; y++) {
                await bot.dig(bot.blockAt(new Vec3(x, y, z))); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
            }
        }
    }

log(bot, 'Code finished.');

})