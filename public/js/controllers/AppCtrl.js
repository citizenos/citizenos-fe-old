'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$log', '$state', '$location', '$timeout', '$cookies', 'sTranslate', 'amMoment', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', function ($scope, $rootScope, $log, $state, $location, $timeout, $cookies, sTranslate, amMoment, sLocation, cosConfig, ngDialog, sAuth, sUser, sHotkeys) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            showSearchFiltersMobile: false,
            isLoading: true
        };

        $scope.app.EVENTS = {
            USER_CHANGE: 'USER_CHANGE'
        };

        $scope.app.user = sAuth.user;
        $scope.app.language = sTranslate.currentLanguage;

        $scope.app.metainfo = {
            title: 'META_DEFAULT_TITLE',
            description: 'META_DEFAULT_DESCRIPTION',
            keywords: 'META_DEFAULT_KEYWORDS',
            icon: sLocation.getAbsoluteUrl('/favicon.ico'),
            author: null,
            image: sLocation.getAbsoluteUrl('/imgs/logo_dark_seo.png'),
            url: null,
            siteName: 'CitizenOS.com',
            hreflang: {}
        };

        createRelUrls();

        // Different global notifications that can be shown in the page header
        $scope.app.notifications = {
            messages: {}
        };

        $scope.app.notifications.levels = {
            SUCCESS: 'success',
            INFO: 'info',
            ERROR: 'error'
        };

        sHotkeys.add('ctrl+alt+shift+t', sTranslate.debugMode);

        // Initially all messages are empty
        Object.keys($scope.app.notifications.levels).forEach(function (key) {
            $scope.app.notifications.messages[$scope.app.notifications.levels[key]] = [];
        });

        /**
         * Show global notification with specified level
         *
         * @param {string} level One of $scope.app.notifications.types
         * @param {string} key Translation key
         */
        $scope.app.doShowNotification = function (level, key) {
            $scope.app.notifications.messages[level].push(key);
        };

        /**
         * Hide global notification with specified level
         *
         * @param {string} level One of $scope.app.notifications.types
         */
        $scope.app.doHideNotification = function (level) {
            $scope.app.notifications.messages[level] = [];
        };

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

        $scope.app.doShowConfirm = function () {
            $log.debug('AppCtrl.doShowConfirm()');

            ngDialog.open({
                template: '/views/modals/confirm.html',
                scope: $scope
            });
        };


        $scope.app.doShowDatePicker = function () {
            $log.debug('AppCtrl.doShowDatePicker()');

            ngDialog.open({
                template: '/views/modals/date_picker.html',
                scope: $scope
            });
        };


        $scope.app.doShowInviteUsers = function () {
            $log.debug('AppCtrl.doShowInviteUsers()');

            ngDialog.open({
                template: '/views/modals/invite_users.html',
                scope: $scope
            });
        };

        $scope.app.doShowAddTopics = function () {
            $log.debug('AppCtrl.doShowAddTopic()');

            ngDialog.open({
                template: '/views/modals/add_topics.html',
                scope: $scope
            });
        };

        $scope.app.doShowDeleteTopic = function () {
            $log.debug('AppCtrl.doShowDeleteTopic()');

            ngDialog.open({
                template: '/views/modals/topic_delete_confirm.html',
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
                sTranslate.switchLanguage(language);
                if (sTranslate.checkLanguageIsValid(language)) {
                    $cookies.put('language', language);
                    $log.debug('langCookie', $cookies.get('language'));
                }
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

        $rootScope.$on('$translateChangeSuccess', function () {
            $scope.app.language = sTranslate.currentLanguage;
            amMoment.changeLocale($scope.app.language);
        });

        $rootScope.$on('$stateChangeSuccess', function () {
            $timeout(function () {
                $log.debug('AppCtrl.$stateChangeSuccess', 'prerenderReady', $state.$current.name);
                window.prerenderReady = true;

                $scope.app.showSearch = false;
                $scope.app.showSearchResults = false;
                $scope.app.showSearchFiltersMobile = false;
                $scope.app.showNav = false;
            });
        });

        function createRelUrls() {
            angular.forEach(sTranslate.LANGUAGES, function (language) {
                var url = $location.url().split('/');
                url[1] = language;
                $scope.app.metainfo.hreflang[language] = sLocation.getBaseUrl() + url.join('/');
            });
        }

    }]);
