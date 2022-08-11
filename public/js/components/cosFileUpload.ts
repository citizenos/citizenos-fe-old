import * as angular from 'angular';

let cosFileUpload = {
    selector: 'cosFileUpload',
    template: `<input type="file" multiple="{{$ctrl.multiple}}" />`,
    bindings: {
        select: '=?',
        multiple: '@?'
    },
    controller: ['$element', class CosFileUploadController {
        private $element;
        private select;
        private multiple;

        constructor ($element) {
            this.$element = $element;
            this.$element.bind('change', angular.bind(this, this.change));
        }

        change () {
            this.select(this.$element.find('input')[0].files);
        }
    }]
}


angular
    .module('citizenos')
    .component(cosFileUpload.selector, cosFileUpload );
