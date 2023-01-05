'use strict';
import * as angular from 'angular';

let topicVoteDelegate = {
    selector: 'topicVoteDelegate',
    templateUrl: '/views/components/topic/topic_vote_delegate.html',
    bindings: {},
    controller: ['$log', 'TopicMemberUser', 'ngDialog', 'sNotification', 'VoteDelegation', 'TopicVote', 'AppService', class TopicVoteDelegateController {
        private topic;
        private delegateUser = null;
        private searchResults = {users: []};
        private searchStringUser = null;

        constructor (private $log, private TopicMemberUser, private ngDialog, private sNotification, private VoteDelegation, private TopicVote, private app) {
            $log.debug('TopicVoteDelegateController');
            this.topic = app.topic;
        }


        search (str) {
            this.sNotification.removeAll();
            if (str && str.length >= 2) {
                this.TopicMemberUser
                    .query({topicId: this.topic.id, search: str})
                    .then(data => data.rows)
                    .then((topicMembers) => {
                        this.searchResults.users = topicMembers;
                    });

            } else {
                this.searchResults.users = [];
            }
        };

        addUser (member) {
            this.sNotification.removeAll();

            if (!member) {
                this.sNotification.addError('MSG_ERROR_POST_API_USERS_TOPICS_VOTES_DELEGATIONS_40002');
            }

            if (member.id && member !== this.delegateUser) {
                this.delegateUser = member;
            }
        };

        doRemoveDelegateUser () {
            this.delegateUser = null;
        };

        doSaveDelegate () {
            if (this.delegateUser.id) {
                this.VoteDelegation
                    .save({topicId: this.topic.id, voteId: this.topic.vote.id, userId: this.delegateUser.id})
                    .then((data) => {
                        this.topic.vote.topicId = this.topic.id;
                        this.TopicVote.get(this.topic.vote)
                            .then((vote) => {
                                this.topic.vote = vote;
                            })
                    });
            }
        }
    }]
}
angular
    .module('citizenos')
    .component(topicVoteDelegate.selector, topicVoteDelegate);
