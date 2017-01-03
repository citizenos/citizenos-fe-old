'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$log', '$location', 'sTopic', 'sTranslate', function ($scope, $state, $stateParams, $log, $location, sTopic, sTranslate) {
        $log.debug('TopicCtrl');

        $scope.topic = _.find($scope.itemList, {id: $stateParams.topicId});

        $scope.generalInfo = {
            isVisible: true
        };

    }]);
