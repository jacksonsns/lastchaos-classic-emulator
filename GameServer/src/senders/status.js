const Message = require('@local/shared/message');

module.exports = {
    messageName: 'MSG_STATUS',
    send: function (session, msgId)
    {
        return (data) =>
        {
            var msg = new Message({ type: msgId });
    
            msg.write('i32>', data.level);                  // Level
            msg.write('u64>', data.experience);             // Current Experience
            msg.write('u64>', data.maxExperience);          // Max Experience
            msg.write('i32>', data.health.getCurrentValue());           // Current Health Points
            msg.write('i32>', data.maxHealth.getCurrentValue());        // Max Health Points
            msg.write('i32>', data.mana.getCurrentValue());             // Current Mana Points
            msg.write('i32>', data.maxMana.getCurrentValue());          // Max Mana Points
            
            msg.write('i32>', data.strength.getCurrentValue());         // Strength
            msg.write('i32>', data.dexterity.getCurrentValue());        // Dexterity
            msg.write('i32>', data.intelligence.getCurrentValue());     // Intelligence
            msg.write('i32>', data.condition.getCurrentValue());        // Condition
            
            msg.write('i32>', data.strengthAdded);    // Added Strength
            msg.write('i32>', data.dexterityAdded);   // Added Dexterity
            msg.write('i32>', data.intelligenceAdded);// Added Intelligence
            msg.write('i32>', data.conditionAdded);   // Added Condition
            
            msg.write('i32>', data.attack.getCurrentValue());           // Attack
            msg.write('i32>', data.magicAttack.getCurrentValue());      // Magic Attack
            
            msg.write('i32>', data.defense.getCurrentValue());          // Defense
            msg.write('i32>', data.magicResist.getCurrentValue());      // Magic Resist
            
            msg.write('i32>', data.skillpoint);             // Skillpoint

            msg.write('i32>', data.weight);                 // Weight
            msg.write('i32>', data.maxWeight);              // Max Weight
            
            msg.write('f<', data.walkSpeed.getCurrentValue());          // Walk Speed
            msg.write('f<', data.runSpeed.getCurrentValue());           // Run Speed
            
            msg.write('u8', data.attackSpeed.getCurrentValue());        // Attack Speed
            msg.write('u8', data.magicSpeed.getCurrentValue());         // Magic Speed (?)
            
            msg.write('u8', data.pkName);                   // PK Name
            msg.write('i32>', data.pkPenalty);              // PK Penalty
            msg.write('i32>', data.pkCount);                // PK Count

            msg.write('i32>', data.reputation);             // Reputation (Fame)
            msg.write('f<', data.attackRange.getCurrentValue());        // Attack Range
            msg.write('u8', data.meracJoinFlag);            // GetJoinFlag(ZONE_MERAC)
            msg.write('i32>', data.skillSpeed.getCurrentValue());       // Skill Speed
            msg.write('u8', data.mapAttr);                  // GetMapAttr()

            msg.write('u8', 0);                             // UNK1
            msg.write('u8', 0);                             // UNK2
            msg.write('i32>', 0);                           // UNK3

            session.write(msg.build());
        }
    }
}