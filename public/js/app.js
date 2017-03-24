'use strict';

(function () {

    var module = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngSanitize', 'ngResource', 'ngTouch', 'ngDialog', 'angularMoment', 'focus-if', 'angular-loading-bar', 'ngCookies', 'angularHwcrypto', 'typeahead', 'datePicker', 'monospaced.qrcode', '720kb.tooltips']);

    module
        .constant('cosConfig', {
            api: {
                baseUrl: 'https://citizenos.com' // FIXME: Environment based!
            },
            language: {
                default: 'en',
                list: {
                    en: 'English',
                    et: 'Eesti',
                    ru: 'Pусский'
                },
                debug: 'dbg'
            },
            links: {
                help: {
                    en: 'http://citizenos.uservoice.com/knowledgebase/articles/741585',
                    et: 'http://citizenos.uservoice.com/knowledgebase/articles/741582',
                    ru: 'http://citizenos.uservoice.com/knowledgebase/articles/741798'
                }
            }
        });

    module
        .config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$locationProvider', '$httpProvider', '$resourceProvider', 'ngDialogProvider', 'cfpLoadingBarProvider', 'cosConfig', function ($stateProvider, $urlRouterProvider, $translateProvider, $locationProvider, $httpProvider, $resourceProvider, ngDialogProvider, cfpLoadingBarProvider, cosConfig) {

            var langReg = Object.keys(cosConfig.language.list).join('|');

            $locationProvider.html5Mode({
                enabled: true,
                rewriteLinks: true,
                requireBase: true
            });

            // Send cookies with API request
            $httpProvider.defaults.withCredentials = true;

            $httpProvider.interceptors.push('cosHttpApiErrorInterceptor');

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
                console.log('$urlRouterProvider.otherwise');

                var sAuth = $injector.get('sAuth');
                var $state = $injector.get('$state');
                var $translate = $injector.get('$translate');
                var $log = $injector.get('$log');
                var $cookies = $injector.get('$cookies');

                var locationUrl = $location.url();
                var locationPath = locationUrl.split('/');

                var langkeys = Object.keys(cosConfig.language.list);
                var clientLang = $translate.resolveClientLocale();
                var useLang = cosConfig.language.default;
                if (langkeys.indexOf(clientLang) > -1) {
                    useLang = clientLang;
                }
                if (langkeys.indexOf($cookies.get('language')) > -1) {
                    $log.debug('cookieLang', $cookies.get('language'));
                    useLang = $cookies.get('language');
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
                    console.log('resolveOtherwise', useLang);
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

                            if (privatePortion.url) {
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
                    }

                    if (stateNext) {
                        $state.go(stateNext.name, stateNext.params);
                    } else {
                        $state.go('home', {language: useLang});
                    }
                }
            });

            $urlRouterProvider.config({
                absolute: true // All urls absolute by default
            });

            $stateProvider
                .state('index', {
                    url: '/{language:' + langReg + '}',
                    abstract: true,
                    template: '<div ui-view style="height: 100%"></div>',
                    resolve: {
                        /* @ngInject */
                        sTranslateResolve: function ($stateParams, $log, sTranslate, sAuth) {
                            $log.debug('Resolve language', $stateParams.language);
                            return sTranslate.setLanguage($stateParams.language);
                        },
                        sAuthResolve: function ($q, $log, sAuth) {
                            if (sAuth.user.loggedIn) {
                                return;
                            }
                            return sAuth
                                .status()
                                .then(
                                    function () {
                                        $log.debug('Resolve user', sAuth.user);
                                        return $q.resolve(true);
                                    },
                                    function () {
                                        $log.debug('Resolve user', sAuth.user);
                                        return $q.resolve(false);
                                    }
                                );
                        }
                    }
                })
                .state('main', {
                    url: null,
                    abstract: true,
                    parent: 'index',
                    templateUrl: '/views/layouts/main.html'
                })
                .state('home', {
                    url: '/',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('error', {
                    url: '/error',
                    parent: 'main',
                    abstract: true,
                    template: '<div ui-view style="height: 100%"></div>'
                })
                .state('error.401', {
                    url: '/401',
                    parent: 'error',
                    templateUrl: '/views/401.html'
                })
                .state('error.403', {
                    url: '/403',
                    parent: 'error',
                    templateUrl: '/views/401.html'
                })
                .state('account', {
                    url: '/account',
                    abstract: true,
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('account.signup', {
                    url: '/signup?email&name&redirectSuccess',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/sign_up.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.login', {
                    url: '/login?email&redirectSuccess',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/login.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.profile', { // TODO: Naming inconsistency but /account/myaccount would be funny. Maybe rename all related files to profile?
                    url: '/profile',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/my_account.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.passwordForgot', {
                    url: '/password/forgot',
                    parent: 'account',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/password_forgot.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.passwordReset', {
                    url: '/password/reset/:passwordResetCode?email',
                    parent: 'account',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/password_reset.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('topics', {
                    url: '/topics',
                    abstract: true,
                    parent: 'main',
                    template: '<div ui-view></div>',
                })
                .state('topics.create', {
                    url: '/create',
                    parent: 'topics',
                    controller: ['$scope', '$state', '$stateParams', 'sAuth', 'Topic', function ($scope, $state, $stateParams, sAuth, Topic) {
                        if (!sAuth.user.loggedIn) {
                            return $state.go('account.login', null, {location: false});
                        }

                        var topic = new Topic();
                        topic
                            .$save()
                            .then(function () {
                                $state.go('topics.view', {language: $stateParams.language, topicId: topic.id, editMode: true});
                            });
                    }]
                })
                .state('topics.view', {
                    url: '/:topicId?editMode',
                    parent: 'topics',
                    templateUrl: '/views/topics_topicId.html',
                    resolve: {
                        rTopic: ['$stateParams', 'Topic', 'sAuthResolve', function ($stateParams, Topic, sAuthResolve) {
                            var topic = new Topic({id: $stateParams.topicId});
                            return topic.$get();
                        }]
                    },
                    controller: 'TopicCtrl'
                })
                .state('topics.view.settings', {
                    url: '/settings?tab',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_settings.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^');
                            }
                        });
                    }]
                })
                .state('topics.view.votes', {
                    abstract: true,
                    url: '/votes',
                    parent: 'topics.view',
                    template: '<div ui-view></div>'
                })
                .state('topics.view.votes.create', {
                    parent: 'topics.view.votes',
                    url: '/create',
                    template: '<div ui-view></div>',
                    controller: 'TopicVoteCreateCtrl',
                    resolve: {
                        rVote: ['rTopic', '$state', '$stateParams', '$q', '$timeout', function (rTopic, $state, $stateParams, $q, $timeout) {
                            if (rTopic.voteId) {
                                $timeout(function () {
                                    $state.go('topics.view.votes.view', {language: $stateParams.language, topicId: rTopic.id, voteId: rTopic.voteId}); //if vote is allready created redirect to voting
                                }, 0);
                                return $q.reject();
                            } else {
                                return $q.resolve();
                            }
                        }]
                    }
                })
                .state('topics.view.votes.view', {
                    parent: 'topics.view.votes',
                    url: '/:voteId',
                    template: '<div ui-view></div>',
                    controller: 'TopicVoteCtrl'
                })
                .state('my', {
                    url: '/my?filter',
                    parent: 'main',
                    templateUrl: '/views/my.html',
                    controller: 'MyCtrl',
                    resolve: {
                        // Array of Topics / Groups
                        rItems: ['$state', '$stateParams', '$q', '$window', 'Topic', 'Group', function ($state, $stateParams, $q, $window, Topic, Group) {
                            var filterParam = $stateParams.filter || 'all';

                            switch (filterParam) {
                                case 'all':
                                    return Topic.query().$promise;
                                case 'public':
                                    return Topic.query({visibility: Topic.VISIBILITY.public}).$promise;
                                case 'private':
                                    return Topic.query({visibility: Topic.VISIBILITY.private}).$promise;
                                case 'iCreated':
                                    return Topic.query({creatorId: sAuth.user.id}).$promise;
                                case 'grouped':
                                    return Group.query().$promise;
                                default:
                                    return $q.reject();
                            }
                        }]
                    }
                })
                .state('my.topics', {
                    url: '/topics',
                    parent: 'my',
                    template: '<div ui-view></div>'
                })
                .state('my.topics.topicId', {
                    url: '/:topicId',
                    parent: 'my.topics',
                    templateUrl: '/views/my_topics_topicId.html',
                    resolve: {
                        rTopic: ['$stateParams', 'Topic', 'sAuthResolve', function ($stateParams, Topic, sAuthResolve) {
                            return Topic.get({topicId: $stateParams.topicId, include: 'vote'}).$promise;
                        }]
                    },
                    controller: 'TopicCtrl'
                })
                .state('my.topics.topicId.settings', {
                    url: '/settings?tab',
                    parent: 'my.topics.topicId',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_settings.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^');
                            }
                        });
                    }]
                })
                .state('my.groups', {
                    url: '/groups',
                    parent: 'my',
                    template: '<div ui-view></div>'
                })
                .state('my.groups.create', {
                    url: '/create',
                    parent: 'my.groups',
                    controller: ['$scope', '$stateParams', '$state', 'ngDialog', function ($scope, $stateParams, $state, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/group_create_settings.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^');
                            }
                        });
                    }]
                })
                .state('my.groups.groupId', {
                    url: '/:groupId',
                    parent: 'my.groups',
                    templateUrl: '/views/my_groups_groupId.html',
                    resolve: {
                        rGroup: ['$stateParams', 'Group', 'rItems', function ($stateParams, Group, rItems) {
                            return _.find(rItems, {id: $stateParams.groupId});
                        }]
                    },
                    controller: 'GroupCtrl'
                })
                .state('my.groups.groupId.settings', {
                    url: '/settings?tab',
                    parent: 'my.groups.groupId',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/group_create_settings.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^');
                            }
                        });
                    }]
                })
                .state('about', {
                    url: '/about',
                    parent: 'main',
                    templateUrl: '/views/about.html'
                })
                .state('join', { // Join a Topic via shared url
                    url: '/join/:tokenJoin',
                    parent: 'main',
                    controller: 'JoinCtrl'
                })
                .state('partners', {
                    url: '/partners/:partnerId',
                    abstract: true,
                    parent: 'index',
                    templateUrl: '/views/layouts/partner.html'
                })
                .state('partners.login', {
                    url: '/login',
                    parent: 'partners',
                    templateUrl: '/views/partners_login.html'
                })
                .state('partners.consent', {
                    url: '/consent',
                    parent: 'partners',
                    templateUrl: '/views/partners_consent.html'
                })
                .state('_templates', { // TODO: From here below are the template path relevant in development
                    url: '/_templates',
                    abstract: true,
                    parent: 'main',
                    template: '<div ui-view></div>'
                })
                .state('_templates.topics', {
                    url: '/my/topics',
                    parent: '_templates',
                    templateUrl: '/views/_templates/mytopics.html'
                })
                .state('_templates.topics.topicId', {
                    url: '/:topicId',
                    parent: '_templates.topics',
                    templateUrl: '/views/_templates/mytopics_view.html'
                })
                .state('_templates.topics.topicId.settings', {
                    url: '/settings?tab',
                    parent: '_templates.topics.topicId',
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        $scope.tabSelected = 'settings';
                        var dialog = ngDialog.open({
                            template: '/views/_templates/modals/topic_settings.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^');
                            }
                        });
                    }]
                })
                .state('_templates.topics.view', {
                    url: '/topics/:topicId',
                    parent: '_templates',
                    templateUrl: '/views/_templates/topics_topicId.html'
                })
                .state('_templates.groups', {
                    url: '/groups',
                    parent: '_templates',
                    templateUrl: '/views/_templates/groups.html'
                })
                .state('cos_input_test', {
                    url: '/cos_input_test',
                    parent: 'main',
                    templateUrl: '/views/_templates/cos_input_test.html'
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
                .translations('dbg', {});
        }]);
})();
