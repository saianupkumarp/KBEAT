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
            views: {
              'header': {templateUrl: '/keec/assets/views/header.html'},
              'footer': {templateUrl: '/keec/assets/views/footer.html'}
            }
          })

          /* Home */
          .state('app.home', {
            url: '/keec/',
            views: {
              'content@': {templateUrl: '/keec/assets/views/home.html'}
            }
          })
        // If the path doesn't match any of the configured urls redirect to home
        $urlRouterProvider.otherwise('/keec/');
      })
    angular.element(document).ready(function () {
      angular.bootstrap(document, ['keec']);
    });
  });
