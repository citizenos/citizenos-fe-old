'use strict';

app.controller('TopicCommentCreateFormCtrl', ['$scope', '$rootScope', '$state', '$log', '$q', 'TopicComment', function ($scope, $rootScope, $state, $log, $q, TopicComment) {
    var init = function () {
        $scope.form = {
            type: null,
            subject: null,
            text: null
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

    var saveComment = function (parentId, type) {
        var Comment = new TopicComment();
        Comment.parentId = parentId;
        Comment.type = type;
        Comment.subject = $scope.form.subject;
        Comment.text = $scope.form.text;
        Comment.$save({topicId:$scope.topic.id})
        .then( function (data) {
            $scope.loadTopicComments();
        });
    }
    $scope.submitPro = function () {
        saveComment(null, TopicComment.COMMENT_TYPES.pro);
    };

    $scope.submitCon = function () {
        saveComment(null, TopicComment.COMMENT_TYPES.con);
    };

    $scope.submitReply = function (parentId) {
        $scope.form.subject = null;
        saveComment(parentId, $scope.form.type);
    };


}]);
