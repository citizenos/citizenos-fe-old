'use strict';
import * as angular from 'angular';
import {filter, find, isArray} from 'lodash';

let topicVote = {
    selector: 'topicVote',
    template: '<div ui-view></div>',
    bindings: {},
    controller: ['$scope', '$log', 'TopicVote', 'VoteDelegation', 'ngDialog', 'sNotification', 'AppService', class TopicVoteController {
        public topic;
        public userHasVoted;
        public voteTypes = [];
        public voteAuthTypes = [];

        constructor (private $scope, private $log, private TopicVote, private VoteDelegation, private ngDialog, private sNotification, private  app) {
            $log.debug('TopicVoteCtrl');
            this.topic = app.topic;
            this.topic.vote.topicId = this.topic.id;
            this.voteTypes = TopicVote.VOTE_TYPES;
            this.voteAuthTypes = TopicVote.VOTE_AUTH_TYPES;
            this.getVote();
        }

        getVote () {
            this.TopicVote.get(this.topic.vote).then((vote) => {
                this.topic.vote = vote;
                if (this.topic.vote && this.topic.vote.options) {
                    const  options = this.topic.vote.options.rows;
                    for (var i in options) {
                        options[i].optionId = options[i].id;
                        if (options[i].selected) {
                            this.userHasVoted = true;
                        }
                    }
                }
            });
        };

        canSubmit () {
            if (!this.topic.vote.options || !isArray(this.topic.vote.options.rows)) return false;
            const options = filter(this.topic.vote.options.rows, function (option) {
                return !!option.selected;
            });

            if (options && options.length === 1 && (options[0].value === 'Neutral' || options[0].value === 'Veto')) {
                return true;
            }

            if (options.length > this.topic.vote.maxChoices || options.length < this.topic.vote.minChoices) {
                return false;
            }

            return true;
        };

        getVoteValuePercentage (value) {
            if (!this.topic.vote.getVoteCountTotal() || value < 1 || !value) return 0;
            return value / this.topic.vote.getVoteCountTotal() * 100;
        };
    }]
};

angular
    .module('citizenos')
    .component(topicVote.selector, topicVote);
