angular
    .module('citizenos')
    .directive('cosViewInput', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                var viewIcon = angular.element('<div class="icon_table"><div class="icon_cell"><div class="sprite sprite-icon-eye-on"></div></div></div>');
                elem.after(viewIcon);

                viewIcon.on('click', function () {
                    var eyeElem = angular.element(viewIcon.children().children()[0]);
                    var type = elem.attr('type');
                    if (type === 'password') {
                        elem.attr('type', 'text');
                        eyeElem.removeClass('sprite-icon-eye-on');
                        eyeElem.addClass('sprite-icon-eye-off');
                    } else {
                        elem.attr('type', 'password');
                        eyeElem.removeClass('sprite-icon-eye-off');
                        eyeElem.addClass('sprite-icon-eye-on');
                    }
                });
            }
        }
    }]);
