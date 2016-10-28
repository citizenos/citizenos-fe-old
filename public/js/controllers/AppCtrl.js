'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$log', 'sTranslate', 'cosConfig', 'ngDialog', 'sAuth', function ($scope, $rootScope, $log, sTranslate, cosConfig, ngDialog, sAuth) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            isLoading: true
        };
        $scope.app.user = sAuth.user;
        $scope.app.locale = sTranslate.currentLocale;
        $scope.app.language = sTranslate.currentLanguage;

        // Different global notifications that can be shown in the page header
        $scope.app.notifications = {
            messages: {}
        };

        $scope.app.notifications.levels = {
            SUCCESS: 'success',
            INFO: 'info',
            ERROR: 'error'
        };

        // Initially all messages
        Object.keys($scope.app.notifications.levels).forEach(function (key) {
            $scope.app.notifications.messages[$scope.app.notifications.levels[key]] = [];
        });

        /**
         * Show global notification with specified level
         *
         * @param {string} level One of $scope.app.notifications.types
         * @param {string} message Message to show
         */
        $scope.app.doShowNotification = function (level, message) {
            $scope.app.notifications.messages[level].push(message);
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

        $scope.app.doSwitchLanguage = function (locale) {
            $log.debug('AppCtrl.doSwitchLanguage()', locale);
            sTranslate.switchLanguage(locale);
        };

        ///Listeners and watchers
        $rootScope.$watch(
            function () {
                return !sAuth.user.isLoading;
            },
            function (isLoading) {
                $log.info('$scope.app.user.isLoading', sAuth.user.isLoading);
                if (isLoading) {
                    $scope.app.user = sAuth.user;
                    $scope.app.isLoading = false;
                }
            }
        );
        $rootScope.$on('$translateChangeSuccess', setLocaleVariables);

        function setLocaleVariables() {
            $scope.app.locale = sTranslate.currentLocale;
            $scope.app.language = sTranslate.currentLanguage;
        }
    }]);
