import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('slideController', ['$timeout', '$swipe', '$rootScope', '$window', '$parse',
        function ($timeout, $swipe, $rootScope, $window) {
            return {
                restrict: 'EA',
                /* Do one-way binding for attribute start_slide_at, NOTE camelcase */
                scope: {
                    startSlideAt: '@',
                    identifier: '@',
                    class: '@'
                },
                link: function (scope, element, attrs) {
                    var getElementStyle = function (element) {
                        return $window.getComputedStyle(element[0], null);
                    };

                    var getElementWidth = function (element) {
                        return Number($window.getComputedStyle(element[0], null).width.replace('px', ''));
                    };

                    var getElementMarginLeft = function (element) {
                        return Number($window.getComputedStyle(element[0], null)['margin-left'].replace('px', ''));
                    };

                    var getElementPaddingLeft = function (element) {
                        return Number($window.getComputedStyle(element[0], null)['padding-left'].replace('px', ''));
                    };

                    var getElementMaxDistanceLeft = function (element) {
                        return (getElementMarginLeft(element) + getElementWidth(element)) * -1 + $rootScope.wWidth - getElementPaddingLeft(element);
                    };

                    element.ready(function () {
                        /* Define multiple variables */
                        var startX, target_position, last_element_position, element_drag_speed, stop_position, ease_animation, new_element_position;
                        var element_style = getElementStyle(element);
                        var element_width = getElementWidth(element);
                        var element_max_distance_left = getElementMaxDistanceLeft(element);

                        var speeding_ticket;

                        /* Start touch-drag code */
                        $swipe.bind(element, {
                            'start': function (coords) {
                                /* Get mouse starting coordinates */
                                startX = coords.x;

                                /* Clear interval that was set on drag end */
                                clearInterval(ease_animation);

                                last_element_position = element_style['margin-left'].replace('px', '');

                                /* Get current speed of draggable object */
                                speeding_ticket = setInterval(function () {
                                    new_element_position = element_style['margin-left'].replace('px', '');
                                    element_drag_speed = Math.abs(last_element_position - new_element_position);

                                    /* Limit maximum drag speed */
                                    if (element_drag_speed > 8) {
                                        element_drag_speed = 8;
                                    }

                                    /* Check which way the object was moved (left or right) */
                                    if (last_element_position - new_element_position >= 0) {
                                        element_drag_speed *= -1;
                                    }

                                    /* Update kast element position to use it in new interval */
                                    last_element_position = element_style['margin-left'].replace('px', '');

                                }, 20);


                            },
                            'move': function (coords) {
                                if (element_width >= $rootScope.wWidth) {
                                    /* Get delta by subtracting mouse drag start coordinates by current live mouse coordinates */
                                    var delta = coords.x - startX;

                                    /* Set element position vairable */
                                    var element_position_current = getElementMarginLeft(element) + delta;
                                    /* Make sure div stays inside boundaries and if it's outside, set correct position */
                                    if (element_position_current > element_max_distance_left && element_position_current < 0) {
                                        target_position = element_position_current;
                                    } else if (element_position_current < element_max_distance_left && element_position_current < 0) {
                                        target_position = element_max_distance_left;
                                    } else if (element_position_current > 0) {
                                        target_position = 0;
                                    }

                                    /* Set element position live */
                                    element[0].style.marginLeft = target_position + 'px';
                                }
                            },
                            'end': function (coords) {

                                /* Clear interval that was set on drag start */
                                clearInterval(speeding_ticket);
                                /* Get current position of the element */
                                var elementX_current_position = Number(element_style['margin-left'].replace('px', ''));

                                /* Ease element to final position */
                                /* Only do the ease if easing speed is greater than 0 and the element is inside the boundaries and not at the sides of the boundaries */
                                if (element_drag_speed != 0 && elementX_current_position != 0 && elementX_current_position != element_max_distance_left) {

                                    /* Set interval for easing animation */
                                    ease_animation = setInterval(function () {

                                        /* Set deceleration speed */
                                        element_drag_speed = element_drag_speed / 1.1;
                                        elementX_current_position = Number(element_style['margin-left'].replace('px', '')) + element_drag_speed;

                                        /* If element's speed is lower than 0.1 stop the interval to avoid unneeded calculations */
                                        if (Math.abs(element_drag_speed) < 0.1) {
                                            clearInterval(ease_animation);
                                            /* Make sure div stays inside boundaries and if it's outside, set correct position */
                                        } else if (elementX_current_position < element_max_distance_left && elementX_current_position < 0) {
                                            stop_position = element_max_distance_left;
                                            clearInterval(ease_animation);
                                            /* Make sure div stays inside boundaries and if it's outside, set correct position */
                                        } else if (elementX_current_position > 0) {
                                            stop_position = 0;
                                            clearInterval(ease_animation);
                                        } else {
                                            stop_position = elementX_current_position;
                                        }
                                        /* Move the element according to final easing speed */
                                        element[0].style.marginLeft = stop_position + 'px';
                                    }, 10);
                                }
                            },
                            'cancel': function (coords) {
                                clearInterval(speeding_ticket);
                            }
                        });

                        var onWindowResize = function () {
                            element[0].style.marginLeft = '0px';
                            element_max_distance_left = getElementMaxDistanceLeft(element);
                        };

                        var window = angular.element($window);

                        window.bind('resize', onWindowResize);

                        scope.$on('$destroy', function () {
                            window.unbind('resize', onWindowResize);
                        });
                    });
                }
            }
        }]);


//Initial positioning and getting dimensions of tabs train
angular
    .module('citizenos')
    .directive('dimensions', ['$timeout', '$rootScope',
        function ($timeout, $rootScope) {
            //Set initial tab lengh variable
            $rootScope.tabLength = 0; // Ugh, not nice to use $rootScope like this...
            return {

                link: function (scope, elem) {
                    $timeout(function () {

                        //To set all tabs the same width use this code below
                        if ($rootScope.tabLength < elem[0].offsetWidth) {
                            $rootScope.tabLength = elem[0].offsetWidth;
                        }
                        //If last element in ng-repeat is reached execute
     //                   if (scope.$last === true) {

                            //Get the length of widest tab (and set it to all tabs <= in DOM)
                            $rootScope.tabFinalLength = $rootScope.tabLength + 2;

                            //Get the number of elements in ng-repeat
                            var numberOfElements = scope.$index + 1;

                            //Get the length of tabs train
                            $rootScope.tabsTrainWidth = ($rootScope.tabFinalLength + 10) * numberOfElements;

                            //Get the length of visible area
                            $rootScope.tabsVisibleAreaWidth = elem[0].parentElement.parentElement.parentElement.offsetWidth;

                            //If all the tabs do not fit to the screen, move the tabs train to the left
                            if ($rootScope.tabsTrainWidth > $rootScope.tabsVisibleAreaWidth) {
                                $rootScope.trainPosition = -$rootScope.tabsTrainWidth + $rootScope.tabsVisibleAreaWidth - 10;

                                //Make sure that in mobile, one button is always shown half-way
                                if ($rootScope.wWidth <= 1024) {

                                    var halfVariable = ($rootScope.tabsVisibleAreaWidth / ($rootScope.tabFinalLength + 10) % 1).toFixed(2);

                                    if (Number(halfVariable) < 0.18 || Number(halfVariable) > 0.8) {
                                        $rootScope.trainPosition -= 50;
                                    }
                                }

                            }


        //                }

                    }, 0);
                }

            }
        }
    ]);

//Get div height for comment hiding
angular
    .module('citizenos')
    .directive('checkHeight', ['$timeout', function ($timeout) {
        return {
            scope: true,
            link: function (scope, el, attrs) {
                $timeout(function() {
                    $timeout(init, false);
                });

                function init () {
                    scope.offsetHeight = el[0].offsetHeight;
                    scope.readMore = false;
                    scope.maxTextHeight = 200;
                }
            }
        }
    }]);
