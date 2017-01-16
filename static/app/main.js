define(['jquery', 'angular', 'angular-ui-router','angular-animate','angular-aria','angular-messages',
  'angular-material','md-steppers','angular-material-data-table'],

  function ($, angular) {

    angular.module('keec', [
      'ui.router','ngMaterial', 'md-steppers', 'md.data.table'
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
                $rootScope.constructionDialog=$rootScope.model.steps[1].containers[2];
                $rootScope.windowDialog=$rootScope.model.steps[1].containers[3];
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
            controller: function($scope, $rootScope, $mdDialog){
              $scope.activeStepIndex = 0;
              $scope.totalSteps = $rootScope.model.steps.length;
              $scope.activateStep = function(index) {
                $scope.activeStepIndex = index;
              };
              $rootScope.stepNext = function() {
                var isError = false;
                $rootScope.model.steps[$scope.activeStepIndex].containers.forEach(function(container){
                 container.parameters.forEach(function(parameter){
                  parameter.error = false;
                  if ((parameter.type != 'shape') && (parameter.type != 'button') && (parameter.type != 'figure') && (parameter.value===null || parameter.value===""))
                  {
                   if(parameter.type == 'table'){
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
                  }
                }
              });
               });

                if (isError)
                  return;
                
                if ($scope.activeStepIndex < $scope.totalSteps - 1)
                  $scope.activeStepIndex += 1;
              };
              $rootScope.stepBack = function() {
                if ($scope.activeStepIndex > 0)
                  $scope.activeStepIndex -= 1;
              };
              $rootScope.Dialog = function(ev){
                $mdDialog.show( {
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
                  clickOutsideToClose:true
                }

                );
              };
            }}
          }
        })
        // If the path doesn't match any of the configured urls redirect to home
        $urlRouterProvider.otherwise('/keec/');
      })

.directive('field', function ($mdDialog,$rootScope,$mdEditDialog) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      field: '=',
      container: '=',
    },
    template: '<div ng-include="getTemplateUrl()"></div>',
    transclude: false,

    link: function (scope, element, attrs) {
     scope.field.type = scope.field.type || 'text';
     scope.field.value = null;
     scope.getTemplateUrl = function () {
      return '/keec/assets/views/fields/' + scope.field.type + '.html';
    };
    scope.editInput = function (event, value, index) {
      var editDialog = {
        modelValue: value[index],
        placeholder: 'Enter Input',
        save: function (input) {
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
    scope.editInputValue = function (event, value) {
      var editDialog = {
        modelValue: value.item,
        placeholder: 'Enter Value',
        save: function (input) {
          value.item = input.$modelValue;
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
    scope.selectRow = function (index) {
      scope.selectedTableRow = index;
    }
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
      if(scope.field.id =='windowTable'){
        scope.count = 0;
        scope.field0 = {};
        scope.field0.glazingOptions = scope.field.glazingOptions.split(', ');
        scope.field0.glazingValues = scope.field.glazingValues.split(', ');
        scope.field0.glazingValue = scope.field0.glazingOptions[0]; 
        scope.field0.options = scope.field.options.split(', ');
        scope.field0.values = scope.field.values.split(', ');
        scope.field0.value = scope.field0.options[0];
        scope.field0.item = null; 
        scope.field.combine = [];
        scope.field.combine.splice(0,0,scope.field0);

        scope.addRow = function(){
          scope.count+=1;
          if(scope.count<=3){
            scope.field1 ={};
            scope.field1.glazingOptions = scope.field.glazingOptions.split(', ');
            scope.field1.glazingValues = scope.field.glazingValues.split(', ');
            scope.field1.glazingValue = scope.field1.glazingOptions[0];
            scope.field1.options = scope.field.options.split(', ');
            scope.field1.values = scope.field.values.split(', ');
            scope.field1.value = scope.field1.options[0];
            scope.field1.item = null;
            scope.field.combine.splice(scope.count,0,scope.field1);
          }
        }
      }
      else if(scope.field.id=='spaceTable'){
        scope.field.row_heading = scope.field.row_heading.split(', ');
        scope.field.row1 = scope.field.row1.split(', ');
        scope.field.row1.splice(0,0, scope.field.row_heading[0]);
        scope.field.row2 = scope.field.row2.split(', ');
        scope.field.row2.splice(0,0, scope.field.row_heading[1]);
        scope.field.column_heading = scope.field.column_heading.split(', ');
        scope.field.row1 = scope.field.row1.reduce(function(o,v,i){
          o[i] = v;
          return o;
        },{});
        scope.field.row2 = scope.field.row2.reduce(function(o,v,i){
          o[i] = v;
          return o;
        },{});
        scope.field.merge = [];
        scope.field.merge.splice(0,0,scope.field.row1,scope.field.row2);
        scope.field.value = scope.field.merge;
      }

      break;
      case 'dimension':
      scope.field.value={x:0,y:0,area:0};
      scope.y = scope.container.parameters.filter(function(p){
        return p.id == scope.field.relatedY;
      })[0];
      scope.area = scope.container.parameters.filter(function(p){
        return p.id == scope.field.relatedArea;
      })[0];

      scope.$watch('field.value.x', function(){
        scope.field.value.area = scope.field.value.x * scope.field.value.y;
      });
      scope.$watch('field.value.y', function(){
        scope.field.value.area = scope.field.value.x * scope.field.value.y;
      });

      break;
      case 'shape':
      scope.shape = scope.container.parameters.filter(function(p){
        return p.id == scope.field.related_id;
      })[0];

      break;
      case 'figure':
      scope.figure = scope.container.parameters.filter(function(p){
        return p.id == scope.field.related_id;
      })[0];

      break;
      case 'result':
      scope.result = $rootScope.model.steps;

      break;
      case 'button':
      scope.previous =function(){
        $rootScope.stepBack();
      }
      scope.next =function(){
       $rootScope.stepNext();
     }
     scope.run =function(){
     $rootScope.stepNext();
    }
  }
  scope.dialogBox =function(ev){
    $rootScope.Dialog(ev);
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