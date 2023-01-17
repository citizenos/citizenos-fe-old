'use strict';
import * as angular from 'angular';

let topicVoteSignSmartid = {
    selector: 'topicVoteSignSmartid',
    templateUrl: '/views/components/topic/topic_vote_sign_smartid.html',
    bindings: {},
    controller: ['AppService', 'TopicVoteService', class TopicVoteSignSmartIdController {
        private topic;

        constructor (private app, private TopicVoteService) {
            this.topic = app.topic;
        }
    }]
};

angular
    .module('citizenos')
    .component(topicVoteSignSmartid.selector, topicVoteSignSmartid);
