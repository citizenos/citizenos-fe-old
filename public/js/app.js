'use strict';

(function () {

    var module = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngSanitize', 'ngTouch', 'ngDialog', 'angularMoment', 'focus-if', 'angular-loading-bar', 'ngCookies']);

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

            // Send cookies with API request
            $httpProvider.defaults.withCredentials = true;

            // This is to enable resolving link to state later
            $stateProvider.decorator('parent', function (internalStateObj, parentFn) {
                // This fn is called by StateBuilder each time a state is registered
                // The first arg is the internal state. Capture it and add an accessor to public state object.
                internalStateObj.self.$$state = function () {
                    return internalStateObj;
                };
                // pass through to default .parent() function
                return parentFn(internalStateObj);
            });

            $urlRouterProvider.otherwise(function ($injector, $location) {
                var sAuth = $injector.get('sAuth');
                var $state = $injector.get('$state');
                var $translate = $injector.get('$translate');
                var $log = $injector.get('$log');

                var locationUrl = $location.url();
                var locationPath = locationUrl.split('/');

                var langkeys = Object.keys(cosConfig.language.list);
                var clientLang = $translate.resolveClientLocale();
                var useLang = cosConfig.language.default;
                if (langkeys.indexOf(clientLang) > -1) {
                    useLang = clientLang;
                }
                $log.debug('$urlRouterProvider.otherwise', 'Language detected before status', useLang);

                var returnLink = '/';

                sAuth
                    .status()
                    .then(function (user) {
                        $log.debug('sAuth.success', user);
                        $log.debug('$urlRouterProvider.otherwise', 'status loaded', user);

                        if (user.language) {
                            useLang = user.language;
                        }
                        resolveOtherwise();
                    }, function (err) {
                        $log.debug('sAuth.err', err);
                        resolveOtherwise();
                    });

                function resolveOtherwise() {
                    returnLink = '/' + useLang + '/';
                    if (langkeys.indexOf(locationPath[1]) > -1) {
                        returnLink = '/' + locationPath[1] + '/';
                        useLang = locationPath[1];
                    } else if (locationPath.length > 1) {
                        returnLink = '/' + useLang + locationUrl;
                    }

                    var statesList = $state.get();
                    var stateNext = null;

                    // Try to resolve the link to a state. We don't wanna use $location.href as it would reload the whole page, call all the API-s again.
                    // https://github.com/angular-ui/ui-router/issues/1651
                    for (var i = 0; i < statesList.length; i++) {
                        var stateObj = statesList[i];
                        if (stateObj.name) {
                            var privatePortion = stateObj.$$state();
                            var params = privatePortion.url.exec(returnLink, $location.search());
                            if (params) {
                                stateNext = {
                                    name: stateObj.name,
                                    params: params
                                };
                                $log.debug('$urlRouterProvider.otherwise', 'Matched state', stateNext);
                                break; // Stop the loop, we found our state
                            }
                        }
                    }

                    if (stateNext) {
                        $state.go(stateNext.name, stateNext.params);
                    } else {
                        $state.go('home', {language: useLang});
                    }
                }
            });

            $stateProvider
                .state('main', {
                    abstract: true,
                    url: '/{language:' + langReg + '}',
                    templateUrl: '/views/layouts/main.html',
                    resolve: {
                        /* @ngInject */
                        sTranslateResolve: function ($stateParams, $log, sTranslate, sAuth) {
                            sTranslate.setLanguage($stateParams.language);
                            if (sAuth.user.isLoading === false) {
                                $log.debug('$stateProvider.state("main").resolve', 'Status already loaded');
                                return;
                            } else {
                                return sAuth
                                    .status()
                                    .catch(function () {
                                        //This to prevent view from loading before there is a response from sAuth
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
                    templateUrl: '/views/topics.html',
                    controller: 'HomeCtrl'
                })
                .state('topics.create', {
                    url: '/create',
                    parent: 'topics',
                    templateUrl: '/views/topic.html',
                    controller: 'TopicCtrl'
                })
                .state('topics.view', {
                    url: '/:id',
                    parent: 'topics',
                    templateUrl: '/views/topic.html',
                    controller: 'TopicCtrl'
                })
                .state('topics.vote', {
                    url: '/vote',
                    parent: 'topics.view',
                    templateUrl: 'topic.voting.html',
                    controller: 'VoteCtrl'
                })
                .state('topics.vote.create', {
                    url: '/vote/create',
                    parent: 'topics.view',
                    templateUrl: 'topic.voting.html',
                    controller: 'VoteCtrl'
                })
                .state('groups', {
                    url: '/groups',
                    parent: 'main',
                    templateUrl: '/views/groups.html',
                    controller: 'GroupCtrl'
                })
                .state('groups.create', {
                    url: '/create',
                    parent: 'groups',
                    templateUrl: '/views/groups.html',
                    controller: 'GroupCtrl'
                })
                .state('about', {
                    url: '/about',
                    parent: 'main',
                    templateUrl: '/views/about.html'
                })
                .state('faq', {
                    url: '/faq',
                    parent: 'main',
                    templateUrl: '/views/faq.html'
                })
                .state('help', {
                    url: '/help',
                    parent: 'main',
                    templateUrl: '/views/help.html'
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

            // https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translateProvider
            $translateProvider
                .preferredLanguage(cosConfig.language.default)
                .registerAvailableLanguageKeys(Object.keys(cosConfig.language.list).push(cosConfig.language.debug)) //et
                .determinePreferredLanguage()
                .useSanitizeValueStrategy('escaped') // null, 'escaped' - http://angular-translate.github.io/docs/#/guide/19_security
                .useLocalStorage()
                .useMissingTranslationHandlerLog()
                .translations('dbg', {})
        }]);
})();
