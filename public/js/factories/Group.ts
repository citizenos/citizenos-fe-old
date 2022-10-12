import * as angular from 'angular';

export class Group {
    public apiRoot: string;
    public apiUnauthRoot: string;
    public $http;

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
    public GroupMemberUser;

    constructor($http, GroupMemberUser, sAuth, sLocation) {
        this.$http = $http;
        this.GroupMemberUser = GroupMemberUser;
        var getUrlPrefix = function () {
            var prefix = sAuth.getUrlPrefix();
            if (!prefix) {
                return '';
            }

            return `/${prefix}`;
        };

        var getUrlUser = function () {
            var userId = sAuth.getUrlUserId();
            if (!userId) {
                return '';
            }

            return `/${userId}`;
        };
        this.apiUnauthRoot = sLocation.getAbsoluteUrlApi('/api/groups');
        this.apiRoot = sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/groups')
            .replace('/:prefix', getUrlPrefix())
            .replace('/:userId', getUrlUser());
    }

    query(params: { string: string }) {
        return this.$http.get(this.apiRoot, { params });
    }

    get(id, params?: { string: string }) {
        return this.$http.get(this.apiRoot + '/' + id, { params })
            .then((res) => {
                return res.data.data
            });
    }

    save(data: any) {
        return this.$http.post(this.apiRoot, data)
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

        return this.$http.put(this.apiRoot + '/' + data.id, sendData)
            .then((res) => {
                return res.data.data
            });
    }

    delete(data: any) {
        return this.$http.delete(this.apiRoot + '/' + data.id);
    }

    join (token: string) {
        return this.$http.post(this.apiUnauthRoot + '/join/' + token)
            .then((res) => {
                return res.data.data
            });
    }
}

angular
  .module("citizenos")
  .service("Group", ['$http', 'GroupMemberUser', 'sAuth', 'sLocation', Group]);