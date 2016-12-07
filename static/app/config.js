requirejs.config({
  baseUrl: '/keec/assets',
  paths: {
    'angular': 'vendor/angular/angular',
    'jquery': 'vendor/jquery/dist/jquery.min',
    'angular-ui-router': 'vendor/angular-ui-router/release/angular-ui-router.min',
    'angular-animate' :'vendor/angular-animate/angular-animate',
    'angular-aria' :'vendor/angular-aria/angular-aria',
    'angular-messages':'vendor/angular-messages/angular-messages',
    'angular-material' :'vendor/angular-material/angular-material.min',
    'md-steppers':'vendor/md-steppers/dist/md-steppers.min'
  },
  shim: {
    'angular': {
      exports: 'angular'
    },
    'angular-ui-router': {
      deps: ['angular']
    },
    'angular-animate': {
      deps: ['angular']
    },
    'angular-aria': {
      deps: ['angular']
    },
     'angular-messages': {
      deps: ['angular']
    },
     'angular-material': {
      deps: ['angular']
    },
     'md-steppers': {
      deps: ['angular']
    }
  }
});

// Bootstrapping
require(['app/main']);
