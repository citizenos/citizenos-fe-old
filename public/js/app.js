'use strict';

/**
 *  Angular App
 *
 *  @see https://angularjs.org/
 */

var app = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngTouch','ngCookies', ]);


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

app.config(function ($stateProvider, $locationProvider, $urlRouterProvider, $translateProvider, $httpProvider,  cosConfig) {

    $locationProvider.html5Mode({
        enabled: true,
        rewriteLinks: true,
        requireBase: true
    });
    var langReg = Object.keys(cosConfig.language.list).join('|');
    $urlRouterProvider.otherwise(function ($injector, $location) {
        var langkeys = Object.keys(cosConfig.language.list);
        var $location = $injector.get('$location');
        var $translate = $injector.get('$translate');
     //   var sAuth = $injector.get('sAuth');
        var currentLang = $translate.proposedLanguage() || $translate.use() || cosConfig.language.default;

        var locationPath = $location.url().split('/');
        console.log(currentLang, locationPath, $location.url());
        if (langkeys.indexOf(locationPath[1]) > -1) {
            return '/' + locationPath[1] + '/';
        } else if (locationPath.length > 1) {
       //     sAuth.user.loadlang = true;
            return '/' + currentLang + $location.url();
        } else {
         //   sAuth.user.loadlang = true;
            return '/' + currentLang + '/';
        }
    });

    $stateProvider
        .state('main', {
            abstract: true,
            url: '/{language:' + langReg + '}',
            templateUrl: '/views/layouts/main.html',
            controller: function ($scope, $state, $stateParams, $translate, $location) {
                console.log('main', $stateParams.language);
                if ($stateParams.language) {
                    $translate.use($stateParams.language);
                }
            }
        })
        .state('home', {
            url: '/',
            parent: 'main',
            controller: 'HomeCtrl',
            templateUrl: '/views/home.html'
        })
    /*$routeProvider
        .when('/', {
            controller: 'HomeCtrl',
            templateUrl: '../views/home.html'
        })

        .when('/topics', {
            controller: 'HomeCtrl',
            templateUrl: '../views/no_topics.html'
        });*/

    $translateProvider.useStaticFilesLoader({
      prefix: 'languages/',
      suffix: '.json'
    });

    $translateProvider.preferredLanguage(cosConfig.language.default);
    $translateProvider.useLocalStorage();
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
