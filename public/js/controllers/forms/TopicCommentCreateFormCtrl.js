'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentCreateFormCtrl', ['$scope', '$rootScope', '$state', '$log', '$q', 'TopicComment', function ($scope, $rootScope, $state, $log, $q, TopicComment) {
        var init = function () {
            $scope.form = {
                type: null,
                subject: null,
                text: null,
                errors: null
            };

            $scope.TopicCommentTypes = angular.extend({}, TopicComment.COMMENT_TYPES);
            delete $scope.TopicCommentTypes[TopicComment.COMMENT_TYPES.reply];

            $scope.COMMENT_TYPES_MAXLENGTH = TopicComment.COMMENT_TYPES_MAXLENGTH;
            $scope.COMMENT_SUBJECT_MAXLENGTH = TopicComment.COMMENT_SUBJECT_MAXLENGTH;
        };
        init();

        $scope.saveComment = function (parentId, parentVersion) {
            var comment = new TopicComment();
            comment.parentId = parentId;
            comment.parentVersion = parentVersion;
            comment.type = $scope.form.type;
            comment.subject = $scope.form.subject;
            comment.text = $scope.form.text;

            $scope.form.errors = null;

            comment
                .$save({topicId: $scope.topic.id})
                .then(
                    function (comment) {
                        return $state.go(
                            $state.current.name,
                            {commentId: $scope.getCommentIdWithVersion(comment.id, comment.edits.length - 1)}
                        );
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

        $scope.commentTextLengthCheck = function (comment, text) {
            console.log('commentTextLengthCheck', comment, text);
            if (text && $scope.form.type && text.length > TopicComment.COMMENT_TYPES_MAXLENGTH[$scope.form.type]) {
                if (!comment.errors) {
                    comment.errors = {};
                }
                comment.errors.text = 'VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ERROR_TEXT_TOO_LONG';
                console.log('commentTextLengthCheck ERROR', comment, text);
            } else {
                if (comment.errors && comment.errors.text) {
                    comment.errors.text = null;
                }
                console.log('commentTextLengthCheck COOL', comment, text);
            }
        };

        $scope.commentSubjectLengthCheck = function (comment, subject) {
            console.log('commentTextLengthCheck', comment, subject);

            if (subject && subject.length > TopicComment.COMMENT_SUBJECT_MAXLENGTH) {
                if (!comment.errors) {
                    comment.errors = {};
                }
                comment.errors.subject = 'VIEWS.TOPICS_TOPICID.TXT_ARGUMENT_ERROR_SUBJECT_TOO_LONG';
                console.log('commentTextLengthCheck ERROR', comment, subject);
            } else {
                if (comment.errors && comment.errors.subject) {
                    comment.errors.subject = null;
                }
                console.log('commentTextLengthCheck COOL', comment, subject);
            }
        };

        $scope.submitReply = function (parentId, parentVersion) {
            $scope.form.subject = null;
            $scope.saveComment(parentId, parentVersion);
        };

    }]);
