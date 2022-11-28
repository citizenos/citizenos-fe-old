import * as angular from 'angular';
export class GroupJoin {
    constructor(private $http, private sLocation) {}


    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/join/:token', {groupId: data.groupId});
        return this.$http.post(path, data)
        .then((res) => {
            return res.data.data
        });
    }

    update(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId/join/:token', {groupId: data.groupId || data.id});

        const allowedFields = ['name', 'description', 'imageUrl'];
        const sendData = {};
        allowedFields.forEach((key)=> {
            sendData[key] = data[key] || null;
        });

        return this.$http.put(path, sendData)
            .then((res) => {
                return res.data.data
            });
    }
}

angular
  .module("citizenos")
  .service("GroupJoin", ['$http', 'sLocation', GroupJoin]);