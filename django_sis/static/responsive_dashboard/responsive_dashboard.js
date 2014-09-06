var ss_options = {
        enableDrag: false,
        gutterX: 20,
        gutterY: 20,
        paddingX: 20,
        paddingY: 20,
        align: "left",
        colWidth: 300,
        minColumns: 1,
    }

jQuery(document).ready(function($) {
    screen_width = $(window).width();
    if (screen_width < 600) {
        $('.dashlet').attr('data-ss-colspan', 1);
    }
    $container = $("#dashboard_container");
    $container.shapeshift(ss_options);
    $container.on("ss-rearranged", function(e, selected) {
        dashlet_id = $(selected).data('dashlet_id');
        $.post(
            'ajax_reposition/',
            {dashlet_id: dashlet_id, position: $(selected).index()},
            function(data){
                $('#save_status').html(data);
            }
        );
    });
});


// http://stackoverflow.com/questions/5489946/jquery-how-to-wait-for-the-end-or-resize-event-and-only-then-perform-an-ac
// Adjust column spans for mobile view resize and back
var rtime = new Date(1, 1, 2000, 12,00,00);
var timeout = false;
var delta = 200;
$(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeend, delta);
    }
});
function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta);
    } else {
        timeout = false;
        screen_width = $(window).width();
        if (screen_width < 600) {
            $('.dashlet').attr('data-ss-colspan', 1);
            $container.shapeshift(ss_options);
        } else {
            $('.dashlet').each(function(i, value) {
                $(value).attr('data-ss-colspan', $(value).attr('data-ss-colspan-orig'));
            });
            $container.shapeshift(ss_options);
        }
    }               
}

function delete_dashlet(dashlet_id) {
    $.post(
        'ajax_delete/',
        {dashlet_id: dashlet_id},
        function(data){
            $('#save_status').html(data);
            $('#dashlet_'+dashlet_id).remove();
            $("#dashboard_container").trigger("ss-rearrange")
        }
    );
}

function customize_dashboard( element ){
    if ( $(element).data('is_customizing') == '1' ) {
        $(element).html('Customize Dashboard <img class="dashboard_gear" src="/static/responsive_dashboard/img/gear.svg"/>');
        $(element).data('is_customizing', '0');
        ss_options.enableDrag = false;
        $('#dashboard_container').shapeshift(ss_options);
        $('#dashlet_add_new').hide();
        $('.close_x').hide();
    } else {
        $(element).html('Stop Customizing <img class="dashboard_gear" src="/static/responsive_dashboard/img/gear.svg"/>');
        $(element).data('is_customizing', '1');
        ss_options.enableDrag = true;
        $('#dashboard_container').shapeshift(ss_options);
        $('#dashlet_add_new').show();
        $('.close_x').show();
    }
    $("#dashboard_container").trigger("ss-rearrange")
}
