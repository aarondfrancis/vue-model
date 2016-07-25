
var elixir = require('laravel-elixir');

require('laravel-elixir-browserify-official');

elixir(function(mix) {
    mix.browserify('./src/VueModel.js', 'dist/vue-model.js');
});