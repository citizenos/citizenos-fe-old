'use strict'

import * as angular from 'angular';

let topicSocialMentions = {
    selector: 'topicSocialMentions',
    templateUrl: '/views/topics_topicId_mentions.html',
    bindings: {
        topicId: '=',
        hashtag: '=',
        canEdit: '='
    },
    controller: ['Mention',class TopicSocialMentionsController {
        public topicSocialMentions = [];
        private Mention;
        public topicId;
        public hashtag;
        public canEdit;

        constructor (Mention) {
            this.Mention = Mention;
            this.loadTopicSocialMentions();
        }

        loadTopicSocialMentions () {
            console.log(this.hashtag);
            if (this.hashtag) {
                this.topicSocialMentions = this.Mention.query({topicId: this.topicId});
            }
        };
    }]
}

angular
    .module('citizenos')
    .component(topicSocialMentions.selector, topicSocialMentions);