const db = require('@local/shared/db');
const util = require('../util');

class InventoryRow {
    constructor({ itemUid, item, plus, stack, wearingPosition, flag, durability, options, stackUids }) {
        this.itemUid = itemUid;
        this.item = item;

        this.stackUids = stackUids || [];

        this.wearingPosition = wearingPosition ?? 255;
        this.stack = stack || 1;
        this.plus = plus || 0;
        this.flag = flag || 0;
        this.durability = durability || -1;
        this.options = options || [];
    }
}

class Inventory {
    PLATINUM_MAX_PLUS = 127;
    FLAG_ITEM_PLATINUM_GET = (a, b) => (b = a & PLATINUM_MAX_PLUS);
    FLAG_ITEM_PLATINUM_SET = (a, b)	=> (a = ( (a &~ PLATINUM_MAX_PLUS) | b ));
    FLAG_ITEM_OPTION_ENABLE = (1 << 7);
    FLAG_ITEM_SEALED = (1 << 8);
    FLAG_ITEM_SUPER_STONE_USED = (1 << 9);
    FLAG_ITEM_BOOSTER_ADDED = (1 << 10);
    FLAG_ITEM_SILVERBOOSTER_ADDED = (1 << 11);
    FLAG_ITEM_GOLDBOOSTER_ADDED = (1 << 12);
    FLAG_ITEM_PLATINUMBOOSTER_ADDED = (1 << 13);
    FLAG_ITEM_COMPOSITION = (1 << 14);
    FLAG_ITEM_LENT = (1 << 15);
    FLAG_ITEM_LEVELDOWN = (1 << 16);

    MAX_TABS = 3;
    MAX_COLUMNS = 20;
    MAX_ROWS = 5;

    TAB_DEFAULT = 0;
    TAB_QUEST = 1;
    TAB_EVENT = 2;

    constructor({ owner }) {
        this.owner = owner;
        this.items = Array.from(Array(this.MAX_TABS), () => Array.from(Array(this.MAX_COLUMNS), () => new Array(this.MAX_ROWS)));
        
        // TODO:
        this.weight = 3000;
        this.maxWeight = 150000;
    }

    find(tab, opts) {
        for(var col = 0; col < this.MAX_COLUMNS; col++) {
            var row = this.items[tab][col].findIndex(opts);

            if(row != -1) {
                return {
                    position: {
                        tab: tab,
                        col: col,
                        row: row
                     },
                     data: this.items[tab][col][row]
                };
            }
        }
    }

    filter(tab, opts) {
        var results = [];

        for(var col = 0; col < this.MAX_COLUMNS; col++) {
            var rows = this.items[tab][col].filter(opts);

            if(rows.length)
                results.push(...rows);
        }

        return results;
    }

    findEmptyRow(tab) {
        for(var col = 0; col < this.MAX_COLUMNS; col++) {
            var row = this.items[tab][col].findIndex((i) => (typeof i === "undefined"));

            if(row != -1) {
                return {
                    tab: tab,
                    col: col,
                    row: row
                };
            }
        }
    }

    add(tab, invenRow, sendMsg = true) {
        var result = this.findEmptyRow(tab);

        if(!result) {
            this.owner.session.send.sys(3); // MSG_SYS_FULL_INVENTORY
            return false;
        }

        var stmt = db.query(`
            UPDATE items 
            SET accountId = ?, charId = ?, place = ?, position = ?
            WHERE id = ? OR parentId = ?`,
            [this.owner.session.accountId, this.owner.id, 1, [tab, result.col, result.row].join(','), invenRow.itemUid, invenRow.itemUid]);

        if(!stmt) {
            // TODO: handle error
            return false;
        }

        this.items[tab][result.col][result.row] = invenRow;

        var pos = {
            position: {
                tab: tab,
                col: result.col,
                row: result.row
            }
        };

        // send item to client
        if(sendMsg)
            this.owner.session.send.item('MSG_ITEM_ADD', { ...invenRow, ...pos });

        return pos;
    }

    addToPosition(position, row) {
        if(!this.isEmptyAt(position))
            return false;
        
        this.items[position.tab][position.col][position.row] = row;
        return true;
    }

    isEmptyAt(position) {
        return (typeof this.items[position.tab][position.col][position.row] === 'undefined')
    }

    swap(tab, src, dst) {
        var srcRow = this.items[tab][src.position.col][src.position.row];
        var dstRow = this.items[tab][dst.position.col][dst.position.row];

        // TODO: packet seems to be malformed, better log it in the future
        if(src.uid != srcRow.itemUid)
            return false;

        if(srcRow == undefined || (dst.uid != -1 && dstRow == undefined))
            return false;
        
        var result = db.query(`
            UPDATE items 
            SET position = ?
            WHERE id = "?" OR parentId = ?`,
            [[tab, dst.position.col, dst.position.row].join(','), srcRow.itemUid, srcRow.itemUid]);

        // TODO: handle error

        this.items[tab][src.position.col][src.position.row] = dstRow;

        if(dstRow != undefined) {
            result = db.query(`
                UPDATE items 
                SET position = ?
                WHERE id = ? OR parentId = ?`,
                [[tab, src.position.col, src.position.row].join(','), dstRow.itemUid, dstRow.itemUid]);
        }

        this.items[tab][dst.position.col][dst.position.row] = srcRow;
        
        // TODO: handle error

        // send swap to client
        this.owner.session.send.item('MSG_ITEM_SWAP', { tab, src, dst });

        return true;
    }

    update(position, opts) {
        if(opts)
            Object.assign(this.items[position.tab][position.col][position.row], opts);
    }

    remove(position) {
        this.items[position.tab][position.col][position.row] = undefined;
    }

    async equip(position, wearingPosition) {
        var requestedRow = this.items[position.tab][position.col][position.row];

        var stmt = await db.query(
            "UPDATE items SET wearingPosition = ? WHERE charId = ? AND id = ?",
            [wearingPosition, this.owner.id, requestedRow.itemUid]);

        if(!stmt) {
            // TODO: error handling
            return false;
        }

        requestedRow.wearingPosition = wearingPosition;
        this.owner.event.emit('inventory-equip', requestedRow);

        return true;
    }

    async unequip(wearingPosition) {
        var result;

        for(var col = 0; col < this.MAX_COLUMNS; col++) {
            var row = this.items[this.TAB_DEFAULT][col].findIndex((i) => (i?.wearingPosition == wearingPosition));

            if(row != -1) {
                var stmt = await db.query(
                    "UPDATE items SET wearingPosition = NULL WHERE charId = ? AND id = ?",
                    [this.owner.id, this.items[this.TAB_DEFAULT][col][row].itemUid]);

                if(!stmt) {
                    // TODO: error handling
                    result = false;
                }

                this.items[this.TAB_DEFAULT][col][row].wearingPosition = 255;

                result = {
                    position: {
                        tab: this.TAB_DEFAULT,
                        col: col,
                        row: row
                    },
                    data: this.items[this.TAB_DEFAULT][col][row]
                };

                this.owner.event.emit('inventory-unequip', this.items[this.TAB_DEFAULT][col][row]);
            }
        }

        return result;
    }

    get() {
        return this.items;
    }
}

module.exports = { Inventory, InventoryRow };