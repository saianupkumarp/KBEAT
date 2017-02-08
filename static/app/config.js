requirejs.config({
  baseUrl: '/keec/assets',
  paths: {
    'angular': 'vendor/angular/angular',
    'angular-cookies': 'vendor/angular-cookies/angular-cookies.min',
    'angular-i18n': 'vendor/angular-i18n/angular-locale_es-ar',
    'jquery': 'vendor/jquery/dist/jquery.min',
    'angular-translate': 'vendor/angular-translate/angular-translate.min',
    'angular-translate-loader': 'vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.min',
    'angular-translate-storage-cookie': 'vendor/angular-translate-storage-cookie/angular-translate-storage-cookie.min',
    'angular-translate-storage-local': 'vendor/angular-translate-storage-local/angular-translate-storage-local.min',
    'angular-ui-router': 'vendor/angular-ui-router/release/angular-ui-router.min',
    'angular-animate' :'vendor/angular-animate/angular-animate',
    'angular-aria' :'vendor/angular-aria/angular-aria',
    'angular-messages':'vendor/angular-messages/angular-messages',
    'angular-material' :'vendor/angular-material/angular-material.min',
    'md-steppers':'vendor/md-steppers/dist/md-steppers.min',
    'angular-material-data-table':'vendor/angular-material-data-table/dist/md-data-table.min',
    'md-data-table':'vendor/md-data-table/dist/md-data-table-templates',
    'angular-scroll':'vendor/angular-scroll/angular-scroll'
  },
  shim: {
    'angular': {
      exports: 'angular'
    },
    'angular-i18n': {
      deps: ['angular']
    },
    'angular-cookies': {
      deps: ['angular']
    },
    'angular-ui-router': {
      deps: ['angular']
    },
    'angular-translate': {
      deps: ['angular']
    },
    'angular-translate-loader': {
      deps: ['angular-translate']
    },
    'angular-translate-storage-cookie': {
      deps: ['angular-translate']
    },
    'angular-translate-storage-local': {
      deps: ['angular-translate']
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
    },
    'angular-material-data-table': {
      deps: ['angular']
    },
     'angular-scroll': {
      deps: ['angular']
    }
  }
});

// Bootstrapping
require(['app/main']);
