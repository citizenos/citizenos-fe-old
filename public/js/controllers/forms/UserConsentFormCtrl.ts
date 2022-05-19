import * as angular from 'angular';
angular
    .module('citizenos')
    .controller('UserConsentFormCtrl', ['$scope', '$rootScope', '$window', '$state', '$stateParams', '$log', 'sLocation', 'sUser', function ($scope, $rootScope, $window, $state, $stateParams, $log, sLocation, sUser) {
        $log.debug('UserConsentFormCtrl', $stateParams);

        $scope.doAccept = function () {
            $log.debug('UserConsentFormCtrl', 'doAccept', $stateParams);
            sUser
                .consentsCreate($scope.partner.id)
                .then(function () {
                    $window.location.href = sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
                }, function (err) {
                    $log.error('Failed to create User consent for Partner', $scope.partner.id, err);
                });
        };

        $scope.doCancel = function () {
            $log.debug('UserConsentFormCtrl', 'doCancel', $stateParams);
            $window.location.href = sLocation.getAbsoluteUrlApi('/api/auth/openid/cancel');
        };
    }]);
