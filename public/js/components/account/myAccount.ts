'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let myAccount = {
    selector: 'myAccount',
    templateUrl: '/views/components/account/account.html',
    bindings: {},
    controller: ['$log', '$stateParams', '$document', '$window', 'ngDialog', 'sNotification', 'sAuth', 'sUser', 'sUpload', 'TopicNotification', 'TopicNotificationService', 'AppService', class MyAccountController {
        public form = {
            name: null,
            email: null,
            password: null,
            newPassword: null,
            company: null,
            imageUrl: null,
            passwordConfirm: null,
            preferences: {
                showInSearch: false,
                notifications: {
                    topics: {},
                    groups: {}
                }
            }
        };
        public settings;
        public errors;
        public imageFile;
        private ITEMS_COUNT_PER_PAGE = 10;

        constructor ($log, private $stateParams, private $document, private $window, private ngDialog, private sNotification, private sAuth, private sUser, private sUpload, private TopicNotification, private TopicNotificationService, private app) {
            $log.debug('MyAccountController');
            app.tabSelected = $stateParams.tab || 'profile';
            angular.extend(this.form, this.sAuth.user);
            TopicNotificationService.reload();
        }

        removeTopicNotifications (topic) {
            if (!topic.allowNotifications) {
                return this
                    .app
                    .removeTopicNotifications(topic.topicId, topic.allowNotifications)
                    .then(() => {
                        this.TopicNotificationService.reload();
                    },() => {
                        topic.allowNotifications = true;
                    });
            }

            this.TopicNotification.update({
                topicId: topic.topicId,
                preferences: {
                    Topic: true,
                    TopicComment: true,
                    CommentVote: true,
                    TopicReport: true,
                    TopicVoteList: true,
                    TopicEvent: true
                },
                allowNotifications: true
            })
            .then((data) => {
                this.settings = data;
            }, (err) => {
                this.sNotification.addError(err);
            });
        };

        doUpdateProfile () {
            this.errors = null;

            const success = (res) => {
                // E-mail address was changed!
                var emailChanged = this.sAuth.user.email !== this.form.email;
                angular.extend(this.sAuth.user, res.data.data);
                this.ngDialog.closeAll(); // Close all dialogs, including the one open now...
                angular.extend(this.form, this.sAuth.user);
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
                    .uploadUserImage(this.imageFile[0])
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
            const input = $(this.$document[0].getElementById('profileImage')).find('input');
            input.click();

            input.on('change', (e) => {
                const files = e.target['files'];
                const reader = new FileReader();
                reader.onload = (() => {
                    return (e) => {
                        this.form.imageUrl = e.target.result;
                    };
                })();
                reader.readAsDataURL(files[0]);
            });
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
