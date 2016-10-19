'use strict';

/**
 *  Angular App
 *
 *  @see https://angularjs.org/
 */

var app = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngTouch','ngCookies' , 'ngDialog', 'focus-if']);

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

app.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $translateProvider, $httpProvider,  cosConfig, ngDialogProvider) {
//    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  //  console.log($locationProvider);
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
            controller: function ($scope, $state, $stateParams, $translate, $location, sAuth) {
                console.log('main', $stateParams.language);
               // console.log(sAuth.status());
                //console.log(sAuth.user);
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
        .state('topics', {
            url: '/topics',
            parent: 'main',
            controller: 'TopicCtrl',
            templateUrl: '/views/no_topics.html'
        })
        .state('account', {
            abstract: true,
            url: '/account',
            parent: 'main',
            templateUrl: '/views/home.html'
        })
        .state('account.signup', {
            url: '/signup?email&name&redirectSuccess',
            controller: function ($scope, $state, $stateParams, $log, ngDialog) {
                if ($scope.app.user.loggedIn) {
                    $state.go('home');
                }
                ngDialog.open({
                    template: '/views/modals/register.html',
                    data: $stateParams,
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
            }
        })
        .state('account.login', {
            url: '/login?email&redirectSuccess',
            controller: function ($scope, $state) {
                console.log($scope.app.user);
                if ($scope.app.user.loggedIn) {
                    $state.go('home');
                }
            }
        });

    $translateProvider.useStaticFilesLoader({
      prefix: 'languages/',
      suffix: '.json'
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

   // $translateProvider.preferredLanguage(cosConfig.language.default);
    $translateProvider
        .preferredLanguage(cosConfig.language.default)
        .registerAvailableLanguageKeys(Object.keys(cosConfig.language.list)) //et
        .determinePreferredLanguage()
        .useSanitizeValueStrategy('escaped') // null, 'escaped' - http://angular-translate.github.io/docs/#/guide/19_security
        .useStorage('translateKookieStorage');
    $translateProvider.useLocalStorage();
});

/* Close dropdowns when clicked outside of it */
app.directive('dropdown', function($document) {
	return {
		restrict: "A",
		link: function(scope, elem, attr) {

			elem.bind('click', function() {
				elem.toggleClass('dropdown_active');
				elem.addClass('active_recent');
			});

			$document.bind('click', function() {
				if(!elem.hasClass('active_recent')) {
					elem.removeClass('dropdown_active');
				}
				elem.removeClass('active_recent');
			});

		}
	}
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
