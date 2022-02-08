'use strict';

angular
    .module('citizenos')
    .controller('TopicJoinCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$location', '$filter', '$log', 'Topic', function ($scope, $rootScope, $state, $stateParams, $location, $filter, $log, Topic) {
        var joinTopic = new Topic();

        joinTopic
            .$getByToken({
                token: $stateParams.token,
                __doNotDisplayErrors: true
            })
            .then(
                function (res) { // IF IT RETURNS, it is a PUBLIC topic and send straight to the Topic view - https://github.com/citizenos/citizenos-fe/issues/405#issuecomment-943336961
                    return $state.go('topics.view', {
                        topicId: res.id
                    });
                },
                function (err) {
                    // IT does not exist or the Topic is PRIVATE and requires login
                    return joinTopic.$join({
                        token: $stateParams.token
                    });
                }
            )
            .then(
                function (res) {
                    if (res && res.data) {
                        $state.go('topics.view', {
                            topicId: res.data.id
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
