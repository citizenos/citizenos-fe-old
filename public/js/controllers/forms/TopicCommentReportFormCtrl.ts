'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('TopicCommentReportFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicComment', function ($scope, $log, ngDialog, TopicComment) {
        $log.debug('TopicCommentReportFormCtrl');

        $scope.comment = $scope.ngDialogData.comment;
        $scope.reportTypes = TopicComment.COMMENT_REPORT_TYPES;

        $scope.form = {
            type: null,
            text: null,
            topicId: $scope.ngDialogData.topic.id,
            id:  $scope.comment.id
        };

        $scope.doReport = function () {
            var topicComment = new TopicComment($scope.form);

            topicComment.$report()
                .then(function () {
                    ngDialog.closeAll();
                }, function (res) {
                    $scope.errors = res.data.errors;
                });
        };

    }]);
