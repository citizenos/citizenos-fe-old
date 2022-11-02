import * as angular from 'angular';
export class VoteDelegation {
     constructor(private $http, private sAuth, private sLocation) {}

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/votes/:voteId/delegations', data)

        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/votes/:voteId/delegations', data);

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }
}

angular
    .module('citizenos')
    .service('VoteDelegation', ['$http', 'sAuth', 'sLocation', VoteDelegation]);