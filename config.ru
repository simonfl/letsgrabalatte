require 'sinatra'
require 'haml'
require 'sass/plugin/rack'
require './latte'

Sass::Plugin.options[:style] = :compressed
use Sass::Plugin::Rack

run Sinatra::Application
