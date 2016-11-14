'use strict';

angular
    .module('citizenos')
    .controller('LoginEsteIdFormCtrl', ['$scope', '$log', '$state', '$window', '$timeout', 'ngDialog', 'sAuth', 'sTranslate', function ($scope, $log, $state, $window, $timeout, ngDialog, sAuth, sTranslate) {
        $log.debug('LoginEsteIdFormCtrl');

        var init = function () {
            $scope.formMobile = {
                phoneNumber: null,
                pid: null,
                challengeID: null,
                isLoading: false
            };
        };
        init();

        // General error message for both sign-in methods
        $scope.estidLoginError = null;

        $scope.doCloseEstidLoginError = function () {
            $scope.estidLoginError = null;
        };

        $scope.doLoginMobiilId = function () {
            $log.debug('LoginEsteIdFormCtrl.doLoginMobiilId()');

            $scope.formMobile.isLoading = true;
            $scope.estidLoginError = null;


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
                    var msg;

                    $log.error('Something failed when trying to log in with mobile', err);

                    if (!err.data) {
                        $log.error('Error when logging in with mobile id', err);
                        msg = 'MSG_ERROR_50000';
                    } else {
                        sTranslate.errorsToKeys(err, 'LOGIN');
                        msg = err.data.status.message;
                    }

                    $scope.formMobile.isLoading = false;
                    $scope.formMobile.challengeID = null;

                    $scope.estidLoginError = msg;
                });
        };

        $scope.doLoginIdCard = function () {
            $log.debug('LoginEsteIdFormCtrl.doLoginIdCard()');

            $scope.isLoadingIdCard = true;
            $scope.estidLoginError = null;

            var msg;

            sAuth
                .loginIdCard()
                .then(
                    function () {
                        handleLoginSuccess();
                    },
                    function (err) {
                        $log.error('Something failed when trying to log in with card', err);

                        if (!err.data) {
                            $log.error('Error when logging in with card', err);
                            msg = 'MSG_ERROR_50000';
                        } else {
                            sTranslate.errorsToKeys(err, 'LOGIN');
                            msg = err.data.status.message;
                        }

                        $scope.isLoadingIdCard = false;
                        $scope.estidLoginError = msg;
                    }
                );
        };

        var handleLoginSuccess = function () {
            // TODO: Partner login support
            // TODO: Redirect to somewhere?
            ngDialog.closeAll(true);
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
