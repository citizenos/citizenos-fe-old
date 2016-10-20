(function () {
    'use strict';

    var module = angular.module('citizenos', ['ngRoute', 'ngTouch', 'ngDialog', 'focus-if']);

    module.constant('cosConfig', {
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

    module.config(['$routeProvider', '$locationProvider', 'ngDialogProvider', function ($routeProvider, $locationProvider, ngDialogProvider) {

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
