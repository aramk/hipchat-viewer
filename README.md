#HipChat Viewer

GUI frontend viewer for [HipChat](https://www.hipchat.com/) chat log exports.  
By Aram Kocharyan, <http://aramk.com>.  
Released under the [MIT license](http://opensource.org/licenses/MIT).

## Exporting
Export your chat logs in the Admin screen of Hipchat, download the zip archive and extract it to a happy place.

## Compiler
The compiler adds a `list.json` file in each room folder which can be used to look up the filenames of chat logs. Run it like so using Ruby:

	ruby ./compile.rb <hipchat_export directory>
	
