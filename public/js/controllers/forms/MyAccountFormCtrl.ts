'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let myAccount = {
    selector: 'myAccount',
    templateUrl: '../../../views/modals/my_account.html',
    bindings: {},
    controller: ['$log', '$stateParams', '$document', '$window', 'ngDialog', 'sNotification', 'sAuth', 'sUser', 'sUpload','AppService', class MyAccountController {
        public form = {
            name: null,
            email: null,
            password: null,
            newPassword: null,
            company: null,
            imageUrl: null,
            passwordConfirm: null,
            preferences: {
                showInSearch: false
            }
        };
        public errors;
        public sapp;
        public imageFile;

        constructor (private $log, private $stateParams, private $document, private $window, private ngDialog, private sNotification, private sAuth, private sUser, private sUpload, AppService) {
            $log.debug('MyAccountFormCtrl');
            this.sapp = AppService;
            this.sapp.tabSelected = 'profile';
            angular.extend(this.form, this.sAuth.user);
            angular.bind(this, this.switchImage);
        }


        doUpdateProfile () {
            this.errors = null;

            const success = (res) => {
                // E-mail address was changed!
                var emailChanged = this.sAuth.user.email !== this.form.email;
                angular.extend(this.sAuth.user, res.data.data);
                this.ngDialog.closeAll(); // Close all dialogs, including the one open now...
                if (emailChanged) {
                    this.sNotification.addInfo('MSG_INFO_CHECK_EMAIL_TO_VERIFY_YOUR_NEW_EMAIL_ADDRESS');
                }
            };

            const error = (res) => {
                this.errors = res.data.errors;
            };

            if (this.form.newPassword) {
                if (this.form.newPassword !== this.form.passwordConfirm) {
                    this.errors = {
                        newPassword: 'MSG_ERROR_PASSWORD_MISMATCH'
                    };
                    return;
                }
            }

            if (this.imageFile) {
                this.sUpload
                    .uploadUserImage(this.imageFile)
                    .then((response) => {
                        this.form.imageUrl = response.data.link;
                        this.sAuth.user.imageUrl = response.data.link;
                        this.ngDialog.closeAll(); // Close all dialogs, including the one open now...
                    }, error);

            } else {
                this.sUser
                    .update(this.form.name, this.form.email, this.form.password, this.form.company, this.form.imageUrl, this.form.preferences, null, this.sAuth.user.termsVersion, this.form.newPassword)
                    .then(success, error);
            }
        };

        uploadImage () {
            console.log(this.$document[0].getElementById('profileImage'))
            $(this.$document[0].getElementById('profileImage')).find('input').click();
        };

        switchImage (files) {
            const self = this;
            self.imageFile = files[0];
            const reader = new FileReader();
            console.log(self.form);
            reader.onload = (() => {
                return (e) => {
                    console.log(self.form);
                    self['imageItem'] = e.target.result;
                };
            })();
            reader.readAsDataURL(files[0]);
        };

        deleteProfileImage () {
            const myAccount = this;
            this.sUser
                .update(this.form.name, this.form.email, this.form.password, this.form.company, '')
                .then((res) => {
                        angular.extend(this.sAuth.user, res.data.data);
                        myAccount.form.imageUrl = '';
                    },
                    (res) => {
                        myAccount.errors = res.data.errors;
                    }
                );
        };

        doDeleteAccount () {
            const data = angular.extend({}, this.$stateParams);
            const myAccount = this;
            this.ngDialog.openConfirm({
                template: '/views/modals/user_delete_confirm.html',
                data: data,
                closeByEscape: false,
                closeByNavigation: false
            })
            .then(() => {
                myAccount.sUser
                    .deleteUser()
                    .then(() => {
                        return myAccount.sAuth.logout();
                    })
                    .then(() => {
                        myAccount.$window.location.href = '/';
                    });
                }
            );
        };
    }]
}
angular
    .module('citizenos')
    .component(myAccount.selector, myAccount);
