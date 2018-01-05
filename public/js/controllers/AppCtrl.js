'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$log', '$state', '$window', '$location', '$timeout', '$cookies', '$anchorScroll', 'sTranslate', 'amMoment', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', 'sNotification', 'UserVoice', function ($scope, $rootScope, $log, $state, $window, $location, $timeout, $cookies, $anchorScroll, sTranslate, amMoment, sLocation, cosConfig, ngDialog, sAuth, sUser, sHotkeys, sNotification, UserVoice) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            showSearchFiltersMobile: false,
            isLoading: true
        };

        $scope.app.user = sAuth.user;
        
        sTranslate
            .getCurrentLanguage()
            .then(function (language) {
                $scope.app.language = language;
            });

        $scope.app.metainfo = {
            title: 'META_DEFAULT_TITLE',
            description: 'META_DEFAULT_DESCRIPTION',
            keywords: 'META_DEFAULT_KEYWORDS',
            icon: sLocation.getAbsoluteUrl('/imgs/favicon.ico'),
            iconHires: sLocation.getAbsoluteUrl('/imgs/icon_hires.png'),
            author: null,
            image: sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.png'),
            url: null,
            siteName: 'CitizenOS.com',
            hreflang: {}
        };

        createRelUrls();

        // Different global notifications that can be shown in the page header
        $scope.app.notifications = sNotification;

        sHotkeys.add('ctrl+alt+shift+t', sTranslate.debugMode);

        $scope.app.doShowLogin = function () {
            $log.debug('AppCtrl.doShowLogin()');

            ngDialog.open({
                template: '/views/modals/login.html',
                scope: $scope
            });
        };

        $scope.app.doShowMyAccount = function () {
            $log.debug('AppCtrl.doShowMyAccount()');

            ngDialog.open({
                template: '/views/modals/my_account.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowConfirm = function () {
            $log.debug('AppCtrl.doShowConfirm()');

            ngDialog.open({
                template: '/views/_templates/modals/confirm.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowDeleteComment = function () {
            $log.debug('AppCtrl.doShowDeleteComment()');

            ngDialog.open({
                template: '/views/_templates/modals/delete_comment.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowSetNumber = function () {
            $log.debug('AppCtrl.doShowSetNumber()');

            ngDialog.open({
                template: '/views/_templates/modals/set_number.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowDatePicker = function () {
            $log.debug('AppCtrl.doShowDatePicker()');

            ngDialog.open({
                template: '/views/_templates/modals/date_picker.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowInviteUsers = function () {
            $log.debug('AppCtrl.doShowInviteUsers()');

            ngDialog.open({
                template: '/views/_templates/modals/invite_users.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowAddTopics = function () {
            $log.debug('AppCtrl.doShowAddTopic()');

            ngDialog.open({
                template: '/views/_templates/modals/add_topics.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowTopicSettings = function () {
            $log.debug('AppCtrl.doShowTopicSettings()');

            ngDialog.open({
                template: '/views/modals/topic_settings.html',
                scope: $scope
            });
        };

        // TODO: REMOVE - temporary for templates
        $scope.app.doShowDeleteTopic = function () {
            $log.debug('AppCtrl.doShowDeleteTopic()');

            ngDialog.open({
                template: '/views/_templates/modals/topic_delete_confirm.html',
                scope: $scope
            });
        };

        $scope.app.doSwitchLanguage = function (language) {
            $log.debug('AppCtrl.doSwitchLanguage()', language);
            if (language === $scope.app.language) {
                return;
            }

            if ($scope.app.user.loggedIn && sTranslate.checkLanguageIsValid(language) && $scope.app.user.language !== language) {
                sUser
                    .updateLanguage(language)
                    .then(function () {
                        $scope.app.user.language = language;
                        sTranslate.switchLanguage(language);
                    });
            } else {
                if (sTranslate.checkLanguageIsValid(language)) {
                    $cookies.put('language', language);
                    $log.debug('langCookie', $cookies.get('language'));
                }
                sTranslate.switchLanguage(language);
            }
        };

        $scope.app.doLogout = function () {
            sAuth
                .logout()
                .then(
                    function () {
                        $state.go('home');
                    },
                    function (err) {
                        $log.error('AppCtrl.doLogout()', 'Logout failed', err);
                    }
                );
        };

        $scope.app.scrollToAnchor = function (anchor) {
            // TODO: Probably not the most elegant way but works for now. Probably should be a directive, which calculates the yOffset (https://docs.angularjs.org/api/ng/service/$anchorScroll#yOffset)
            $timeout(function () {
                if ($rootScope.wWidth <= 1024) {
                    $anchorScroll.yOffset = 68;
                } else {
                    $anchorScroll.yOffset = 8;
                }
                $anchorScroll(anchor);
            }, 0);
        };

        $rootScope.$on('ngDialog.opened', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('ngDialog.closed', function () {
            sNotification.removeAll();
        });

        $rootScope.$on('$translateChangeSuccess', function () {
            $scope.app.language = sTranslate.currentLanguage;
            amMoment.changeLocale($scope.app.language);
            UserVoice.push(['set', 'locale', $scope.app.language]);
        });

        $rootScope.$on('$stateChangeSuccess', function () {
            $timeout(function () {
                $log.debug('AppCtrl.$stateChangeSuccess', 'prerenderReady', $state.$current.name);
                window.prerenderReady = true;

                if ($window.ga) {
                    $window.ga('send', {
                        hitType: 'pageview',
                        page: $location.url()
                    });
                }

                $scope.app.showSearch = false;
                $scope.app.showSearchResults = false;
                $scope.app.showSearchFiltersMobile = false;
                $scope.app.showNav = false;
                $anchorScroll();
            });
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            $log.debug('$stateChangeError', 'event', event, 'toState', toState, 'toParams', toParams, 'fromState', fromState, 'fromParams', fromParams, 'error', error);
            if (error.status && error.data && error.config) { // $http failure in "resolve"
                var stateError = 'error.' + error.status;
                $log.debug('$stateChangeError', '"resolve" failed in route definition.');
                $state.go(stateError, {language: fromParams.language || $scope.app.user.language}, {location: false});
            }
        });

        function createRelUrls() {
            angular.forEach(sTranslate.LANGUAGES, function (language) {
                var url = $location.url().split('/');
                url[1] = language;
                $scope.app.metainfo.hreflang[language] = sLocation.getBaseUrl() + url.join('/');
            });
        }

        // Update UserVoice data when User changes
        $scope.$watch(function () {
            return $scope.app.user.loggedIn;
        }, function (loggedIn) {
            if (loggedIn) {
                Raven.setUserContext({
                    id: $scope.app.user.id
                });

                UserVoice.push(['identify', {
                    email: $scope.app.user.email || '',
                    id: $scope.app.user.id,
                    name: $scope.app.user.name
                }]);
            } else {
                Raven.setUserContext();
                UserVoice.push(['identify', {}]);
            }
        });
        // Set up UserVoice - https://developer.uservoice.com/docs/widgets/options/
        // TODO: Ideally this should be in provider.config...
        UserVoice.push(['set', {
            accent_color: '#808283',
            trigger_color: 'white',
            trigger_background_color: 'rgba(46, 49, 51, 0.6)'
        }]);

        UserVoice.push(['addTrigger', {mode: 'contact', trigger_position: 'bottom-right'}]);

    }]);
