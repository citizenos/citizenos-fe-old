import * as angular from 'angular';

export class Group {
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
        var prefix = this.sAuth.getUrlPrefix();
        if (!prefix) {
            return '';
        }

        return `/${prefix}`;
    };

    getUrlUser () {
        var userId = this.sAuth.getUrlUserId();
        if (!userId) {
            return '';
        }

        return `/${userId}`;
    };

    constructor(private $http, private sAuth, private sLocation, private GroupMemberUser) {
    }

    query(params: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/groups', params)
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params).then((res) => {
            return res.data.data;
        });
    }

    get(id, params?: any) {
        let path = this.sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/groups/:groupId', {groupId: id})
            .replace('/:prefix', this.getUrlPrefix())
            .replace('/:userId', this.getUrlUser());

        return this.$http.get(path, params)
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

        return this.$http.delete(path).then((res) => {
            return res.data;
        });
    }

    join (token: string) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/groups/join/:token', {token});

        return this.$http.post(path)
            .then((res) => {
                return res.data.data
            });
    }

    canUpdate (group) {
        return group && ((group.permission && group.permission.level === this.GroupMemberUser.LEVELS.admin) || (group.userLevel && group.userLevel === this.GroupMemberUser.LEVELS.admin));
    };

    canShare (group) {
        return group && (!this.isPrivate(group) || this.canUpdate(group));
    }
    canDelete (group) {
        return this.canUpdate(group);
    };

    isPrivate (group) {
        return group && group.visibility === this.VISIBILITY.private;
    };
}

angular
  .module("citizenos")
  .service("Group", ['$http', 'sAuth', 'sLocation', 'GroupMemberUser', Group]);
