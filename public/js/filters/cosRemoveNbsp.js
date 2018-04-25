angular
    .module('citizenos')
    .filter('cosRemoveNbsp', function () {
        return function cosRemoveWhitespace(text) {
            return text.replace(/&nbsp;/g, ' ');
        }
    });
