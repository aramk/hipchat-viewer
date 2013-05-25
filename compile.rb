#!/usr/bin/env ruby

# HipChat Viewer Compiler
# By Aram Kocharyan, aramk.com
# Released under the MIT license: http://opensource.org/licenses/MIT
# 
# This script adds a list.json file into each room describing the chat logs so they can be identified in JavaScript.

require 'json'

if ARGV.size == 0
	puts 'compile.rb <hipchat_export directory>'
end

dir = ARGV[0]

# TODO add absolute relative directory support

dir = File.expand_path(dir);
room_dir = File.absolute_path(dir + '/rooms')
list_filename = 'list.json'

puts "Compiling in #{dir}"

if File.directory? room_dir
  puts "Room directory: #{room_dir}"
else
  puts "Room directory does not exist: #{room_dir}"
  exit
end

Dir.foreach(room_dir) do |item|
  next if item == '.' or item == '..'
  abs_path = File.absolute_path(room_dir + '/' + item)
  if File.directory? abs_path
    puts "> Found room '#{item}'"
    chat_files = []
    Dir.foreach(abs_path) do |chat_file|
      next if chat_file == '.' or chat_file == '..' or chat_file == list_filename
      chat_files.push(chat_file)
      puts "    Found chat log in #{item}/#{chat_file}"
    end
    list_path = abs_path + '/' + list_filename
    f = File.new(list_path, 'w+')
    f.write(chat_files.to_json)
    f.close
    puts "    Compiled #{item}/#{list_filename}"
  end
end
