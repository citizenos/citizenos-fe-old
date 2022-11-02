'use strict';
import * as angular from 'angular';

let privacyPolicy = {
    selector: 'privacyPolicy',
    templateUrl: '/views/components/account/privacy_policy.html',
    bindings: {},
    controller:  ['$log', '$state', '$stateParams', '$window', 'ngDialog', 'sAuth', 'sUser', 'cosConfig', 'AppService', class PrivacyPolicyController {
        constructor (private $log, private $state, private $stateParams, private $window, private ngDialog, private sAuth, private sUser, private cosConfig, private app) {

        }

        reject () {
            const data = angular.extend({}, this.$stateParams);
            this.ngDialog.openConfirm({
                    template: '/views/modals/user_delete_confirm.html',
                    data: data,
                    closeByEscape: false,
                    closeByNavigation: false
                })
                .then(() => {
                    this.sUser
                        .deleteUser()
                        .then(() => {
                            return this.sAuth.logout();
                        })
                        .then(() => {
                            this.$window.location.href = '/';
                        });
                    }
                );

        };

        accept () {
            this.sUser
                .updateTermsVersion(this.cosConfig.legal.version)
                .then(() => {
                    this.sUser
                        .listUserConnections(this.sAuth.user.id)
                        .then((connections) => {
                            const filtered = connections.rows.filter((con) => {
                                return ['esteid', 'smartid'].indexOf(con.connectionId) > -1;
                            });

                            if (filtered.length) {
                                this.$window.location.href = this.$stateParams.redirectSuccess || '/';
                            } else if (this.$window.navigator.languages.indexOf('et') > -1) {
                                const dialog = this.ngDialog.open({
                                    template: '/views/modals/add_eid.html'
                                });

                                dialog.closePromise.then(() => {
                                    this.$window.location.href = this.$stateParams.redirectSuccess || '/';;
                                });
                            } else {
                                this.$window.location.href = this.$stateParams.redirectSuccess || '/';;
                            }
                        });
                });

        };
    }]
};

angular
    .module('citizenos')
    .component(privacyPolicy.selector, privacyPolicy);