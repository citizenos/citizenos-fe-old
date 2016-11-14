'use strict';

angular
    .module('citizenos')
    .controller('LoginEsteIdFormCtrl', ['$scope', '$log', '$state', '$window', 'ngDialog', 'sAuth', 'sTranslate', 'sLocation', function ($scope, $log, $state, $window, ngDialog, sAuth, sTranslate, sLocation) {
        $log.debug('LoginEsteIdFormCtrl');

        var init = function () {
            $scope.formMobile = {
                phone: null,
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

    }]);
