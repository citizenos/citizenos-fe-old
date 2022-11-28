import * as angular from 'angular';

let myMenuItem = {
    selector: 'myMenuItem',
    templateUrl: '/views/components/my/my_menu_item.html',
    bindings: {
        item: '='
    },
    controller: ['$log', '$state', 'Topic', 'Group', class MyMenuItemController {
        public options;
        public item;

        constructor ($log, private $state, private Topic, private Group) {
            $log.debug('MyItemsMenuController');
        };

        goToView (editMode?) {
            const status = this.item.status;
            const params = {topicId: this.item.id, editMode: null, voteId: null};
            if (status === this.Topic.STATUSES.inProgress) {
                if (this.Topic.canEdit(this.item) && editMode) {
                    params.editMode = true;
                }

                this.$state.go('topics/view', params);
            } else if (status === this.Topic.STATUSES.voting) {
                params.voteId = this.item.voteId;
                this.$state.go('topics/view/votes/view', params);
            } else {
                this.$state.go('topics/view/followUp', params);
            }
        };

        goToItemView () {
            if (this.$state.$current.name.indexOf('groups') > -1) {
                return this.$state.go('my/groups/groupId', {groupId: this.item.id, filter: 'grouped'});
            }

            return this.$state.go('my/topics/topicId', {topicId: this.item.id, filter: 'all'});
        }

        isActiveItem () {
            if (this.item.id === (this.$state.params.topicId || this.$state.params.groupId)) {
                return true;
            }

            return false;
        };

        isPrivate() {
            return this.item.visibility === (this.Topic.VISIBILITY.private || this.Group.VISIBILITY.private);
        }
    }]
};

angular
    .module('citizenos')
    .component(myMenuItem.selector, myMenuItem);

