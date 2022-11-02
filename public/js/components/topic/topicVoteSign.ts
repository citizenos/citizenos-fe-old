'use strict';
import * as angular from 'angular';
import {map} from 'lodash';

let topicVoteSign = {
    selector: 'topicVoteSign',
    templateUrl: '/views/components/topic/topic_vote_sign.html',
    bindings: {
        options: '='
    },
    controller: ['ngDialog', class TopicVoteSignController {

        constructor (private ngDialog) {}

        doSignEsteId () {
            this.ngDialog
                .open({
                    template: '<topic-vote-sign-esteid></topic-vote-sign-esteid>',
                    plain: true
                });
        };

        doSignSmartId () {
            this.ngDialog
                .open({
                    template: '<topic-vote-sign-smartid></topic-vote-sign-smartid>',
                    plain: true
                });
        };
    }]
};

angular
    .module('citizenos')
    .component(topicVoteSign.selector, topicVoteSign);
