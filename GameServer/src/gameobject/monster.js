const log = require('@local/shared/logger');
const { Position } = require('../types');
const util = require('../util');

const GameObject = require('./index');
const Attackable = require('./traits/attackable');
const { Vector2 } = require('three');


class Monster extends util.extender(GameObject, Attackable) {
    constructor({ uid, id, zone, flags, level, statistics, reward, position, respawnTime }) {
        // get all properties from GameObject class
        super(...arguments);

        this.type = 'monster';
        this.objType = 1;

        this.level = level;

        this.reward = {
            experience: reward?.experience || 0,
            gold: reward?.gold || 0,
            items: reward?.items || []
        };

        this.respawnTime = /*respawnTime ||*/ 15 * 1000;

        this.testMoveInRange(250);

        Object.assign(this.statistics, statistics, this.statistics);
    }

    appear(character) {
        if (this.state.dead)
            return;

        character.session.send.appear('monster', {
            uid: this.uid,
            firstAppearance: this.firstAppearance, // TODO:
            id: this.id,
            zoneId: this.zone.id,
            areaId: this.areaId,
            position: this.position,
            health: this.statistics.health.getCurrentValue(),
            maxHealth: this.statistics.maxHealth.getCurrentValue()
        });

        character.addVisibleObject('monster', this.uid);

        this.appearCount += 1;

        // TODO: appearedFirstTime should indicate whether the object appeared for the first time
        this.event.emit('appear', /* appearedFirstTime */);
    }

    appearInRange(range) {
        var characterPoints = this.zone.getObjectsInArea(this.position.x, this.position.y, range)
            .filter(obj => obj.type === 'character');

        for (var obj of characterPoints)
            this.appear(obj.character);
    }

    disappear(character) {
        if (this.state.dead)
            return;

        character.session.send.disappear({
            objType: 1,
            uid: this.uid
        });

        character.removeVisibleObject('monster', this.uid);

        // TODO: disappearedFirstTime should indicate whether the object disappeared for the first time
        this.event.emit('disappear', /* disappearedFirstTime */);
    }

    die() {
        super.die();
        setTimeout(() => this.respawn(), this.respawnTime);
        this.event.emit('die');
    }
}

module.exports = Monster;