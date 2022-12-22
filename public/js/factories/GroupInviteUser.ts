import * as angular from 'angular';
export class GroupInviteUser {
    constructor (private $http, private sLocation) {}

    get(params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users/:inviteId', params);

        return this.$http.get(path)
            .then((res) => {
                const data = res.data.data;
                data.user.isRegistered = res.data.status.code !== 20002;
                return data;
            });
    }

    save(params, data:any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users', params);

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    query (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users', params);

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data;
            });
    }

    accept (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users/:inviteId/accept', params);

        return this.$http.post(path)
            .then((res) => {
                const data = res.data;
                return data;
            });
    }

    delete (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/invites/users/:inviteId', params);

        return this.$http.delete(path)
            .then((res) => {
                const data = res.data;
                return data;
            });
    }
}
angular
    .module('citizenos')
    .service('GroupInviteUser', ['$http', 'sLocation', GroupInviteUser]);
