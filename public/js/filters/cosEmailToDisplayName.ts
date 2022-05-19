import * as angular from 'angular';
angular
    .module('citizenos')
    .filter('emailToDisplayName', function () {
        return function emailToDisplayName(email) {
            if (!email || !email.indexOf('@') || email.indexOf('@') < 1) return null;

            var displayName = '';

            email.split('@')[0].split(/[\._-]/).forEach(function (val) {
                displayName += val.charAt(0).toUpperCase() + val.substr(1) + ' ';
            });

            return displayName.trim();
        }
    });
