angular
    .module('citizenos')
    .directive('cosDropdown', ['$document', '$timeout', function ($document, $timeout) {
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {
                var elementClickHandler = function () {
                    elem.toggleClass('dropdown_active');
                    elem.addClass('active_recent');
                };
                //elem.on('click', elementClickHandler);

                var documentClickHandler = function () {
                    if (!elem.hasClass('active_recent')) {
                        elem.removeClass('dropdown_active');
                    }
                    elem.removeClass('active_recent');
                };
                //$document.on('click', documentClickHandler);

                scope.$on('$destroy', function () {
                    // Don't leave event handlers hanging
                    elem.off('click', elementClickHandler);
                    $document.off('click', documentClickHandler);
                });

                $timeout(function () {
                    var dropdownWithDescription = elem[0].getElementsByClassName('dropdown with_description')[0];
                    if (dropdownWithDescription) {
                        var dropdownItems = dropdownWithDescription.getElementsByClassName('dropdown_item');

                        var elementMouseEnterHandler = function () {
                            var elementClasses = this.classList;
                            var itemClass;

                            // find the "item_*" class name to use it to highlight the right description
                            for (var i = 0; i < elementClasses.length; i++) {
                                if (elementClasses[i].indexOf('item_') === 0) {
                                    itemClass = elementClasses[i];
                                    break;
                                }
                            }
                            if (itemClass) {
                                // Add active class to the dropdown items
                                for (var i = 0; i < dropdownItems.length; i++) {
                                    dropdownItems[i].classList.remove('active');
                                }
                                elementClasses.add('active');

                                // Add active to the relevant description
                                var itemDescriptions = dropdownWithDescription.getElementsByClassName('item_description');
                                for (var i = 0; i < itemDescriptions.length; i++) {
                                    var itemDescriptionClassList = itemDescriptions[i].classList;
                                    if (itemDescriptionClassList.contains(itemClass)) {
                                        itemDescriptionClassList.add('active');
                                    } else {
                                        itemDescriptionClassList.remove('active');
                                    }
                                }
                            }
                        };

                        for (var i = 0; i < dropdownItems.length; i++) {
                            dropdownItems[i].addEventListener('mouseenter', elementMouseEnterHandler.bind(dropdownItems[i]));
                        }
                    }
                })
            }
        }
    }]);

