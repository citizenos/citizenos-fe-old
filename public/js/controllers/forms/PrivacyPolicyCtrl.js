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
                    sUser
                        .listUserConnections(sAuth.user.id)
                        .then(
                            function (connections) {
                                var filtered = connections.rows.filter(function (con) {
                                    return ['esteid', 'smartid'].indexOf(con.connectionId) > -1;
                                });
                                if (filtered.length) {
                                    $window.location.href = $stateParams.redirectSuccess;
                                } else {
                                    var dialog = ngDialog.open({
                                        template: '/views/modals/add_eid.html',
                                        scope: $scope
                                    });

                                    dialog.closePromise.then(function () {
                                        $window.location.href = $stateParams.redirectSuccess;
                                    });
                                }
                            });
                });

        };

    }]);
