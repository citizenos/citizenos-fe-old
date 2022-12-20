import * as angular from 'angular';
export class TopicNotification {
    constructor(private $http, private sLocation) {}

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/notificationsettings/topics', params);

        return this.$http.get(path, {params}).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.topicId) params.topicId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', params);

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        if (!data.topicId) data.topicId = data.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', data);

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        if (!data.topicId) data.topicId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', data);
        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        if (!data.topicId) data.topicId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/notificationsettings', data);

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }

};

angular
    .module('citizenos')
    .service('TopicNotification', ['$http', 'sLocation', TopicNotification]);
