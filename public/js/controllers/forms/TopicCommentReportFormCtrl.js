'use strict';

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
            $log.debug('doReport', $scope.comment, $scope.form);
            var topicComment = new TopicComment($scope.form);

            topicComment.$report()
                .then(function () {
                    $log.debug('Report success', $scope.comment, $scope.form);
                    ngDialog.closeAll();
                }, function () {
                    $log.error('Failed to report comment', $scope.comment, $scope.form, arguments);
                });
        };

    }]);
