'use strict';

angular
    .module('citizenos')
    .controller('ConnectSmartIdFormCtrl', ['$scope', '$log', '$state', '$window', '$timeout', 'ngDialog', 'sLocation', 'sAuth', 'sUser', function ($scope, $log, $state, $window, $timeout, ngDialog, sLocation, sAuth, sUser) {
        $log.debug('ConnectSmartIdFormCtrl');

        var init = function () {
            $scope.formSmartId = {
                pid: null,
                countryCode: 'EE',
                challengeID: null,
                isLoading: false
            };

            $scope.isLoadingIdCard = false;
        };
        init();

        $scope.authSmartId = function () {
            $log.debug('ConnectSmartIdFormCtrl.authSmartId()');

            $scope.formSmartId.isLoading = true;

            sAuth
                .loginSmartIdInit($scope.formSmartId.pid, $scope.formSmartId.countryCode)
                .then(function (loginSmartIdInitResult) {
                    $scope.formSmartId.challengeID = loginSmartIdInitResult.challengeID;
                    var token = loginSmartIdInitResult.token;
                    return pollSmartIdStatus(token, 3000, 80);
                });
        };

        var pollSmartIdStatus = function (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return $timeout(function () {
                return sUser.addUserConnection(sAuth.user.id, 'smartid', token)
                    .then(function(response) {
                        ngDialog.closeAll();
                    });
            }, milliseconds, false);
        };

    }]);
