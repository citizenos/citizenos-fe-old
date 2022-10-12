'use strict';
import * as angular from 'angular';

let publicGroups = {
    selector: 'publicGroups',
    templateUrl: '/views/public_groups.html',
    bindings: {},
    controller: ['$state', 'sAuth', 'Group', 'GroupMemberUser', 'PublicGroupService', 'ngDialog', 'AppService', class PublicGroupsController {
        public app;
        public groupList = [];
        public order = 'ASC';

        constructor (private $state, private sAuth, public Group, private GroupMemberUser, private PublicGroupService, private ngDialog, AppService) {
            this.app = AppService;
            PublicGroupService.reload();
            this.groupList = PublicGroupService.groups;
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
            this.groupList = this.PublicGroupService.groups;
        };

        goToGroupView (group) {
            console.log(group);
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
            const GroupMemberUser = this.GroupMemberUser;
            const sAuth = this.sAuth;
            const $state = this.$state;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: group
                    }
                })
                .then(() => {
                    const groupMemberUser = new GroupMemberUser({id: sAuth.user.id});
                    groupMemberUser
                        .$delete({groupId: group.id})
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
