const message = require('@local/shared/message');

module.exports = {
    messageName: 'MSG_APPEAR',
    send: function (session, msgId)
    {
        return (subType, data) =>
        {
            const appearCharacter = () =>
            {            
                var msg = new message({ type: msgId });
                       
                msg.write('u8', 1);             // new
                msg.write('u8', 0);             // m_type
                msg.write('i32>', 1);           // m_index
                msg.write('stringnt', 'test');  // name
                msg.write('u8', 1);             // m_job
                msg.write('u8', 1);             // hairstyle
                msg.write('u8', 1);             // facestyle
    
                msg.write('f<', 1255);          // X
                msg.write('f<', 341);           // Z
                msg.write('f<', 160);           // H
                msg.write('f<', 0);             // R
                msg.write('u8', 0);             // Y LAYER
    
                msg.write('i16>', 100);         // hp
                msg.write('i16>', 1000);        // maxhp
    
                msg.write('u8', 0);             // player state
                msg.write('i32>', 0);           // pkpenalty
                msg.write('u8', 0);             // getpkname
    
                var armor = [ 75, 34, 48, 38, 49, 39, 41 ];
                var plus =  [ 15, 15, 15, 15, 15, 15, 15 ];
    
                for(var i = 1; i <= 6; ++i) {
                    msg.write('i32>', armor[i - 1]);
                    msg.write('i32>', plus[i - 1]);
                }
    
                msg.write('i32>', 0);           // assist state
                msg.write('u8', 1);             // assist count
                
                for(var i = 0; i < 1; i++) {
                    msg.write('i32>', -1);
                    msg.write('i32>', -1);
                    msg.write('u8', 0);
                    msg.write('i32>', -1);
                }
                
                for(var i = 0; i < 1; i++) {
                    msg.write('i32>', -1);
                    msg.write('i32>', -1);
                    msg.write('u8', 0);
                    msg.write('i32>', -1);
                }
    
                msg.write('u8', 0);                     // personal shop mode
                msg.write('stringnt', '');              // title
    
                msg.write('i32>', -1);                     // guild id
                msg.write('stringnt', '');              // guild name
    
                msg.write('i32>', -1);                     // 
                msg.write('i32>', -1);                     // 
    
                session.write(msg.build({ }));
            }

            // data = { uid, id, isNew, position }
            const appearNpc = (data) =>
            {
                var msg = new message({ type: msgId });
    
                msg.write('u8', data.isNew ?? 0);                           // New
                msg.write('u8', 1);                                         // Appear Type
                msg.write('i32>', data.uid);                                // Unique ID
                msg.write('i32>', parseInt(data.id));                       // NPC ID
                msg.write('f<', parseFloat(data.position.x).toFixed(1));    // X
                msg.write('f<', parseFloat(data.position.z).toFixed(1));    // Z
                msg.write('f<', parseFloat(data.position.h).toFixed(1));    // H
                msg.write('f<', parseFloat(data.position.r).toFixed(1));    // R
                msg.write('u8', 0);                                         // Y LAYER
                msg.write('i32>', 10000);                                   // Health
                msg.write('i32>', 10000);                                   // Max Health
                msg.write('i32>', 0);                                       // Assist State
                msg.write('u8', 0);                                         // Assist Count
                msg.write('u8', 0);                                         // Attribute Position

                session.write(msg.build({ }));
            };

            const subTypeHandler = {
                'CHARACTER': () => appearCharacter(data),
                'NPC': () => appearNpc(data)
            };

            if(subType in subTypeHandler)
                subTypeHandler[subType]();
        }
    }
}