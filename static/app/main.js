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
              'footer': {templateUrl: '/keec/assets/views/footer.html'}
            }
          })

          /* Home */
          .state('app.home', {
            url: '/keec/',
            views: {
              'content@': {
                templateUrl: '/keec/assets/views/home.html',
                controller:function($scope,$mdDialog){
                  $scope.selectedStep=0;
                  $scope.stepProgress = 1;
                  $scope.maxStep = 4;
                   $scope.stepData = [
                           { step: 1, completed: false,data: {} },
                           { step: 2, completed: false,data: {} },
                           { step: 3, completed: false,data: {} },
                           { step: 4, completed: false,data: {} },
                       ];
                  $scope.BuildingInfo={};
                  $scope.submit=function(stepData){
                    console.log(stepData);
                    $scope.enableNextStep = function() {
               if ($scope.selectedStep >= $scope.maxStep) {
                 return;
                }
        
        if ($scope.selectedStep === $scope.stepProgress - 1) {
            $scope.stepProgress = $scope.stepProgress + 1;
                 }
           $scope.selectedStep = $scope.selectedStep + 1;
           stepData.completed=true;
           console.log( $scope.selectedStep,$scope.stepProgress);
          }
                   console.log($scope.BuildingInfo);
                   $scope.enableNextStep();
                  }
                $scope.dialog=function(ev){
                  $mdDialog.show({
        controller:  function DialogController($scope, $mdDialog) {
        
      },
      templateUrl: '/keec/assets/views/dialog.html',
      clickOutsideToClose:true,
       });
        }
                } 

              }
            }
          })
        // If the path doesn't match any of the configured urls redirect to home
        $urlRouterProvider.otherwise('/keec/');
      })
    angular.element(document).ready(function () {
      angular.bootstrap(document, ['keec']);
    });
  });
