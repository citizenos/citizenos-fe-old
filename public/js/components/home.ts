'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let home = {
    selector: 'home',
    templateUrl: '/views/home.html',
    bindings: {},
    controller: ['$state', '$stateParams', 'ngDialog', 'PublicTopicService', 'GroupMemberUser', 'PublicGroupService', 'sAuth', 'Topic', 'AppService', class HomeController {
        constructor (private $state, private $stateParams, private ngDialog, public PublicTopicService, private GroupMemberUser, public PublicGroupService, private sAuth, private Topic, public app) {
            PublicTopicService.limit = 8;
            PublicGroupService.limit = 8;
            console.log(PublicTopicService)
            PublicTopicService.reload();
            PublicGroupService.reload();
        }

        goToGroupView (group) {
            this.$state.go('public/groups/view',{groupId:group.id});
        };

        goToTopicView(topic) {
            const params = {
                language: this.$stateParams.language,
                topicId: topic.id
            }
            let view = 'topics/view';
            if (topic.status === this.Topic.STATUSES.voting) {
                view += '/votes/view'
                params['voteId'] = topic.voteId;
            } else if ([this.Topic.STATUSES.followUp, this.Topic.STATUSES.close].indexOf(topic.status) > -1) {
                view += '/followUp';
            }

            this.$state.go(view, params);
        }

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

}

angular
    .module('citizenos')
    .component(home.selector, home);
