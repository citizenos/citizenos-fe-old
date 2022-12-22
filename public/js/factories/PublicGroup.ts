import * as angular from 'angular';

export class PublicGroup {
    public VISIBILITY = {
        public: 'public',
        private: 'private'
    };

    public members = {
        topics: {
            rows: [],
            latest: null,
            order: null,
            count: 0
        },
        users: {
            rows: [],
            count: 0
        }
    };

    public permission = {
        level: 'none'
    };

    public visibility = 'private';

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

    constructor(private $http, private sAuth, private sLocation, private GroupMemberUser) {
    }

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/groups', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, { params });
    }

    get(id, params?: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/groups/:groupId', {groupId: id})
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, { params })
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups');

        return this.$http.post(path, data)
            .then((res) => {
                return res.data.data
            });
    }

    update(data: any) {
        const allowedFields = ['name', 'description', 'imageUrl'];
        const sendData = {};
        allowedFields.forEach((key)=> {
            sendData[key] = data[key] || null;
        });
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId', {groupId: data.id || data.groupId});
        return this.$http.put(path, sendData)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/groups/:groupId', {groupId: data.id || data.groupId});

        return this.$http.delete(path);
    }

    join (token: string) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/groups/join/:token', {token});

        return this.$http.post(path)
            .then((res) => {
                return res.data.data
            });
    }

    canUpdate (group) {
        return group.permission && group.permission.level === this.GroupMemberUser.LEVELS.admin;
    };

    canDelete (group) {
        return this.canUpdate(group);
    };
}

angular
  .module("citizenos")
  .service("PublicGroup", ['$http', 'sAuth', 'sLocation', 'GroupMemberUser', PublicGroup]);
