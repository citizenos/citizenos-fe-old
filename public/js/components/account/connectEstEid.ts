'use strict';
import * as angular from 'angular';

let connectEstEid = {
    selector: 'connectEstEid',
    templateUrl: '/views/components/account/login_esteid.html',
    bindings: {},
    controller: ['$log', '$state', '$window', 'cosConfig', '$timeout', 'hwcrypto', 'ngDialog', 'sLocation', 'sAuth', 'sUser', 'AppService', class ConnectEstEIdController {
        private pid;
        private phoneNumber;
        private challengeID;
        private isLoading =  false;
        private isLoadingIdCard = false;
        private authMethodsAvailable;

        private errors;
        constructor (private $log, private $state, private $window, cosConfig, private $timeout, private hwcrypto, private ngDialog,  private sLocation, private sAuth, private sUser, private app) {
            this.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);
        }

        authMobiilId () {
            this.$log.debug('ConnectEstEIdController.authMobiilId()');

            this.isLoading = true;

            this.sAuth
                .loginMobiilIdInit(this.pid, this.phoneNumber)
                .then((loginMobileIdInitResult) => {
                    this.challengeID = loginMobileIdInitResult.challengeID;
                    const token = loginMobileIdInitResult.token;
                    return this.pollMobiilIdLoginStatus(token, 3000, 80);
                }).then(() => {
                    this.ngDialog.closeAll();
                }, (err) => {
                    this.$log.error('Something failed when trying to log in with mobile', err);

                    this.isLoading = false;
                    this.challengeID = null;
                });
        };

        authIdCard () {
            this.$log.debug('ConnectEstEIdController.authIdCard()');

            this.isLoadingIdCard = true;

            return this.sAuth.idCardInit()
                .then((response) => {
                    if (response.data.data.token) {
                        return this.sUser.addUserConnection(this.sAuth.user.id, 'esteid', response.data.data.token)
                            .then(() => {
                                this.ngDialog.closeAll();
                            });
                        }
                    });
        };

        pollMobiilIdLoginStatus (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return this.$timeout(() => {
                return this.sUser.addUserConnection(this.sAuth.user.id, 'esteid', token)
                    .then((response) => {
                        return response;
                    });
            }, milliseconds, false);
        };

    }]
};

angular
    .module('citizenos')
    .component(connectEstEid.selector, connectEstEid);