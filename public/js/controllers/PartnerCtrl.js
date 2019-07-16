'use strict';

angular
    .module('citizenos')
    .controller('PartnerCtrl', ['$scope', 'rPartner', function ($scope, rPartner) {
        $scope.partner = rPartner;
    }]);
