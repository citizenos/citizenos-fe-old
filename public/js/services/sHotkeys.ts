'use strict';
/*
 Enables function calling from key combinations
 */
import * as angular from 'angular';
import * as _ from 'lodash';
angular
    .module('citizenos')
    .service('sHotkeys', ['$state', '$document', '$log', function ($state, $document, $log) {
        var sHotkeys = this;

        var KEYMAP = {
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

        var EVENTMAP = [];

        sHotkeys.keysDown = [];

        init();

        sHotkeys.add = function (keys, callback) {
            var keysList = keys.split('+');
            var combo = [];
            for (var i = 0; i < keysList.length; i++) {
                var key = keysList[i].toLowerCase();
                if (_.values(KEYMAP).indexOf(key) > -1) {
                    var code = Object.keys(KEYMAP)[_.values(KEYMAP).indexOf(key)];
                    combo.push(parseInt(code));
                }
                else {
                    $log.error('COULD NOT ADD KEY', key);
                    return;
                }
            }
            EVENTMAP.push({keys: combo, callback: callback});
        };

        function keyDown() {
            $document.find('html').bind('keydown', function (e) {
                if (sHotkeys.keysDown.indexOf(e.keyCode) < 0) {
                    sHotkeys.keysDown.push(e.keyCode);
                    for (var x = 0; x < EVENTMAP.length; x++) {
                        if (sHotkeys.keysDown.length >= EVENTMAP[x].keys.length) {
                            var matchCount = 0;
                            var matchNeeded = EVENTMAP[x].keys.length;
                            for (var i = 0; i < sHotkeys.keysDown.length; i++) {
                                if (EVENTMAP[x].keys.indexOf(sHotkeys.keysDown[i]) > -1) {
                                    matchCount++;
                                    if (matchCount === matchNeeded) {
                                        sHotkeys.keysDown = [];
                                        var cb = EVENTMAP[x].callback;
                                        cb();
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        function keyUp() {
            $document.find('html').bind('keyup', function (e) {
                sHotkeys.keysDown.splice(sHotkeys.keysDown.indexOf(e.keyCode, 1));
            });
        }

        function init() {
            keyDown();
            keyUp();
            sHotkeys.keysDown = [];

            var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
            for (var i = 0; i < alphabet.length; ++i) {
                KEYMAP[alphabet[i].charCodeAt(0) - 32] = alphabet[i];
            }
            /**
             * loop through the f keys, f1 to f19 and add them to the map
             * programmatically
             */
            for (i = 1; i < 20; ++i) {
                KEYMAP[111 + i] = 'f' + i;
            }

            /**
             * loop through to map numbers on the numeric keypad
             */
            for (i = 0; i <= 9; ++i) {
                KEYMAP[i + 96] = i;
            }
        }

    }]);
