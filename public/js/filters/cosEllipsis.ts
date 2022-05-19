import * as angular from 'angular';
angular
    .module('citizenos')
    .filter('cosEllipsis', function () {
        return function cosEllipsis(text, limit) {
            if (!text || typeof text !== 'string') return null;

            if (!limit) {
                limit = 128;
            }

            return text.substr(0, limit) + (text.length > limit ? '...' : '');
        }
    });
