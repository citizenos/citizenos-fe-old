import * as angular from 'angular';

let cosFileUpload = {
    selector: 'cosFileUpload',
    template: `<input type="file" multiple="{{$ctrl.multiple}}" />`,
    bindings: {
        select: '=',
        imageItem: '=',
        multiple: '@?'
    },
    controller: ['$element', class CosFileUploadController {
        private $element;
        public select;
        public imageItem;
        private multiple;

        constructor ($element) {
            this.$element = $element;
            this.$element.bind('change', angular.bind(this, this.change));
        }

        change () {
            const files = this.$element.find('input')[0].files;
            this.select(files);
            this.imageItem = files;
        }
    }]
}


angular
    .module('citizenos')
    .component(cosFileUpload.selector, cosFileUpload );
