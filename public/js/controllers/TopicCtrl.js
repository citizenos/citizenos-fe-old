'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$log','$location', 'sTopic', 'sTranslate', function ($scope, $state, $stateParams, $log, $location, sTopic, sTranslate) {
        $log.debug('TopicCtrl');
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
        if($state.current.name === 'topics.view' && $stateParams.id){
            sTopic.readUnauth({id:$stateParams.id}).then( function (data) {
                angular.extend($scope.topic, data);
                $log.debug('topic.readUnauth', data);
            });
        }
        if ($state.current.name === 'topics.create') {
            sTopic.create($scope.topic).then( function (data) {
                $log.debug('TopicCtrl.topic.create', data);
            }, function (err) {
                $log.error(err);
                sTranslate.errorsToKeys(err,'USER');
            });

        }
    }]);
