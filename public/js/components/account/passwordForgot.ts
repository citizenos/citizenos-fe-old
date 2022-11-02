'use strict';
import * as angular from 'angular';

let passwordForgot = {
    selector: 'passwordForgot',
    templateUrl: '/views/components/account/password_forgot.html',
    bindings: {},
    controller:  ['ngDialog', 'sAuth', 'sNotification', 'AppService', class PasswordForgotController {
        private email;
        private errors = null;

        constructor (private ngDialog, private sAuth, private sNotification, private app) {
        }

        doPasswordReset () {
            this.errors = null;

            const success = (res) => {
                this.ngDialog.closeAll(); // Close all dialogs, including this one..
                this.sNotification.addInfo('MSG_INFO_PASSWORD_RECOVERY_EMAIL_SENT');
            };

            const error = (res) => {
                this.errors = res.data.errors;
            };

            this.sAuth
                .passwordResetSend(this.email)
                .then(success, error);
        };
    }]
};

angular
    .module('citizenos')
    .component(passwordForgot.selector, passwordForgot);