'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$log', 'sTopic', 'sTopicResolve', function ($scope, $log, sTopic, sTopicResolve) {
        $log.debug('TopicCtrl');
        $log.debug('sTopicResolve',sTopicResolve);
        $scope.topic = {
            id: null,
            title: null,
            description: null,
            status: null,
            visibility: null,
            categories: [],
            hashtag: null,
            permission: {
                level: null
            },
            upUrl: null
        };
        if (sTopicResolve) {
            angular.extend($scope.topic,sTopicResolve);
            $scope.app.metainfo.title  = sTopicResolve.title;
            $scope.app.metainfo.description  = angular.element(sTopicResolve.description).text().replace(sTopicResolve.title,'');
        }
        else{

            sTopic.create($scope.topic);

        }
    }]);
