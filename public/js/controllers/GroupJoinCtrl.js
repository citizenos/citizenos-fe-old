'use strict';

angular
    .module('citizenos')
    .controller('GroupJoinCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$location', '$filter', '$log', 'Group', function ($scope, $rootScope, $state, $stateParams, $location, $filter, $log, Group) {
        var joinGroup = new Group();

        joinGroup
            .$join({
                token: $stateParams.token
            })
            .then(
                function (res) {
                    if (res && res.data) {
                        $state.go('my.groups.groupId', {
                            groupId: res.data.id
                        });
                    }
                },
                function (res) {
                    var status = res.data.status;
                    if (status.code === 40100) { // Unauthorized
                        var currentUrl = $state.href($state.current.name, $stateParams);
                        $state.go('account.login', {redirectSuccess: currentUrl});
                    } else if (status.code === 40001) { // Matching token not found.
                        $state.go('home');
                    } else {
                        $log.error('Failed to join Topic', res);
                    }
                }
            );
    }]);
