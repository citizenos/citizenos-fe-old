'use strict';

(function () {

    var module = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngSanitize', 'ngResource', 'ngTouch', 'ngDialog', 'angularMoment', 'focus-if', 'angular-loading-bar', 'ngCookies', 'angularHwcrypto', 'typeahead', 'datePicker', 'monospaced.qrcode', '720kb.tooltips', 'angularLoad']);

    module
        .constant('cosConfig', window.__config || {});

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

            $urlRouterProvider.config({
                absolute: true // All urls absolute by default
            });

            $stateProvider
                .state('index', {
                    url: '/{language:' + langReg + '}',
                    abstract: true,
                    template: '<div ui-view class="full_height"></div>',
                    resolve: {
                        /* @ngInject */
                        sTranslateResolve: function ($stateParams, $log, sTranslate) {
                            $log.debug('Resolve language', $stateParams.language);
                            return sTranslate.setLanguage($stateParams.language);
                        },
                        sAuthResolve: function ($q, $log, $state, $stateParams, $window, sAuth, sLocation) {
                            if (sAuth.user.loggedIn) {
                                return;
                            }
                            return sAuth
                                .status()
                                .then(
                                    function () {
                                        $log.debug('Resolve user', sAuth.user, 'LOGGED IN');
                                        if (sAuth.user.loggedIn) {
                                            if (!sAuth.user.termsVersion || sAuth.user.termsVersion !== cosConfig.legal.version) {
                                                return $state.go(
                                                    'account.tos',
                                                    {
                                                        redirectSuccess: sLocation.getAbsoluteUrl($window.location.pathname) + $window.location.search
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
                        }
                    }
                })
                .state('main', {
                    url: null,
                    abstract: true,
                    parent: 'index',
                    templateUrl: '/views/layouts/main.html',
                    resolve: {
                        /* @ngInject */
                        sActivitiesResolve: function ($log, $q, sAuthResolve, sAuth, sActivity) {
                            $log.debug('Resolve unreadActivities');
                            if (sAuth.user.loggedIn) {
                                return sActivity
                                    .getUnreadActivities();
                            } else {
                                return $q.resolve(false);
                            }

                        }
                    }
                })
                .state('home', {
                    url: '/?topicStatus',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('category', {
                    url: '/topics/categories/:category?topicStatus',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('cookieControl', {
                    url: '/cookieControl',
                    parent: 'main',
                    templateUrl: '/views/home.html',
                    controller: ['$scope', 'ngDialog', function ($scope, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/cookie_control.html',
                            closeByEscape: false,
                            closeByNavigation: false,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('opinionfestival', {
                    url: '/opinionfestival',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('hacktivistcommunity', {
                    url: '/hacktivistcommunity?topicStatus',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('thirtyfourislandproject', {
                    url: '/thirtyfourislandproject?topicStatus',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('eestijazziarengusuunad', {
                    url: '/eestijazziarengusuunad?topicStatus',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('thetwelvemovie', {
                    url: '/thetwelvemovie?topicStatus',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('account', {
                    url: '/account',
                    abstract: true,
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('account.tos', {
                    url: '/tos?redirectSuccess',
                    controller: ['$scope', 'ngDialog', function ($scope, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/privacy_policy.html',
                            closeByEscape: false,
                            closeByNavigation: false,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.signup', {
                    url: '/signup?email&name&redirectSuccess',
                    controller: ['$scope', '$state', '$stateParams', '$log', 'ngDialog', 'sAuthResolve', function ($scope, $state, $stateParams, $log, ngDialog, sAuthResolve) {
                        if (sAuthResolve) {
                            return $state.go('home');
                        }

                        var dialog = ngDialog.open({
                            template: '/views/modals/sign_up.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home');
                            }
                        });
                    }]
                })
                .state('account.login', {
                    url: '/login?email&redirectSuccess',
                    controller: ['$scope', '$state', '$stateParams', '$log', 'ngDialog', 'sAuthResolve', function ($scope, $state, $stateParams, $log, ngDialog, sAuthResolve) {
                        if (sAuthResolve) {
                            return $state.go('home');
                        }

                        var dialog = ngDialog.open({
                            template: '/views/modals/login.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home');
                            }
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
                    url: '/create?title&groupId&groupLevel',
                    parent: 'topics',
                    controller: ['$scope', '$state', '$stateParams', 'sAuth', 'Topic', 'GroupMemberTopic', function ($scope, $state, $stateParams, sAuth, Topic, GroupMemberTopic) {
                        if (!sAuth.user.loggedIn) {
                            return $state.go('account.login', null, {location: false});
                        }

                        var topic = new Topic();

                        if ($stateParams.title) {
                            topic.description = '<html><head></head><body><h1>' + $stateParams.title + '</h1></body></html>';
                        }

                        topic
                            .$save()
                            .then(function (topic) {
                                if ($stateParams.groupId) {
                                    var level = $stateParams.groupLevel || GroupMemberTopic.LEVELS.read;
                                    var member = {
                                        groupId: $stateParams.groupId,
                                        id: topic.id,
                                        level: level
                                    };
                                    var groupMemberTopic = new GroupMemberTopic(member);
                                    groupMemberTopic
                                        .$save()
                                        .then(function () {
                                            $state.go('topics.view', {
                                                language: $stateParams.language,
                                                topicId: topic.id,
                                                editMode: true
                                            });
                                        });
                                } else {
                                    $state.go('topics.view', {
                                        language: $stateParams.language,
                                        topicId: topic.id,
                                        editMode: true
                                    });
                                }
                            });
                    }]
                })
                .state('topics.view', {
                    url: '/:topicId?editMode&commentId&argumentsPage',
                    parent: 'topics',
                    templateUrl: '/views/topics_topicId.html',
                    resolve: {
                        rTopic: ['$state', '$stateParams', 'Topic', 'sAuthResolve', function ($state, $stateParams, Topic, sAuthResolve) {
                            // HACK: sAuthResolve is only included here so that auth state is loaded before topic is loaded. Angular does parallel loading if it does not see dependency on it.
                            return new Topic({id: $stateParams.topicId})
                                .$get()
                                .then(function (topic) {
                                    return topic;
                                });
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
                .state('topics.view.invite', {
                    url: '/invite?tab',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_invite.html',
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
                .state('topics.view.files', {
                    url: '/files',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_attachments.html',
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
                .state('topics.view.report', {
                    url: '/report',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^');
                                });
                            return;
                        }

                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_report.html',
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
                .state('topics.view.reportsModerate', { // Cant use topics.view.reports.moderate as that would assume this route is child of topics.view.reports which it is not
                    url: '/reports/:reportId/moderate',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^');
                                });
                            return;
                        }

                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_reports_reportId_moderate.html',
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
                .state('topics.view.reportsReview', { // Cant use topics.view.reports.moderate as that would assume this route is child of topics.view.reports which it is not
                    url: '/reports/:reportId/review',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^');
                                });
                            return;
                        }

                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_reports_reportId_review.html',
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
                .state('topics.view.reportsResolve', {
                    url: '/reports/:reportId/resolve',
                    parent: 'topics.view',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        if (!$scope.app.user.loggedIn) {
                            var dialogLogin = $scope.app.doShowLogin();
                            dialogLogin.closePromise
                                .then(function () {
                                    $state.go('^');
                                });
                            return;
                        }

                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_reports_reportId_resolve.html',
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
                .state('topics.view.commentsReportsModerate', {
                    url: '/comments/:reportedCommentId/reports/:reportId/moderate?token',
                    parent: 'topics.view',
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
                            template: '/views/modals/topic_comment_moderate.html',
                            data: {
                                comment: rTopicComment.comment,
                                topic: rTopic,
                                report: {
                                    id: $stateParams.reportId
                                },
                                token: $stateParams.token
                            }
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
                                    $state.go('topics.view.votes.view', {
                                        language: $stateParams.language,
                                        topicId: rTopic.id,
                                        voteId: rTopic.voteId
                                    }); //if vote is allready created redirect to voting
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
                .state('topics.view.followUp', {
                    parent: 'topics.view',
                    url: '/followUp',
                    template: '<div ui-view></div>',
                    resolve: {
                        status: ['rTopic', '$q', '$state', '$stateParams', 'Topic', function (rTopic, $q, $state, $stateParams, Topic) {
                            if ([Topic.STATUSES.closed, Topic.STATUSES.followUp].indexOf(rTopic.status) > -1) {
                                return $q.resolve();
                            } else {
                                $state.go('topics.view', {
                                    language: $stateParams.language,
                                    topicId: rTopic.id
                                }); //if topic editing or voting is still in progress
                            }
                        }]
                    },
                    controller: 'TopicFollowUpCtrl'
                })
                .state('my', {
                    url: '/my?filter&openTabs',
                    parent: 'main',
                    templateUrl: '/views/my.html',
                    controller: 'MyCtrl',
                    resolve: {
                        // Array of Topics / Groups
                        rItems: ['$state', '$stateParams', '$location', '$q', '$window', 'Topic', 'Group', 'sAuth', 'sAuthResolve', function ($state, $stateParams, $location, $q, $window, Topic, Group, sAuth, sAuthResolve) {
                            var filterParam = $stateParams.filter || 'all';
                            var urlParams = {
                                prefix: null,
                                userId: null
                            };
                            var path = $location.path();

                            if (!$stateParams.filter && (path.indexOf('groups') > -1)) {
                                $stateParams.filter = 'grouped';
                                filterParam = 'grouped';
                            }

                            if (sAuthResolve || sAuth.user.loggedIn) {
                                urlParams = {
                                    prefix: 'users',
                                    userId: 'self'
                                }
                            }

                            switch (filterParam) {
                                case 'all':
                                    return Topic.query(urlParams).$promise;
                                case 'public':
                                    urlParams.visibility = Topic.VISIBILITY.public;
                                    return Topic.query(urlParams).$promise;
                                case 'private':
                                    urlParams.visibility = Topic.VISIBILITY.private;
                                    return Topic.query(urlParams).$promise;
                                case 'haveVoted':
                                    urlParams.hasVoted = true;
                                    return Topic.query(urlParams).$promise;
                                case 'haveNotVoted':
                                    urlParams.hasVoted = false;
                                    return Topic.query(urlParams).$promise;
                                case 'iCreated':
                                    urlParams.creatorId = sAuth.user.id;
                                    return Topic.query(urlParams).$promise;
                                case 'inProgress':
                                    urlParams.statuses = Topic.STATUSES.inProgress;
                                    return Topic.query(urlParams).$promise;
                                case 'voting':
                                    urlParams.statuses = Topic.STATUSES.voting;
                                    return Topic.query(urlParams).$promise;
                                case 'followUp':
                                    urlParams.statuses = Topic.STATUSES.followUp;
                                    return Topic.query(urlParams).$promise;
                                case 'closed':
                                    urlParams.statuses = Topic.STATUSES.closed;
                                    return Topic.query(urlParams).$promise;
                                case 'pinnedTopics':
                                    urlParams.pinned = true;
                                    return Topic.query(urlParams).$promise;
                                case 'showModerated':
                                    urlParams.showModerated = true;
                                    return Topic.query(urlParams).$promise;
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
                        rTopic: ['$stateParams', '$anchorScroll', 'Topic', 'sAuthResolve', function ($stateParams, $anchorScroll, Topic, sAuthResolve) {
                            var urlParams = {
                                topicId: $stateParams.topicId,
                                include: 'vote'
                            };
                            if (sAuthResolve) {
                                urlParams.prefix = 'users';
                                urlParams.userId = 'self';
                            }
                            return Topic.get(urlParams).$promise
                                .then(function (topic) {
                                    $anchorScroll('content_root'); // TODO: Remove when the 2 columns become separate scroll areas
                                    return topic;
                                });
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
                .state('my.topics.topicId.invite', {
                    url: '/invite?tab',
                    parent: 'my.topics.topicId',
                    reloadOnSearch: false,
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_invite.html',
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
                        rGroup: ['$state', '$stateParams', '$anchorScroll', 'Group', 'rItems', function ($state, $stateParams, $anchorScroll, Group, rItems) {
                            $anchorScroll('content_root'); // TODO: Remove when the 2 columns become separate scroll areas
                            var group = _.find(rItems, {id: $stateParams.groupId});

                            if (!group) {
                                $state.go('error.404');
                            } else {
                                return group;
                            }
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
                    controller: ['$state', '$window', 'cosConfig', function ($state, $window, cosConfig) {
                        var aboutPage = cosConfig.links.about;

                        if (aboutPage) {
                            $window.location.href = aboutPage;

                            return;
                        }
                        $state.go('error.404');
                    }]
                })
                .state('join', { // Join a Topic via shared url
                    url: '/join/:tokenJoin',
                    parent: 'main',
                    controller: 'JoinCtrl'
                })
                .state('topicsTopicIdInvitesUsers', { // Cannot use dot notation (topics.topicId.invites.users) as that would make the page child of "topics" and we don't want that.
                    url: '/topics/:topicId/invites/users/:inviteId',
                    parent: 'main',
                    templateUrl: '/views/home.html',
                    resolve: {
                        rTopicInviteUser: ['$stateParams', '$q', '$log', 'TopicInviteUser', function ($stateParams, $q, $log, TopicInviteUser) {
                            var params = {
                                id: $stateParams.inviteId,
                                topicId: $stateParams.topicId
                            };

                            return new TopicInviteUser(params)
                                .$get()
                                .then(
                                    function (topicInvite) {
                                        topicInvite.id = params.id;

                                        return topicInvite;
                                    },
                                    function (err) {
                                        return $q.resolve(err); // Resolve so that the page would load
                                    }
                                );
                        }]
                    },
                    controller: ['$scope', '$state', '$stateParams', '$log', '$timeout', 'sAuth', 'sNotification', 'ngDialog', 'TopicInviteUser', 'rTopicInviteUser', function ($scope, $state, $stateParams, $log, $timeout, sAuth, sNotification, ngDialog, TopicInviteUser, rTopicInviteUser) {
                        if (!(rTopicInviteUser instanceof TopicInviteUser)) { // Some kind of error happened, the instance was not built
                            return; // ERROR: Expecting cosHttpApiErrorInterceptor to tell the user what went wrong
                        }

                        var doAccept = function () {
                            return rTopicInviteUser
                                .$accept()
                                .then(
                                    function () {
                                        return $state.go(
                                            'topics.view',
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

                        var dialog = ngDialog.open({
                            template: '/views/modals/topic_topicId_invites_users_inviteId.html',
                            data: $stateParams,
                            scope: $scope, // pass on scope, so that modal has access to App scope ($scope.app)
                            controller: ['$scope', '$log', function ($scope, $log) {
                                $scope.invite = rTopicInviteUser;

                                $scope.doAccept = function () {
                                    // 3. The invited User is NOT logged in - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                                    if (!sAuth.user.loggedIn) {
                                        var currentUrl = $state.href($state.current.name, $stateParams);
                                        return $state.go('account.login', {redirectSuccess: currentUrl});
                                    }

                                    // 2. User logged in, but opens an invite NOT meant to that account  - https://github.com/citizenos/citizenos-fe/issues/112#issuecomment-541674320
                                    if (sAuth.user.loggedIn && $scope.invite.user.id !== sAuth.user.id) {
                                        sAuth
                                            .logout()
                                            .then(function () {
                                                var currentUrl = $state.href($state.current.name, $stateParams);
                                                // Reload because the sAuthResolve would not update on logout causing the login screen to redirect to "home" thinking User is logged in
                                                return $state.go('account.login', {redirectSuccess: currentUrl}, {reload: true});
                                            });
                                    }
                                };
                            }]
                        });

                        dialog.closePromise.then(function (data) {
                            if (data.value !== '$navigation') { // Avoid running state change when ngDialog is already closed by a state change
                                return $state.go('home');
                            }
                        });
                    }]
                })
                .state('partners', {
                    url: '/partners/:partnerId',
                    abstract: true,
                    parent: 'index',
                    resolve: {
                        rPartner: ['$stateParams', 'sPartner', function ($stateParams, sPartner) {
                            return sPartner
                                .info($stateParams.partnerId)
                                .then(function (partnerInfo) {
                                    return partnerInfo;
                                });
                        }]
                    },
                    controller: 'PartnerCtrl',
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
                .state('widgets.wrapped', {
                    url: null,
                    parent: 'widgets',
                    abstract: true,
                    templateUrl: '/views/layouts/widget.html'
                })
                .state('widgets.wrapped.sourcePartnerObjectId', {
                    url: '/partners/:partnerId/topics/:sourcePartnerObjectId',
                    parent: 'widgets',
                    abstract: true,
                    template: '<div ui-view></div>',
                    resolve: {
                        /* @ngInject */
                        TopicResolve: function ($http, $state, $stateParams, sLocation) {
                            var path = sLocation.getAbsoluteUrlApi(
                                '/api/partners/:partnerId/topics/:sourcePartnerObjectId',
                                $stateParams
                            );
                            return $http
                                .get(path)
                                .then(function (res) {
                                    return res.data.data;
                                });
                        }
                    }
                })
                .state('widgets.wrapped.sourcePartnerObjectId.arguments', {
                    url: '/arguments',
                    parent: 'widgets.wrapped.sourcePartnerObjectId',
                    controller: ['$state', '$stateParams', 'TopicResolve', function ($state, $stateParams, TopicResolve) {
                        $state.go('widgets.wrapped.arguments', {
                            topicId: TopicResolve.id,
                            widgetId: $stateParams.widgetId
                        });
                    }]
                })
                .state('widgets.wrapped.arguments', {
                    url: '/topics/:topicId/arguments',
                    parent: 'widgets.wrapped',
                    template: '<div class="comments_section"><div class="comments_content"><div ng-include="\'views/topics_topicId_comments.html\'"></div></div></div>'
                })
                .state('widgets.activities', {
                    url: '/activities',
                    parent: 'widgets',
                    templateUrl: '/views/widgets/activities.html',
                    resolve: {
                        /* @ngInject */
                        ActivitiesResolve: function ($http, $stateParams, sActivity) {
                            return sActivity.getActivitiesUnauth(0, 100);
                        }
                    },
                    controller: 'ActivitiesWidgetCtrl'
                })
                .state('widgets.topicActivities', {
                    url: '/topics/:topicId/activities',
                    parent: 'widgets',
                    templateUrl: '/views/widgets/activities.html',
                    resolve: {
                        /* @ngInject */
                        ActivitiesResolve: function ($http, $stateParams, sActivity) {
                            return sActivity.getTopicActivitiesUnauth($stateParams.topicId);
                        }
                    },
                    controller: 'ActivitiesWidgetCtrl'
                })
                .state('widgets.partnerActivities', {
                    url: '/partners/:partnerId/activities?filter',
                    parent: 'widgets',
                    templateUrl: '/views/widgets/activities.html',
                    resolve: {
                        /* @ngInject */
                        ActivitiesResolve: function ($http, $stateParams, sActivity) {
                            var filters = $stateParams.filter;
                            return sActivity.getActivitiesUnauth(0, 50, null, filters, $stateParams.partnerId);
                        }
                    },
                    controller: 'ActivitiesWidgetCtrl'
                })
                .state('widgets.partnerTopicActivities', {
                    url: '/activities',
                    parent: 'widgets.wrapped.sourcePartnerObjectId',
                    controller: ['$state', '$stateParams', 'TopicResolve', function ($state, $stateParams, TopicResolve) {
                        $state.go('widgets.topicActivities', {
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
                .state('error.404', {
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
