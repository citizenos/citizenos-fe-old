(function () {
    'use strict';

    // Allow copy-paste use of the directive in 3rd party projects
    var module = null;
    try {
        module = angular.module('citizenos');
    } catch (e) {
        // Deliberate, angular.module('modulename') would throw if a non existing module is fetched and we create a new if the namespace did not exist
        module = angular.module('citizenos', []);
    }

    module
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
})();
