import * as angular from 'angular';

let myMenuItem = {
    selector: 'myMenuItem',
    templateUrl: '/views/components/my_menu_item.html',
    bindings: {
        item: '='
    },
    controller: ['$log', '$state', 'Topic', class MyMenuItemController {
        public options;
        public item;
        private Topic;
        private $state;

        constructor ($log, $state, Topic) {
            this.Topic = Topic;
            this.$state = $state;
            $log.debug('MyItemsMenuController');
        };

        goToView (editMode?) {
            const status = this.item.status;
            const params = {topicId: this.item.id, editMode: null, voteId: null};
            if (status === this.Topic.STATUSES.inProgress) {
                if (this.item.canEdit() && editMode) {
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

    }]
};

angular
    .module('citizenos')
    .component(myMenuItem.selector, myMenuItem);

