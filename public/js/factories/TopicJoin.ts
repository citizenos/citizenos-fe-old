import * as angular from 'angular';

export class TopicJoin {
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

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/:userId/topics/:topicId/join', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.put(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/:userId/topics/:topicId/join/:token', data);
        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }
};

angular
    .module('citizenos')
    .service('TopicJoin', ['$http', 'sAuth', 'sLocation', TopicJoin]);
