'use strict'
import * as angular from 'angular';

angular
    .module('citizenos')
    .directive('cosStyles', ['$timeout',
        function($timeout) {
            return {
                replace: false,
                link: function (scope, elem, attrs) {

                    scope.$watch(attrs.cosStyles, function (newValue, oldValue) {
                        var styles = JSON.parse(attrs.cosStyles);
                        if (typeof styles === 'object') {
                            var keys = Object.keys(styles);
                            keys.forEach(function (prop) {
                                elem[0].style[prop] = styles[prop];
                            });
                        }
                    });
                }
            }
        }
    ]);