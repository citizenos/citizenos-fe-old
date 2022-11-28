'use strict';
import * as angular from 'angular';

let AddEidComponent = {
    selector: 'addEid',
    templateUrl: '/views/components/account/add_eid.html',
    bindings: '',
    controller: ['$log', '$cookies', 'ngDialog', 'sAuth', 'sUser', 'sNotification', 'cosConfig', class AddEidController {
        private $log;
        private $cookies;
        private ngDialog;
        private sAuth;
        private sUser;
        private sNotification;

        public authMethodsAvailable;
        public form = {
            email: null,
            password: null
        }
        public errors;

        constructor ($log, $cookies, ngDialog, sAuth, sUser, sNotification, cosConfig) {
            $log.debug('AddEidCtrl');
            this.$log = $log;
            this.$cookies = $cookies;
            this.ngDialog = ngDialog;
            this.sAuth = sAuth;
            this.sUser = sUser;
            this.sNotification = sNotification;
            this.authMethodsAvailable = angular.extend({}, cosConfig.features.authentication);

        }

        /**
         * Login with Estonian ID-Card
         */
         doConnectEsteId () {
            this.ngDialog
                .open({
                    template: '<connect-est-eid></connect-est-eid>',
                    plain: true
                });
        };

        /**
         * Login with Smart-ID
         */
        doConnectSmartId () {
            this.ngDialog
                .open({
                    template: '<connect-smart-id></connect-smart-id>',
                    plain: true
                });
        };

        doUpdateProfile () {
            const ctrl = this;
            let errors = this.errors = null;

            const success = (res) => {
                // E-mail address was changed!
                ctrl.$cookies.remove('addEmailInProgress');
                angular.extend(ctrl.sAuth.user, res.data.data);
                ctrl.sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_NEW_EMAIL_ADDRESS');
                ctrl.sAuth.user.loggedIn = true;
                ctrl.ngDialog.closeAll(); // Close all dialogs, including the one open now...
            };

            const error = (res) => {
                errors = res.data.errors;
            };

            if (ctrl.form.email) {
                ctrl.sUser
                    .update(ctrl.sAuth.user.name, ctrl.form.email)
                    .then(success, error);
            } else {
                errors = {email: 'MODALS.ADD_EMAIL_ERROR_MSG_INVALID'}
            }

        }
    }]
}

angular
    .module('citizenos')
    .component(AddEidComponent.selector, AddEidComponent);
