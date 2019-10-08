'use strict';

angular
    .module('citizenos')
    .controller('TopicInviteFormCtrl', ['$scope', '$log', '$state', '$stateParams', 'ngDialog', 'TopicInviteUser', function ($scope, $log, $state, $stateParams, ngDialog, TopicInviteUser) {
        $log.debug('TopicInviteFormCtrl');

        var params = {
            inviteId: $stateParams.inviteId,
            topicId: $stateParams.topicId
        };

        TopicInviteUser.get(params).$promise
            .then(
                function (topicInvite) {
                    $scope.invite = topicInvite;
                }, function (err) {
                    $log.error('TopicInviteFormCtrl', 'err', err);
                }
            );

        $scope.doAccept = function () {
            $log.debug('TopicInviteFormCtrl', 'doAccept()');
        };

    }]);
