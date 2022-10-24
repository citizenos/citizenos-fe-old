import * as angular from 'angular';

export class GroupService {
    private page = 1;
    private hasMore = true;
    private isLoading = false;
    private groups = [];
    private search = null;
    private orderBy = 'name';
    private order = 'ASC';

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
    doSearch () {
        this.hasMore = true;
        this.page = 1;
        this.groups = [];
        this.loadGroups();
    }
    doOrder() {
        this.hasMore = true;
        this.page = 1;
        this.groups = [];
        this.loadGroups();
    }
    reload () {
        this.groups = [];
        this.loadGroups();
    }
    loadGroups() {
        if (this.hasMore && !this.isLoading) {
            this.isLoading = true;

            let params = {
              page: this.page,
              orderBy: this.orderBy,
              order: this.order,
              str: this.search
            };

            this.Group.query(params).then((res) => {
              for (let group of res.data.data.rows) {
                this.groups.push(group);
              }

              if (!res.data) {
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