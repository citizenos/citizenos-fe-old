'use strict';
import * as angular from 'angular';

let passwordReset = {
    selector: 'passwordReset',
    templateUrl: '/views/components/account/password_reset.html',
    bindings: {},
    controller:  ['$log', '$state', '$stateParams', 'ngDialog', 'sAuth', 'sNotification', 'AppService', class PasswordResetController {
        private password;
        private passwordConfirm;
        private passwordResetEmail;
        private passwordResetCode;
        private errors = null;

        constructor (private $log, private $state, private $stateParams, private ngDialog, private sAuth, private sNotification, private app) {
            this.passwordResetEmail = $stateParams.email;
            this.passwordResetCode = $stateParams.passwordResetCode;
        }

        doPasswordReset () {
            this.errors = null;

            const success = () => {
                this.$state
                    .go('account/login', {email: this.passwordResetEmail})
                    .then(() => {
                        this.sNotification.addInfo('MSG_INFO_PASSWORD_RESET_SUCCESS');
                    });
            };

            const error =  (res) => {
                if (res.data.errors) { // Field errors
                    this.errors = res.data.errors;
                }
            };

            if (this.password) {
                if (this.password !== this.passwordConfirm) {
                    this.errors = {
                        password: 'MSG_ERROR_PASSWORD_MISMATCH'
                    };
                    return;
                }
            }

            this.sAuth
                .passwordReset(this.passwordResetEmail, this.password, this.passwordResetCode)
                .then(success, error);
        };
    }]
};

angular
    .module('citizenos')
    .component(passwordReset.selector, passwordReset);