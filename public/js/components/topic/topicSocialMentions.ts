'use strict'

import * as angular from 'angular';

let topicSocialMentions = {
    selector: 'topicSocialMentions',
    templateUrl: '/views/components/topic/topics_topicId_mentions.html',
    bindings: {},
    controller: ['Topic','Mention', 'AppService', class TopicSocialMentionsController {
        public topicSocialMentions = [];
        public topicId;
        public hashtag;

        constructor (private Topic, private Mention, private app) {
            this.topicId = app.topic.id;
            this.hashtag = app.topic.hashtag;
            this.Mention = Mention;
            this.loadTopicSocialMentions();
        }

        loadTopicSocialMentions () {
            if (this.hashtag) {
                this.Mention.query({topicId: this.topicId})
                .then((data) => {
                    this.topicSocialMentions = data.rows;
                })
            }
        };
    }]
}

angular
    .module('citizenos')
    .component(topicSocialMentions.selector, topicSocialMentions);