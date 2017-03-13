define(['jquery', 'angular', 'angular-i18n', 'angular-ui-router', 'underscore',
    'angular-animate', 'angular-aria', 'angular-messages', 'angular-cookies',
    'angular-translate-loader', 'angular-moment', 'angular-translate-storage-cookie', 'angular-translate-storage-local',
    'angular-material', 'md-steppers', 'angular-material-data-table', 'angular-scroll','bootstrap', 'fabricjs'
  ],

  function($, angular) {

    angular.module('keec', [
        'ui.router', 'ngMaterial', 'pascalprecht.translate', 'ngCookies', 'md-steppers', 'md.data.table', 'duScroll', 'angularMoment'
      ])

      .config(function($locationProvider, $stateProvider, $urlRouterProvider, $translateProvider) {
        // Multi-language support
        $translateProvider
          .useLocalStorage()
          .useStaticFilesLoader({
            prefix: '/keec/assets/locales/',
            suffix: '.json'
          })
          .determinePreferredLanguage(function() {
            var lang = navigator.language || navigator.userLanguage;
            return lang && lang.substring(0, 2);
          });
        $translateProvider.useSanitizeValueStrategy('escape');

        // Enabling HTML 5 mode to remove the # prefix from URL's
        $locationProvider.html5Mode({
          enabled: true,
          requireBase: false
        });

        // URL States (routes)
        $stateProvider

          /* Intro Page */
          .state('app.intro', {
            url: '/keec/',
            views: {
              'content@': {
                templateUrl: '/keec/assets/views/intro.html',
                controller: function($scope, $rootScope, $window) {
                  $rootScope.screenWidth = $window.innerWidth;
                  if ($rootScope.screenWidth <= 860) {
                    $rootScope.menu = true;
                    $rootScope.labels = false;
                  } else if ($rootScope.screenWidth > 860) {
                    $rootScope.labels = true;
                    $rootScope.menu = false;
                  }
                  $(window).resize(function() {
                    if ($(window).width() <= 860) {
                      $scope.$apply(function() {
                        $rootScope.labels = false;
                        $rootScope.menu = true;
                      });

                    } else if ($(window).width() > 860) {
                      $scope.$apply(function() {
                        $rootScope.labels = true;
                        $rootScope.menu = false;
                      });
                    }
                  });
                }
              }
            }
          })

          .state('app', {
            abstract: true,
            url: '',
            resolve: {
              // Gets app configuration
              config: function($http) {
                return $http.get('/keec/api/config').then(function(response) {
                  return response.data;
                });
              },

              //Get model - By Anup Kumar -
              models: function($http, $rootScope, $translate, $sce) {
                var locale = $translate.use() || $translate.proposedLanguage();
                return $http.get('/keec/api/models', {
                  params: {
                    locale: locale
                  }
                }).then(function(response) {
                  var models = response.data['objects'] || [];
                  $rootScope.models = models
                  return $rootScope.models;
                });
              },

              //Gets tasks
              tasks: function($http, $rootScope, models) {
                return $http.get('/keec/api/tasks').then(function(response) {
                  var tasks = response.data['tasks'] || [];
                  var paginationLimit = 10;
                  _(tasks).each(function (task) {
                    if (!task.model_name) {
                      task.model_name = _(models).findWhere({name: task['model_name'].lower()});
                    }
                    paginationLimit = task.model_name.taskPaginationLimit;
                  });
                  $rootScope.filteredTasks = tasks; 
                  $rootScope.tasks = tasks;
                  $rootScope.taskPagination = {
                    limit: paginationLimit,
                    pages: Math.floor($rootScope.filteredTasks.length / paginationLimit) + ($rootScope.filteredTasks.length % paginationLimit ? 1 : 0),
                    currentPage: 1,
                    start: 0
                  }
                  $rootScope.showMoreButton=true;
                  $rootScope.taskPagination.pages =  Math.floor($rootScope.tasks.length / 6) + 1;
                  $rootScope.taskPagination.start = 0;
                  $rootScope.calculatePagination = function(){
                      $rootScope.taskPagination = {
                        limit: paginationLimit,
                        pages: Math.floor($rootScope.filteredTasks.length / paginationLimit) + ($rootScope.filteredTasks.length % paginationLimit ? 1 : 0),
                        currentPage: 1,
                        start: 0
                      }
                  }
                  $rootScope.taskPagination = {
                    limit: paginationLimit,
                    pages: Math.floor($rootScope.filteredTasks.length / paginationLimit) + ($rootScope.filteredTasks.length % paginationLimit ? 1 : 0),
                    currentPage: 1,
                    start: 0
                  }
                  $rootScope.taskPaginate = function(direction)
                  {
                    switch(direction)
                    {
                      case 'next':
                        if($rootScope.taskPagination.currentPage+1 <= $rootScope.taskPagination.pages)
                          $rootScope.taskPagination.currentPage += 1;
                          break;
                      case 'prev':
                        if($rootScope.taskPagination.currentPage-1 >= 1)
                          $rootScope.taskPagination.currentPage -= 1;
                        break;
                    }
                    $rootScope.taskPagination.start = ($rootScope.taskPagination.currentPage -1) * $rootScope.taskPagination.limit;
                  }
                  return $rootScope.tasks;
                });
              },

              //Get Task ID
              task_id: function($location, $rootScope){
                $rootScope.task_id = $location.path().substr($location.path().lastIndexOf('/') + 1);
                return $rootScope.task_id;
              }
            },
            views: {
              'header': {
                templateUrl: '/keec/assets/views/header.html'
              },
              'footer': {
                templateUrl: '/keec/assets/views/footer.html'
              },
            }
          })

          /* Home */
          .state('app.home', {
            url: '/keec/model/{model_name}',
            resolve: {
              model: function($stateParams, models) {
                return _(models).findWhere({
                  name: $stateParams['model_name']
                });
              }
            },
            views: {
              'content@': {
                templateUrl: '/keec/assets/views/home.html',
                controller: function($scope, $rootScope, $mdDialog, api, model, $location, $anchorScroll, $document, $window) {
                  if ($window.localStorage.getItem("token") == null) {
                    $rootScope.selectedCountry = 0;
                  } else {
                    $rootScope.selectedCountry = $window.localStorage.getItem("token");
                  }
                  $rootScope.onClick = function(index) {
                    $window.localStorage.setItem("token", index);
                  };
                  $rootScope.model = model;
                  $scope.count = 0;
                  $scope.activeStepIndex = 0;
                  $scope.totalSteps = $rootScope.model.steps.length;
                  $rootScope.screenWidth = $window.innerWidth;
                  console.log($rootScope.screenWidth);
                  console.log($window);
                  if ($rootScope.screenWidth <= 860) {
                    $rootScope.menu = true;
                    $rootScope.labels = false;
                  } else if ($rootScope.screenWidth > 860) {
                    $rootScope.labels = true;
                    $rootScope.menu = false;
                  }
                  $(window).resize(function() {
                    if ($(window).width() <= 860) {
                      $scope.$apply(function() {
                        $rootScope.labels = false;
                        $rootScope.menu = true;
                      });

                    } else if ($(window).width() > 860) {
                      $scope.$apply(function() {
                        $rootScope.labels = true;
                        $rootScope.menu = false;
                      });
                    }
                  });
                  $scope.activateStep = function(index) {
                    if ((index <= $scope.count)) {
                      $scope.activeStepIndex = index;
                      $("html, body").stop(true).delay(10).animate({
                        scrollTop: $('#' + index).offset().top - ($("#stppr").outerHeight() + 50)
                      }, 1500);
                    }
                  };

                  $rootScope.postData = function(data) {
                    api.postData(model.name, data);
                  };

                  $rootScope.num = 0;

                  $rootScope.stepNext = function(index) {
                    if (index == 4) {
                      console.log('run');
                      $scope.activeStepIndex = index;
                      $rootScope.data = {};
                      var resJson = {}
                      var ObjCount = 0;
                      var RelDimId;
                      $rootScope.model.steps.forEach(function(obj) {
                        obj.containers.forEach(function(obj1) {
                          obj1.parameters.forEach(function(obj2) {
                            if (obj2.id != 'prev' && obj2.id != 'next' && obj2.id != 'figure' && obj2.id != 'run' && obj2.id != 'display' && obj2.type != 'table' && obj2.id != 'shape') {
                              if (obj2.id == 'cmbBldgShape') {
                                RelDimId = obj2.value;
                              }
                              if (typeof RelDimId != "undefined" && obj2.id == RelDimId + 'Data') {
                                for (var key in obj2.value) {
                                  resJson[key] = obj2.value[key];
                                  ObjCount = ObjCount + 2;
                                }
                              }
                              if (obj2.id == 'rdbtnWinWwr') {
                                if (obj2.rdbtnWinArea) {
                                  resJson.rdbtnWinArea = obj2.rdbtnWinArea;
                                  ObjCount = ObjCount + 2;
                                } else if (obj2.rdbtnWinWwr) {
                                  resJson.rdbtnWinWwr = obj2.rdbtnWinWwr;
                                  ObjCount = ObjCount + 2;
                                }
                              } else {
                                resJson[obj2.id] = obj2.value;
                                ObjCount = ObjCount + 2;
                              }
                            }
                          });
                        });
                      });
                      resJson.txtSkyltType = 'flat';
                      resJson.txtSkyltCvr = 13;
                      var nonObjJson = {};
                      for (var prop in resJson) {
                        if (resJson.hasOwnProperty(prop) && typeof resJson[prop] !== "object") {
                          nonObjJson[prop] = resJson[prop];
                        }
                      }
                      $rootScope.data = JSON.stringify(nonObjJson);
                      $rootScope.postData($rootScope.data);
                    } else {
                      var isError = false;
                      $rootScope.model.steps[$scope.activeStepIndex].containers.forEach(function(container) {
                        container.parameters.forEach(function(parameter) {
                          parameter.error = false;
                          if ((parameter.type != 'shape') && (parameter.type != 'button') && (parameter.type != 'table') && (parameter.type != 'figure') && (parameter.value === null || parameter.value === "")) {
                            /* if(parameter.type == 'table'){
                              parameter.combine.forEach(function(element){
                               if((element.item == '')||(element.item == null)){
                                 parameter.error = true;
                                 isError = true;
                               }
                             })

                            }
                            else{
                              parameter.error = true;
                              isError = true;
                            }*/
                            parameter.error = true;
                            isError = true;
                          }
                        });
                      });
                    }

                    if (index <= 3 && isError == false) {
                      $scope.activeStepIndex = index;
                      if (index - 1 == $scope.count) {
                        $scope.count += 1;
                      }
                      $("html, body").stop(true).delay(10).animate({
                        scrollTop: $('#' + index).offset().top - ($("#stppr").outerHeight() + 50)
                      }, 1500);
                    }
                  };

                  $rootScope.stepBack = function(index) {
                    $scope.activeStepIndex = index
                    $("html, body").stop(true).delay(10).animate({
                      scrollTop: $('#' + index).offset().top - ($("#stppr").outerHeight() + 50)
                    }, 1500);
                  };
                  $rootScope.Dialog = function(ev) {
                    $mdDialog.show({
                        controller: function($scope, $mdDialog) {
                          $scope.conDialog = $rootScope.constructionDialog;
                          $scope.conDialog.options0 = $scope.conDialog.parameters[0].options.split(', ');
                          $scope.conDialog.values0 = $scope.conDialog.parameters[0].values.split(', ');
                          $scope.conDialog.options1 = $scope.conDialog.parameters[1].options.split(', ');
                          $scope.conDialog.values1 = $scope.conDialog.parameters[1].values.split(', ');
                          $scope.conDialog.options4 = $scope.conDialog.parameters[4].options.split(', ');
                          $scope.conDialog.values4 = $scope.conDialog.parameters[4].values.split(', ');
                          $scope.winDialog = $rootScope.windowDialog;
                          $scope.hide = function() {
                            $mdDialog.hide();
                          };
                        },
                        templateUrl: '/keec/assets/views/dialog.html',
                        targetEvent: ev,
                        scope: $scope,
                        preserveScope: true,
                        clickOutsideToClose: true
                      }

                    );
                  };
                }
              }
            }
          })

          //Task list page state
          .state('app.tlist', {
            url: '/keec/task',
            views: {
              'content@': {templateUrl: '/keec/assets/views/task-list.html'}
            },
            onEnter: function(){
              setTimeout(window.createCarousel,500);
            }
          })
        // If the path doesn't match any of the configured urls redirect to home
        $urlRouterProvider.otherwise('/keec/');
      })
      /* Backend API */
      .factory('api', function($q, $http, $state, $timeout, $rootScope) {
        var request = function(callback, timeout) {
          var deferred = $q.defer();

          $timeout(function() {
            deferred.resolve(null);
          }, typeof timeout !== 'undefined' ? timeout : 800);

          callback(deferred);

          return deferred.promise;
        };

        return {
          postData: postData
        };

        function postData(name, data) {
          return $http.post('/keec/api/models/' + name, data).then(function(response) {
            console.log(response.data)
            // if (response.data) {
            //   $rootScope.$broadcast('resultData', response.data)
            //   setTimeout(function() {
            //     $rootScope.stepNext()
            //   }, 5000);
            // }
            $state.go('app.tlist');
          })
        }
      })

      /* Configuration manager */
      .factory('configStorage', function($window, $cookieStore) {
        return {
          set: function(name, value) {
            try {
              $window.localStorage.setItem(name, value);
            } catch (e) {
              $cookieStore.put(name, value);
            }
          },
          get: function(name) {
            try {
              return $window.localStorage.getItem(name);
            } catch (e) {
              return $cookieStore.get(name);
            }
          }
        }
      })

      //
      // Filters
      //

      .filter('htmlSafe', function($sce){
        return function(args){
          return $sce.trustAsHtml(args);
        }
      })

      .filter('parameterDisplay', function ($sce) {
        var getParameters = function(args){
          console.log(args);
          var bldLoc = args.cmbBldgLocation;
          var bldShape = args.cmbBldgShape;
          return bldLoc + " | " + bldShape;
        }
        return function (args) {
          return $sce.trustAsHtml(getParameters(args));
        };
      })

      .filter('argumentDisplay', function ($sce) {
        var getParameters = function(args){
          var params = "Building Name: " + args.txtBldgName;
          params += " | " + "Building Type: " +  args.cmbBldgType;
          params += " | " + "Building Location: " + args.cmbBldgLocation
          params += " | " + "Building Shape: " + args.cmbBldgShape;
          return params;
        }
        return function (args) {
          return $sce.trustAsHtml(getParameters(args));
        };
      })

      .filter('titleDisplay', function(){
        return function(title)
        {
          var location = title;
          return location;
        }
      })

      // Return true or a given text if object has items
      .filter('isEmpty', function () {
        return function (items, replaceText) {
          return items && items.length ? false : replaceText || true;
        };
      })

      .directive('field', function($mdDialog, $rootScope, $mdEditDialog) {
        return {
          restrict: 'E',
          replace: true,
          scope: {
            field: '=',
            container: '=',
          },
          template: '<div ng-include="getTemplateUrl()"></div>',
          transclude: false,

          link: function(scope, element, attrs) {
            scope.field.type = scope.field.type || 'text';
            scope.field.value = null;
            scope.getTemplateUrl = function() {
              return '/keec/assets/views/fields/' + scope.field.type + '.html';
            };

            scope.blocked = function() {
              if (scope.field.enabled == 'False') {
                return true;
              }
              return false;
            }

            scope.editInput = function(event, value, index) {
              var editDialog = {
                modelValue: value[index],
                placeholder: 'Enter Input',
                save: function(input) {
                  value[index] = input.$modelValue;
                },
                targetEvent: event,
                title: 'Edit Field',
                validators: {
                  'md-maxlength': 30
                }
              };
              var promise;
              promise = $mdEditDialog.large(editDialog);
            };
            scope.editInputValue = function(event, value) {
              var editDialog = {
                modelValue: value.fieldValue,
                placeholder: 'Enter Value',
                save: function(input) {
                  value.fieldValue = input.$modelValue;
                },
                targetEvent: event,
                title: 'Edit Value',
                validators: {
                  'md-maxlength': 30
                }
              };
              var promise;
              promise = $mdEditDialog.large(editDialog);
            };
            scope.selectedTableRow = null;
            scope.selectRow = function(index) {
              scope.selectedTableRow = index;
            }

            switch (scope.field.type) {
              case 'dropdown':
                scope.field.options = scope.field.options.split(', ');
                scope.field.values = scope.field.values.split(', ');
                if (scope.field.url) {
                  scope.field.urls = scope.field.url.split(', ')
                  scope.field.value = scope.field.values[0]
                }
                scope.$watch('field.url', function() {
                  if (scope.field.url) {
                    scope.field.value = scope.field.url.slice(0, -4)
                  }
                })
                break;
              case 'radio':
                scope.field.options = scope.field.options.split(', ');
                scope.field.value = scope.field.options[0];
                if (scope.field.url) {
                  scope.field.url = scope.field.url
                }
                scope.$watch('scope.field.value', function() {
                  if (scope.field.value == 'Window Area (m2)') {
                    scope.field.rdbtnWinArea = true;
                    scope.field.rdbtnWinWwr = false;
                  } else {
                    scope.field.rdbtnWinWwr = true;
                  }
                });
                break;
              case 'number':
                scope.field.value = parseFloat(scope.field.default);
                break;
              case 'table':
                if (scope.field.id == 'windowTable') {
                  scope.row1 = scope.container.parameters.filter(function(p) {
                    return p.id == scope.field.related_id1;
                  })[0];
                  scope.row1.directionOptions = scope.row1.directionOptions.split(', ');
                  scope.row1.directionValues = scope.row1.directionValues.split(', ');
                  scope.row1.glazingOptions = scope.row1.glazingOptions.split(', ');
                  scope.row1.glazingValues = scope.row1.glazingValues.split(', ');
                  scope.row2 = scope.container.parameters.filter(function(p) {
                    return p.id == scope.field.related_id2;
                  })[0];
                  scope.row2.directionOptions = scope.row2.directionOptions.split(', ');
                  scope.row2.directionValues = scope.row2.directionValues.split(', ');
                  scope.row2.glazingOptions = scope.row2.glazingOptions.split(', ');
                  scope.row2.glazingValues = scope.row2.glazingValues.split(', ');
                  scope.row3 = scope.container.parameters.filter(function(p) {
                    return p.id == scope.field.related_id3;
                  })[0];
                  scope.row3.directionOptions = scope.row3.directionOptions.split(', ');
                  scope.row3.directionValues = scope.row3.directionValues.split(', ');
                  scope.row3.glazingOptions = scope.row3.glazingOptions.split(', ');
                  scope.row3.glazingValues = scope.row3.glazingValues.split(', ');
                  scope.row4 = scope.container.parameters.filter(function(p) {
                    return p.id == scope.field.related_id4;
                  })[0];
                  scope.row4.directionOptions = scope.row4.directionOptions.split(', ');
                  scope.row4.directionValues = scope.row4.directionValues.split(', ');
                  scope.row4.glazingOptions = scope.row4.glazingOptions.split(', ');
                  scope.row4.glazingValues = scope.row4.glazingValues.split(', ');
                  scope.field.rowValues = [];
                  scope.field.rowValues.splice(0, 0, scope.row1, scope.row2, scope.row3, scope.row4);
                } else if (scope.field.id == 'spaceTable') {
                  scope.field.row_heading = scope.field.row_heading.split(', ');
                  scope.field.row1 = scope.field.row1.split(', ');
                  scope.field.row1.splice(0, 0, scope.field.row_heading[0]);
                  scope.field.row2 = scope.field.row2.split(', ');
                  scope.field.row2.splice(0, 0, scope.field.row_heading[1]);
                  scope.field.column_heading = scope.field.column_heading.split(', ');
                  scope.field.row1 = scope.field.row1.reduce(function(o, v, i) {
                    o[i] = v;
                    return o;
                  }, {});
                  scope.field.row2 = scope.field.row2.reduce(function(o, v, i) {
                    o[i] = v;
                    return o;
                  }, {});
                  scope.field.merge = [];
                  scope.field.merge.splice(0, 0, scope.field.row1, scope.field.row2);
                  scope.field.value = scope.field.merge;
                }

                break;
              case 'dimension':
                scope.axisObj = {};
                function axisData() {
                  var shpAxisArr = scope.field.label.split(',');
                  for (var axisKey of shpAxisArr) {
                    if(scope.field.hasOwnProperty('txtLeng' + axisKey)) {
                      scope.axisObj[axisKey] = Number(scope.field['txtLeng' + axisKey])
                    }
                  }
                };
                axisData();
                //Watch
                scope.$watchCollection(
                  "axisObj", function() {
                    scope.txtFloorArea = 1;
                    for(var axisKey in scope.axisObj) {
                      scope.txtFloorArea *= scope.axisObj[axisKey]
                    };
                  }
                );
                scope.building = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.related_id;
                })[0];
                break;
              case 'rectangular':
                scope.field.value = {
                  txtLengX1: 10,
                  txtLengY1: 10,
                  txtFloorArea: 0
                };
                scope.building = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.related_id;
                })[0];
                scope.txtLengY1 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY1;
                })[0];
                scope.txtFloorArea = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedArea;
                })[0];
                scope.$watch('field.value.txtLengX1', function() {
                  scope.field.value.txtFloorArea = scope.field.value.txtLengX1 * scope.field.value.txtLengY1;
                });
                scope.$watch('field.value.txtLengY1', function() {
                  scope.field.value.txtFloorArea = scope.field.value.txtLengX1 * scope.field.value.txtLengY1;
                });

                break;
              case 'lshape':
                scope.field.value = {
                  txtLengX1: 10,
                  txtLengX2: 5,
                  txtLengY1: 10,
                  txtLengY2: 5,
                  txtFloorArea: 0
                };
                scope.building = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.related_id;
                })[0];
                scope.field.relDimId = scope.building.url + 'Data'
                scope.txtLengX2 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedX2;
                })[0];
                scope.txtLengY1 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY1;
                })[0];
                scope.txtLengY2 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY2;
                })[0];
                scope.txtFloorArea = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedArea;
                })[0];
                scope.$watch('field.value.txtLengX1', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX1 * scope.field.value.txtLengY1) - ((scope.field.value.txtLengX1 - scope.field.value.txtLengX2) * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2));
                });
                scope.$watch('field.value.txtLengX2', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX1 * scope.field.value.txtLengY1) - ((scope.field.value.txtLengX1 - scope.field.value.txtLengX2) * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2));
                });
                scope.$watch('field.value.txtLengY1', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX1 * scope.field.value.txtLengY1) - ((scope.field.value.txtLengX1 - scope.field.value.txtLengX2) * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2));
                });
                scope.$watch('field.value.txtLengY2', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX1 * scope.field.value.txtLengY1) - ((scope.field.value.txtLengX1 - scope.field.value.txtLengX2) * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2));
                });

                break;
              case 'tshape':
                scope.field.value = {
                  txtLengX1: 10,
                  txtLengX2: 5,
                  txtLengX3: 5,
                  txtLengY1: 10,
                  txtLengY2: 5,
                  txtFloorArea: 0
                };
                scope.building = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.related_id;
                })[0];
                scope.selected = scope.building.selected
                scope.txtLengX2 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedX2;
                })[0];
                scope.txtLengX3 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedX3;
                })[0];
                scope.txtLengY1 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY1;
                })[0];
                scope.txtLengY2 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY2;
                })[0];
                scope.txtFloorArea = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedArea;
                })[0];
                scope.$watch('field.value.txtLengX1', function() {
                  scope.field.value.txtFloorArea = 2 * (scope.field.value.txtLengX2 * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY1);
                });
                scope.$watch('field.value.txtLengX2', function() {
                  scope.field.value.txtFloorArea = 2 * (scope.field.value.txtLengX2 * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY1);
                });
                scope.$watch('field.value.txtLengX3', function() {
                  scope.field.value.txtFloorArea = 2 * (scope.field.value.txtLengX2 * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY1);
                });
                scope.$watch('field.value.txtLengY1', function() {
                  scope.field.value.txtFloorArea = 2 * (scope.field.value.txtLengX2 * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY1);
                });
                scope.$watch('field.value.txtLengY2', function() {
                  scope.field.value.txtFloorArea = 2 * (scope.field.value.txtLengX2 * (scope.field.value.txtLengY1 - scope.field.value.txtLengY2)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY1);
                });

                break;
              case 'ushape':
                scope.field.value = {
                  txtLengX1: 10,
                  txtLengX2: 5,
                  txtLengX3: 5,
                  txtLengY1: 10,
                  txtLengY2: 5,
                  txtLengY3: 5,
                  txtFloorArea: 0
                };
                scope.building = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.related_id;
                })[0];
                scope.selected = scope.building.selected
                scope.txtLengX2 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedX2;
                })[0];
                scope.txtLengX3 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedX3;
                })[0];
                scope.txtLengY1 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY1;
                })[0];
                scope.txtLengY2 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY2;
                })[0];
                scope.txtLengY3 = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedY3;
                })[0];
                scope.txtFloorArea = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.relatedArea;
                })[0];
                scope.$watch('field.value.txtLengX1', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX2 * scope.field.value.txtLengY1) + (scope.field.value.txtLengX1 - (scope.field.value.txtLengX2 + scope.field.value.txtLengX3)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY2);
                });
                scope.$watch('field.value.txtLengX2', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX2 * scope.field.value.txtLengY1) + (scope.field.value.txtLengX1 - (scope.field.value.txtLengX2 + scope.field.value.txtLengX3)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY2);
                });
                scope.$watch('field.value.txtLengX3', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX2 * scope.field.value.txtLengY1) + (scope.field.value.txtLengX1 - (scope.field.value.txtLengX2 + scope.field.value.txtLengX3)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY2);
                });
                scope.$watch('field.value.txtLengY1', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX2 * scope.field.value.txtLengY1) + (scope.field.value.txtLengX1 - (scope.field.value.txtLengX2 + scope.field.value.txtLengX3)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY2);
                });
                scope.$watch('field.value.txtLengY2', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX2 * scope.field.value.txtLengY1) + (scope.field.value.txtLengX1 - (scope.field.value.txtLengX2 + scope.field.value.txtLengX3)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY2);
                });
                scope.$watch('field.value.txtLengY3', function() {
                  scope.field.value.txtFloorArea = (scope.field.value.txtLengX2 * scope.field.value.txtLengY1) + (scope.field.value.txtLengX1 - (scope.field.value.txtLengX2 + scope.field.value.txtLengX3)) + (scope.field.value.txtLengX3 * scope.field.value.txtLengY2);
                });

                break;
              case 'shape':
                scope.shape = scope.container.parameters.filter(function(p) {
                  return p.id == scope.field.related_id;
                })[0];
                break;
              // case 'result':
              //   /*Result tab tables ........*/
              //   scope.$on('resultData', function(event, data) {
              //     /*  Result Tab.......................*/
              //     $rootScope.out = data

              //     /* Result Data table..................*/

              //     $rootScope.heading = Object.keys($rootScope.out.results[0]);
              //     $rootScope.values = [];
              //     $rootScope.out.results.forEach(function(obj, i) {
              //       $rootScope.values[i] = Object.values(obj);
              //     });
              //     /*..............................*/


              //     /* GeneralParams data table................*/

              //     $rootScope.generalKeys = Object.keys($rootScope.out.generalParams);
              //     $rootScope.filteredgeneralParams = [];
              //     $rootScope.filteredGeneralKeys = [];
              //     $rootScope.glasstype = [];
              //     $rootScope.buildingDetails = [];
              //     $rootScope.misc = [];
              //     $rootScope.generalKeys.forEach(function(obj, i) {
              //       if (obj.charAt(0) == obj.charAt(0).toLowerCase()) {
              //         $rootScope.filteredGeneralKeys[i] = obj;
              //       }
              //     });
              //     $rootScope.filteredGeneralKeys.forEach(function(fkey) {
              //       $rootScope.generalKeys.forEach(function(gkey, i) {
              //         if (fkey == gkey) {
              //           $rootScope.filteredgeneralParams[fkey] = $rootScope.out.generalParams[fkey];
              //         }
              //       })
              //     });
              //     $rootScope.filteredgeneralParamsKeys = Object.keys($rootScope.filteredgeneralParams);
              //     $rootScope.filteredgeneralParamsKeys.forEach(function(key) {
              //       if (key.charAt(0) == 'g') {
              //         $rootScope.glasstype[key] = $rootScope.filteredgeneralParams[key];
              //       } else if (key.charAt(0) == 'b') {
              //         $rootScope.buildingDetails[key] = $rootScope.filteredgeneralParams[key];
              //       } else {
              //         $rootScope.misc[key] = $rootScope.filteredgeneralParams[key];
              //       }
              //     });
              //     $rootScope.glassArray = [];
              //     for (var key in $rootScope.glasstype) {
              //       $rootScope.glassArray.push(key, $rootScope.glasstype[key]);
              //     }
              //     $rootScope.buildingDetailsArray = [];
              //     for (var key in $rootScope.buildingDetails) {

              //       $rootScope.buildingDetailsArray.push(key, $rootScope.buildingDetails[key]);
              //     }
              //     $rootScope.miscArray = [];
              //     for (var key in $rootScope.misc) {

              //       $rootScope.miscArray.push(key, $rootScope.misc[key]);
              //     }

              //     /* .......................*/

              //     /*  Input Data Table............*/

              //     $rootScope.inputArray = [];
              //     for (var key in $rootScope.out.input) {
              //       $rootScope.inputArray.push(key, $rootScope.out.input[key]);
              //     }


              //     scope.resultValues = $rootScope.values;
              //     scope.resultHeading = $rootScope.heading;

              //     scope.glassType = $rootScope.glassArray;
              //     scope.buildingDetails = $rootScope.buildingDetailsArray;
              //     scope.misc = $rootScope.miscArray;
              //     scope.inputData = $rootScope.inputArray;
              //     /* --- SIM File ---*/
              //     scope.simFile = location.protocol + '//' + location.hostname + ':' + '8080' + $rootScope.out.simFile;
              //     scope.bepsFile = location.protocol + '//' + location.hostname + ':' + '8080' + $rootScope.out.beps
              //   })
              //   break;
              case 'button':
                scope.previous = function() {
                  $rootScope.stepBack();
                }

                scope.next = function() {
                  $rootScope.stepNext();
                }
                scope.run = function() {
                  scope.runData();
                  $rootScope.stepNext();
                }
                break;
            }
            scope.dialogBox = function(ev) {
              $rootScope.Dialog(ev);
            }
            if (scope.field.type == 'text' || scope.field.type == 'number')
              scope.$watch('field.value', function(newValue, oldValue) {
                if (scope.field.error && newValue != oldValue) {
                  scope.field.error = !newValue;
                }
              });

          }
        }
      });

    angular.element(document).ready(function() {
      angular.bootstrap(document, ['keec']);
    });
  });