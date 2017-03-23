'use strict';

angular
    .module('citizenos')
    .controller('PartnerCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {
        $scope.partner = {
            id: $stateParams.partnerId
        };
    }]);
