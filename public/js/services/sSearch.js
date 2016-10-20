(function () {
    'use strict';

    // Allow copy-paste use of the service in 3rd party projects
    var module = null;
    try {
        module = angular.module('citizenos');
    } catch (e) {
        // Deliberate, angular.module('modulename') would throw if a non existing module is fetched and we create a new if the namespace did not exist
        module = angular.module('citizenos', []);
    }

    module
        .service('sSearch', ['$log', '$q', function ($log, $q) {
            var Search = this;

            Search.search = function (str) {
                $log.debug('sSearch.search()', str);

                //FIXME: Replace with actual search function
                return $q(function (resolve, reject) {
                    var result = [
                        {
                            "groupName": "My Topics 0",
                            "groupResults": [
                                {
                                    "resultTitles": []
                                }
                            ]
                        },
                        {
                            "groupName": "My Topics 1",
                            "groupResults": [
                                {
                                    "resultTitles": [
                                        "Subjects",
                                        "Categories",
                                        "Creator"
                                    ],
                                    "resultLinks": [
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 1",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 2",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 3",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 4",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 5",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 6",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "resultTitles": [
                                        "Users"
                                    ],
                                    "resultLinks": [
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe 1",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe 2",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe 3",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe 4",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe 5",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe 6",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                    ]
                                },
                                {
                                    "resultTitles": [
                                        "Groups"
                                    ],
                                    "resultLinks": [
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Greenpeace 1",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Greenpeace 2",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Greenpeace 3",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "groupName": "My Topics 2",
                            "groupResults": [
                                {
                                    "resultTitles": [
                                        "Subjects",
                                        "Categories",
                                        "Creator"
                                    ],
                                    "resultLinks": [
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 1",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 2",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 3",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 4",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 5",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "linksWrap": [
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "A greener city garden will improve conditions in our neighbourhood 6",
                                                            "linkHref": "#11"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "Ecology",
                                                            "linkHref": "#21"
                                                        },
                                                        {
                                                            "linkName": "Nature",
                                                            "linkHref": "#22"
                                                        },
                                                        {
                                                            "linkName": "Something else",
                                                            "linkHref": "#23"
                                                        }
                                                    ]
                                                },
                                                {
                                                    "links": [
                                                        {
                                                            "linkName": "John Doe",
                                                            "linkHref": "#31"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ];
                    setTimeout(function () {
                        resolve(result);
                    }, 200);
                });
            };

        }]);
})();
