'use strict';

angular
    .module('citizenos')
    .controller('PrivacyPolicyCtrl', ['$scope', '$log', '$state', '$stateParams', 'ngDialog', 'sAuth', 'sUser', 'cosConfig', function ($scope, $log, $state, $stateParams, ngDialog, sAuth, sUser, cosConfig) {
        $log.debug('PrivacyPolicyCtrl');

        $scope.reject = function () {
            sUser
                .deleteUser()
                .then(function () {
                    sAuth.logout();
                    ngDialog.closeAll();
                });
        };
        
        $scope.accept = function () {
            sUser
                .updateTermsVersion(cosConfig.legal.version)
                .then(function (user) {
                    console.log('UPd', user);
                    ngDialog.closeAll();
                });
        };

    }]);
