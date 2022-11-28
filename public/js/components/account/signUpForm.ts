'use strict';
import * as angular from 'angular';

let signUpForm = {
    selector: 'signUpForm',
    templateUrl: '/views/components/account/sign_up.html',
    bindings: {},
    controller: ['$log', '$stateParams', 'cosConfig', '$window', 'ngDialog', 'sAuth', 'sNotification', 'AppService', class SignUpFormController {
        private form =  {
            name: null,
            email: null,
            password: null,
            passwordConfirm: null,
            company: null,
            redirectSuccess: null,
            preferences: {
                showInSearch: false
            },
            termsVersion: null,
            settings: null
        };

        private agreeToTerms = false;
        private errors;
        constructor (private $log, private $stateParams, private cosConfig, private $window, private ngDialog, private sAuth, private sNotification, private app) {
            this.form.termsVersion = cosConfig.legal.version;
            this.form.email = $stateParams.email;
            this.form.name = $stateParams.name
            this.form.redirectSuccess = $stateParams.redirectSuccess;
        }

        doSignUp () {
            this.$log.debug('SignUpFormCtrl.doSignUp()');
            if (!this.agreeToTerms) {
                this.errors = {
                    terms: 'MSG_ERROR_NEED_TO_AGREE_TERMS'
                }
                return;
            }
            const success = (response) => {
                this.ngDialog.closeAll(); // Close all dialogs, including the one open now...
                if (response.data && response.data.redirectSuccess) {
                    this.$window.location.href = response.data.redirectSuccess;
                } else {
                    this.sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_ACCOUNT');
                }
            };

            const error = (res) => {
                this.errors = res.data.errors;
            };

            if (this.form.password && this.form.password !== this.form.passwordConfirm) {
                this.errors = {
                    password: 'MSG_ERROR_PASSWORD_MISMATCH'
                };
                return;
            } else {
                this.$log.error('doSignUp NEW USER', this.form);
                this.sAuth
                    .signUp(this.form.email, this.form.password, this.form.name, this.form.company, this.form.redirectSuccess, this.form.settings, this.form.termsVersion)
                    .then(success, error);
            }
        };
    }]
};

angular
    .module('citizenos')
    .component(signUpForm.selector, signUpForm);