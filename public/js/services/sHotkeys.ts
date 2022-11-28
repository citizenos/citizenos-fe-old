'use strict';
/*
 Enables function calling from key combinations
 */
import * as angular from 'angular';

export class Hotkeys {
    private KEYMAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'ins',
        46: 'del',
        91: 'meta',
        93: 'meta',
        224: 'meta',
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111: '/',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };

    private EVENTMAP = [];

    private keysDown = [];

    constructor (private $state, private $document, private $log) {
        this.keyDown();
        this.keyUp();
        this.keysDown = [];

        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        for (let i = 0; i < alphabet.length; ++i) {
            this.KEYMAP[alphabet[i].charCodeAt(0) - 32] = alphabet[i];
        }
        /**
         * loop through the f keys, f1 to f19 and add them to the map
         * programmatically
         */
        for (let i = 1; i < 20; ++i) {
            this.KEYMAP[111 + i] = 'f' + i;
        }

        /**
         * loop through to map numbers on the numeric keypad
         */
        for (let i = 0; i <= 9; ++i) {
            this.KEYMAP[i + 96] = i;
        }
    }

    add (keys, callback) {
        const keysList = keys.split('+');
        const combo = [];
        for (let i = 0; i < keysList.length; i++) {
            const key = keysList[i].toLowerCase();
            if (Object.values(this.KEYMAP).indexOf(key) > -1) {
                const code = Object.keys(this.KEYMAP)[Object.values(this.KEYMAP).indexOf(key)];
                combo.push(parseInt(code));
            }
            else {
                this.$log.error('COULD NOT ADD KEY', key);
                return;
            }
        }
        this.EVENTMAP.push({keys: combo, callback: callback});
    };

    keyDown () {
        this.$document.find('html').bind('keydown', (e) => {
            if (this.keysDown.indexOf(e.keyCode) < 0) {
                this.keysDown.push(e.keyCode);
                for (let x = 0; x < this.EVENTMAP.length; x++) {
                    if (this.keysDown.length >= this.EVENTMAP[x].keys.length) {
                        let matchCount = 0;
                        const matchNeeded = this.EVENTMAP[x].keys.length;
                        for (var i = 0; i < this.keysDown.length; i++) {
                            if (this.EVENTMAP[x].keys.indexOf(this.keysDown[i]) > -1) {
                                matchCount++;
                                if (matchCount === matchNeeded) {
                                    this.keysDown = [];
                                    const cb = this.EVENTMAP[x].callback;
                                    cb();
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    keyUp () {
        this.$document.find('html').bind('keyup', (e) => {
            this.keysDown.splice(this.keysDown.indexOf(e.keyCode, 1));
        });
    }
}

angular
    .module('citizenos')
    .service('sHotkeys', ['$state', '$document', '$log', Hotkeys ]);
