'use strict';

angular
    .module('citizenos')
    .controller('LoginSmartIdFormCtrl', ['$scope', '$log', '$state', '$window', '$timeout', 'ngDialog', 'sLocation', 'sAuth', function ($scope, $log, $state, $window, $timeout, ngDialog, sLocation, sAuth) {
        $log.debug('LoginSmartIdFormCtrl');

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

        $scope.doLoginSmartId = function () {
            $log.debug('LoginEsteIdFormCtrl.doLoginMobiilId()');

            $scope.formSmartId.isLoading = true;

            sAuth
                .loginSmartIdInit($scope.formSmartId.pid, $scope.formSmartId.countryCode)
                .then(function (loginSmartIdInitResult) {
                    $scope.formSmartId.challengeID = loginSmartIdInitResult.challengeID;
                    var token = loginSmartIdInitResult.token;
                    return pollSmartIdLoginStatus(token, 3000, 80);
                })
                .then(function () {
                    console.log(sAuth.user);
                    if (!sAuth.user.email) {
                        $window.location.reload();
                    } else {
                        handleLoginSuccess();
                    }

                }, function (err) {
                    $log.error('Something failed when trying to log in with mobile', err);

                    $scope.formSmartId.isLoading = false;
                    $scope.formSmartId.challengeID = null;
                });
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

        var pollSmartIdLoginStatus = function (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return $timeout(function () {
                return sAuth.loginSmartIdStatus(token)
                    .then(function (response) {
                        var statusCode = response.data.status.code;
                        switch (statusCode) {
                            case 20001:
                                return $timeout(function () {
                                    return pollSmartIdLoginStatus(token, milliseconds, retry);
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
