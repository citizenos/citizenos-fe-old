import * as angular from 'angular';

export class Mention {
    constructor (private $http, private sAuth, private sLocation) {}

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

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/mentions', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params).then((res) => {
            return res.data.data;
        });
    }
};

angular
    .module('citizenos')
    .service('Mention', ['$http', 'sAuth', 'sLocation', Mention]);
