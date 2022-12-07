'use strict';
import * as angular from 'angular';

(function () {

    var module = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngSanitize', 'ngResource', 'ngTouch', 'ngDialog', 'angularMoment', 'focus-if', 'angular-loading-bar', 'ngCookies', 'angularHwcrypto', 'typeahead', 'datePicker', '720kb.tooltips', '720kb.socialshare', 'angularLoad', 'cosmarkdown', 'monospaced.qrcode']);

    module
        .constant('cosConfig', window.__config || {});

    module
        .config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$locationProvider', '$httpProvider', '$resourceProvider', '$transitionsProvider', 'ngDialogProvider', 'cfpLoadingBarProvider', 'cosConfig', '$logProvider', function ($stateProvider, $urlRouterProvider, $translateProvider, $locationProvider, $httpProvider, $resourceProvider, $transitionsProvider, ngDialogProvider, cfpLoadingBarProvider, cosConfig, $logProvider) {
            var langReg = Object.keys(cosConfig.language.list).join('|');
            $logProvider.debugEnabled(true);

            $locationProvider.html5Mode({
                enabled: true,
                rewriteLinks: true,
                requireBase: true
            });
            // Send cookies with API request
            $httpProvider.defaults.withCredentials = true;

            $httpProvider.interceptors.push('cosHttpApiUnauthorizedInterceptor');
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
                var sAuth = $injector.get('sAuth');
                var $state = $injector.get('$state');
                var $translate = $injector.get('$translate');
                var $log = $injector.get('$log');
                var $cookies = $injector.get('$cookies');

                var locationUrl = $location.url();
                var locationPath = locationUrl.split('/');

                var langkeys = Object.keys(cosConfig.language.list);
                var clientLang = $translate.resolveClientLocale() || $translate.use();

                var useLang = cosConfig.language.default;
                if (langkeys.indexOf(clientLang) > -1) {
                    useLang = clientLang;
                }
                if (langkeys.indexOf($cookies.getObject('language')) > -1) {
                    $log.debug('cookieLang', $cookies.getObject('language'));
                    useLang = $cookies.getObject('language');
                }
                $log.debug('$urlRouterProvider.otherwise', 'Language detected before status', useLang);

                var returnLink = '/';

                sAuth
                    .status()
                    .then(function (user) {
                        if (!sAuth.user.email) {
                            sAuth.user.loggedIn = false;
                        }

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

                function resolveOtherwise () {
                    returnLink = '/' + useLang + '/';
                    if (langkeys.indexOf(locationPath[1]) > -1) {
                        returnLink = '/' + locationPath[1] + '/';
                        useLang = locationPath[1];
                    } else if (locationPath.length > 1) {
                        returnLink = '/' + useLang + $location.path();
                    }

                    var statesList = $state.get();
                    var stateNext = null;

                    // Try to resolve the link to a state. We don't wanna use $location.href as it would reload the whole page, call all the API-s again.
                    // https://github.com/angular-ui/ui-router/issues/1651
                    statesList.forEach(function (stateObj) {
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
                                }
                            }
                        }
                    });
                    if (stateNext) {
                        if (stateNext.params && stateNext.params.language === 'aa') { // Crowdin language selected, we need a full page reload for the in-context script to work.
                            window.location.href = $state.href(stateNext.name, stateNext.params);
                        } else {
                            $state.go(stateNext.name, stateNext.params, {location: 'replace'});
                        }
                    } else {
                        $state.go('error.404', {language: useLang}, {location: 'replace'});
                    }
                }
            });

            var sTranslateResolve = function ($stateParams, $log, sTranslate) {
                $log.debug('Resolve language', $stateParams.language);
                return sTranslate.setLanguage($stateParams.language);
            };

            $stateProvider
                .state('index', {
                    url: '/{language:' + langReg + '}',
                    abstract: true,
                    template: '<div ui-view class="full_height"></div>',
                    resolve: {
                        sTranslateResolve: ['$stateParams', '$log', 'sTranslate', sTranslateResolve],
                        sAuthResolve: ['$q', '$log', '$state', '$stateParams', '$cookies', '$window', 'sAuth', 'sLocation', 'ngDialog', function ($q, $log, $state, $stateParams, $cookies, $window, sAuth, sLocation, ngDialog) {
                            if (sAuth.user.loggedIn) {
                                return $q.resolve(true);
                            }
                            // If new window is opened while login-flow is in-progress without adding new e-mail we logout the current user to prevent taking over accounts
                            if ($cookies.getObject('addEmailInProgress')) {
                                $cookies.remove('addEmailInProgress');

                                sAuth.logout();

                                return $q.resolve(true);
                            }

                            return sAuth
                                .status()
                                .then(
                                    function () {
                                        $log.debug('Resolve user', sAuth.user, 'LOGGED IN');
                                        if (!sAuth.user.email) {
                                            sAuth.user.loggedIn = false;
                                            var dialog = ngDialog.open({
                                                template: '<add-email></add-email>'
                                            });

                                            dialog.closePromise.then(function () {
                                                if (!sAuth.user.email) {
                                                    $cookies.remove('addEmailInProgress');
                                                    sAuth.logout();
                                                }
                                            });
                                        }
                                        if (sAuth.user.loggedIn) {
                                            if (!sAuth.user.termsVersion || sAuth.user.termsVersion !== cosConfig.legal.version) {
                                                return $state.go(
                                                    'account/tos',
                                                    {
                                                        redirectSuccess: sLocation.getAbsoluteUrl($window.location.pathname) + $window.location.search,
                                                        language: $stateParams.language
                                                    },
                                                    {
                                                        location: false
                                                    }
                                                );
                                            }
                                        }

                                        return $q.resolve(true);
                                    },
                                    function () {
                                        $log.debug('Resolve user', sAuth.user, 'NOT LOGGED IN');
                                        return $q.resolve(false);
                                    }
                                );
                        }]
                    },
                    controller: ['$rootScope', '$log', '$state', 'AppService', 'TopicInviteUser', function ($rootScope, $log, $state, AppService, TopicInviteUser) {
                        $rootScope.app = AppService;
                    }]
                })
                .state('main', {
                    url: null,
                    abstract: true,
                    parent: 'index',
                    templateUrl: '/views/layouts/main.html',
                    resolve: {
                        sActivitiesResolve: ['$log', '$q', 'sAuthResolve', 'sAuth', 'sActivity', function ($log, $q, sAuthResolve, sAuth, sActivity) {
                            $log.debug('Resolve unreadActivities');
                            if (sAuth.user.loggedIn) {
                                return sActivity
                                    .getUnreadActivities()
                                    .then(
                                        function (res) {
                                            return res;
                                        },
                                        function (err) {
                                            $log.error('Failed to load Activities.', err);
                                            return $q.resolve(false); // Ignore, do not break the whole site.
                                        }
                                    );
                            } else {
                                return $q.resolve(false);
                            }

                        }]
                    }
                })
                .state('home', {
                    url: '/?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('public/groups', {
                    url: '/groups?groupStatus',
                    parent: 'main',
                    template: '<public-groups><public-groups>'
                })
                .state('public/groups/view', {
                    url: '/groups/:groupId?groupStatus&tab',
                    parent: 'main',
                    template: '<public-group><public-group>'
                })
                .state('public/groups/view/settings', {
                    url: '/settings',
                    parent: 'public/groups/view',
                    controller: ['$state', 'ngDialog', function ($state, ngDialog) {
                        var createDialog = function () {
                            var dialogs = ngDialog.getOpenDialogs();
                            dialogs.forEach(function (id) {
                                ngDialog.close(id, '$closeButton');
                            })
                            var dialog = ngDialog.open({
                                template: '<group-settings></group-settings>',
                                plain: true,
                                preCloseCallback: function (value) {
                                    if (value === '$closeButton') {
                                        return true;
                                    }
                                    return false;
                                }
                            });
                            dialog
                                .closePromise
                                .then(function () {
                                    $state.go('^', {}, {reload: true}, {supercede: false});
                                });
                        }

                        createDialog();
                    }]
                })
                .state('category', {
                    url: '/topics/categories/:category?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('citizenos', {
                    url: '/citizenos',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('opinionfestival', {
                    url: '/opinionfestival',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('hacktivistcommunity', {
                    url: '/hacktivistcommunity?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('pyln', {
                    url: '/pyln?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('thirtyfourislandproject', {
                    url: '/thirtyfourislandproject?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('eestijazziarengusuunad', {
                    url: '/eestijazziarengusuunad?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('thetwelvemovie', {
                    url: '/thetwelvemovie?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('eurochangemakers', {
                    url: '/eurochangemakers?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('biotoopia', {
                    url: '/biotoopia?topicStatus',
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('account', {
                    url: '/account',
                    abstract: true,
                    parent: 'main',
                    template: '<home></home>'
                })
                .state('account/settings', {
                    url: '/myaccount?tab',
                    parent: 'main',
                    template: '<my-account></my-account>'
                })
                .state('account/tos', {
                    url: '/tos?redirectSuccess',
                    parent: 'account',
                    controller: ['$scope', 'ngDialog', function ($scope, ngDialog) {
                        ngDialog.open({
                            template: '<privacy-policy></privacy-policy>',
                            closeByEscape: false,
                            closeByNavigation: false,
                            plain: true
                        });
                    }]
                })
                .state('account/signup', {
                    parent: 'account',
                    url: '/signup?name&redirectSuccess&email',  // NOTE: Also supports email via "params" conf and rHiddenParams
                    controller: ['$scope', '$state', '$stateParams', '$log', 'ngDialog', 'sAuthResolve', function ($scope, $state, $stateParams, $log, ngDialog, sAuthResolve) {
                        if (sAuthResolve) {
                            return $state.go('home');
                        }

                        var dialog = ngDialog.open({
                            template: '<sign-up-form></sign-up-form>',
                            plain:true
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('account/login', {
                    parent: 'account',
                    url: '/login?userId&redirectSuccess&email', // NOTE: Also supports email via "params" conf and rHiddenParams
                    resolve: {
                        rUserConnections: ['$state', '$stateParams', '$log', 'sUser', function ($state, $stateParams, $log, sUser) {
                            if ($stateParams.userId) {
                                return sUser
                                    .listUserConnections($stateParams.userId)
                                    .then(
                                        function (res) {
                                            return res;
                                        },
                                        function (err) {
                                            // If the UserConnection fetch fails, it does not matter, we just don't filter authentication methods
                                            $log.warn('Unable to fetch UserConnections for User', err);
                                            return;
                                        });
                            } else {
                                return;
                            }
                        }]
                    },
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', '$log', '$transition$', 'ngDialog', 'sAuthResolve', 'rUserConnections', function ($scope, $state, $stateParams, $log, $transition$, ngDialog, sAuthResolve, rUserConnections) {

                        var dialogData = {
                            userConnections: rUserConnections,
                            email: null
                        };

                        let template = '<login-form></login-form>'
                        var dialog = ngDialog.open({
                            template: template,
                            plain: true
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('account/passwordForgot', {
                    url: '/password/forgot',
                    parent: 'account',
                    controller: ['ngDialog', function (ngDialog) {
                        ngDialog.open({
                            template: '<password-forgot></password-forgot>',
                            plain: true
                        });
                    }]
                })
                .state('account/passwordReset', {
                    url: '/password/reset/:passwordResetCode?email',
                    parent: 'account',
                    controller: ['ngDialog', function (ngDialog) {
                        ngDialog.open({
                            template: '<password-reset></password-reset>',
                            plain: true
                        });
                    }]
                })
                .state('topics', {
                    url: '/topics',
                    abstract: true,
                    parent: 'main',
                    template: '<div ui-view></div>',
                })
                .state('topics/create', {
                    url: '/create?title&groupId&groupLevel&groupVisibility',
                    parent: 'topics',
                    controller: ['$scope', '$state', '$stateParams', 'sAuth', 'Topic', 'GroupMemberTopic', 'AppService', function ($scope, $state, $stateParams, sAuth, Topic, GroupMemberTopic, app) {
                        if (!sAuth.user.loggedIn) {
                            return app.doShowLogin()
                        }

                        var topic = {};
                        if ($stateParams.title) {
                            topic['description'] = '<html><head></head><body><h1>' + $stateParams.title + '</h1></body></html>';
                        }
                        if ($stateParams.groupVisibility === 'public') {
                            topic['visibility'] = Topic.VISIBILITY.public;
                        }

                        Topic
                            .save(topic)
                            .then(function (topic) {
                                if ($stateParams.groupId) {
                                    var level = $stateParams.groupLevel || GroupMemberTopic.LEVELS.read;
                                    var member = {
                                        groupId: $stateParams.groupId,
                                        topicId: topic.id,
                                        level: level
                                    };
                                    GroupMemberTopic
                                        .save(member, member)
                                        .then(function () {
                                            $state.go('topics/view', {
                                                language: $stateParams.language,
                                                topicId: topic.id,
                                                editMode: true
                                            });
                                        });
                                } else {
                                    $state.go('topics/view', {
                                        language: $stateParams.language,
                                        topicId: topic.id,
                                        editMode: true
                                    });
                                }
                            });
                    }]
                })
                .state('topics/view', {
                    url: '/:topicId?editMode&commentId&argumentsPage&notificationSettings',
                    parent: 'topics',
                    template: '<topic></topic>',
                    resolve: {
                        rTopic: ['$state', '$stateParams', 'Topic', 'sAuthResolve','AppService', function ($state, $stateParams, Topic, sAuthResolve, AppService) {
                            // HACK: sAuthResolve is only included here so that auth state is loaded before topic is loaded. Angular does parallel loading if it does not see dependency on it.
                            return Topic
                                .get($stateParams.topicId)
                                .then(function (topic) {
                                    AppService.topic = topic;
                                    return topic;
                                });
                        }]
                    }
                })
                .state('topics/view/settings', {
                    url: '/settings?tab',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$state', 'AppService', '$stateParams', 'Topic', 'ngDialog', function ($state, AppService, $stateParams, Topic, ngDialog) {
                        var data = angular.extend({}, $stateParams);
                        console.log(ngDialog);
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<topic-settings></topic-settings>',
                                plain: true,
                                preCloseCallback: function (value) {
                                    if (value === '$closeButton') {
                                        return true;
                                    }
                                    return false;
                                }
                            });

                            dialog.closePromise.then(function () {
                                $state.go('^', null, {reload: true, supercede: false});
                            });
                        };
                        createDialog();
                    }]
                })
                .state('topics/view/invite', {
                    url: '/invite?tab',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$state', 'ngDialog', function ($state, ngDialog) {
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<topic-invite></topic-invite>',
                                plain: true,
                                preCloseCallback: function (value) {
                                    if (value === '$closeButton') {
                                        return true;
                                    }
                                    return false;
                                }
                            });

                            dialog.closePromise.then(function () {
                                $state.go('^', {}, {supercede: false});
                            });
                        }

                        createDialog();
                    }]
                })
                .state('topics/view/participants', {
                    url: '/participants?tab',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$state', 'ngDialog', function ($state, ngDialog) {
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<topic-members></topic-members>',
                                plain:true,
                                preCloseCallback: function (value) {
                                    if (value === '$closeButton') {
                                        return true;
                                    }
                                    return false;
                                }
                            });

                            dialog.closePromise.then(function (data) {
                                if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                    $state.go('^', {}, {supercede: false});
                                }
                            });
                        }

                        createDialog();
                    }]
                })
                .state('topics/view/files', {
                    url: '/files',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '<topic-attachment-modal></topic-attachment-modal>',
                            plain: true
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('topics/view/report', {
                    url: '/report',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', 'ngDialog', function ($scope, $state, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^', {}, {supercede: false});
                                });
                            return;
                        }
                        var dialog = ngDialog.open({
                            template: '<topic-report-form></topic-report-form>',
                            plain: true
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('topics/view/reportsModerate', { // Cant use topics/view/reports.moderate as that would assume this route is child of topics/view/reports which it is not
                    url: '/reports/:reportId/moderate',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^', {}, {supercede: false});
                                });
                            return;
                        }
                        var dialog = ngDialog.open({
                            template: '<topic-report-moderate></topic-report-moderate>',
                            plain:true
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('topics/view/reportsReview', { // Cant use topics/view/reports.moderate as that would assume this route is child of topics/view/reports which it is not
                    url: '/reports/:reportId/review',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^', {}, {supercede: false});
                                });
                            return;
                        }
                        var data = angular.extend({}, $stateParams);
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_reports_reportId_review.html',
                            data: data,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('topics/view/reportsResolve', {
                    url: '/reports/:reportId/resolve',
                    parent: 'topics/view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^', {}, {supercede: false});
                                });
                            return;
                        }
                        var dialog = ngDialog.open({
                            template: '<topic-report-resolve></topic-report-resolve>',
                            plain:true
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('topics/view/commentsReportsModerate', {
                    url: '/comments/:reportedCommentId/reports/:reportId/moderate?token',
                    parent: 'topics/view',
                    resolve: {
                        rTopicComment: ['$stateParams', '$http', 'sLocation', function ($stateParams, $http, sLocation) {
                            var path = sLocation.getAbsoluteUrlApi(
                                '/api/topics/:topicId/comments/:reportedCommentId/reports/:reportId',
                                $stateParams
                            );

                            var config = {
                                headers: {
                                    'Authorization': 'Bearer ' + $stateParams.token
                                }
                            };

                            return $http
                                .get(path, config)
                                .then(function (res) {
                                    return res.data.data;
                                });
                        }]
                    },
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', 'rTopicComment', 'rTopic', function ($scope, $state, $stateParams, ngDialog, rTopicComment, rTopic) {
                        var dialog = ngDialog.open({
                            template: '<topic-comment-moderate></topic-comment-moderate>',
                            plain: true
                        });
                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                $state.go('^', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('topics/view/votes', {
                    abstract: true,
                    url: '/votes',
                    parent: 'topics/view',
                    template: '<div ui-view></div>'
                })
                .state('topics/view/votes/create', {
                    parent: 'topics/view/votes',
                    url: '/create',
                    template: '<div ui-view></div>'
                })
                .state('topics/view/votes/view', {
                    parent: 'topics/view/votes',
                    url: '/:voteId',
                    template: '<div ui-view></div>'
                })
                .state('topics/view/followUp', {
                    parent: 'topics/view',
                    url: '/followUp',
                    template: '<div ui-view></div>'
                })
                .state('my', {
                    url: '/my?filter&openTabs',
                    parent: 'main',
                    template: '<div ui-view></div>'
                })
                .state('my/topics', {
                    url: '/topics',
                    parent: 'my',
                    template: '<my-topics></my-topics>'
                })
                .state('my/topics/topicId', {
                    url: '/:topicId',
                    parent: 'my/topics',
                    resolve: {
                        rTopic: ['$stateParams', 'Topic', 'sAuthResolve', 'AppService', function ($stateParams, Topic, sAuthResolve, AppService) {
                            // HACK: sAuthResolve is only included here so that auth state is loaded before topic is loaded. Angular does parallel loading if it does not see dependency on it.
                            return Topic
                                .get($stateParams.topicId)
                                .then(function (topic) {
                                    AppService.topic = topic;
                                    return topic;
                                });
                        }]
                    },
                    template: '<my-topics-topic></my-topics-topic>'
                })
                .state('my/topics/topicId/settings', {
                    url: '/settings?tab',
                    parent: 'my/topics/topicId',
                    reloadOnSearch: false,
                    controller: ['$state', 'ngDialog', function ($state, ngDialog) {
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<topic-settings></topic-settings>',
                                plain: true,
                                preCloseCallback: function (value) {
                                    if (value === '$closeButton') {
                                        return true;
                                    }
                                    return false;
                                }
                            });

                            dialog.closePromise.then(function () {
                                $state.go('^', null, {reload: true, supercede: false});
                            });
                        }

                        createDialog();
                    }]
                })
                .state('my/topics/topicId/invite', {
                    url: '/invite?tab',
                    parent: 'my/topics/topicId',
                    reloadOnSearch: false,
                    controller: ['$state', 'ngDialog', 'rTopic', function ($state, ngDialog, rTopic) {
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<topic-invite></topic-invite>',
                                plain: true
                            });

                            dialog.closePromise.then(function (data) {
                                $state.go('^', {}, {supercede: false});
                            });
                        }

                        createDialog();
                    }]
                })
                .state('my/groups', {
                    url: '/groups',
                    parent: 'my',
                    template: '<my-groups></my-groups>'
                })
                .state('my/groups/create', {
                    url: '/create',
                    parent: 'my/groups',
                    controller: ['$state', 'ngDialog', function ($state, ngDialog) {
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<group-create></group-create>',
                                plain: true
                            });

                            dialog.closePromise.then(function () {
                                $state.go('^', {}, {supercede: false});
                            });
                        }

                        createDialog();
                    }]
                })
                .state('my/groups/groupId', {
                    url: '/:groupId',
                    parent: 'my/groups',
                    resolve: {
                        rGroup: ['$stateParams', 'sAuthResolve', 'GroupService', 'AppService', 'Group', function ($stateParams, sAuthResolve, GroupService, AppService, Group) {
                            return Group
                                .get($stateParams.groupId)
                                .then(function (group) {
                                    AppService.group = group;
                                    return group;
                                });
                            // HACK: sAuthResolve is only included here so that auth state is loaded before topic is loaded. Angular does parallel loading if it does not see dependency on it.
                            if (!GroupService.groups.countTotal && !GroupService.isLoading) {
                                return GroupService.reload();
                            }
                        }]
                    },
                    template: '<my-groups-group></my-groups-group>'
                })
                .state('my/groups/groupId/settings', {
                    url: '/settings?tab',
                    parent: 'my/groups/groupId',
                    reloadOnSearch: false,
                    controller: ['$state', 'GroupService', 'ngDialog', function ($state, GroupService, ngDialog) {
                        var createDialog = function () {
                            ngDialog.closeAll();
                            var dialog = ngDialog.open({
                                template: '<group-settings></group-settings>',
                                plain: true,
                                preCloseCallback: function (value) {
                                    if (value === '$closeButton') {
                                        return true;
                                    }
                                    return false;
                                }
                            });
                            dialog.closePromise
                                .then(function () {
                                    GroupService.reload();
                                    $state.go('^', {}, {supercede: false, reload: true});
                                });
                        }

                        createDialog();
                    }]
                })
                .state('groupJoin', { // Join a Topic via shared url
                    url: '/groups/join/:token',
                    parent: 'main',
                    controller: ['$state', '$stateParams', 'Group', '$log', function ($state, $stateParams, Group, $log) {
                        Group
                            .join($stateParams.token)
                            .then(
                                function (res) {
                                    if (res.id) {
                                        $state.go('my/groups/groupId', {
                                            groupId: res.id
                                        });
                                    }
                                },
                                function (res) {
                                    var status = res.status;
                                    if (status.code === 40100) { // Unauthorized
                                        var currentUrl = $state.href($state.current.name, $stateParams);
                                        $state.go('account/login', {redirectSuccess: currentUrl});
                                    } else if (status.code === 40001) { // Matching token not found.
                                        $state.go('home');
                                    } else {
                                        $log.error('Failed to join Topic', res);
                                    }
                                }
                            );
                    }]
                })
                .state('about', {
                    url: '/about',
                    parent: 'main',
                    controller: ['$state', '$window', 'cosConfig', function ($state, $window, cosConfig) {
                        var aboutPage = cosConfig.links.about;

                        if (aboutPage) {
                            $window.location.href = aboutPage;

                            return;
                        }
                        $state.go('error/404');
                    }]
                })
                .state('join', { // Join a Topic via shared url - DEPRECATED, use "topicJoin" instead - https://github.com/citizenos/citizenos-fe/issues/311
                    url: '/join/:token',
                    parent: 'main',
                    controller: ['$state', '$stateParams', function ($state, $stateParams) {
                        // DEPRECATED! DEPRECATED, redirected to "topicJoin" instead - https://github.com/citizenos/citizenos-fe/issues/311
                        $state.go(
                            'topicJoin',
                            {
                                token: $stateParams.token.padStart(12, '0') // Legacy tokens are of length 8, pad with 0-s as the tokens where migrated over with leading 0-s
                            }
                        )
                    }]
                })
                .state('topicJoin', { // Join a Topic via shared url
                    url: '/topics/join/:token',
                    parent: 'main',
                    controller: 'TopicJoinController'
                })
                .state('topicsTopicIdInvitesUsers', { // Cannot use dot notation (topics.topicId.invites.users) as that would make the page child of "topics" and we don't want that.
                    url: '/topics/:topicId/invites/users/:inviteId',
                    parent: 'main',
                    template: '<home></home>',
                    resolve: {
                        rTopicInviteUser: ['$stateParams', '$q', '$log', 'TopicInviteUser', 'sNotification', function ($stateParams, $q, $log, TopicInviteUser, sNotification) {
                            var params = {
                                id: $stateParams.inviteId,
                                topicId: $stateParams.topicId
                            };

                            return TopicInviteUser
                                .get(params)
                                .then(
                                    function (topicInvite) {
                                        topicInvite.id = params.id;

                                        return topicInvite;
                                    },
                                    function (err) {
                                        if (err.status === 404) {
                                            sNotification.removeAll();
                                            sNotification.showDialog('MSG_ERROR_GET_API_USERS_TOPICS_INVITES_USERS_41002_HEADING', 'MSG_ERROR_GET_API_USERS_TOPICS_INVITES_USERS_41002');
                                            return;
                                        }

                                        return $q.resolve(err); // Resolve so that the page would load
                                    }
                                );
                        }]
                    },
                    controller: ['$scope', '$state', '$stateParams', '$log', '$timeout', 'sAuth', 'sNotification', 'ngDialog', 'TopicInviteUser', 'rTopicInviteUser', function ($scope, $state, $stateParams, $log, $timeout, sAuth, sNotification, ngDialog, TopicInviteUser, rTopicInviteUser) {
                        console.log('rTopicInviteUser', rTopicInviteUser);
                        if (!rTopicInviteUser.id) { // Some kind of error happened, the instance was not built
                            return; // ERROR: Expecting cosHttpApiErrorInterceptor to tell the user what went wrong
                        }

                        var doAccept = function () {
                            return TopicInviteUser
                                .accept(rTopicInviteUser)
                                .then(
                                    function () {
                                        return $state.go(
                                            'topics/view',
                                            {
                                                topicId: rTopicInviteUser.topicId
                                            }
                                        )
                                    }
                                );
                        };

                        // 1. The invited User is logged in - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                        if (sAuth.user.loggedIn && rTopicInviteUser.user.id === sAuth.user.id) {
                            return doAccept();
                        }
                        var data = angular.extend({}, $stateParams);
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_topicId_invites_users_inviteId.html',
                            data: data,
                            scope: $scope, // pass on scope, so that modal has access to App scope ($scope.app)
                            controller: ['$scope', '$log', function ($scope, $log) {
                                $scope.invite = rTopicInviteUser;

                                $scope.doAccept = function () {
                                    // 3. The invited User is NOT logged in - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                                    if (!sAuth.user.loggedIn) {
                                        var currentUrl = $state.href($state.current.name, $stateParams);
                                        if (!$scope.invite.user.isRegistered) {
                                            // The invited User is not registered, the User has been created by the system - https://github.com/citizenos/citizenos-fe/issues/773
                                            return $state.go('account/signup', {
                                                userId: $scope.invite.user.id,
                                                redirectSuccess: currentUrl,
                                                email: $scope.invite.user.email, // HACK: Hidden e-mail from the URL and tracking - https://github.com/citizenos/citizenos-fe/issues/657
                                                name: null
                                            });
                                        } else {
                                            return $state.go('account/login', {
                                                userId: $scope.invite.user.id,
                                                redirectSuccess: currentUrl,
                                                email: $scope.invite.user.email // HACK: Hidden e-mail from the URL and tracking - https://github.com/citizenos/citizenos-fe/issues/657
                                            });
                                        }
                                    }

                                    // 2. User logged in, but opens an invite NOT meant to that account  - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                                    if (sAuth.user.loggedIn && $scope.invite.user.id !== sAuth.user.id) {
                                        sAuth
                                            .logout()
                                            .then(function () {
                                                var currentUrl = $state.href($state.current.name, $stateParams);
                                                // Reload because the sAuthResolve would not update on logout causing the login screen to redirect to "home" thinking User is logged in
                                                return $state.go('account/login', {
                                                    userId: $scope.invite.user.id,
                                                    redirectSuccess: currentUrl,
                                                    email: $scope.invite.user.email // HACK: Hidden e-mail from the URL and tracking - https://github.com/citizenos/citizenos-fe/issues/657
                                                }, {reload: true});
                                            });
                                    }
                                };
                            }]
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('groupsGroupIdInvitesUsers', { // Cannot use dot notation (groups.groupId.invites.users) as that would make the page child of "groups" and we don't want that.
                    url: '/groups/:groupId/invites/users/:inviteId',
                    parent: 'main',
                    template: '<home></home>',
                    resolve: {
                        rGroupInviteUser: ['$stateParams', '$q', '$log', 'GroupInviteUser', 'sNotification', function ($stateParams, $q, $log, GroupInviteUser, sNotification) {
                            var params = {
                                inviteId: $stateParams.inviteId,
                                groupId: $stateParams.groupId
                            };

                            return GroupInviteUser
                                .get(params)
                                .then(
                                    function (groupInvite) {
                                        groupInvite.id = params.inviteId;

                                        return groupInvite;
                                    },
                                    function (err) {
                                        if (err.status === 404) {
                                            sNotification.removeAll();
                                            sNotification.showDialog('MSG_ERROR_GET_API_USERS_GROUPS_INVITES_USERS_41002_HEADING', 'MSG_ERROR_GET_API_USERS_GROUPS_INVITES_USERS_41002');
                                            return;
                                        }

                                        return $q.resolve(err); // Resolve so that the page would load
                                    }
                                );
                        }]
                    },
                    controller: ['$scope', '$state', '$stateParams', '$log', '$timeout', 'sAuth', 'sNotification', 'ngDialog', 'GroupInviteUser', 'rGroupInviteUser', function ($scope, $state, $stateParams, $log, $timeout, sAuth, sNotification, ngDialog, GroupInviteUser, rGroupInviteUser) {
                        var doAccept = function () {
                            return GroupInviteUser
                                .accept($stateParams)
                                .then(
                                    function () {
                                        return $state.go(
                                            'my/groups/groupId',
                                            {
                                                groupId: rGroupInviteUser.groupId
                                            }
                                        )
                                    }
                                );
                        };

                        // 1. The invited User is logged in - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                        if (sAuth.user.loggedIn && rGroupInviteUser.user.id === sAuth.user.id) {
                            return doAccept();
                        }
                        var data = angular.extend({}, $stateParams);
                        var dialog = ngDialog.open({
                            template: '/views/modals/group_groupId_invites_users_inviteId.html',
                            data: data,
                            scope: $scope, // pass on scope, so that modal has access to App scope ($scope.app)
                            controller: ['$scope', '$log', function ($scope, $log) {
                                $scope.invite = rGroupInviteUser;

                                $scope.doAccept = function () {
                                    // 3. The invited User is NOT logged in - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                                    if (!sAuth.user.loggedIn) {
                                        var currentUrl = $state.href($state.current.name, $stateParams);
                                        if (!$scope.invite.user.isRegistered) {
                                            // The invited User is not registered, the User has been created by the system - https://github.com/citizenos/citizenos-fe/issues/773
                                            return $state.go('account/signup', {
                                                userId: $scope.invite.user.id,
                                                redirectSuccess: currentUrl,
                                                email: $scope.invite.user.email, // HACK: Hidden e-mail from the URL and tracking - https://github.com/citizenos/citizenos-fe/issues/657
                                                name: null
                                            });
                                        } else {
                                            return $state.go('account/login', {
                                                userId: $scope.invite.user.id,
                                                redirectSuccess: currentUrl,
                                                email: $scope.invite.user.email // HACK: Hidden e-mail from the URL and tracking - https://github.com/citizenos/citizenos-fe/issues/657
                                            });
                                        }
                                    }

                                    // 2. User logged in, but opens an invite NOT meant to that account  - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                                    if (sAuth.user.loggedIn && $scope.invite.user.id !== sAuth.user.id) {
                                        sAuth
                                            .logout()
                                            .then(function () {
                                                var currentUrl = $state.href($state.current.name, $stateParams);
                                                // Reload because the sAuthResolve would not update on logout causing the login screen to redirect to "home" thinking User is logged in
                                                return $state.go('account/login', {
                                                    userId: $scope.invite.user.id,
                                                    redirectSuccess: currentUrl,
                                                    email: $scope.invite.user.email // HACK: Hidden e-mail from the URL and tracking - https://github.com/citizenos/citizenos-fe/issues/657
                                                }, {reload: true});
                                            });
                                    }
                                };
                            }]
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home', {}, {supercede: false});
                            }
                        });
                    }]
                })
                .state('partners', {
                    url: '/partners/:partnerId',
                    abstract: true,
                    parent: 'index',
                    resolve: {
                        rPartner: ['$stateParams', 'sPartner', 'AppService', function ($stateParams, sPartner, AppService) {
                            return sPartner
                                .info($stateParams.partnerId)
                                .then(function (partnerInfo) {
                                    AppService.partner = AppService;
                                    return partnerInfo;
                                });
                        }]
                    },
                    controller: ['$scope', 'rPartner', function ($scope, rPartner) {
                        $scope.partner = rPartner;
                    }],
                    templateUrl: '/views/layouts/partner.html'
                })
                .state('partners/login', {
                    url: '/login',
                    parent: 'partners',
                    template: '<partner-login></partner-login>'
                })
                .state('partners/consent', {
                    url: '/consent',
                    parent: 'partners',
                    template: '<user-consent-form></user-consent-form>'
                })
                .state('widgets', {
                    url: '/widgets?widgetId&widgetTitle&style',
                    parent: 'index',
                    abstract: true,
                    template: '<link rel="stylesheet" href="/styles/widgets.css"><link rel="stylesheet" ng-if="customWidgetStyle" type="text/css" href="{{customWidgetStyle}}"><div ui-view></div>',
                    controller: ['$rootScope', '$scope', '$window', '$document', '$stateParams', '$timeout', '$interval', '$log', 'ngDialog', function ($rootScope, $scope, $window, $document, $stateParams, $timeout, $interval, $log, ngDialog) {
                        $scope.app.widgetTitle = $stateParams.widgetTitle;
                        $scope.customWidgetStyle = $stateParams.style;
                        $scope.widgetPostMessage = function (data) {
                            if ($window.self !== $window.parent) {
                                var msg = {citizenos: {}};
                                msg.citizenos['widgets'] = {};
                                msg.citizenos['widgets'][$stateParams.widgetId] = data;
                                $window.top.postMessage(msg, '*');
                            } else {
                                // SKIP, as not in a frame
                            }
                        };

                        if ($window.self !== $window.parent) { // Inside iframe
                            var heightPrev;
                            var interval = $interval(function () {
                                var heightCurrent = $document[0].getElementsByTagName('body')[0].scrollHeight;
                                var lightbox = document.getElementById('root_lightbox');
                                if (lightbox && lightbox.scrollHeight) {
                                    heightCurrent = Math.max(heightCurrent, lightbox.scrollHeight);
                                }

                                if (heightPrev !== heightCurrent) {
                                    heightPrev = heightCurrent;

                                    $scope.widgetPostMessage({
                                        height: heightCurrent
                                    });
                                }
                            }, 100);

                            $scope.$on('$destroy', function () {
                                interval.cancel();
                            });

                            $rootScope.$on('ngDialog.opened', function () {
                                // If widgets are in iframe, we should inform about dialog positon for parent page to scroll to the right place
                                if ($window.self !== $window.parent) {
                                    var dialogElement = document.getElementById('lightbox');
                                    var dialogElementPosition = dialogElement.getBoundingClientRect();

                                    $scope.widgetPostMessage({
                                        overlay: {
                                            top: dialogElementPosition.top
                                        },
                                        height: document.getElementById('root_lightbox').scrollHeight
                                    });
                                }
                            });

                            $scope.doShowWidgetHowItWorks = function () {
                                ngDialog.open({
                                    template: '/views/modals/widgets_how_it_works.html'
                                });
                            }
                        }
                    }]
                })
                .state('widgets/wrapped', {
                    url: null,
                    parent: 'widgets',
                    abstract: true,
                    templateUrl: '/views/layouts/widget.html'
                })
                .state('widgets/wrapped/sourcePartnerObjectId', {
                    url: '/partners/:partnerId/topics/:sourcePartnerObjectId',
                    parent: 'widgets',
                    abstract: true,
                    template: '<div ui-view></div>',
                    resolve: {
                        TopicResolve: ['$http', '$stateParams', 'sLocation', function ($http, $stateParams, sLocation) {
                            var path = sLocation.getAbsoluteUrlApi(
                                '/api/partners/:partnerId/topics/:sourcePartnerObjectId',
                                $stateParams
                            );
                            return $http
                                .get(path)
                                .then(function (res) {
                                    return res.data.data;
                                });
                        }]
                    }
                })
                .state('widgets/wrapped/sourcePartnerObjectId/arguments', {
                    url: '/arguments',
                    parent: 'widgets/wrapped/sourcePartnerObjectId',
                    controller: ['$state', '$stateParams', 'TopicResolve', function ($state, $stateParams, TopicResolve) {
                        $state.go('widgets/wrapped/arguments', {
                            topicId: TopicResolve.id,
                            widgetId: $stateParams.widgetId
                        });
                    }]
                })
                .state('widgets/wrapped/arguments', {
                    url: '/topics/:topicId/arguments',
                    parent: 'widgets/wrapped',
                    template: '<div class="comments_section"><div class="comments_content"><div ng-include="\'views/topics_topicId_comments.html\'"></div></div></div>'
                })
                .state('widgets/activities', {
                    url: '/activities',
                    parent: 'widgets',
                    template: '<activities-widget></activities-widget>'
                })
                .state('widgets/topicActivities', {
                    url: '/topics/:topicId/activities',
                    parent: 'widgets',
                    template: '<activities-widget></activities-widget>'
                })
                .state('widgets/partnerActivities', {
                    url: '/partners/:partnerId/activities?filter',
                    parent: 'widgets',
                    template: '<activities-widget></activities-widget>'
                })
                .state('widgets/partnerTopicActivities', {
                    url: '/activities',
                    parent: 'widgets/wrapped/sourcePartnerObjectId',
                    controller: ['$state', '$stateParams', 'TopicResolve', function ($state, $stateParams, TopicResolve) {
                        $state.go('widgets/topicActivities', {
                            topicId: TopicResolve.id,
                            widgetId: $stateParams.widgetId
                        });
                    }]
                })
                .state('authCallback', { // Callback page for the "popup" style (facebook, google) authentication flow.
                    url: '/auth/callback',
                    template: '<h1>Redirecting...</h1>',
                    controller: ['$window', '$document', function ($window, $document) {
                        if ($document[0].documentMode || $window.navigator.userAgent.indexOf('Edge') > -1) {
                            return $window.close();
                        } else {
                            $window.opener.postMessage({status: 'success'}, $window.origin);
                        }
                    }]
                })
                .state('onedrive', {
                    url: '/onedrive',
                    templateUrl: '<div></div>'
                })
                .state('error', {
                    url: '/error',
                    parent: 'main',
                    abstract: true,
                    template: '<div ui-view class="full_height"></div>'
                })
                .state('error/401', {
                    url: '/401',
                    parent: 'error',
                    templateUrl: '/views/401.html'
                })
                .state('error/403', {
                    url: '/403',
                    parent: 'error',
                    templateUrl: '/views/401.html'
                })
                .state('error/404', {
                    url: '/404',
                    parent: 'error',
                    templateUrl: '/views/404.html'
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
                .registerAvailableLanguageKeys(Object.keys(cosConfig.language.list).push(cosConfig.language.debug))
                .determinePreferredLanguage()
                .useSanitizeValueStrategy('escaped') // null, 'escaped' - http://angular-translate.github.io/docs/#/guide/19_security
                .useLocalStorage()
                .useMissingTranslationHandlerLog()
                .translations(cosConfig.language.debug, {});


        }]);
})();
