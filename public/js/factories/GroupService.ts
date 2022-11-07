import * as angular from 'angular';

export class GroupService {
    private page = 1;
    private countTotal = 0;
    private totalPages = 0;
    private hasMore = true;
    private isLoading = false;
    private groups = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';
    private limit = 10;
    private offset = 0;

    constructor(private Group) {
        this.loadGroups();
    }

    getGroup (id) {
        for (var i = 0; i < this.groups.length; i++) {
          const obj = this.groups[i];
          if (obj.id == id) {
            return obj;
          }
        }
      }
    doSearch (str) {
        this.hasMore = true;
        this.page = 1;
        this.groups = [];
        this.offset = 0;
        this.search = str;
        this.loadGroups();
    }
    doOrder(orderBy, order?) {
        this.hasMore = true;
        this.offset = 0;
        this.page = 1;
        this.orderBy = orderBy;
        if (!order && this.order === 'ASC') {
            this.order = 'DESC';
        } else {
            this.order = 'ASC';
        }
        this.groups = [];
        this.loadGroups();
    }
    reload () {
        this.search = null;
        this.offset = 0;
        this.page = 1;
        this.hasMore = true;
        this.groups = [];
        this.loadGroups();
    }
    loadGroups() {
        this.countTotal = 0;
        this.totalPages = 0;
        if (this.hasMore && !this.isLoading) {
            this.isLoading = true;

            let params = {
                page: this.page,
                orderBy: this.orderBy,
                order: this.order,
                offset: this.offset,
                limit: this.limit
            };

            if (this.search) {
                params['str'] = this.search;
            }
            this.Group.query(params).then((data) => {
                this.countTotal = data.countTotal || 0;
                this.totalPages = Math.ceil(data.countTotal / this.limit);
                this.groups = data.rows;
                if (!data.rows.length) {
                    this.hasMore = false;
                }
                this.isLoading = false;
            });
        }
    }

    loadMore () {
        if (this.hasMore && !this.isLoading) {
            this.page += 1;
            this.loadGroups();
        }
    }
};

angular
  .module("citizenos")
  .service("GroupService", ['Group', GroupService]);