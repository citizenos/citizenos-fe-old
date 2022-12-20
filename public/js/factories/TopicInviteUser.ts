import * as angular from 'angular';

export class TopicInviteUser {
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
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params}).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.inviteId) params.inviteId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params)
            .then((res) => {
                const data = res.data.data;
                data.user.isRegistered = res.data.status.code !== 20002;
                return data;
            });
    }

    save(topicId, data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users', {topicId})
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        if (!data.inviteId) data.inviteId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId', data);
        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        if (!data.inviteId) data.inviteId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId', data);

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }

    accept (data) {
        if (!data.inviteId) data.inviteId = data.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/invites/users/:inviteId/accept', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }
};

angular
    .module('citizenos')
    .service('TopicInviteUser', ['$http', 'sAuth', 'sLocation', TopicInviteUser]);
