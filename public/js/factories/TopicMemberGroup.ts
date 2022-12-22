import * as angular from 'angular';
export class TopicMemberGroup {
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
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params}).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.groupId) params.groupId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups/:groupId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params)
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        if (!data.groupId) {
            data.groupId = data.id;
        }
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        if (!data.groupId) data.groupId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups/:groupId', data);
        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        if (!data.groupId) data.groupId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/members/groups/:groupId', data);

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }
};

angular
    .module('citizenos')
    .service('TopicMemberGroup', ['$http', 'sAuth', 'sLocation', TopicMemberGroup]);
