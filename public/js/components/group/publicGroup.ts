'use strict';
import * as angular from 'angular';

let publicGroup = {
    selector: 'publicGroup',
    templateUrl: '/views/components/group/public_group.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$log', 'sAuth', 'Group', 'PublicGroup', 'GroupMemberUser', 'GroupMemberUserService', 'PublicGroupMemberTopicService', 'ngDialog', 'AppService', class PublicGroupController {
        public group;

        constructor (private $state, $stateParams, private $log, private sAuth, private Group, private PublicGroup, private GroupMemberUser, public GroupMemberUserService, public PublicGroupMemberTopicService, private ngDialog, private app) {
            if ($stateParams.groupId) {
                PublicGroup
                .get($stateParams.groupId)
                .then((group) => {
                    this.group = group;
                    this.app.tabSelected = $stateParams.tab || 'topics';
                }, (err) => {
                    console.log(err);
                    if (['401', '403', '404'].indexOf(err.status))
                        $state.go('error/'+err.status)
                });
            }
            GroupMemberUserService.groupId = $stateParams.groupId;
            GroupMemberUserService.reload();
            PublicGroupMemberTopicService.groupId = $stateParams.groupId;
            PublicGroupMemberTopicService.reload();
        }

        showSettings (tab?) {
            this.$state.go('public/groups/view/settings', {groupId: this.group.id, tab: tab});
        }

        leaveGroup () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: this.group
                    }
                })
                .then(() => {
                    this.GroupMemberUser
                        .delete({groupId: this.group.id, userId: this.sAuth.user.id})
                        .then(() => {
                            this.$state.reload(true);
                        });
                });
        };

        deleteGroup () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_delete_confirm.html'
                })
                .then(() => {
                    this.Group.delete(this.group)
                        .then(() => {
                            this.$state.reload('public/groups', null, {reload: true});
                        });
                }, angular.noop);
        };

        shareGroupDialog() {
            this.ngDialog.open({
                template: '<group-invite></group-invite>',
                plain:true
            })
        }

        createTopicDialog() {
            this.ngDialog.open({
                template: '<group-create-topic></group-create-topic>',
                plain:true
            })
        }

        addTopicDialog() {
            this.ngDialog.open({
                template: '<group-add-topics></group-add-topics>',
                plain:true
            })
        }

        joinGroup () {
            this.ngDialog.openConfirm({
                template: '/views/modals/group_join_confirm.html',
                closeByEscape: false
            })
            .then(() => {
                this.Group
                    .join(this.group.join.token)
                    .then((res) => {
                        if (res.id) {
                            this.$state.reload(true);
                        }
                    }, (res) => {
                        this.$log.error('Failed to join Topic', res);
                    }
                );
            });
        }
    }]
}

angular
    .module('citizenos')
    .component(publicGroup.selector, publicGroup);
