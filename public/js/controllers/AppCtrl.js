'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$log', 'cosConfig', 'ngDialog', function ($scope, $log, cosConfig, ngDialog) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false
        };

        // Application User info
        $scope.app.user = {
            loggedIn: false
        };

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

        $scope.doShowLogin = function () {
            $log.debug('AppCtrl.doShowLogin()');

            ngDialog.open({
                template: '/views/modals/login.html',
                scope: $scope
            });
        };

        //FIXME: REMOVE, used for debugging on mobile
        $scope.app.alert = function (str) {
            alert(str);
        };
    }]);
