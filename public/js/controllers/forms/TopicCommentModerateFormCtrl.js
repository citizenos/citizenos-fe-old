'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentModerateFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicComment', function ($scope, $log, ngDialog, TopicComment) {
        $log.debug('TopicCommentModerateFormCtrl', $scope.ngDialogData);

        $scope.comment = $scope.ngDialogData.comment;
        $scope.reportTypes = TopicComment.COMMENT_REPORT_TYPES;

        $scope.form = {
            type: null,
            text: null,
            id: $scope.comment.id,
            topicId: $scope.ngDialogData.topic.id,
            reportId: $scope.ngDialogData.report.id
        };

        $scope.doModerate = function () {
            var topicComment = new TopicComment($scope.form);

            topicComment
                .$moderate()
                .then(function () {
                    ngDialog.closeAll();
                }, function (res) {
                    $scope.errors = res.data.errors;
                });
        };

    }]);
