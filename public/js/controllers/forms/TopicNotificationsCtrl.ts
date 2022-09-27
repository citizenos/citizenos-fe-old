'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('TopicNotificationsCtrl', ['$scope', '$state', '$stateParams', '$log', '$location', 'Topic', 'TopicVote', function ($scope, $state, $stateParams, $log, $location, Topic, TopicVote) {
        $log.debug('TopicNotificationsCtrl', $state, $stateParams);

        $scope.tabSelected = $stateParams.tab || 'general';
        $scope.notifications = {
            all: false
        };

        $scope.selectOption = function (option) {
            console.log(option);
            option = !option;
            console.log(option);
        };

        $scope.selectTab = function (tab) {
            $scope.tabSelected = tab;
            $location.search({tab: tab});
        };
    }]);
