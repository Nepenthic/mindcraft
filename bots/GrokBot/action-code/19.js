(async (bot) => {

    
    // Get the current position of the bot
    const position = world.getPosition(bot); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    // Define the area to clean up
    const cleanupArea = {
      xMin: position.x - 5,
      xMax: position.x + 5,
      zMin: position.z - 5,
      zMax: position.z + 5,
      yMin: position.y,
      yMax: position.y + 3
    }; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    // Remove unwanted blocks in the cleanup area
    for (let x = cleanupArea.xMin; x <= cleanupArea.xMax; x++) {
      for (let z = cleanupArea.zMin; z <= cleanupArea.zMax; z++) {
        for (let y = cleanupArea.yMin; y <= cleanupArea.yMax; y++) {
          const block = await world.getBlockType(bot, x, y, z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
          if (block !== 'air' && block !== 'grass_block' && block !== 'dirt') {
            await skills.digBlock(bot, x, y, z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
          }
        }
      }
    }
    
    // Organize items in the inventory
    await skills.organizeInventory(bot); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    // Place torches for light
    const torchPositions = [
      new Vec3(position.x - 3, position.y + 1, position.z),
      new Vec3(position.x + 3, position.y + 1, position.z),
      new Vec3(position.x, position.y + 1, position.z - 3),
      new Vec3(position.x, position.y + 1, position.z + 3)
    ]; if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    
    for (const torchPos of torchPositions) {
      await skills.placeBlock(bot, 'torch', torchPos.x, torchPos.y, torchPos.z); if(bot.interrupt_code) {log(bot, "Code interrupted.");return;}
    }

log(bot, 'Code finished.');

})