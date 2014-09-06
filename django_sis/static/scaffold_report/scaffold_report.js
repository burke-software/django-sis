jQuery(function($) { $.extend({
    form: function(url, data, method) {
        if (method == null) method = 'POST';
        if (data == null) data = {};

        var form = $('<form>').attr({
            method: method,
            action: url
         }).css({
            display: 'none'
         });

        var addData = function(name, data) {
            if ($.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    var value = data[i];
                    addData(name + '[]', value);
                }
            } else if (typeof data === 'object') {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        addData(name + '[' + key + ']', data[key]);
                    }
                }
            } else if (data != null) {
                form.append($('<input>').attr({
                  type: 'hidden',
                  name: String(name),
                  value: String(data)
                }));
            }
        };

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                addData(key, data[key]);
            }
        }

        return form.appendTo('body');
    }
}); });

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function process_errors(filter_errors) {
  /* Process ajax error infomation
   * arr is an array generated in a django template */
  $('.scaffold_active_filters .filter').removeClass('filter_error');
  filter_errors.forEach(function(filter_error, i) {
      if (filter_error.filter != "") {
        $('.generate-warning').show();
      }
      
      var filterDiv = $('.scaffold_active_filters div#filter_'+filter_error.filter);
      filterDiv.addClass('filter_error');

      var badFields = []; // Create array to get bad field names
      for (o in filter_error.errors) { // Populate array, excluding filter numbers
        if (filter_error.errors.hasOwnProperty(o) && typeof(o) !== 'function' && o != 'filter_number') {
          badFields.push(o);
        }
      }
      badFields.reverse(); // Errors were coming in backwards
      
      errorText = ""; // Define error text

      if (badFields.length > 1) { // Handle multiple errors
        errorText = "Notes on highlighted fields, L to R:";
      }

      for (i = 0; i < badFields.length; i++) {
        var numberError = ""; // Handle multiple errors
        if (badFields.length > 1) {
          numberError = i+1 + ". ";
        }

        filterDiv.find('#id_'+badFields[i]).addClass('bad-field'); // Tag bad field with class
        errorText += " " + numberError + filter_error.errors[badFields[i]][0]; // Prep error text
      }

      filterDiv.find('.error-text').text(errorText); // Populate error text

  });
}

function view_results(type) {
  var csrf_token = getCookie('csrftoken');
  var filters = $('.scaffold_active_filters .filter');
  var filter_data = [];
  $('.error-text').text('');
  $('#scaffold').find('.bad-field').removeClass('bad-field');
  $('#preview_area').hide();
  $('.generate-warning').hide();
  $(filters).each(function(key, value) { 
    var filter_dict = {
      'name': $(value).data('name'),
      'form': $(value).find('form.filter_form').serialize()
    }
    filter_data.push(filter_dict);
  })
  data_dict = {
    csrfmiddlewaretoken: csrf_token,
    data: JSON.stringify(filter_data),
  }
  
  if (type == 'preview') {
    $.post(
      'view/?type=' + type,
      data_dict,
      function(data) {
        $('#preview_area').html(data.preview_html);
        process_errors(data.filter_errors);
        $('#preview_area').fadeIn();
      } 
    );
  } else {
    $.form('view/?type=' + type, data_dict, 'POST').submit();
  }
}


var delayValidation;

function waitforit_view_results(type, stop) {
  if (stop == true) {
    console.log("cancel timeout");
    clearTimeout(delayValidation);
  } else {
    console.log("timeout triggered");
    delayValidation = window.setTimeout(function () {
      view_results(type);
    }, 5000);  
  }
}

function reindex_filters() {
    var i = 0;
    $('.scaffold_active_filters .filter').each(function(index, value) { 
        $(value).attr('id', 'filter_' + i);
        $(value).find('form input[name="filter_number"]').val(i);
        i += 1;
    });
}

function add_filter(select) {
    prepare_filter(select);
    view_results('preview');
    reindex_filters();
}

function prepare_filter(select) {
    var value = select.options[select.selectedIndex].value; // Outputs something like "TardyFilter"
    var form = $('#filter_copy_area .' + value).clone(true); // Set clone to true to duplicate event handler data as well (i.e. .click() action for delete-filter)

    $('#scaffold_active_filters').append(form);
    $('#add_new_filter').val('');
}

$(document).ready(function() {
  // Handle the deletion of filters. Mostly cosmetic.
  $('.delete-filter').click(function() {
    $(this).parents('.filter').remove(); // Remove the whole block
  });

  // Selected Template doesn't need to be visible (or enabled) if a template isn't selected.
  if ($('.TemplateSelection select').val() == "") {
      $('#export-to-template').hide();
  }

  $('.TemplateSelection select').change(function() {
    if ($(this).val() != "") {
      $('#export-to-template').fadeIn();
    } else {
      $('#export-to-template').fadeOut();
    }
  });

  $('.filter input, .filter select').change(function() {
    waitforit_view_results('preview',true);

    var selectCount = 0;
    var inputCount = 0;
    
    requiredSelects = $(this).parents('.filter').find('select.report-required');
    requiredInputs = $(this).parents('.filter').find('input.report-required');

    for (i = 0; i < requiredSelects.length; i++) {
      if (requiredSelects[i].value == "") {
        selectCount++;
      }
    }

    for (i = 0; i < requiredInputs.length; i++) {
      if (requiredInputs[i].value == "") {
        inputCount++;
      }
    }

    console.log($(this).parents('.filter').attr("data-name") + ": " + inputCount + " inputs, " + selectCount + " selects");

    if (selectCount + inputCount == 0) {
      view_results('preview');
    } else {
      waitforit_view_results('preview');
    }
    //console.log("fields in " + $(this).attr("id"));
  });
});

$(function() {
  reindex_filters();
  $('#add_new_filter').val('');
  view_results('preview');
});

