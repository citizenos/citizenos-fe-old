'use strict';

angular
    .module('citizenos')
    .service('sNotification', ['$log', function ($log) {
        var sNotification = this;

        sNotification.levels = {
            SUCCESS: 'success',
            INFO: 'info',
            ERROR: 'error'
        };

        // FYI: One should never access this directly, but via functions.
        // At this point I have no idea how to make the object and its properties read-only.
        sNotification.messages = {};
        sNotification.dialog = null;

        var init = function () {
            Object.keys(sNotification.levels).forEach(function (key) {
                sNotification.messages[sNotification.levels[key]] = [];
            });
            sNotification.dialog = null;
        };
        init();

        var add = function (level, key) {
            if (sNotification.messages[level].indexOf(key) === -1) {
                sNotification.messages[level].push(key);
            }
        };

        sNotification.removeAll = function (level) {
            if (level) {
                sNotification.messages[level] = [];
            } else {
                init();
            }
        };

        sNotification.addInfo = function (key) {
            add(sNotification.levels.INFO, key);
        };

        sNotification.addError = function (key) {
            add(sNotification.levels.ERROR, key);
        };

        sNotification.showDialog = function (heading, content) {
            sNotification.dialog = {
                heading: heading,
                content: content
            }
        };

        return sNotification;
    }]);
