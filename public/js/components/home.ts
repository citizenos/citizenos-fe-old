'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let home = {
    selector: 'home',
    templateUrl: '/views/home.html',
    bindings: {},
    controller: ['$state', '$stateParams', 'PublicTopicService', 'PublicGroupService', 'Topic', 'AppService', class HomeController {
        constructor (private $state, private $stateParams, public PublicTopicService, public PublicGroupService, private Topic, public app) {
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
    }]

}

angular
    .module('citizenos')
    .component(home.selector, home);
