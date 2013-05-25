require([
//    'lib/jquery-1.10.0.min'
], function (jQuery) { // TODO get this require working

    var Viewer = function (args) {
        this.url = null;
        this.$urlModal = args.$urlModal;
        this.$sidebar = args.$sidebar;
        this.$content = args.$content;
        this.dataType = 'json' || args.dataType;
        this.defaultUrl = this.currentURL() + 'hipchat_export/';
//        this.postCount = 0;
//        this.postLimit = 10;

        if (!this.url) {
            this.url = this.defaultUrl;
        }

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
                if (url.length) {
                    $urlGroup.removeClass('error');
                    $alert.addClass('hide');
                    me.load(url, {
                        success: function () {
                            me.$urlModal.modal('hide');
                        },
                        error: function () {
                            console.log('error');
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
            var successCallback = args.success;
            $.ajax($.extend(args, {
                dataType: me.dataType,
                url: me.url + me.roomsDir + me.listFilename,
                success: function (data) {
                    if (successCallback) {
                        successCallback(data);
                    }
                    me.rooms = data.rooms;
                    me.$sidebar.html('');
                    $.each(me.rooms, function (i, room) {
                        if (i < 1) { // TODO remove
                            me.addRoom(room);
                        }
                    });

                    $('body').scrollspy({target: '.bs-docs-sidebar'});
                }
            }));
        },
        addRoom: function (room) {
            var me = this;

//            if (me.postCount >= me.postLimit) {
//                console.log('skip');
//                return;
//            }

            me.$sidebar.append($('<li><a href="#room-' + room.room_id + '"><i class="icon-chevron-right"></i> ' + room.name + '</a></li>'));
            var $section = $('<section id="room-' + room.room_id + '"><div class="page-header"><h1>' + room.name + '</h1><div></section>');
            me.$content.append($section);

            var roomURL = me.url + me.roomsDir + room.name + '/';
            $.ajax({
                dataType: me.dataType,
                url: roomURL + me.listFilename,
                success: function (logFiles) {

//                    if (me.postCount >= me.postLimit) {
//                        console.log('skip');
//                        return;
//                    }

                    console.log('logs', logFiles);

                    $.each(logFiles, function (i, logFile) {
                        var date = logFile.replace(/\.json$/, '');
                        var $log = $('<h2>' + date + '</h2>');
                        $section.append($log);
//                        if (me.postCount >= me.postLimit) {
//                            console.log('skip');
//                            return;
//                        }

                        var $table = $('<table class="table"></table>');
                        $section.append($table);

                        $.ajax({
                            dataType: me.dataType,
                            url: roomURL + logFile,
                            success: function (logContent) {
                                $.each(logContent, function (j, post) {
//                                    me.postCount++;
//                                    if (post) {
                                    if (post.message) {
                                        post.message = me.bleep(post.message);
                                        post.message = me.linkify(post.message);
                                        post.message = me.mentions(post.message);
                                        post.message = post.message.replace('http: //', 'http://');
                                    }

                                    var name = post.from ? post.from.name : 'Anonymous';
                                        var $row = $('<tr><td class="user">' + name + '</td><td class="message">' + post.message + '</td></tr>');
                                        $table.append($row);
//                                        console.log(post);
//                                    }
                                });
                            }
                        });
                    });
                }
            });

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

    $(function () {
//        // TODO move to caller script

        $('.nav-list').affix();


        $('section [href^=#]').click(function (e) {
            e.preventDefault()
        });

        var viewer = new Viewer({
            $urlModal: $('#url-modal'),
            $sidebar: $('#navbar'),
            $content: $('#content')
        });

    });

});
