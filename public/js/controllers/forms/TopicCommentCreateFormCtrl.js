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
            $scope.maxLengthSubject = 128;
            $scope.maxLengthText = 2048;
            $scope.charactersLeft = $scope.maxLength;
        };
        init();


        $scope.$watch(function () {
            return $scope.form.text;
        }, function () {
            $scope.charactersLeft = $scope.maxLengthText - ($scope.form.text ? $scope.form.text.length : 0);
        });

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
                    function () {
                        $scope.loadTopicComments();
                        init();
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
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
