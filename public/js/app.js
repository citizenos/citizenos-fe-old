'use strict';

(function () {
    var module = angular.module('citizenos', ['ngRoute', 'ngTouch', 'ngDialog', 'focus-if']);

    module
        .constant('cosConfig', {
            api: {
                baseUrl: 'https://citizenos-citizenos-web-test.herokuapp.com' // FIXME: Environment based!
            },
            language: {
                default: 'en',
                list: {
                    en: 'English',
                    et: 'Eesti',
                    ru: 'Pусский'
                },
                debug: 'dbg'
            }
        });

    module
        .config(['$routeProvider', '$locationProvider', '$httpProvider', 'ngDialogProvider', 'cosConfig', function ($routeProvider, $locationProvider, $httpProvider, ngDialogProvider, cosConfig) {

            $locationProvider.html5Mode(true);

            $routeProvider
                .when('/', {
                    controller: 'HomeCtrl',
                    templateUrl: '../views/home.html'
                })
                .when('/topics', {
                    controller: 'HomeCtrl',
                    templateUrl: '../views/no_topics.html'
                });

            $httpProvider.interceptors.push(function () {
                return {
                    request: function (config) {
                        if (config.url.indexOf('api/') > -1) {
                            config.url = cosConfig.api.baseUrl + config.url; // FIXME: Environment based!
                        }
                        return config;
                    }
                }
            });

            ngDialogProvider.setDefaults({
                overlay: false,
                showClose: false,
                trapFocus: false,
                disableAnimation: true,
                closeByNavigation: true,
                closeByDocument: true,
                closeByEscape: true
            });

        }]);
})();
