import * as angular from 'angular';

let groupInviteUser = {
    selector: 'groupInviteUser',
    template:  `
        <div class="pretend_td">
        <div class="profile_image_wrapper dark">
            <!--div class="profile_moon sprite sprite-icon-certified-fb2x"></div-->
            <div class="account_picture">
                <img ng-if="$ctrl.invite.user.imageUrl" ng-src="{{$ctrl.invite.user.imageUrl}}">
                <div ng-if="!$ctrl.invite.user.imageUrl" class="profile_image_filler">
                    <cos-initials class="table_cell" ng-model="$ctrl.invite.user.name"></cos-initials>
                    <div class="profile_circle"></div>
                </div>
            </div>
        </div>
        <div class="name_wrap">
            <div class="table_cell">
                <div ng-bind="$ctrl.invite.user.name">John Smith</div>
                <div class="via">
                    {{$ctrl.invite.user.email}} {{$ctrl.invite.user.phoneNumber}}
                    <span ng-if="$ctrl.invite.user.email || $ctrl.invite.user.phoneNumber"> • </span>
                    <span translate="VIEWS.MY_TOPICS_TOPICID.TXT_INVITE_PENDING">Pending invite</span>
                </div>
                <div class="via">
                    <span translate="VIEWS.PUBLIC_GROUP.INIVTE_EXPIRES" translate-values="{expiresAt: ($ctrl.invite.expiresAt | amTimeAgo)}">{{$ctrl.invite.expiresAt | amTimeAgo}}
                </div>
            </div>
        </div>
    </div>
    <div class="pretend_td">
        <span class="user_level_text">{{'TXT_TOPIC_LEVELS_' + $ctrl.invite.level | uppercase | translate}}</span>
    </div>
    <div class="pretend_td recycle_bin_wrap">
        <div class="btn_wrap recycle_bin" ng-if="$ctrl.canUpdate">
            <div class="btn" ng-click="$ctrl.deleteInvite()">
                <div class="table_cell">
                    <div class="sprite desktop_fix sprite-mytopics-icon-deletetopic2x"></div>
                    <div class="sprite mobile_fix sprite-mytopics-icon-deletetopic2x"></div>
                </div>
            </div>
        </div>
    </div>
    `,
    bindings: {
        group: '=',
        invite: '=',
        canUpdate: '=?'
    },
    controller: ['ngDialog', 'GroupInviteUser', 'GroupInviteUserService', class GroupInviteUserController {
        private group;
        private invite;
        private canUpdate;
        private delete;

        constructor (private ngDialog, private GroupInviteUser, private GroupInviteUserService) {}

        deleteInvite () {
            const invite = this.invite;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_invite_user_delete_confirm.html',
                    data: {
                        user: this.invite.user
                    }
                })
                .then(() => {
                    this.GroupInviteUser
                        .delete({groupId: invite.groupId, inviteId: invite.id})
                        .then(() => {this.GroupInviteUserService.reload()})
                });
        };
    }]
}

angular
    .module('citizenos')
    .component(groupInviteUser.selector, groupInviteUser);
