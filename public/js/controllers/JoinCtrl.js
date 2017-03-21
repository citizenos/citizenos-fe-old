'use strict';

angular
    .module('citizenos')
    .controller('JoinCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$location', '$filter', '$log', 'Topic', function ($scope, $rootScope, $state, $stateParams, $location, $filter, $log, Topic) {
        var joinTopic = new Topic();
        joinTopic
            .$join({tokenJoin: $stateParams.tokenJoin})
            .then(function (res) {
                $state.go('my.topics.topicId', {
                    topicId: res.data.id
                });
            }, function (res) {
                $log.error('Failed to join Topic ', res);
                var status = res.data.status;
                if (status.code === 40100) { // Unauthorized
                    // Redirect to login.
                    $log.error('Failed to join', status.code, status.message);
                    var currentUrl = $state.href($state.current.name, $stateParams);
                    $state.go('account.login', {redirectSuccess: currentUrl});
                } else if (status.code === 40001) { // Matching token not found.
                    $state
                        .go('home');
                } else {
                    $log.error('Failed to join Topic', res);
                }
            });
    }]);
