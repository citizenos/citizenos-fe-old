'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$state', '$log', 'sTranslate', 'cosConfig', 'ngDialog', 'sAuth', '$location', function ($scope, $rootScope, $state, $log, sTranslate, cosConfig, ngDialog, sAuth, $location) {
        $log.debug('AppCtrl');
        $log.debug($location.path());

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false,
            isLoading: true
        };
        $scope.app.user = sAuth.user;
        $scope.app.locale = sTranslate.currentLocale();
        $scope.app.language = sTranslate.currentLanguage();
        $scope.app.doShowLogin = doShowLogin;
        $scope.app.switchLanguage = switchLanguage;

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

        $rootScope.$watch(function () {
            return !sAuth.user.isLoading;
        }, function (isLoading) {
            $log.info('$scope.app.user.isLoading', sAuth.user.isLoading);
            if (isLoading) {
                $scope.app.user = sAuth.user;
                $scope.app.isLoading = false;
            }
        });

        function doShowLogin() {
            $log.debug('AppCtrl.doShowLogin()');

            ngDialog.open({
                template: '/views/modals/login.html',
                scope: $scope
            });
        }

        function switchLanguage(locale) {
            $log.debug('AppCtrl.switchLanguage()', locale);
            if (sTranslate.checkLocaleIsValid(locale)) {
                $state.transitionTo($state.current.name, {language: locale});
            }
            sTranslate.setLanguage(locale);
        }

        $rootScope.$on('$translateChangeSuccess', setLocaleVariables);

        function setLocaleVariables() {
            $scope.app.locale = sTranslate.currentLocale();
            $scope.app.language = sTranslate.currentLanguage();
        }
    }]);
