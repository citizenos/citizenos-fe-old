'use strict';

angular
    .module('citizenos')
    .controller('TopicCommentVoteCtrl', ['$scope', '$log', '$state', '$stateParams', '$window', '$document', '$interval', 'ngDialog', 'sAuth', 'sLocation', 'sNotification', function ($scope, $log, $state, $stateParams, $window, $document, $interval, ngDialog, sAuth, sLocation, sNotification) {
        $log.debug('TopicCommentVoteCtrl');

        $scope.voteItems = $scope.$parent.ngDialogData.commentVotes;
        var itemsPerPage = 2;
        $scope.totalPages = Math.ceil($scope.voteItems.rows.length / itemsPerPage) || 1;
        $scope.page = 1;

        $scope.loadPage = function (pageNr) {
            $scope.page = pageNr;
        };

        $scope.isOnPage = function (index, page) {
            var endIndex = page * itemsPerPage;
            return  (index >= (endIndex - itemsPerPage) && index < endIndex);
        }

    }]);
