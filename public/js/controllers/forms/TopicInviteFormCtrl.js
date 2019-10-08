'use strict';

angular
    .module('citizenos')
    .controller('TopicInviteFormCtrl', ['$scope', '$log', '$state', '$stateParams', 'ngDialog', 'TopicInviteUser', function ($scope, $log, $state, $stateParams, ngDialog, TopicInviteUser) {
        $log.debug('TopicInviteFormCtrl');

        var params = {
            id: $stateParams.inviteId,
            topicId: $stateParams.topicId
        };

        new TopicInviteUser(params)
            .$get()
            .then(
                function (topicInvite) {
                    topicInvite.id = params.id;
                    $scope.invite = topicInvite;
                }, function (err) {
                    $log.error('TopicInviteFormCtrl', 'error loading TopicInviteUser', err);
                }
            );

        $scope.doAccept = function () {
            $log.debug('TopicInviteFormCtrl', 'doAccept()', $scope.invite);
            $scope.invite
                .$accept()
                .then(
                    function (res) {
                        $log.debug('TopicInviteFormCtrl', 'doAccept()', res);
                    },
                    function (err) {
                        $log.error('TopicInviteFormCtrl', 'doAccept()', err);
                    }
                );
        };

    }]);
