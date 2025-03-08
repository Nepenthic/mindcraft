(async (bot) => {

    // Mining down 10 blocks then to the left and right for stone
    const botPosition = bot.entity.position; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    const startY = botPosition.y; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    // Mining down 10 blocks
    for (let y = startY - 1; y >= startY - 10; y--) {
        await skills.dig(bot, botPosition.x, y, botPosition.z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    }
    
    // Mining to the left and right
    for (let x = botPosition.x - 1; x <= botPosition.x + 1; x += 2) {
        for (let y = startY - 10; y <= startY - 1; y++) {
            await skills.dig(bot, x, y, botPosition.z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
        }
    }

log(bot, 'Code finished.');

})