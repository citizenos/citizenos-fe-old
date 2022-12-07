import * as angular from 'angular';
export class GroupJoin {
    constructor(private $http, private sLocation) {}


    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/join', {groupId: data.groupId});

        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    update(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/join/:token', {groupId: data.groupId || data.id, token: data.token});

        return this.$http.put(path, data)
            .then((res) => {
                return res.data.data
            });
    }
}

angular
  .module("citizenos")
  .service("GroupJoin", ['$http', 'sLocation', GroupJoin]);
