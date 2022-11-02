'use strict';
import * as angular from 'angular';

let userConsentForm = {
    selector: 'userConsentForm',
    templateUrl: '/views/components/partners/partners_consent.html',
    bindings: {},
    controller: ['$window', '$state', '$stateParams', '$log', 'sLocation', 'sUser', 'AppService', class UserConsentFormController {
        private partner;
        constructor (private $window, private $state, private $stateParams, private $log, private sLocation, private sUser, private app) {
            this.partner = app.partner;
        }
        doAccept () {
            this.$log.debug('UserConsentFormCtrl', 'doAccept', this.$stateParams);
            this.sUser
                .consentsCreate(this.partner.id)
                .then(() => {
                    this.$window.location.href = this.sLocation.getAbsoluteUrlApi('/api/auth/openid/authorize');
                }, (err) => {
                    this.$log.error('Failed to create User consent for Partner', this.partner.id, err);
                });
        };

        doCancel () {
            this.$log.debug('UserConsentFormCtrl', 'doCancel', this.$stateParams);
            this.$window.location.href = this.sLocation.getAbsoluteUrlApi('/api/auth/openid/cancel');
        };
    }]
}