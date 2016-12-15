define(['jquery', 'angular', 'angular-ui-router','angular-animate','angular-aria','angular-messages',
  'angular-material','md-steppers'],

  function ($, angular) {

    angular.module('keec', [
      'ui.router','ngMaterial', 'md-steppers'
      ])

    .config(function ($locationProvider, $stateProvider, $urlRouterProvider) {

        // Enabling HTML 5 mode to remove the # prefix from URL's
        $locationProvider.html5Mode({
          enabled: true,
          requireBase: false
        });

        // URL States (routes)
        $stateProvider
        .state('app', {
          abstract: true,
          url: '',
          resolve: {
            model: function($http, $rootScope){
              return $http.get('/keec/api/model').then(function(response){
                $rootScope.model = response.data;
                return response.data;
              })
            }
          },
          views: {
            'header': {templateUrl: '/keec/assets/views/header.html'},
            'footer': {templateUrl: '/keec/assets/views/footer.html'},
          }
        })

        /* Home */
        .state('app.home', {
          url: '/keec/',
          views: {
            'content@': {templateUrl: '/keec/assets/views/home.html',
            controller: function($scope, $rootScope){
              $scope.activeStepIndex = 0;
              $scope.totalSteps = $rootScope.model.steps.length;
              $scope.activateStep = function(index) {
                $scope.activeStepIndex = index;
              };
              $scope.stepNext = function() {
                var isError = false;
                
                $rootScope.model.steps[$scope.activeStepIndex].containers.forEach(function(container){
                  container.parameters.forEach(function(parameter){
                    parameter.error = false;
                    if (parameter.type != 'shape' && (parameter.value===null || parameter.value===""))
                    {
                      parameter.error = true;
                      isError = true;
                    }
                  });
                });

                if (isError)
                  return;
                
                if ($scope.activeStepIndex < $scope.totalSteps - 1)
                  $scope.activeStepIndex += 1;
              };
              $scope.stepBack = function() {
                if ($scope.activeStepIndex > 0)
                  $scope.activeStepIndex -= 1;
              };

            }}
          }
        })
        // If the path doesn't match any of the configured urls redirect to home
        $urlRouterProvider.otherwise('/keec/');
      })

    .directive('field', function () {
      return {
        restrict: 'E',
        replace: true,
        scope: {
          field: '=',
          container: '='
        },
        template: '<div ng-include="getTemplateUrl()"></div>',
        transclude: false,

        link: function (scope, element, attrs) {
          scope.field.type = scope.field.type || 'text';
          scope.field.value = null;

          scope.getTemplateUrl = function () {
            return '/keec/assets/views/fields/' + scope.field.type + '.html';
          };

          switch(scope.field.type) {
            case 'dropdown':
              scope.field.options = scope.field.options.split(', '); 
              scope.field.values = scope.field.values.split(', '); 
              scope.field.value = scope.field.values[0];
              break;
            case 'radio':
              scope.field.options = scope.field.options.split(', '); 
              scope.field.value = scope.field.options[0];
              break;
            case 'table':
              scope.field.rowHeading = scope.field.row_heading.split(', ');
              scope.field.columnHeading = scope.field.column_heading.split(', ');
              scope.field.value = 1;
              break;
            case 'dimension':
              scope.field.value={x:0,y:0,area:0};
              scope.y = scope.container.parameters.filter(function(p){
                return p.id == scope.field.relatedY;
              })[0];
              scope.area = scope.container.parameters.filter(function(p){
                return p.id == scope.field.relatedArea;
              })[0];
              console.log(scope.y,scope.area);
              break;
          }
          if (scope.field.type == 'text' || scope.field.type == 'number')
            scope.$watch('field.value', function(newValue, oldValue){
              if (scope.field.error && newValue!=oldValue)
              {
                scope.field.error = !newValue;
              }
            });
        }
      }
    });


    angular.element(document).ready(function () {
      angular.bootstrap(document, ['keec']);
    });
  });