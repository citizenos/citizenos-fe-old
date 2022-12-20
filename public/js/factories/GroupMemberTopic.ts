import * as angular from 'angular';
export class GroupMemberTopic {
    constructor (private $http, private sLocation, private sAuth, private Topic) {}
    private LEVELS = {
        read: 'read',
        edit: 'edit',
        admin: 'admin'
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

    get(params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/members/groups/:groupId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path)
            .then((res) => {
                const data = res.data;
                data.user.isRegistered = res.status.code !== 20002;
                return data;
            });
    }

    save(params, data:any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/members/groups', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    update(params, data:any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/members/groups/:groupId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.put(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    query (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/groups/:groupId/members/topics', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data;
            });
    }

    queryPublic (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/groups/:groupId/members/topics', params);

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data;
            });
    }

    delete (params) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/members/groups/:groupId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.delete(path)
            .then((res) => {
                const data = res.data;
                return data;
            });
    }
}
angular
    .module('citizenos')
    .service('GroupMemberTopic', ['$http', 'sLocation', 'sAuth', 'Topic', GroupMemberTopic]);
