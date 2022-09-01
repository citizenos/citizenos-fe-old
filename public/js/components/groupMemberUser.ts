import * as angular from 'angular';

let myMemberUser = {
    selector: 'myMemberUser',
    template:  `
        <div class="pretend_td">
            <div class="profile_image_wrapper dark">
                <div class="account_picture">
                    <img ng-if="$ctrl.member.imageUrl" ng-src="{{$ctrl.member.imageUrl}}">
                    <div ng-if="!$ctrl.member.imageUrl" class="profile_image_filler">
                        <cos-initials class="table_cell" ng-model="$ctrl.member.name"></cos-initials>
                        <div class="profile_circle"></div>
                    </div>
                </div>
            </div>
            <div class="name_wrap">
                <div class="table_cell">
                    <div ng-bind="$ctrl.member.name">John Smith</div>
                    <div class="via">
                        {{$ctrl.member.email}} {{$ctrl.member.phoneNumber}}
                    </div>
                </div>
            </div>
        </div>
        <div class="pretend_td">
            <div cos-dropdown class="classic_dropdown" ng-if="$ctrl.group.canUpdate()">
                <div class="dropdown_selection">
                    <div class="dropdown_text">{{'TXT_TOPIC_LEVELS_' + $ctrl.member.level | uppercase | translate}}</div>

                    <div class="arrow_holder">
                        <div class="table_cell">
                            <div class="sprite sprite-icon-dropdown-arrowdown2x"></div>

                            <div class="v_line"></div>
                        </div>
                    </div>
                </div>
                <div class="dropdown" ng-if="$ctrl.group.canUpdate()">
                    <div class="dropdown_item" ng-repeat="(key, level) in $ctrl.GroupMemberUser.LEVELS">
                        <div class="item_name" ng-click="$ctrl.doUpdateMemberUser(level)">{{'TXT_TOPIC_LEVELS_' + level | uppercase | translate}}</div>
                    </div>
                </div>
            </div>
            <div ng-if="!$ctrl.group.canUpdate()">
                <span class="user_level_text">{{'TXT_TOPIC_LEVELS_' + $ctrl.member.level | uppercase | translate}}</span>
            </div>
        </div>
        <div class="pretend_td recycle_bin_wrap" ng-if="$ctrl.group.canUpdate()">
            <div class="btn_wrap recycle_bin">
                <div class="btn" ng-click="$ctrl.doDeleteMemberUser($ctrl.member)">
                    <div class="table_cell">
                        <div class="sprite desktop_fix sprite-mytopics-icon-deletetopic2x"></div>
                        <div class="sprite mobile_fix sprite-mytopics-icon-deletetopic2x"></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    bindings: {
        member: '=',
        canUpdate: '=?',
        group: '=?',
        topic: '=?'
    },
    controller: ['ngDialog', 'GroupMemberUser', 'TopicMemberUser', 'sAuth', '$state', class MyMemberUserController {
        private member;
        private canUpdate;
        private group;
        private topic;

        private ngDialog;
        private GroupMemberUser;
        private TopicMemberUser;
        private sAuth;
        private $state;

        constructor (ngDialog, GroupMemberUser, TopicMemberUser, sAuth, $state) {
            this.ngDialog = ngDialog;
            this.GroupMemberUser = GroupMemberUser;
            this.TopicMemberUser = TopicMemberUser;
            this.sAuth = sAuth;
            this.$state = $state;
        }

        doUpdateMemberUser (level) {
            const member = this.member;
            if (member.level !== level) {
                const oldLevel = member.level;
                member.level = level;
                member
                    .$update({groupId: this.group.id})
                    .then(
                        angular.noop,
                        function () {
                            member.level = oldLevel;
                        });
            }
        };

        doDeleteMemberUser () {
            const member = this.member
            if (this.group) {
                const group = this.group
                if (member.id === this.sAuth.user.id) { // IF User tries to delete himself, show "Leave" dialog instead
                    this.doLeaveGroup();
                } else {
                    this.ngDialog
                        .openConfirm({
                            template: '/views/modals/group_member_user_delete_confirm.html',
                            data: {
                                user: member
                            }
                        })
                        .then(() => {
                            member
                                .$delete({groupId: group.id})
                                .then(() => {
                                    group.getMemberUsers();
                                });
                        }, angular.noop);
                }
            } else {
                const topic = this.topic;
                if (member.id = this.sAuth.user.id) {
                    this.doLeaveTopic();
                }
                this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: member
                    }
                })
                .then(() => {
                    member
                        .$delete({topicId: topic.id})
                        .then(() => {
                        //    return $scope.loadTopicMemberUserList(); // Good old topic.members.users.splice wont work due to group permission inheritance
                        });
                }, angular.noop);
            }
        };

        doLeaveGroup () {
            const GroupMemberUser = this.GroupMemberUser;
            const sAuth = this.sAuth;
            const group = this.group;
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

        doLeaveTopic () {
            const self = this;
            self.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: self.topic
                    }
                })
                .then(() => {
                    const topicMemberUser = new self.TopicMemberUser({id: self.sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: self.topic.id})
                        .then(() => {
                            self.$state.go('my.topics', null, {reload: true});
                        });
                });
        };
    }]
}

angular
    .module('citizenos')
    .component(myMemberUser.selector, myMemberUser);
