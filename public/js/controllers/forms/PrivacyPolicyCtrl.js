'use strict';

angular
    .module('citizenos')
    .controller('PrivacyPolicyCtrl', ['$scope', '$log', '$state', '$stateParams', '$window', '$timeout', 'ngDialog', 'sAuth', 'sUser', 'cosConfig', function ($scope, $log, $state, $stateParams, $window, $timeout, ngDialog, sAuth, sUser, cosConfig) {
        $log.debug('PrivacyPolicyCtrl', '$state', $state, $stateParams);

        $scope.reject = function () {
            ngDialog.openConfirm({
                    template: '/views/modals/user_delete_confirm.html',
                    data: $stateParams,
                    scope: $scope, // Pass on $scope so that I can access AppCtrl,
                    closeByEscape: false,
                    closeByNavigation: false
                })
                .then(
                    function () {
                        sUser
                            .deleteUser()
                            .then(function () {
                                return sAuth
                                    .logout();
                            })
                            .then(function () {
                                $window.location.href = '/';
                            });
                    }
                );

        };

        $scope.accept = function () {
            sUser
                .updateTermsVersion(cosConfig.legal.version)
                .then(function () {
                    $window.location.href = $stateParams.redirectSuccess;
                });
        };

    }]);
