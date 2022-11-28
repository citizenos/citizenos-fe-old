import * as angular from 'angular';
angular
    .module('citizenos')
    .filter('wrapWithSpan', ['$sanitize', function ($sanitize) {
        return function wrapWithSpan(text, value, cssClass) {
            var valueNew = '<span class=":cssClass">:value</span>'
                .replace(':value', $sanitize(value))
                .replace(':cssClass', cssClass);
            return text.replace(new RegExp(value, 'ig'), valueNew);
        };
    }]);
