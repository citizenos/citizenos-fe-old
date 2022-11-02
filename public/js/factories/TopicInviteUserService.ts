import * as angular from 'angular';

export class TopicInviteUserService {
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
    private topicId = null;

    constructor(private TopicInviteUser) {
        this.loadUsers();
    }
    getTopicInviteUser (id) {
        for (var i = 0; i < this.users.length; i++) {
          const obj = this.users[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch () {
        this.page = 1;
        this.offset = 0;
        this.users = [];
        this.loadUsers();
    }
    doOrder(orderBy, order?) {
        this.offset = 0;
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
        this.page = 1;
        this.offset = 0;
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
        if (!this.isLoading && this.topicId) {
            this.isLoading = true;
            let params = {
                topicId: this.topicId,
                offset: this.offset,
                search: this.search,
                order: this.orderBy,
                sortOrder: this.order,
                limit: this.limit
            }
            this.TopicInviteUser.query(params).then((data) => {
                if (data.rows.length) {
                    this.countTotal = data.countTotal || 0;
                    this.totalPages = Math.ceil(data.countTotal / this.limit);
                    this.users = data.rows;
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
  .service("TopicInviteUserService", ['TopicInviteUser', TopicInviteUserService]);