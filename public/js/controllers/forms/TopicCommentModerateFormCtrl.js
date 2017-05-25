'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentModerateFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicComment', function ($scope, $log, ngDialog, TopicComment) {
        $log.debug('TopicCommentModerateFormCtrl', $scope.ngDialogData);

        $scope.comment = $scope.ngDialogData.comment;
        $scope.reportTypes = TopicComment.COMMENT_REPORT_TYPES;

        $scope.form = {
            type: null,
            text: null
        };

        $scope.doModerate = function () {
            // FIXME
        };

    }]);
