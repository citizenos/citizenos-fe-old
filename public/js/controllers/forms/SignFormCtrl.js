'use strict';

angular
    .module('citizenos')
    .controller('SignFormCtrl', ['$scope', '$log', '$state', '$stateParams', '$window', '$document', '$interval', 'ngDialog', 'sAuth', 'sLocation', 'sNotification', function ($scope, $log, $state, $stateParams, $window, $document, $interval, ngDialog, sAuth, sLocation, sNotification) {
        $log.debug('SignFormCtrl');
        $scope.form = {};
        angular.extend($scope.form, $stateParams, $scope.$parent.ngDialogData);
        /**
         * Sign with Estonian ID-Card
         */
        $scope.doSignEsteId = function () {
            ngDialog
                .open({
                    template: '/views/modals/topic_vote_sign_esteid.html',
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
        };

        /**
         * Sign with Smart-ID
         */
        $scope.doSignSmartId = function () {
            ngDialog
                .open({
                    template: '/views/modals/topic_vote_sign_smartid.html',
                    scope: $scope // Pass on $scope so that I can access AppCtrl
                });
        };

    }]);
