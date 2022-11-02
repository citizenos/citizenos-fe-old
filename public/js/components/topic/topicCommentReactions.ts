'use strict';
import * as angular from 'angular';

let topicCommentReactions = {
    selector: 'topicCommentReactions',
    templateUrl: '/views/components/topic/topic_comment_reactions.html',
    bindings: {
        commentId: '@',
        topicId: '@'
    },
    controller: ['$timeout', 'TopicComment', class TopicCommentReactionsController {
        private commentId;
        private topicId;
        private voteItems = [];
        private itemsPerPage = 10;
        private page = 1;
        private totalPages = 0;

        constructor (private $timeout, private TopicComment) {
            this.loadReactions()
        };

        loadReactions() {
            this.$timeout(() => {
                this.TopicComment
                    .votes({
                        commentId: this.commentId,
                        topicId: this.topicId
                    })
                    .then((commentVotes) => {
                        this.voteItems = commentVotes;
                        this.totalPages = Math.ceil(commentVotes.rows.length / this.itemsPerPage) || 1;
                        this.page = 1;
                    });
            });
        };

        loadPage (pageNr) {
            this.page = pageNr;
        };

        isOnPage (index, page) {
            const endIndex = page * this.itemsPerPage;

            return  (index >= (endIndex - this.itemsPerPage) && index < endIndex);
        }
    }]
};

angular
    .module('citizenos')
    .component(topicCommentReactions.selector, topicCommentReactions);
