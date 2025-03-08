(async (bot) => {

    
    // Digging a 2x10x1 hallway
    let startPos = bot.entity.position.clone(); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    let hallwayLength = 10; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    let hallwayWidth = 2; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    let hallwayHeight = 1; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let z = 0; z < hallwayLength; z++) {
        for (let x = 0; x < hallwayWidth; x++) {
            for (let y = 0; y < hallwayHeight; y++) {
                let block = bot.blockAt(new Vec3(startPos.x + x, startPos.y + y, startPos.z + z)); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                if (block) await bot.dig(block); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
            }
        }
    }
    
    // Digging the 10x10x3 room at the end of the hallway
    let roomStartPos = new Vec3(startPos.x, startPos.y, startPos.z + hallwayLength); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    let roomLength = 10; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    let roomWidth = 10; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    let roomHeight = 3; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (let z = 0; z < roomLength; z++) {
        for (let x = 0; x < roomWidth; x++) {
            for (let y = 0; y < roomHeight; y++) {
                let block = bot.blockAt(new Vec3(roomStartPos.x + x, roomStartPos.y + y, roomStartPos.z + z)); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
                if (block) await bot.dig(block); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
            }
        }
    }

log(bot, 'Code finished.');

})