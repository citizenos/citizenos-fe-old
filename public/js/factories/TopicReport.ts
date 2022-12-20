import * as angular from 'angular';
export class TopicReport {

    private TYPES = {
        abuse: 'abuse', // is abusive or insulting
        obscene: 'obscene', // contains obscene language
        spam: 'spam', // contains spam or is unrelated to topic
        hate: 'hate', // contains hate speech
        netiquette: 'netiquette', // infringes (n)etiquette
        duplicate: 'duplicate' // duplicate
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

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/reports', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params}).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.reportId) params.reportId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/reports/:reportId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/reports', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    moderate(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/reports/:id/moderate', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    review(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/reports/:id/review', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    resolve(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/reports/:id/resolve', data)
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
    .service('TopicReport', ['$http', 'sAuth', 'sLocation', TopicReport]);
