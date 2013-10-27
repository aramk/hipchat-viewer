require([
//    'lib/jquery-1.10.0.min'
], function (jQuery) { // TODO get this require working

  var
  Viewer = function (args) {
    this.url = null;
    this.$urlModal = args.$urlModal;
    this.$sidebar = args.$sidebar;
    this.$content = args.$content;

    this.defaultUrl = this.currentURL() + 'hipchat_export/';

    if (!this.url) {
      this.url = this.defaultUrl;
    }

    this.expandAll = new ExpandButton();
    this.$content.append(this.expandAll.dom);
    this.expandAll.dom.hide();

    var me = this;
    me.load(this.url, {
      error: function () {
        me.askURL();
      }
    });
  };

  Viewer.prototype = {

    listFilename: 'list.json',
    roomsDir: 'rooms/',
    usersDir: 'users/',

    askURL: function (args) {
      var me = this;
      this.$urlModal.modal();
      var $url = $('.url', this.$urlModal);
      var $urlGroup = $url.closest('.control-group');
      var $submit = $('.submit', this.$urlModal);
      var $alert = $('.alert', this.$urlModal);
      this.$urlModal.on('shown', function () {
        $url.focus();
      });
      $url.attr('placeholder', window.location.protocol + '//' + window.location.host + '/somepath');
      $submit.click(function (e) {
        e.stopPropagation();
        var url = $url.val();
        this.dataType = $('.request-type:checked', me.$urlModal).val() || 'json';
        if (url.length) {
          $urlGroup.removeClass('error');
          $alert.addClass('hide');
          me.load(url, {
            success: function () {
              me.$urlModal.modal('hide');
            },
            error: function () {
              $url.focus();
              $alert.removeClass('hide');
            }
          });
        } else {
          $urlGroup.addClass('error');
          $url.focus();
        }
      });
    },
    addSlash: function (str) {
      return str.replace(/(?!\/)(.)$/, '$1/');
    },
    currentURL: function () {
      var url = window.location.protocol + '//' + window.location.host + window.location.pathname;
      return this.addSlash(url);
    },
    currentDir: function () {
      return this.currentURL().substring(0, this.currentURL().replace(/\/$/, '').lastIndexOf('/'));
    },
    load: function (url, args) {
      var me = this;
      me.url = me.addSlash(url || this.url);
      $.ajax($.extend($.extend({}, args), {
        dataType: me.dataType,
        url: me.url + me.usersDir + me.listFilename,
        async: me.async,
        success: function (data) {
          me.users = {};
          $.each(data.users, function (i, user) {
            me.users[user.user_id] = user;
          });
          me.loadRooms(args);
          me.expandAll.dom.show();
        }
      }));
    },
    loadRooms: function (args) {
      var me = this;
      var successCallback = args.success;
      $.ajax($.extend(args, {
        dataType: me.dataType,
        url: me.url + me.roomsDir + me.listFilename,
        async: false,
        success: function (data) {
          if (successCallback) {
            successCallback(data);
          }
          me.rooms = data.rooms;
          me.$sidebar.html('');
          $.each(me.rooms, function (i, room) {
            me.addRoom(room);
          });
        }
      }));
      $('body').scrollspy({target: '.bs-docs-sidebar'});
    },
    addRoom: function (room) {
      var me = this;

      me.$sidebar.append($('<li><a href="#room-' + room.room_id + '"><i class="icon-chevron-right"></i> ' + room.name + '</a></li>'));
      var $roomSection = $('<section id="room-' + room.room_id + '"></section>');
      var $header = $('<div class="page-header"><h1>' + room.name + '</h1><div>');
      $roomSection.append($header);
      var expand = new ExpandButton($roomSection);
      $header.append(expand.dom);
      me.$content.append($roomSection);

      var roomURL = me.url + me.roomsDir + room.name + '/';
      $.ajax({
        dataType: me.dataType,
        url: roomURL + me.listFilename,
        async: false,
        success: function (logFiles) {
          $.each(logFiles, function (i, logFile) {
            var date = logFile.replace(/\.json$/, '');
            var $log = $('<h2><a class="log" href="#"><span class="log-show">+</span><span class="log-hide">-</span> ' + me.dateString(date) + '</a></h2>');
            $roomSection.append($log);
            var $logSection = $('<div></div>');
            $roomSection.append($logSection);
            var visible = false;
            var loaded = false;
            $logSection.hide();
            $log.click(function (e) {
              e.preventDefault();
              if (!loaded) {
                me.loadLog({
                  $logSection: $logSection,
                  roomURL: roomURL,
                  logFile: logFile
                });
                loaded = true;
              }
              if (visible) {
                $logSection.hide();
                $log.removeClass('log-visible');
              } else {
                $logSection.show();
                $log.addClass('log-visible');
              }
              visible = !visible;
            });

          });
        }
      });
    },

    loadLog: function (args) {
      var me = this;
      var $table = $('<table class="table"></table>');

      var $logSection = args.$logSection;
      var roomURL = args.roomURL;
      var logFile = args.logFile;

      $logSection.append($table);

      $.ajax({
        dataType: me.dataType,
        url: roomURL + logFile,
        success: function (logContent) {
          $.each(logContent, function (j, post) {

            if (post.message) {
              post.message = me.bleep(post.message);
              post.message = me.linkify(post.message);
              post.message = me.mentions(post.message);
              post.message = post.message.replace('http: //', 'http://');
            }

            var user_id = post.from ? post.from.user_id : null;
            var name = 'Anonymous';
            var user = null;
            var mention = null;
            if (user_id) {
              user = me.users[user_id];
              if (user) {
                name = user.name;
                mention = user.mention_name;
              }
            }

            var $row = $('<tr></tr>');
            var $user = $('<td class="user"></td>');
            var $userInner = $('<div title="@' + mention + '">' + name + '</div>');
            var $message = $('<td class="message"></td>');
            var $messageInner = $('<div>' + post.message + '</div>');
            $row.append($user);
            $user.append($userInner);
            $message.append($messageInner);
            $row.append($message);
            $table.append($row);
          });
        },
        error: function (logContent) {
          // Probably related to http://help.hipchat.com/forums/138883-suggestions/suggestions/3996693-online-log-export-viewer
        }
      });
    },

    dateString: function (date) {
      return moment(date).format('MMMM D, YYYY');
    },
    bleep: function (str) {
      var me = this;
      var badWords = ['fuck'];
      $.each(badWords, function (i, word) {
        if (str) {
          var bleeps = Array(word.length + 1).join('*');
          str = str.replace(word, bleeps);
        }
      });
      return str;
    },
    mentions: function (str) {
      return str.replace(/(@[\w+]+)/gi, '<span class="mention">$1</span>');
    },
    linkify: function (str) {
      return str.replace(/([\w]+:\/\/[\S]*)/g, '<a href="$1" target="_blank">$1</a>');
    }
  };

  var ExpandButton = function (container) {
    var me = this;
    var on = false;
    me.dom = $('<button id="expand-all" class="btn btn-primary" data-dismiss="modal" data-toggle="button" data-on="Collapse All" data-off="Expand All"></button>');
    var update = function () {
      if (on) {
        me.dom.text(me.dom.attr('data-on'));
      } else {
        me.dom.text(me.dom.attr('data-off'));
      }
    };
    update();
    me.dom.click(function () {
      $('.log', container).trigger('click');
      on = !on;
      update();
    });
  };

  $(function () {
    // TODO move to caller script

    $('.nav-list').affix();

    $('section [href^=#]').click(function (e) {
      e.preventDefault();
    });

    var viewer = new Viewer({
      $urlModal: $('#url-modal'),
      $sidebar: $('#navbar'),
      $content: $('#content')
    });

  });

});
