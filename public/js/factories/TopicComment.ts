import * as angular from 'angular';
import {isObject} from 'lodash';
export class TopicComment {
    private COMMENT_TYPES = {
        pro: 'pro',
        con: 'con',
        poi: 'poi',
        reply: 'reply'
    };

    private COMMENT_SUBJECT_MAXLENGTH = 128;

    private COMMENT_TYPES_MAXLENGTH = {
        pro: 2048,
        con: 2048,
        poi: 500,
        reply: 2048
    };

    private COMMENT_REPORT_TYPES = {
        abuse: 'abuse', // is abusive or insulting
        obscene: 'obscene', // contains obscene language
        spam: 'spam', // contains spam or is unrelated to topic
        hate: 'hate', // contains hate speech
        netiquette: 'netiquette', // infringes (n)etiquette
        duplicate: 'duplicate' // duplicate
    };

    private COMMENT_ORDER_BY = {
    //    rating: 'rating', removed 23.12.2022
        popularity: 'popularity',
        date: 'date'
    };

    getUrlPrefix () {
        const prefix = this.sAuth.getUrlPrefix();
        if (!prefix) {
            return '';
        }

        return `/${prefix}`;
    };

    getUrlUser () {
        const userId = this.sAuth.getUrlUserId();
        if (!userId) {
            return '';
        }

        return `/${userId}`;
    };

    constructor(private $http, private sAuth, private sLocation) {}

    query(params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/comments', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());
        return this.$http.get(path, {params}).then((res) => {
            const result = res.data.data;
            const flattenTree  = (parentNode, currentNode) => {
                if (currentNode.replies.rows.length > 0) {
                    if (parentNode !== currentNode) {
                        parentNode.replies.rows = parentNode.replies.rows.concat(currentNode.replies.rows);
                    }
                    currentNode.replies.rows.forEach(function (reply, i) {
                        flattenTree(parentNode, reply);
                    });
                }
            };

            result.rows.forEach((row, k) => {
                flattenTree(row, row);
            });

            return result;
        });
    }

    get(params?: any) {
        if (!params.commentId) params.commentId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/comments/:c', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params)
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/comments', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        if (!data.commentId) data.commentId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/comments/:commentId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.put(path, data)
            .then((res) => {
                return res.data
            });
    }

    delete(data: any) {
        if (!data.commentId) data.commentId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/comments/:commentId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }

    vote (data) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/comments/:commentId/votes', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    };

    votes (data) {
        if (!data.commentId) data.commentId = data.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/:userId/topics/:topicId/comments/:commentId/votes', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());
        return this.$http.get(path)
            .then((res) => {
                return res.data.data
            });
    };

    report (data) {
        if (!data.commentId) data.commentId = data.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/comments/:commentId/reports', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());
        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    };

    isEdited (comment) {
        return comment.edits.length > 1;
    };

    isVisible (comment) {
        return (!comment.deletedAt && !comment.showDeletedComment) || (comment.deletedAt && comment.showDeletedComment);
    };

    canEdit (comment) {
        return (comment.creator.id === this.sAuth.user.id && !comment.deletedAt);
    };

    canDelete (comment) {
        return this.canEdit(comment);
    };
}

angular
    .module('citizenos')
    .service('TopicComment', ['$http', 'sAuth', 'sLocation', TopicComment]);
