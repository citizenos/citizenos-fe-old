'use strict';
import * as angular from 'angular';

let publicGroups = {
    selector: 'publicGroups',
    templateUrl: '/views/components/group/public_groups.html',
    bindings: {},
    controller: ['$scope', '$state', 'sAuth', 'Group', 'GroupMemberUser', 'PublicGroupService', 'ngDialog', 'AppService', class PublicGroupsController {
        public order = 'ASC';

        constructor ($scope, private $state, private sAuth, public Group, private GroupMemberUser, public PublicGroupService, private ngDialog, private app) {
            $scope.$watch(() => PublicGroupService.isLoading, (newValue) => {
                if (newValue === false && PublicGroupService.limit === 8) {
                    PublicGroupService.limit = 26;
                    PublicGroupService.reload();
                }
            });
        }

        createGroup () {
            if (!this.app.user.loggedIn) {
                this.$state.go('account/login');
            }
            const dialog = this.ngDialog.open({
                template: '<group-create visibility="public"></group-create>',
                plain: true
            });

            dialog.closePromise.then( () => {
                return this.$state.reload(true);
            })
        }

        sortGroups (order?) {
            if (!order) order = 'ASC';
            this.PublicGroupService.order = order;
            this.PublicGroupService.doOrder();
        };

        goToGroupView (group) {
            this.$state.go('public/groups/view',{groupId:group.id});
        };

        joinGroup (group) {
            this.ngDialog.openConfirm({
                template: '/views/modals/group_join_confirm.html',
                closeByEscape: false
            })
            .then(() => {
                this.$state.go('groupJoin', {token: group.join.token});
            });
        };

        leaveGroup (group) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: group
                    }
                })
                .then(() => {
                    this.GroupMemberUser
                        .delete({groupId: group.id, userId: this.sAuth.user.id})
                        .then(() => {
                            this.$state.reload(true);
                        });
                });
        };
    }]
};

angular
    .module('citizenos')
    .component(publicGroups.selector, publicGroups);
