'use strict'
import * as angular from 'angular';

let cosPagination = {
    selector: 'cosPagination',
    template: `
        <div class="pagination" ng-if="$ctrl.totalPages > 1">
            <div class="pagination_items_wrap">
                <div class="page_button button_prev table_cell" ng-click="$ctrl.loadPrevious()" >«</div>
                <div class="page_button table_cell" ng-repeat="x in $ctrl.pages()" ng-click="$ctrl.select({page: x})" ng-class="{'active': x === $ctrl.page }">{{x}}</div>
                <div class="page_button button_next table_cell" ng-click="$ctrl.loadNext()">»</div>
            </div>
        </div> `,
    bindings: {
        totalPages: '=',
        page: '=',
        select: '&'
    },
    controller: class CosPaginatioController {
        public totalPages;
        public page;
        public select;

        constructor () {}
        pages () {
            const array = [];

            if (this.totalPages <= 5) {
                for (var i = 1; i <= this.totalPages; i++) {
                    array.push(i);
                }
            } else if (this.page < 4) {
                for (var i = 1; i < 6; i++) {
                    array.push(i);
                }
            } else if (this.totalPages - this.page >= 2) {
                for (var i = -2; i < 3; i++) {
                    array.push(this.page + i);
                }
            } else {
                for (var i = -4; i < 1; i++) {
                    array.push(this.totalPages + i);
                }
            }

            return array;
        };

        loadNext () {
            if (this.page === this.totalPages) {
                return;
            }
            this.select({page: this.page + 1});
        };

        loadPrevious () {
            if (this.page === 1) {
                return;
            }

            this.select({page: this.page - 1});
        };
    }
}
angular
    .module('citizenos')
    .component(cosPagination.selector, cosPagination)
