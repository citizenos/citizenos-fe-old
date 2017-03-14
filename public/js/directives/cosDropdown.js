angular
    .module('citizenos')
    .directive('cosDropdown', ['$document', '$compile', function ($document, $compile) {
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {
                var elementClickHandler = function () {
                    elem.toggleClass('dropdown_active');
                    elem.addClass('active_recent');
                };
                elem.on('click', elementClickHandler);

                var documentClickHandler = function () {
                    if (!elem.hasClass('active_recent')) {
                        elem.removeClass('dropdown_active');
                    }
                    elem.removeClass('active_recent');
                };
                $document.on('click', documentClickHandler);

                scope.$on('$destroy', function () {
                    // Don't leave event handlers hanging
                    elem.off('click', elementClickHandler);
                    $document.off('click', documentClickHandler);
                });
            }
        }
    }]);

