'use strict';

angular
    .module('citizenos')
    .controller('LoginFormCtrl', ['$scope','$state', '$log', 'ngDialog', 'sAuth',  function ($scope, $state, $log, ngDialog, sAuth) {

        $log.debug('LoginFormCtrl', ngDialog);

        var init = function () {
            $scope.form = {
                email: null,
                password: null
            };
        };
        init();

        $scope.errors = null; // Form field errors

        // Init email from state params (url params)
        // Problem is that $state.params on load is empty, but some point it gets updated async...
        var unwatchStateParams = $scope.$watch(function () {
            return $state.params;
        }, function () {
            if ($state.params.email) {
                $scope.form.email = $state.params.email;
                unwatchStateParams(); // Stop watching...
            }
        });
        // Hide mobile navigation when login flow is started
        $scope.app.showNav = false;

        $scope.doLogin = function () {
            $log.debug('LoginFormCtrl.doLogin()');

            ngDialog.open({
                template: '/views/modals/register.html',
                scope: $scope
            });
        };

        $scope.submit = function () {

            var success = function (response) {
                console.log('USER', $scope.app.user);
                console.log('response', response);
                $scope.app.user.loggedIn = true;
                ngDialog.closeAll();
          //      sAuth.status();
                console.log(sAuth.user);
                $state.transitionTo($state.current.name, {language:sAuth.user.language});
                if ($state.is('partners.consent') || $state.is('partners.login')) { // TODO: Controller should not have such logic. Pass a success function or smth to the controller
           //         return $window.location.href = '/api/auth/openid/authorize'; // TODO: Read from config or even move to somewhere else.. maybe the state params should contain a callback function?
                } else {
                    if ($state.params && $state.params.redirectSuccess) {
                        // TODO: I guess checking the URL would be nice in the future...
               //         return $window.location.href = $state.params.redirectSuccess;
                    } else {
                   //     init();
                 //       $window.location.assign(sLocation.removeLangFromUrl());
                    }
                }

            };

            var error = function (response) {
                var status = response.data.status;

                switch (status.code) {
                    case 40001: // Account does not exist
                        //Not using $state.go('account.signup') cause $stateParams are exposed in the url and
                        //I don't want password to be there. Found no secret way to pass data to new state.
                        ngDialog.open({
                            template: '/templates/modals/signUp.html',
                            data: $scope.form,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        break;
                    case 40002: // Account has not been verified
                        $scope.app.showInfo('MSG_INFO_ACCOUNT_NOT_VERIFIED');
                        break;
                    default:
                        sTranslate.errorsToKeys(response, 'USER');
                        $scope.errors = response.data.errors;
                }

            };

            sAuth.login($scope.form.email, $scope.form.password).then(success, error);
        };
    }]);
