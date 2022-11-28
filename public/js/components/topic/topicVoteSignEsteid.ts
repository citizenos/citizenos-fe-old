'use strict';
import * as angular from 'angular';

let topicVoteSignEsteid = {
    selector: 'topicVoteSignEsteid',
    templateUrl: '/views/components/topic/topic_vote_sign_esteid.html',
    bindings: {},
    controller: ['AppService', 'TopicVoteService', class TopicVoteSignEsteidController {
        private topic;

        constructor (private app, private TopicVoteService) {
            this.topic = app.topic;
        }
    }]
};

angular
    .module('citizenos')
    .component(topicVoteSignEsteid.selector, topicVoteSignEsteid);