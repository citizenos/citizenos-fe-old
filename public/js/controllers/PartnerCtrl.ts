'use strict';
import * as angular from 'angular';

angular
    .module('citizenos')
    .controller('PartnerCtrl', ['$scope', 'rPartner', function ($scope, rPartner) {
        $scope.partner = rPartner;
    }]);
