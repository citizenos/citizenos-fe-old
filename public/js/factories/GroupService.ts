import * as angular from 'angular';

angular
    .module('citizenos')
    .factory("GroupService", ['Group', '$rootScope', '$q', function(Group, $rootScope, $q) {
        var self = {
          name: 'GroupService',
          getGroup: function(id) {
            console.log(id);
            for (var i = 0; i < self.groups.length; i++) {
              var obj = self.groups[i];
              if (obj.id == id) {
                return obj;
              }
            }
          },
          page: 1,
          hasMore: true,
          isLoading: false,
          isSaving: false,
          groups: [],
          search: null,
          sorting: "name",
          ordering: "ASC",
          doSearch: function() {
            self.hasMore = true;
            self.page = 1;
            self.groups = [];
            self.loadGroups();
          },
          doOrder: function() {
            self.hasMore = true;
            self.page = 1;
            self.groups = [];
            self.loadGroups();
          },
          reload: function () {
            self.groups = [];
            self.loadGroups();
          },
          loadGroups: function() {
            var d = $q.defer();
            if (self.hasMore && !self.isLoading) {
              self.isLoading = d.promise;

              var params = {
                _page: self.page,
                _sort: self.sorting,
                _order: self.ordering,
                q: self.search
              };

              Group.query(params, function(data) {
                angular.forEach(data, function(person) {
                  self.groups.push(new Group(person));
                });

                if (data.length === 0) {
                  self.hasMore = false;
                }
                self.isLoading = false;
                d.resolve();
              });
            }
          },
          loadMore: function() {
            if (self.hasMore && !self.isLoading) {
              self.page += 1;
              self.loadGroups();
            }
          },
        /*  updateContact: function(person) {
            var d = $q.defer();
            self.isSaving = true;
            person.$update().then(function() {
              self.isSaving = false;
              toaster.pop("success", "Updated " + person.name);
              d.resolve();
            });
            return d.promise;
          },
          removeContact: function(person) {
            var d = $q.defer();
            self.isDeleting = true;
            name = person.name;
            person.$remove().then(function() {
              self.isDeleting = false;
              var index = self.persons.indexOf(person);
              self.persons.splice(index, 1);
              toaster.pop("success", "Deleted " + name);
              d.resolve();
            });
            return d.promise;
          },
          createContact: function(person) {
            var d = $q.defer();
            self.isSaving = true;
            Contact.save(person).$promise.then(function() {
              self.isSaving = false;
              self.hasMore = true;
              self.page = 1;
              self.persons = [];
              self.loadGroups();
              toaster.pop("success", "Created " + person.name);
              d.resolve();
            });
            return d.promise;
          }*/
        };

        self.loadGroups();

        return self;
      }]);
