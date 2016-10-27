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

            $stateProvider.decorator('parent', function (internalStateObj, parentFn) {
                // This fn is called by StateBuilder each time a state is registered

                // The first arg is the internal state. Capture it and add an accessor to public state object.
                internalStateObj.self.$$state = function() { return internalStateObj; };

                // pass through to default .parent() function
                return parentFn(internalStateObj);
            });

            $urlRouterProvider.otherwise(function ($injector, $location) {
                var sAuth = $injector.get('sAuth');
                var $state = $injector.get('$state');
                var $translate = $injector.get('$translate');
                var locationUrl = $location.url();
                var locationPath = locationUrl.split('/');
                var langkeys = Object.keys(cosConfig.language.list);
                var clientLang = $translate.resolveClientLocale();
                var useLang = cosConfig.language.default;
                if (langkeys.indexOf(clientLang) > -1){
                    useLang  = clientLang;
                }
                console.log('Use Language', useLang);
                var returnLink = '/';
                sAuth.status().then(function(user) {
                    console.log('STATUSLOADED',sAuth.user);
                    if(sAuth.user.language){
                        useLang = sAuth.user.language;
                    }
                    returnLink = '/' + useLang + '/';
                    if (langkeys.indexOf(locationPath[1]) > -1) {
                        returnLink = '/' + locationPath[1] + '/';
                        useLang = locationPath[1];
                    } else if (locationPath.length > 1) {
                        returnLink = '/' + useLang + locationUrl;
                    }

                    var statesList = $state.get();
                    var i = 0;
                    console.log('Final link to match', returnLink);
                    angular.forEach(statesList, function(stateObj) {
                        i++;
                        if(stateObj.name){
                            var privatePortion = stateObj.$$state();
                            var match = privatePortion.url.exec(returnLink, $location.search());
                            if (match){
                                console.log("Matched state: " + stateObj.name + " and parameters: ", match);
                                $state.go(stateObj.name, match);
                                i = 0;
                            }
                        }
                        if(i == statesList.length){
                            $state.go('home',{language:useLang});
                        }
                    });
                });
            });

            $stateProvider
                .state('main', {
                    abstract: true,
                    url: '/{language:' + langReg + '}',
                    templateUrl: '/views/layouts/main.html',
                    resolve: {
                        /* @ngInject */
                        sTranslate: function(sTranslate, $stateParams, sAuth) {
                            if(sAuth.user.isLoading === false){
                                console.log('STATUS is already loaded');
                                this.language = sTranslate.currentLanguage();
                                return sTranslate.setLanguage($stateParams.language);
                            }
                            else{
                                return sAuth.status().then(function(user) {
                                    console.log('AUTH USER',sAuth.user);
                                    this.language = sTranslate.currentLanguage();
                                    return sTranslate.setLanguage($stateParams.language);
                                });
                            }
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
                    controller: 'HomeCtrl',
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
