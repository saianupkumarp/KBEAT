requirejs.config({
  baseUrl: '/keec/assets',
  paths: {
    'angular': 'vendor/angular/angular',
    'jquery': 'vendor/jquery/dist/jquery.min',
    'angular-ui-router': 'vendor/angular-ui-router/release/angular-ui-router.min',

  },
  shim: {
    'angular': {
      exports: 'angular'
    },
    'angular-ui-router': {
      deps: ['angular']
    }
  }
});

// Bootstrapping
require(['app/main']);
