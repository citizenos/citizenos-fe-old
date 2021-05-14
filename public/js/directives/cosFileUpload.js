angular
    .module('citizenos')
    .directive('cosFileUpload', [function ($parse) {
        return {
            restrict: 'A',
            scope: {
                select: '=?'
            },
            link: function (scope, element, attrs) {
                //Bind change event on the element
                element.bind('change', function () {
                    //Call apply on scope, it checks for value changes and reflect them on UI
                    scope.$apply(function () {
                        //set the model value
                        scope.select(element[0].files);
                    });
                });
            }
        };
    }]);