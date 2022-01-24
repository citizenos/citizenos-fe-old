'use strict';

angular
    .module('citizenos')
    .controller('ConnectEsteIdFormCtrl', ['$scope', '$log', '$state', '$window', '$timeout', 'ngDialog', 'sLocation', 'sAuth', 'sUser', function ($scope, $log, $state, $window, $timeout, ngDialog, sLocation, sAuth, sUser) {
        $log.debug('ConnectEsteIdFormCtrl');

        var init = function () {
            $scope.formMobile = {
                phoneNumber: null,
                pid: null,
                challengeID: null,
                isLoading: false
            };

            $scope.isLoadingIdCard = false;
        };
        init();

        $scope.authMethodsAvailable = $scope.ngDialogData.authMethodsAvailable;

        $scope.authMobiilId = function () {
            $log.debug('ConnectEsteIdFormCtrl.authMobiilId()');

            $scope.formMobile.isLoading = true;

            sAuth
                .loginMobiilIdInit($scope.formMobile.pid, $scope.formMobile.phoneNumber)
                .then(function (loginMobileIdInitResult) {
                    $scope.formMobile.challengeID = loginMobileIdInitResult.challengeID;
                    var token = loginMobileIdInitResult.token;
                    return pollMobiilIdLoginStatus(token, 3000, 80);
                })
                .then(function () {
                    ngDialog.closeAll();
                }, function (err) {
                    $log.error('Something failed when trying to log in with mobile', err);

                    $scope.formMobile.isLoading = false;
                    $scope.formMobile.challengeID = null;
                });
        };

        $scope.authIdCard = function () {
            $log.debug('ConnectEsteIdFormCtrl.authIdCard()');

            $scope.isLoadingIdCard = true;

            return sAuth.idCardInit()
                .then(function (response) {
                    if (response.data.data.token) {
                        return sUser.addUserConnection(sAuth.user.id, 'esteid', response.data.data.token)
                            .then(function() {
                                ngDialog.closeAll();
                            });
                        }
                    });
        };

        var pollMobiilIdLoginStatus = function (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return $timeout(function () {
                return sUser.addUserConnection(sAuth.user.id, 'esteid', token)
                    .then(function(response) {
                        return response;
                    });
            }, milliseconds, false);
        };

    }]);
