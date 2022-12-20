import * as angular from 'angular';

export class TopicEvent {
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

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/events', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params}).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.eventId) params.eventId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/events/:eventId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params)
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/events', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    update(data: any) {
        if (!data.eventId) data.eventId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/events/:eventId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());
        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        if (!data.eventId) data.eventId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/events/:eventId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }
};

angular
    .module('citizenos')
    .service('TopicEvent', ['$http', 'sAuth', 'sLocation', TopicEvent]);
