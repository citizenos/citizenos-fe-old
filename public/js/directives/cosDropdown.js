angular
    .module('citizenos')
    .directive('cosDropdown', ['$document', function ($document) {
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {

                elem.bind('click', function () {
                    elem.toggleClass('dropdown_active');
                    elem.addClass('active_recent');
                });

                $document.bind('click', function () {
                    if (!elem.hasClass('active_recent')) {
                        elem.removeClass('dropdown_active');
                    }
                    elem.removeClass('active_recent');
                });

            }
        }
    }]);
