'use strict';

(function () {

    var module = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngSanitize', 'ngTouch', 'ngDialog', 'angularMoment', 'focus-if', 'angular-loading-bar', 'ngCookies',]);

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
        .config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$locationProvider', '$httpProvider', 'ngDialogProvider', 'cfpLoadingBarProvider', 'cosConfig', function ($stateProvider, $urlRouterProvider, $translateProvider, $locationProvider, $httpProvider, ngDialogProvider, cfpLoadingBarProvider, cosConfig) {

            var langReg = Object.keys(cosConfig.language.list).join('|');
            $locationProvider.html5Mode({
                enabled: true,
                rewriteLinks: true,
                requireBase: true
            });
            $urlRouterProvider.otherwise(function ($injector) {
                var sUrlResolver = $injector.get('sUrlResolver');
                return sUrlResolver.resolve();
            });

            $stateProvider
                .state('main', {
                    abstract: true,
                    url: '/{language:' + langReg + '}',
                    templateUrl: '/views/layouts/main.html',
                    resolve: {
                        /* @ngInject */
                        sTranslate: function(sTranslate, $stateParams, sAuth) {
                            sAuth.status();
                            console.log('AUTH USER',sAuth.user);
                            this.language = sTranslate.currentLanguage();
                            return sTranslate.setLanguage($stateParams.language);
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

            $translateProvider.useStaticFilesLoader({
              prefix: 'languages/',
              suffix: '.json'
            });

            // https://github.com/likeastore/ngDialog
            ngDialogProvider.setDefaults({
                overlay: false,
                showClose: false,
                trapFocus: false,
                disableAnimation: true,
                closeByNavigation: true,
                closeByDocument: true,
                closeByEscape: true
            });

            // https://github.com/chieffancypants/angular-loading-bar
            cfpLoadingBarProvider.loadingBarTemplate = '<div id="loading_bar"><div class="bar"></div></div>';
            cfpLoadingBarProvider.includeSpinner = false;


       // $translateProvider.preferredLanguage(cosConfig.language.default);
            $translateProvider
                .preferredLanguage(cosConfig.language.default)
                .registerAvailableLanguageKeys(Object.keys(cosConfig.language.list)) //et
                .determinePreferredLanguage()
                .useSanitizeValueStrategy('escaped') // null, 'escaped' - http://angular-translate.github.io/docs/#/guide/19_security
                .useStorage('translateKookieStorage');
                $translateProvider.useLocalStorage();
    }]);

})();
