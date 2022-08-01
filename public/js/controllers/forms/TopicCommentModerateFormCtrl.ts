'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('TopicCommentModerateFormCtrl', ['$scope', '$state', '$stateParams', '$http', '$log', 'ngDialog', 'sLocation', 'TopicComment', function ($scope, $state, $stateParams, $http, $log, ngDialog, sLocation, TopicComment) {
        $log.debug('TopicCommentModerateFormCtrl', $scope.ngDialogData);

        $scope.comment = $scope.ngDialogData.comment;
        $scope.reportTypes = TopicComment.COMMENT_REPORT_TYPES;

        $scope.form = {
            type: null,
            text: null
        };

        $scope.doModerate = function () {
            //FYI:  Did not use TopicComment $resource here cause did not figure out how to pass custom authorization headers for single request
            var path = sLocation.getAbsoluteUrlApi(
                '/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate',
                {
                    topicId: $scope.ngDialogData.topic.id,
                    commentId: $scope.comment.id,
                    reportId: $scope.ngDialogData.report.id
                }
            );

            var config = {
                headers: {
                    'Authorization': 'Bearer ' + $scope.ngDialogData.token
                }
            };

            $http
                .post(path, $scope.form, config)
                .then(
                    function () {
                        return $state.go('topics/view', {language: $stateParams.language, topicId: $scope.ngDialogData.topic.id}, {reload: true});
                    },
                    function (res) {
                        $scope.errors = res.data.errors;
                    }
                );
        };

    }]);
