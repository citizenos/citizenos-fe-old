'use strict';
import * as angular from 'angular';

let connectSmartId = {
    selector: 'connectSmartId',
    templateUrl: '/views/components/account/login_smartid.html',
    bindings: {},
    controller: ['$log', '$state', '$stateParams', '$window', '$timeout', '$q', 'ngDialog', 'sLocation', 'sAuth', 'sUser', 'AppService', class ConnectSmartIdController {
        private pid;
        private countryCode = 'EE';
        private challengeID;
        private isLoading =  false;
        private isLoadingIdCard = false;

        private errors;
        constructor (private $log, private $state, private $stateParams, private $window, private $timeout, private $q, private ngDialog, private sLocation, private sAuth, private sUser, private app) {
        }

        authSmartId () {
            this.$log.debug('ConnectSmartIdFormCtrl.authSmartId()');
            this.isLoading = true;
            this.sAuth
                .loginSmartIdInit(this.pid, this.countryCode)
                .then((loginSmartIdInitResult) => {
                    this.challengeID = loginSmartIdInitResult.challengeID;
                    const token = loginSmartIdInitResult.token;

                    return this.pollSmartIdStatus(token, 3000, 80);
                });
        };

        pollSmartIdStatus (token, milliseconds, retry) {
            if (!retry) retry = 80;
            if (!retry--) throw new Error('Too many retries');

            return this.$timeout(() => {
                return this.sUser.addUserConnection(this.sAuth.user.id, 'smartid', token)
                    .then(() => {
                        this.ngDialog.closeAll();
                    });
            }, milliseconds, false);
        };
    }]
};

angular
    .module('citizenos')
    .component(connectSmartId.selector, connectSmartId);