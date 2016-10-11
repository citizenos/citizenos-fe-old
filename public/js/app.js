'use strict';

/**
 *  Angular App
 *
 *  @see https://angularjs.org/
 */

var app = angular.module('citizenos', ['ngRoute', 'ngTouch', 'ngDialog']);

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
            templateUrl: '../views/no_topics.html'
        });

    ngDialogProvider.setDefaults({
        showClose: false,
        disableAnimation: true,
        closeByNavigation: true,
        closeByDocument: true,
        closeByEscape: true
    });

});

/* Set global wWidth variable for responsive dom hiding */
app.directive('resize', function ($window, $rootScope) {
    return function (scope, element) {

        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'w': window.innerWidth
            };
        };

        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            $rootScope.wWidth = newValue.w;
            if ($rootScope.wWidth > 1024) {
                scope.app.showNav = false; // TODO: Bad separation of concerns that does not make this directive reusable but will do for now.
            }
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});

app.controller('lightbox', ['$scope', '$rootScope', function ($scope, $rootScope) {

    $scope.closeAll = function () {
        $rootScope.lightbox = false;
        $rootScope.loginLightbox = false;
        $rootScope.registerLightbox = false
    }

}]);
