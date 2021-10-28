'use strict';

angular
    .module('citizenos')
    .service('sNotification', ['$timeout', function ($timeout) {
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

        sNotification.addSuccess = function (key) {
            add(sNotification.levels.SUCCESS, key);
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

        sNotification.inline = function (text, X, Y) {
            var el = document.createElement("div");
            el.className = 'inline-message';
            el.innerText = text;
            el.style.left = X + 'px';
            el.style.top = Y + 'px';

            document.body.appendChild(el);
            $timeout(function () {
                el.classList.add('no-opacity');
            }, 300);

            $timeout(function () {
                el.remove();
            }, 1000);
        }

        return sNotification;
    }]);
