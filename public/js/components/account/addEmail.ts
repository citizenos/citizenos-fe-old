'use strict';
import * as angular from 'angular';

let addEmail = {
    selector: 'addEmail',
    templateUrl: '/views/components/account/add_email.html',
    bindings: {},
    controller: ['$log', '$state', '$cookies', 'ngDialog', 'sAuth', 'sUser', 'sNotification', 'AppService', class AddEmailController {
        private email;
        private password;

        private errors;
        constructor (private $log, private $state, private $cookies, private ngDialog, private sAuth, private sUser, private sNotification, private app) {
            $cookies.putObject('addEmailInProgress', true);
        }

        doUpdateProfile () {
            this.errors = null;

            const success = (res) => {
                // E-mail address was changed!
                this.$cookies.remove('addEmailInProgress');
                angular.extend(this.sAuth.user, res.data.data);
                this.sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_NEW_EMAIL_ADDRESS');
                this.sAuth.user.loggedIn = true;
                this.ngDialog.closeAll(); // Close all dialogs, including the one open now...
            };

            const error = (res) => {
                this.errors = res.data.errors;
            };

            if (this.email) {
                this.sUser
                    .update(this.sAuth.user.name, this.email)
                    .then(success, error);
            } else {
                this.errors = {email: 'MODALS.ADD_EMAIL_ERROR_MSG_INVALID'}
            }

        }

        logout () {
            this.sAuth
            .logout()
            .then(() => {
                // Reload because the sAuthResolve would not update on logout causing the login screen to redirect to "home" thinking User is logged in
                this.$state.go('account/login');
            });
        }
    }]
};

angular
    .module('citizenos')
    .component(addEmail.selector, addEmail);