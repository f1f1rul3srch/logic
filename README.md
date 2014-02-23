Logic
=====

A modern, lightweight JavaScript form validator.

How to use
==========

__HTML CONTENT__

    <div class="error_box"></div>
    <div class="success_box"></div>
    
__JS CONTENT__

    var validator = new LogicValidator('name_of_example_form', [{    
        name: 'name',
        display: 'Name',    
        rules: 'required'
    }, {
        name: 'password',
        rules: 'required'
    }, {
        name: 'password_confirm',
        display: 'password confirmation',
        rules: 'required|matches[password]'
    }, {
        name: 'email',
        rules: 'valid_email'
    }], function(errors, evt) {
          var selector_errors = $('.error_box'),
              selector_success = $('.success_box');
            
            if (errors.length > 0) {
                selector_errors.empty();
                
                for (var i = 0, errorLength = errors.length; i < errorLength; i++) {
                    selector_errors.append(errors[i].message + '<br />');
                }
                
                selector_success.css({ display: 'none' });
                selector_errors.fadeIn(200);
            } else {
                selector_errors.css({ display: 'none' });
                selector_success.fadeIn(200);
            }
            
            if (evt && evt.preventDefault) {
                evt.preventDefault();
            } else if (event) {
                event.returnValue = false;
            }
    });

__Enjoy! :)__
