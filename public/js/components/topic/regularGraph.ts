import * as angular from 'angular';

let regularGraph = {
    selector: 'regularGraph',
    templateUrl: '/views/components/topic/regular_graph.html',
    bindings: {
        options: '='
    },
    controller: ['$log', class RegularGraphController {
        public options;
        constructor ($log) {
            $log.debug('RegularGraph');
        };

        getVoteCountTotal () {
            let voteCountTotal = 0;
            if (this.options) {
                const options = this.options.rows;
                for (var i in options) {
                    var voteCount = options[i].voteCount;
                    if (voteCount) {
                        voteCountTotal += voteCount;
                    }
                }
            }

            return voteCountTotal;
        };

        getVoteValuePercentage (value) {
            if (!this.getVoteCountTotal() || value < 1 || !value) return 0;
            return value / this.getVoteCountTotal() * 100;
        };

    }]
};

angular
    .module('citizenos')
    .component(regularGraph.selector, regularGraph);

