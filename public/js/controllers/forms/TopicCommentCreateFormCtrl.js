'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentCreateFormCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$log', '$q', 'TopicComment', function ($scope, $rootScope, $state, $stateParams, $log, $q, TopicComment) {
        var init = function () {
            $scope.form = {
                type: null,
                subject: null,
                text: null,
                errors: null
            };
            $scope.maxLengthSubject = 128;
            $scope.maxLengthText = 2048;
            $scope.charactersLeft = $scope.maxLength;
        };
        init();

        var saveComment = function (parentId, type, parentVersion) {
            var comment = new TopicComment();
            comment.parentId = parentId;
            comment.parentVersion = parentVersion;
            comment.type = type;
            comment.subject = $scope.form.subject;
            comment.text = $scope.form.text;

            $scope.form.errors = null;

            comment
                .$save({topicId: $scope.topic.id})
                .then(
                    function (comment) {
                        $log.debug('Comment', comment, comment.id, comment.parent);
                        $stateParams.commentId = comment.id; // set commentId to the new one, so that UI would pull focus after comments are loaded (loadTopicComments)
                        $scope.loadTopicComments();
                        init();
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

        $scope.commentTextLengthCheck = function (comment, text) {
            if (text && text.length > $scope.maxLengthText) {
                if (!comment.errors) {
                    comment.errors = {};
                }
                comment.errors.text = 'VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ERROR_TEXT_TOO_LONG';
            } else {
                if (comment.errors && comment.errors.text) {
                    comment.errors.text = null;
                }
            }
        };

        $scope.commentSubjectLengthCheck = function (comment, subject) {
            if (subject && subject.length > $scope.maxLengthSubject) {
                if (!comment.errors) {
                    comment.errors = {};
                }
                comment.errors.subject = 'VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ERROR_SUBJECT_TOO_LONG';
            } else {
                if (comment.errors && comment.errors.subject) {
                    comment.errors.subject = null;
                }
            }
        };

        $scope.submitPro = function () {
            saveComment(null, TopicComment.COMMENT_TYPES.pro);
        };

        $scope.submitCon = function () {
            saveComment(null, TopicComment.COMMENT_TYPES.con);
        };

        $scope.submitReply = function (parentId, parentVersion) {
            $scope.form.subject = null;
            saveComment(parentId, $scope.form.type, parentVersion);
        };

    }]);
