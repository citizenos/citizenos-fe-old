'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$log', '$state', '$location', '$timeout', '$cookies', 'sTranslate', 'sLocation', 'cosConfig', 'ngDialog', 'sAuth', 'sUser', 'sHotkeys', function ($scope, $rootScope, $log, $state, $location, $timeout, $cookies, sTranslate, sLocation, cosConfig, ngDialog, sAuth, sUser, sHotkeys) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            isLoading: true
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

        $scope.app.doShowIdSigning = function () {
            $log.debug('AppCtrl.doShowIdSigning()');

            ngDialog.open({
                template: '/views/lightboxes/id_signing.html',
                scope: $scope
            });
        };
        $scope.app.doShowIdSigning();

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
                if( sTranslate.checkLanguageIsValid(language) ){
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
        });

        $rootScope.$on('$stateChangeSuccess', function () {
            $timeout(function () {
                $log.debug('AppCtrl.$stateChangeSuccess', 'prerenderReady');
                window.prerenderReady = true;
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
