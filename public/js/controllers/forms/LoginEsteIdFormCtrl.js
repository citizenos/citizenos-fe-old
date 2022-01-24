'use strict';

angular
    .module('citizenos')
    .controller('LoginEsteIdFormCtrl', ['$scope', '$log', '$state', '$window', '$timeout', 'ngDialog', 'sLocation', 'sAuth', function ($scope, $log, $state, $window, $timeout, ngDialog, sLocation, sAuth) {
        $log.debug('LoginEsteIdFormCtrl');

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
            $log.debug('LoginEsteIdFormCtrl.doLoginMobiilId()');

            $scope.formMobile.isLoading = true;

            sAuth
                .loginMobiilIdInit($scope.formMobile.pid, $scope.formMobile.phoneNumber)
                .then(function (loginMobileIdInitResult) {
                    $scope.formMobile.challengeID = loginMobileIdInitResult.challengeID;
                    var token = loginMobileIdInitResult.token;
                    return pollMobiilIdLoginStatus(token, 3000, 80);
                })
                .then(function () {
                    handleLoginSuccess();
                }, function (err) {
                    $log.error('Something failed when trying to log in with mobile', err);

                    $scope.formMobile.isLoading = false;
                    $scope.formMobile.challengeID = null;
                });
        };

        $scope.authIdCard = function () {
            $log.debug('LoginEsteIdFormCtrl.doLoginIdCard()');

            $scope.isLoadingIdCard = true;

            sAuth
                .loginIdCard()
                .then(
                    function () {
                        handleLoginSuccess();
                    },
                    function (err) {
                        $log.error('Something failed when trying to log in with card', err);

                        $scope.isLoadingIdCard = false;
                    }
                );
        };

        var handleLoginSuccess = function () {
            if ($state.is('partners.consent') || $state.is('partners.login')) {
                return $window.location.href = sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
            } else {
                if ($state.params && $state.params.redirectSuccess) {
                    // TODO: I guess checking the URL would be nice in the future...
                    return $window.location.href = $state.params.redirectSuccess;
                } else {
                    $window.location.reload();
                }
            }
        };

        var pollMobiilIdLoginStatus = function (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return $timeout(function () {
                return sAuth.loginMobiilIdStatus(token)
                    .then(function (response) {
                        var statusCode = response.data.status.code;
                        switch (statusCode) {
                            case 20001:
                                return $timeout(function () {
                                    return pollMobiilIdLoginStatus(token, milliseconds, retry);
                                }, milliseconds, false);
                            case 20002:
                                // Existing User logged in
                                return;
                            case 20003:
                                // New User was created and logged in
                                return;
                            default:
                                $log.error('Mobile login failed', response);
                                return $q.defer().reject(response);
                        }
                    });
            }, milliseconds, false);
        };

    }]);
