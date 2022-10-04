import * as angular from 'angular';

let groupMemberTopic = {
    selector: 'groupMemberTopic',
    template:  `
        <div class="pretend_td">
            <div class="blue_link" ui-sref="topics/view({topicId: $ctrl.memberTopic.id})" ng-bind="$ctrl.memberTopic.title">$ctrl.memberTopic.title</div>
        </div>
        <div class="pretend_td" ng-if="$ctrl.isVisibleField('lastActivity')">
            <div class="pretend_table_mobile_text mobile_label" translate="">Last activity</div>
            <span ng-bind="$ctrl.memberTopic.lastActivity | amDateFormat:'L LT'"></span>
        </div>
        <div class="pretend_td" ng-if="$ctrl.isVisibleField('level')">
            <div class="pretend_table_mobile_text mobile_label" translate="VIEWS.PUBLIC_GROUP.LNK_RIGHTS">Level</div>
            <div cos-dropdown class="classic_dropdown" ng-if="$ctrl.memberTopic.canUpdate()">
                <div class="dropdown_selection">
                    <div class="dropdown_text">{{'TXT_TOPIC_LEVELS_' + $ctrl.memberTopic.permission.levelGroup | uppercase | translate}}</div>

                    <div class="arrow_holder">
                        <div class="table_cell">
                            <div class="sprite sprite-icon-dropdown-arrowdown2x"></div>

                            <div class="v_line"></div>
                        </div>
                    </div>
                </div>
                <div class="dropdown">
                    <div class="dropdown_item" ng-repeat="(key, level) in $ctrl.GroupMemberTopic.LEVELS">
                        <div class="item_name" ng-click="$ctrl.doUpdateMemberTopic(level)">{{'TXT_TOPIC_LEVELS_' + level | uppercase | translate}}</div>
                    </div>
                </div>
            </div>
            <span ng-if="!$ctrl.memberTopic.canUpdate()">{{'TXT_TOPIC_LEVELS_' + $ctrl.memberTopic.permission.levelGroup | uppercase | translate}}</span>
        </div>
        <div class="pretend_td" ng-if="$ctrl.isVisibleField('userscount')">
            <span class="pretend_table_mobile_text mobile_label" translate="VIEWS.MY_GROUPS_GROUPID.LBL_USERS_COUNT" translate-values="{count: $ctrl.memberTopic.members.users.count}">Users: 0</span>
            <span ng-bind="$ctrl.memberTopic.members.users.count"></span>
        </div>
        <div class="pretend_td" ng-if="$ctrl.isVisibleField('status')">
            <div class="pretend_table_mobile_text mobile_label" translate="VIEWS.PUBLIC_GROUP.LNK_STATUS">Status</div>
            <span> {{'TXT_TOPIC_STATUS_'+$ctrl.memberTopic.status | uppercase | translate}} </span>
        </div>
        <div class="pretend_td recycle_bin_wrap" ng-if="$ctrl.memberTopic.canDelete() && $ctrl.isVisibleField('delete')">
            <div class="btn_wrap recycle_bin">
                <div class="btn" ng-click="$ctrl.doDeleteMemberTopic()">
                    <div class="table_cell">
                        <div class="sprite desktop_fix sprite-mytopics-icon-deletetopic2x"></div>
                        <div class="sprite mobile_fix sprite-mytopics-icon-deletetopic2x"></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    bindings: {
        memberTopic: '=',
        fields: '=?',
        canUpdate: '=?',
        group: '='
    },
    controller: ['ngDialog', 'GroupMemberTopic', 'sAuth', '$state', class GroupMemberTopicController {
        private memberTopic;
        private canUpdate;
        private group;
        public fields

        private ngDialog;
        private GroupMemberTopic;
        private sAuth;
        private $state;

        constructor (ngDialog, GroupMemberTopic, sAuth, $state) {
            this.ngDialog = ngDialog;
            this.GroupMemberTopic = GroupMemberTopic;
            this.sAuth = sAuth;
            this.$state = $state;
        }

        isVisibleField (field) {
            return this.fields?.indexOf(field) > -1
        }
        doUpdateMemberTopic (level) {
            const memberTopic = this.memberTopic;
            const group = this.group;
            if (memberTopic.permission.levelGroup !== level) {
                var oldLevel = memberTopic.permission.levelGroup;
                memberTopic.permission.levelGroup = level;
                memberTopic
                    .$update({groupId: group.id})
                    .then(
                        angular.noop,
                        function () {
                            memberTopic.permission.levelGroup = oldLevel;
                        });
            }
        }
        doDeleteMemberTopic () {
            const memberTopic = this.memberTopic;
            const group = this.group;

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: memberTopic
                    }
                })
                .then(function () {
                    memberTopic
                        .$delete({groupId: group.id})
                        .then(function () {
                            group.getMemberTopics();
                        });
                }, angular.noop);
        };
    }]
}

angular
    .module('citizenos')
    .component(groupMemberTopic.selector, groupMemberTopic);
