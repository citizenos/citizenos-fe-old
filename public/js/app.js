'use strict';

/**
 *  Angular App
 *
 *  @see https://angularjs.org/
 */

var app = angular.module('citizenos', ['ngRoute', 'ngTouch', 'ngDialog', 'focus-if']);

app.constant('cosConfig', {
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

app.config(function ($routeProvider, $locationProvider, ngDialogProvider) {

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

});
