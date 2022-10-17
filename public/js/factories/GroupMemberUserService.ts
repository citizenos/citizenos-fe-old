import * as angular from 'angular';

export class GroupMemberUserService {
    private page = 1;
    private totalPages = 0;
    public countTotal = 0;
    private isLoading = false;
    private isSaving = false;
    private users = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;
    private groupId = null;

    constructor(private GroupMemberUser) {
        this.loadUsers();
    }
    getTopicMemberUser (id) {
        for (var i = 0; i < this.users.length; i++) {
          const obj = this.users[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch () {
        this.page = 1;
        this.users = [];
        this.loadUsers();
    }
    doOrder(orderBy, order?) {
        this.page = 1;
        this.orderBy = orderBy;
        if (!order && this.order === 'ASC') {
            this.order = 'DESC';
        } else {
            this.order = 'ASC';
        }
        this.users = [];
        this.loadUsers();
    }
    reload () {
        this.users = [];
        this.loadUsers();
    }
    loadPage (page) {
        this.page = page;
        this.offset = (page - 1) * this.limit;
        this.loadUsers();
    }
    loadUsers() {
        this.countTotal = 0;
        this.totalPages = 0;
        this.users = [];
        if (!this.isLoading && this.groupId) {
            this.isLoading = true;
            let params = {
                groupId: this.groupId,
                offset: this.offset,
                search: this.search,
                order: this.orderBy,
                sortOrder: this.order,
                limit: this.limit
            }
            this.GroupMemberUser.query(params).$promise.then((users) => {
                if (users.length) {
                    this.countTotal = users[0].countTotal || 0;
                    this.totalPages = Math.ceil(users[0].countTotal / this.limit);
                }
                for (let user of users) {
                    this.users.push(user);
                }

                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (!this.isLoading) {
            this.page += 1;
            this.loadUsers();
        }
    }
};

angular
  .module("citizenos")
  .service("GroupMemberUserService", ['GroupMemberUser', GroupMemberUserService]);