import * as angular from 'angular';
export class TopicVote {
    private VOTE_TYPES = {
        regular: 'regular',
        multiple: 'multiple'
    };

    private VOTE_AUTH_TYPES = {
        soft: 'soft',
        hard: 'hard'
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
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params}).then((res) => {
            return res.data.data;
        });
    }

    get(params?: any) {
        if (!params.voteId) params.voteId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes/:voteId', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params})
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        if (!data.voteId) data.voteId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes/:voteId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());
        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        if (!data.voteId) data.voteId = data.id;
        const path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes/:voteId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }

    cast(data: any) {
        if (!data.voteId) data.voteId = data.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes/:voteId', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    status (params) {
        if (!params.voteId) params.voteId = params.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes/:voteId/status', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, {params: {token: params.token}})
            .then((res) => {
                return res.data.data
            });
    };

    sign(data) {
        if (!data.voteId) data.voteId = data.id;
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/votes/:voteId/sign', data)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    getVoteCountTotal (vote) {
        let voteCountTotal = 0;
        if (vote.options) {
            const options = vote.options.rows;
            for (var i in options) {
                const voteCount = options[i].voteCount;
                if (voteCount) {
                    voteCountTotal += voteCount;
                }
            }
        }
        return voteCountTotal;
    };
};

angular
    .module('citizenos')
    .service('TopicVote', ['$http', 'sAuth', 'sLocation', TopicVote]);
