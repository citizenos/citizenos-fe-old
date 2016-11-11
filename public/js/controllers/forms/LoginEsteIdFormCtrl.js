'use strict';

angular
    .module('citizenos')
    .controller('LoginEsteIdFormCtrl', ['$scope', '$log', '$state', '$window', 'ngDialog', 'sAuth', 'sTranslate', 'sLocation', function ($scope, $log, $state, $window, ngDialog, sAuth, sTranslate, sLocation) {
        $log.debug('LoginEsteIdFormCtrl');

        var init = function () {
            $scope.form = {
                phone: null,
                pid: null
            };
        };
        init();

        $scope.doLoginMobiilId = function () {
            $log.debug('LoginEsteIdFormCtrl.doLoginMobiilId()');
        };

        $scope.doLoginIdCard = function () {
            $log.debug('LoginEsteIdFormCtrl.doLoginIdCard()');
        };

    }]);
