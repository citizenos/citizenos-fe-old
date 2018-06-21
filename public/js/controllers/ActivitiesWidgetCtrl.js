'use strict';

angular
    .module('citizenos')
    .controller('ActivitiesWidgetCtrl', ['$scope', '$stateParams', '$log', 'sActivity', 'ActivitiesResolve', function ($scope, $stateParams, $log, sActivity, ActivitiesResolve) {
        $log.debug('ActivitiesWidgetCtrl');

        $scope.activities = ActivitiesResolve;

        $scope.showActivityDescription = function (activity) {
            return sActivity.showActivityDescription(activity);
        };

        $scope.showActivityUpdateVersions = function (activity) {
            return sActivity.showActivityUpdateVersions(activity);
        };
    }]);
