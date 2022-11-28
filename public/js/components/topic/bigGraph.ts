import * as angular from 'angular';

let bigGraph = {
    selector: 'bigGraph',
    templateUrl: '/views/components/topic/big_graph.html',
    bindings: {
        options: '='
    },
    controller: ['$log', class BigGraphController {
        public options;

        constructor ($log) {
            $log.debug('BigGraph');
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

        getOptionLetter (index) {
            if (index < 26) {
                return String.fromCharCode(65 + index);
            } else {
                return String.fromCharCode(65 + Math.floor(index/26)-1) + (String.fromCharCode(65 + index % 26))
            }
        };
    }]
};

angular
    .module('citizenos')
    .component(bigGraph.selector, bigGraph);

