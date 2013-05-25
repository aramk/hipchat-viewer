require([
//    'lib/jquery-1.10.0.min'
], function (jQuery) { // TODO get this require working

    var Viewer = function (args) {
        this.url = null;
        this.$urlModal = args.$urlModal;
        this.$sidebar = args.$sidebar;
        this.dataType = 'json' || args.dataType;
        this.defaultUrl = this.currentURL() + 'hipchat_export/';
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

        roomsURL: 'rooms/list.json',

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
                url: me.url + me.roomsURL,
                success: function (data) {
                    if (successCallback) {
                        successCallback(data);
                    }
                    this.rooms = data.rooms;
                    me.$sidebar.html('');
                    $.each(this.rooms, function (i, room) {
                        me.$sidebar.append($('<li><a href="#'+room.room_id+'"><i class="icon-chevron-right"></i> '+room.name+'</a></li>'));
                    });
                }
            }));
        }
    };

    $(function () {
//        // TODO move to caller script

        $('.nav-list').affix();

        var viewer = new Viewer({
            $urlModal: $('#url-modal'),
            $sidebar: $('#navbar')
        });

    });

});
