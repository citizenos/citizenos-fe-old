/**
 * CitizenOS Etherpad Lite iframe directive
 *
 * If Angulars JQuery wasn't so limited and .css also returned non-inline styles I could also check if iframes initial size was defined with CSS. @see {@link https://docs.angularjs.org/api/ng/function/angular.element#angular-s-jqlite}
 *
 * TO loose all scrolls, Etherpad Lite needs custom stylesheet where:
 * * #editorcontainer { overflow: hidden }
 * * #outerdocbody { overflow: hidden }
 *
 */
import * as angular from 'angular';
import * as _ from 'lodash';

angular
    .module('citizenos')
    .directive('cosEtherpad', ['$window', '$log', function ($window, $log) {
        return {
            restrict: 'A',
            scope: {
                height: '@?',
                width: '@?'
            },
            link: function (scope, element, attrs) {
                console.log(element)
                var $ = angular.element;

                var minWidth;
                var minHeight;

                var valueNotPercent = function (value) {
                    return (value + '').indexOf('%') < 0;
                };

                if (scope.width && valueNotPercent(scope.width)) {
                    minWidth = parseFloat(scope.width);
                }

                if (scope.height && valueNotPercent(scope.height)) {
                    minHeight = parseFloat(scope.height);
                }

                var receiveMessageHandler = function (e) {
                    var msg = e.data;
                    if (msg.name === 'ep_resize') {
                        var width = msg.data.width;
                        var height = msg.data.height;

                        if (angular.isNumber(width) && width > minWidth) {
                            var newWidth = width + 'px';
                            if (newWidth !== element.css('width')) {
                                element.css('width', newWidth);
                            }
                        }

                        if (angular.isNumber(height) && height > minHeight) {
                            var newHeight = height + 'px';
                            if (newHeight !== element.css('height')) {
                                element.css('height', newHeight);
                            }
                        }
                    }
                };

                var sendScrollMessage = _.debounce(function () {
                    var targetWindow = element[0].contentWindow;

                    var yOffsetExtra = 0; // Additional Y offset in case there is a floating header element
                    var mobileHeader = $window.document.getElementById('mobile_header');
                    if (mobileHeader) {
                        yOffsetExtra = parseFloat($window.getComputedStyle(mobileHeader)['height']);
                    }

                    var data = {
                        scroll: {
                            top: $window.pageYOffset + yOffsetExtra,
                            left: $window.pageXOffset
                        },
                        frameOffset: getFrameOffset()
                    };

                    targetWindow.postMessage({
                        name: 'ep_embed_floating_toolbar_scroll',
                        data: data
                    }, '*');

                }, 100);

                // As angular.element does not support $.offset(), copied it over from Jquery source.
                var getFrameOffset = function () {
                    var elem = element[0];

                    // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
                    // Support: IE <=11 only
                    // Running getBoundingClientRect on a
                    // disconnected node in IE throws an error
                    if (!elem.getClientRects().length) {
                        return {top: 0, left: 0};
                    }

                    var rect = elem.getBoundingClientRect();

                    var doc = elem.ownerDocument;
                    var docElem = doc.documentElement;
                    var win = doc.defaultView;

                    return {
                        top: rect.top + win.pageYOffset - docElem.clientTop,
                        left: rect.left + win.pageXOffset - docElem.clientLeft
                    };
                };

                $($window).on('message onmessage', receiveMessageHandler);
                $($window).on('scroll resize', sendScrollMessage);

                scope.$on('$destroy', function () {
                    // Don't leave handlers hanging...
                    $($window).off('message onmessage', receiveMessageHandler);
                    $($window).off('scroll resize', sendScrollMessage);
                });
            }
        }
    }]);
