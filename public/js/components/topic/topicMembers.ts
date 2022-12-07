'use strict';
import * as angular from 'angular';

let topicMembers = {
    selector: 'topicMembers',
    templateUrl: '/views/components/topic/topic_members.html',
    bindings: {},
    controller: ['AppService',  'Topic', 'TopicMemberUserService', 'TopicMemberGroupService', 'TopicInviteUserService', '$log', '$q', '$state', '$stateParams', '$filter', '$location', 'ngDialog', 'sAuth', 'TopicMemberUser', 'TopicInviteUser', 'TopicMemberGroup', class TopicMembersController {
        private topic;
        constructor (private app, public Topic, public TopicMemberUserService, public TopicMemberGroupService, public TopicInviteUserService, private $log, private $q, private $state, private $stateParams, private $filter, private $location, private ngDialog, private sAuth, private TopicMemberUser, private TopicInviteUser, private TopicMemberGroup) {
            this.topic = app.topic;
            this.app.tabSelected = $stateParams.tab || 'participants';
            TopicMemberUserService.topicId = this.topic.id;
            TopicMemberUserService.reload();
            TopicMemberGroupService.topicId = this.topic.id;
            TopicMemberGroupService.reload();
            TopicInviteUserService.topicId = this.topic.id;
            TopicInviteUserService.reload();
        }

        doUpdateMemberUser (topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                const oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser.topicId = this.topic.id;
                this.TopicMemberUser
                    .update(topicMemberUser)
                    .then(() => {
                        topicMemberUser.levelUser = level;
                    }, () => {
                        topicMemberUser.level = oldLevel;
                    });
            }
        };

        doDeleteMemberUser (topicMemberUser) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: topicMemberUser
                    }
                })
                .then(() => {
                    topicMemberUser.topicId = this.topic.id;
                    this.TopicMemberUser
                        .delete(topicMemberUser)
                        .then(() => {
                            this.TopicMemberUserService.reload();
                        });
                }, angular.noop);
        };

        doUpdateMemberGroup (topicMemberGroup, level) {
            this.$log.debug('doUpdateMemberGroup', topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                const oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup.topicId = this.topic.id;
                this.TopicMemberGroup
                    .update(topicMemberGroup)
                    .then(() => {
                        this.TopicMemberUserService.reload();
                    },() => {
                        topicMemberGroup.level = oldLevel;
                });
            }
        };

        doDeleteMemberGroup (topicMemberGroup) {
            this.$log.debug('doDeleteMemberGroup', topicMemberGroup);

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(() => {
                    topicMemberGroup.topicId = this.topic.id;
                    this.TopicMemberGroup
                        .delete(topicMemberGroup)
                        .then(() => {
                            this.TopicMemberGroupService.reload();
                            this.TopicMemberUserService.reload();
                        });
                }, angular.noop);
        };

        doUpdateInvite (topicInviteUser, level) {
            this.$log.debug('doUpdateMemberGroup', topicInviteUser, level);

            if (topicInviteUser.level !== level) {
                const oldLevel = topicInviteUser.level;
                topicInviteUser.level = level;
                topicInviteUser.topicId = this.topic.id;
                this.TopicInviteUser
                    .update(topicInviteUser)
                    .then(() => {
                        topicInviteUser.level = level;
                    }, () => {
                        topicInviteUser.level = oldLevel;
                    });
            }
        };

        doDeleteInviteUser (topicInviteUser) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_invite_user_delete_confirm.html',
                    data: {
                        user: topicInviteUser.user
                    }
                })
                .then((isAll) => {
                    var promisesToResolve = [];
                    // Delete all
                    if (isAll) {
                        this.TopicInviteUserService.users.forEach((invite) => {
                            if (invite.user.id === topicInviteUser.user.id) {
                                invite.topicId = this.topic.id;
                                promisesToResolve.push(this.TopicInviteUser.delete(invite));
                            }
                        });
                    } else { // Delete single
                        topicInviteUser.topicId = this.topic.id;
                        promisesToResolve.push(this.TopicInviteUser.delete(topicInviteUser));
                    }

                    this.$q
                        .all(promisesToResolve)
                        .then(() => {
                            return this.TopicInviteUserService.reload();
                        });
                }, angular.noop);
        };
    }]
};
angular
    .module('citizenos')
    .component(topicMembers.selector, topicMembers);
