Logic
=====

A modern, lightweight JavaScript form validator.

How to use
==========

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
    }], function(errors) {
          if(errors.length > 0) {
            //show the errors
          }
    });

__Enjoy! :)__
