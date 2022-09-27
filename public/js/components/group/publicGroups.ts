'use strict';
import * as angular from 'angular';

let publicGroups = {
    selector: 'publicGroups',
    templateUrl: '/views/public_groups.html',
    bindings: {},
    controller: ['$state', '$log', 'sAuth', 'Group', 'GroupMemberUser', 'PublicGroupService', 'ngDialog', 'AppService', class PublicGroupsController {
        private $state;
        private $log;
        private sAuth;
        public Group;
        private GroupMemberUser;
        private PublicGroupService;
        private ngDialog;
        public app;
        public groupList = [];
        public order = 'ASC';

        constructor ($state, $log, sAuth, Group, GroupMemberUser, PublicGroupService, ngDialog, AppService) {
            this.$state = $state;
            this.sAuth = sAuth;
            this.Group = Group;
            this.PublicGroupService = PublicGroupService;
            this.GroupMemberUser = GroupMemberUser
            this.ngDialog = ngDialog;
            this.app = AppService;
            this.groupList = PublicGroupService.groups;
            console.log(PublicGroupService)
            console.log(this.groupList)
        }

        createGroup () {
            const dialog = this.ngDialog.open({
                template: '<group-create></group-create>',
                plain: true
            });

            dialog.closePromise.then( () => {
                return this.$state.go('^');
            })
        }

        sortGroups () {
            if (this.PublicGroupService.ordering === 'ASC') {
                this.PublicGroupService.ordering = 'DESC';
            }
            this.PublicGroupService.doOrder();
        };

        joinGroup (group) {
            this.ngDialog.openConfirm({
                template: '/views/modals/group_join_confirm.html',
                closeByEscape: false
            })
            .then(() => {
                this.$state.go('groupJoin', {token: group.join.token});
            });
        }

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
                            group.getMemberUsers();
                        });
                });
        };
    }]
}

angular
    .module('citizenos')
    .component(publicGroups.selector, publicGroups);
