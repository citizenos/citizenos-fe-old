angular
    .module('citizenos')
    .directive('required', ['$translate', function ($translate) {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                if(attrs.placeholder){
                   $translate(attrs.placeholder)
                    .then(function (translatedValue) {
                      elem.attr('placeholder', translatedValue+' *');
                    });
                }
            }
        }
    }]);
