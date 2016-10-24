'use strict';

angular
    .module('citizenos')
    .controller('AppCtrl', ['$scope', '$rootScope', '$state', '$log', 'sTranslate', 'cosConfig', 'ngDialog', function ($scope, $rootScope, $state, $log, sTranslate, cosConfig, ngDialog) {
        $log.debug('AppCtrl');

        $scope.app = {
            config: cosConfig,
            showSearch: false,
            showSearchResults: false,
            showNav: false
        };

        $scope.app.user = {
            loggedIn: false
        };
        $scope.app.locale = sTranslate.currentLocale();
        $scope.app.language = sTranslate.currentLanguage();
        $scope.app.doShowLogin = doShowLogin;
        $scope.app.switchLanguage = switchLanguage;

        function doShowLogin() {
            $log.debug('AppCtrl.doShowLogin()');

            ngDialog.open({
                template: '/views/modals/login.html',
                scope: $scope
            });
        };

        //FIXME: REMOVE, used for debugging on mobile
        $scope.app.alert = function (str) {
            alert(str);
        };

        function switchLanguage(locale) {
            $log.debug('switch language', locale);
            if(sTranslate.checkLocaleIsValid(locale)){
                $state.transitionTo($state.current.name, {language:locale});
            }
            sTranslate.setLanguage(locale);
        }

        $rootScope.$on('$translateChangeSuccess', setLocaleVariables);

        function setLocaleVariables () {
            $scope.app.locale = sTranslate.currentLocale();
            $scope.app.language = sTranslate.currentLanguage();
        }
    }]);
