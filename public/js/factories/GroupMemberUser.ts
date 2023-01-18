import * as angular from 'angular';
export class GroupMemberUser {
    private LEVELS = {
        read: 'read',
        admin: 'admin'
    };

    constructor (private $http, private sLocation, private sAuth) {}

    getUrlPrefix () {
        var prefix = this.sAuth.getUrlPrefix();
        if (!prefix) {
            return '';
        }

        return `/${prefix}`;
    };

    getUrlUser () {
        var userId = this.sAuth.getUrlUserId();
        if (!userId) {
            return '';
        }

        return `/${userId}`;
    };

    get(params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:user/groups/:groupId/members/users/:userId', {'userId:': params.userId, 'groupId:': params.groupId})
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path)
            .then((res) => {
                return res.data.data;
            });
    }

    save(params, data:any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/members/users', params);

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(params, data:any) {
        if (!params.userId) params.userId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/members/users/:userId', params);

        return this.$http.put(path, params)
        .then((res) => {
            return res.data.data
        });
    }

    query (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/groups/:groupId/members/users', {groupId: params.groupId})
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data;
            });
    }

    delete (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:user/groups/:groupId/members/users/:userId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:user', this.getUrlUser());

        return this.$http.delete(path)
            .then((res) => {
                const data = res.data;
                return data;
            });
    }
}
angular
    .module('citizenos')
    .service('GroupMemberUser', ['$http', 'sLocation', 'sAuth', GroupMemberUser]);
