'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('TopicFollowUpCtrl', ['$scope', '$log', 'TopicEvent', 'ngDialog', function ($scope, $log, TopicEvent, ngDialog) {
        $log.debug('TopicFollowUpCtrl');

        $scope.$parent.topicEvents = null;

        var init = function () {
            $scope.$parent.eventForm = {
                subject: null,
                text: null
            };

            $scope.$parent.maxLengthSubject = 128;
            $scope.$parent.maxLengthText = 2048;
            $scope.$parent.topicEvents = TopicEvent.query({topicId: $scope.topic.id});
        };
        init();

        $scope.$parent.submitEvent = function () {
            var topicEvent = new TopicEvent({topicId: $scope.topic.id, subject: $scope.eventForm.subject, text: $scope.eventForm.text});

            topicEvent
                .$save()
                .then(
                    function () {
                        init();
                    },
                    function (res) {
                        $scope.eventForm.errors = res.data.errors;
                    });
        };

        $scope.$parent.deleteEvent = function (event) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_event_delete_confirm.html',
                    data: {
                        event: event
                    }
                })
                .then(function () {
                    event.topicId = $scope.topic.id;
                    event
                        .$delete()
                        .then(function () {
                            init();
                        });
                }, angular.noop);

        }

    }]);
