'use strict';

angular
    .module('citizenos')
    .controller('TopicFollowUpCtrl', ['$scope', '$log', 'TopicEvent',  function ($scope, $log, TopicEvent) {
        $log.debug('TopicFollowUpCtrl');

        $scope.$parent.topicEvents = null;

        var init = function () {
            $scope.$parent.eventForm = {
                subject: null,
                text: null
            };

            $scope.$parent.maxLengthSubject = 128;
            $scope.$parent.maxLengthText = 2048;
            $scope.$parent.topicEvents = TopicEvent.query({topicId:$scope.topic.id});
        };
        init();

        $scope.$parent.submitEvent = function () {
            var topicEvent = new TopicEvent({topicId:$scope.topic.id, subject: $scope.eventForm.subject, text: $scope.eventForm.text});

            topicEvent
                .$save()
                .then(function () {
                    init();
                });
        };

        $scope.$parent.deleteEvent = function (event) {
            event
                .$delete()
                .then(function () {
                    init();
                });

        }

    }]);
