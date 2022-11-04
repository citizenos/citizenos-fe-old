'use strict';
import * as angular from 'angular';

export class Notification {
    private levels = {
        SUCCESS: 'success',
        INFO: 'info',
        ERROR: 'error'
    };

    // FYI: One should never access this directly, but via functions.
    // At this point I have no idea how to make the object and its properties read-only.
    private messages = {};
    private dialog = null;

    constructor (private $timeout) {
        this.init();
    };

    private init = () => {
        Object.keys(this.levels).forEach((key) => {
            this.messages[this.levels[key]] = [];
        });
        this.dialog = null;
    };

    add (level, key) {
        if (this.messages[level].indexOf(key) === -1) {
            this.messages[level].push(key);
        }
    };

    removeAll (level) {
        if (level) {
            this.messages[level] = [];
        } else {
            this.init();
        }
    };

    addSuccess (key) {
        this.add(this.levels.SUCCESS, key);
    };

    addInfo (key) {
        this.add(this.levels.INFO, key);
    };

    addError (key) {
        this.add(this.levels.ERROR, key);
    };

    showDialog (heading, content) {
        this.dialog = {
            heading: heading,
            content: content
        }
    };

    inline (text, X, Y) {
        const el = document.createElement("div");
        el.className = 'inline-message';
        el.innerText = text;
        el.style.left = X + 'px';
        el.style.top = Y + 'px';

        document.body.appendChild(el);
        this.$timeout(() => {
            el.classList.add('no-opacity');
        }, 300);

        this.$timeout(() => {
            el.remove();
        }, 1000);
    };
};

angular
    .module('citizenos')
    .service('sNotification', ['$timeout', Notification]);
