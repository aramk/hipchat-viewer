require([
//    'lib/jquery-1.10.0.min'
], function (jQuery) { // TODO get this require working

    var Viewer = function (args) {
        this.url = null;
        this.urlModal = args.urlModal;

        var me = this;

        if (!this.url) {
            this.urlModal.modal();
            var $url = $('.url', this.urlModal);
            var $urlGroup = $url.closest('.control-group');
            var $submit = $('.submit', this.urlModal);
            this.urlModal.on('shown', function () {
                $url.focus();
            });
            $url.attr('placeholder', window.location.protocol + '//' + window.location.host + '/somepath');
            $submit.click(function (e) {
                var url = $url.val();
                if (url.length) {
                    me.load(url);
                } else {
                    $urlGroup.addClass('error');
                    e.stopPropagation();
                }
            });
        } else {
            me.load(this.url);
        }

    };

    Viewer.prototype = {
        load: function (url) {
            this.url = this.url || url;
            console.log(this.url);
        }
    };

    $(function () {
//        // TODO move to caller script
        var viewer = new Viewer({
            urlModal: $("#url-modal")
        });
    });

});
