/*
* Logic.js 1.0.0
* Built with love by Reach in the UK.
* Licensed under the MIT license.
* https://reachmsg.github.com/logic
*/

;(function ( $, window, document, undefined ) {

    'use strict';

    var defaults = {
        messages: {
            required: 'The %s field is required.',
            matches: 'The %s field does not match the %s field.',
            "default": 'The %s field is still set to default, please change.',
            valid_email: 'The %s field must contain a valid email address.',
            valid_emails: 'The %s field must contain all valid email addresses.',
            min_length: 'The %s field must be at least %s characters in length.',
            max_length: 'The %s field must not exceed %s characters in length.',
            exact_length: 'The %s field must be exactly %s characters in length.',
            greater_than: 'The %s field must contain a number greater than %s.',
            less_than: 'The %s field must contain a number less than %s.',
            alpha: 'The %s field must only contain alphabetical characters.',
            alpha_numeric: 'The %s field must only contain alpha-numeric characters.',
            alpha_dash: 'The %s field must only contain alpha-numeric characters, underscores, and dashes.',
            numeric: 'The %s field must contain only numbers.',
            integer: 'The %s field must contain an integer.',
            decimal: 'The %s field must contain a decimal number.',
            is_natural: 'The %s field must contain only positive numbers.',
            is_natural_no_zero: 'The %s field must contain a number greater than zero.',
            valid_ip: 'The %s field must contain a valid IP.',
            valid_base64: 'The %s field must contain a base64 string.',
            valid_credit_card: 'The %s field must contain a valid credit card number.',
            is_file_type: 'The %s field must contain only %s files.',
            valid_url: 'The %s field must contain a valid URL.'
        },

        callback: function(errors){

        }
    };

    var ruleRegex = /^(.+?)\[(.+)\]$/,
        numericRegex = /^[0-9]+$/,
        integerRegex = /^\-?[0-9]+$/,
        decimalRegex = /^\-?[0-9]*\.?[0-9]+$/,
        emailRegex = /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/,
        alphaRegex = /^[a-z]+$/i,
        alphaNumericRegex = /^[a-z0-9]+$/i,
        alphaDashRegex = /^[a-z0-9_\-]+$/i,
        naturalRegex = /^[0-9]+$/i,
        naturalNoZeroRegex = /^[1-9][0-9]*$/i,
        ipRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
        base64Regex = /[^a-zA-Z0-9\/\+=]/i,
        numericDashRegex = /^[\d\-\s]+$/,
        urlRegex = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

    /*
    * The exposed public object to validate a form:
    *
    * @param formNameOrNode - String - The name attribute of the form (i.e. <form name="myForm"></form>) or node of the form element
    * @param fields - Array - [{
    *     name: The name of the element (i.e. <input name="myField" />)
    *     display: 'Field Name'
    *     rules: required|matches[password_confirm]
    * }]
    * @param callback - Function - The callback after validation has been performed.
    *     @argument errors - An array of validation errors
    *     @argument event - The javascript event
    */

    var LogicValidator = function(formNameOrNode, fields, callback) {
        this.callback = callback || defaults.callback;
        this.errors = [];
        this.fields = {};
        this.form = this._formByNameOrNode(formNameOrNode) || {};
        this.messages = {};
        this.handlers = {};

        for (var i = 0, fieldLength = fields.length; i < fieldLength; i++) {
            var field = fields[i];

            if ((!field.name && !field.names) || !field.rules) {
                continue;
            }

            if (field.names) {
                for (var j = 0; j < field.names.length; j++) {
                    this._addField(field, field.names[j]);
                }
            } else {
                this._addField(field, field.name);
            }
        }

        var _onsubmit = this.form.onsubmit;

        this.form.onsubmit = (function(that) {
            return function(evt) {
                try {
                    return that._validateForm(evt) && (_onsubmit === undefined || _onsubmit());
                } catch (e) {}
            };
        })(this);
    },

    attributeValue = function(element, attributeName) {
        var i;

        if ((element.length > 0) && (element[0].type === 'radio' || element[0].type === 'checkbox')) {
            for (i = 0, elementLength = element.length; i < elementLength; i++) {
                if(element[i].checked) {
                    return element[i][attributeName];
                }
            }

            return;
        }

        return element[attributeName];
    };

    LogicValidator.prototype.setMessage = function(rule, message) {
        this.messages[rule] = message;

        // return this for chaining
        return this;
    };

    LogicValidator.prototype.registerCallback = function(name, handler) {
        if(name && typeof name === 'string' && handler && typeof handler === 'function') {
            this.handlers[name] = handler;
        }

        //return this for chaining
        return this;
    };

    LogicValidator.prototype._formByNameOrNode = function(formNameOrNode) {
        return (typeof formNameOrNode === 'object') ? formNameOrNode : document.forms[formNameOrNode];
    };

    LogicValidator.prototype._addField = function(field, nameValue) {
        this.fields[nameValue] = {
            name: nameValue,
            display: field.display || nameValue,
            rules: field.rules,
            id: null,
            type: null,
            value: null,
            checked: null
        };
    };

    LogicValidator.prototype._validateForm = function(evt) {
        this.errors = [];

        for (var key in this.fields) {
            if (this.fields.hasOwnProperty(key)) {
                var field = this.fields[key] || {},
                    element = this.form[field.name];

                if (element && element !== undefined) {
                    field.id = attributeValue(element, 'id');
                    field.type = (element.length > 0) ? element[0].type : element.type;
                    field.value = attributeValue(element, 'value');
                    field.checked = attributeValue(element, 'checked');

                    /*
                     * Run through the rules for each field.
                     */

                    this._validateField(field);
                }
            }
        }

        if (typeof this.callback === 'function') {
            this.callback(this.errors, evt);
        }

        if (this.errors.length > 0) {
            if (evt && evt.preventDefault) {
                evt.preventDefault();
            } else if (event) {
                // IE uses the global event variable
                event.returnValue = false;
            }
        }

        return true;
    };

    LogicValidator.prototype._validateField = function(field) {
        var rules = field.rules.split('|'),
            indexOfRequired = field.rules.indexOf('required'),
            isEmpty = (!field.value || field.value === '' || field.value === undefined);

        /*
         * Run through the rules and execute the validation methods as needed
         */

        for (var i = 0, ruleLength = rules.length; i < ruleLength; i++) {
            var method = rules[i],
                param = null,
                failed = false,
                parts = ruleRegex.exec(method);

            /*
             * If this field is not required and the value is empty, continue on to the next rule unless it's a callback.
             * This ensures that a callback will always be called but other rules will be skipped.
             */

            if (indexOfRequired === -1 && method.indexOf('!callback_') === -1 && isEmpty) {
                continue;
            }

            /*
             * If the rule has a parameter (i.e. matches[param]) split it out
             */

            if (parts) {
                method = parts[1];
                param = parts[2];
            }

            if (method.charAt(0) === '!') {
                method = method.substring(1, method.length);
            }

            /*
             * If the hook is defined, run it to find any validation errors
             */

            if (typeof this._hooks[method] === 'function') {
                if (!this._hooks[method].apply(this, [field, param])) {
                    failed = true;
                }
            } else if (method.substring(0, 9) === 'callback_') {
                // Custom method. Execute the handler if it was registered
                method = method.substring(9, method.length);

                if (typeof this.handlers[method] === 'function') {
                    if (this.handlers[method].apply(this, [field.value, param]) === false) {
                        failed = true;
                    }
                }
            }

            /*
             * If the hook failed, add a message to the errors array
             */

            if (failed) {
                // Make sure we have a message for this rule
                var source = this.messages[method] || defaults.messages[method],
                    message = 'An error has occurred with the ' + field.display + ' field.';

                if (source) {
                    message = source.replace('%s', field.display);

                    if (param) {
                        message = message.replace('%s', (this.fields[param]) ? this.fields[param].display : param);
                    }
                }

                this.errors.push({
                    id: field.id,
                    name: field.name,
                    message: message,
                    rule: method
                });

                // Break out so as to not spam with validation errors (i.e. required and valid_email)
                break;
            }
        }
    };

    LogicValidator.prototype._hooks = {
        required: function(field) {
            var value = field.value;

            if ((field.type === 'checkbox') || (field.type === 'radio')) {
                return (field.checked === true);
            }

            return (value !== null && value !== '');
        },

        "default": function(field, defaultName){
            return field.value !== defaultName;
        },

        matches: function(field, matchName) {
            var el = this.form[matchName];

            if (el) {
                return field.value === el.value;
            }

            return false;
        },

        valid_email: function(field) {
            return emailRegex.test(field.value);
        },

        valid_emails: function(field) {
            var result = field.value.split(",");

            for (var i = 0, resultLength = result.length; i < resultLength; i++) {
                if (!emailRegex.test(result[i])) {
                    return false;
                }
            }

            return true;
        },

        min_length: function(field, length) {
            if (!numericRegex.test(length)) {
                return false;
            }

            return (field.value.length >= parseInt(length, 10));
        },

        max_length: function(field, length) {
            if (!numericRegex.test(length)) {
                return false;
            }

            return (field.value.length <= parseInt(length, 10));
        },

        exact_length: function(field, length) {
            if (!numericRegex.test(length)) {
                return false;
            }

            return (field.value.length === parseInt(length, 10));
        },

        greater_than: function(field, param) {
            if (!decimalRegex.test(field.value)) {
                return false;
            }

            return (parseFloat(field.value) > parseFloat(param));
        },

        less_than: function(field, param) {
            if (!decimalRegex.test(field.value)) {
                return false;
            }

            return (parseFloat(field.value) < parseFloat(param));
        },

        alpha: function(field) {
            return (alphaRegex.test(field.value));
        },

        alpha_numeric: function(field) {
            return (alphaNumericRegex.test(field.value));
        },

        alpha_dash: function(field) {
            return (alphaDashRegex.test(field.value));
        },

        numeric: function(field) {
            return (numericRegex.test(field.value));
        },

        integer: function(field) {
            return (integerRegex.test(field.value));
        },

        decimal: function(field) {
            return (decimalRegex.test(field.value));
        },

        is_natural: function(field) {
            return (naturalRegex.test(field.value));
        },

        is_natural_no_zero: function(field) {
            return (naturalNoZeroRegex.test(field.value));
        },

        valid_ip: function(field) {
            return (ipRegex.test(field.value));
        },

        valid_base64: function(field) {
            return (base64Regex.test(field.value));
        },

        valid_url: function(field) {
            return (urlRegex.test(field.value));
        },

        valid_credit_card: function(field){
            // Luhn Check Code from https://gist.github.com/4075533
            // accept only digits, dashes or spaces
            if (!numericDashRegex.test(field.value)) return false;

            // The Luhn Algorithm. It's so pretty.
            var nCheck = 0, nDigit = 0, bEven = false;
            var strippedField = field.value.replace(/\D/g, "");

            for (var n = strippedField.length - 1; n >= 0; n--) {
                var cDigit = strippedField.charAt(n);
                nDigit = parseInt(cDigit, 10);
                if (bEven) {
                    if ((nDigit *= 2) > 9) nDigit -= 9;
                }

                nCheck += nDigit;
                bEven = !bEven;
            }

            return (nCheck % 10) === 0;
        },

        is_file_type: function(field,type) {
            if (field.type !== 'file') {
                return true;
            }

            var ext = field.value.substr((field.value.lastIndexOf('.') + 1)),
                typeArray = type.split(','),
                inArray = false,
                i = 0,
                len = typeArray.length;

            for (i; i < len; i++) {
                if (ext == typeArray[i]) inArray = true;
            }

            return inArray;
        }
    };

    /*

    $.fn.logic = function ( option, fn ) {
    var namespace = { namespace: $( this ).data( 'logicNamespace' ) ? $( this ).data( 'logicNamespace' ) : ( 'undefined' !== typeof option && 'undefined' !== typeof option.namespace ? option.namespace : $.fn.logic.defaults.namespace ) }
      , options = $.extend( true, {}, $.fn.logic.defaults, 'undefined' !== typeof window.LogicConfig ? window.LogicConfig : {}, option, this.domApi( namespace.namespace ) )
      , newInstance = null
      , args = Array.prototype.slice.call(arguments, 1);

    function bind ( self, type ) {
      var logicInstance = $( self ).data( type );

      if ( !logicInstance ) {
        switch ( type ) {
          case 'logicForm':
            logicInstance = new LogicForm( self, options, 'logicForm' );
            break;
          case 'logicField':
            logicInstance = new LogicField( self, options, 'logicField' );
            break;
          case 'logicFieldMultiple':
            logicInstance = new LogicFieldMultiple( self, options, 'logicFieldMultiple' );
            break;
          default:
            return;
        }

        $( self ).data( type, logicInstance );
      }

      if ( 'string' === typeof option && 'function' === typeof logicInstance[ option ] ) {
        var response = logicInstance[ option ].apply( logicInstance, args );

        return 'undefined' !== typeof response ? response : $( self );
      }

      return logicInstance;
    }

    if ( $( this ).is( 'form' ) || 'undefined' !== typeof $( this ).domApi( namespace.namespace )[ 'bind' ] ) {
      newInstance = bind ( $( this ), 'logicForm' );

    } else if ( $( this ).is( options.inputs ) ) {
      newInstance = bind( $( this ), !$( this ).is( 'input[type=radio], input[type=checkbox]' ) ? 'logicField' : 'logicFieldMultiple' );
    }

    return 'function' === typeof fn ? fn() : newInstance;
  };

  $( window ).on( 'load', function () {
    $( '[logic-validate], [data-logic-validate]' ).each( function () {
      $( this ).logic();
    } );
  } );

  $.fn.domApi = function ( namespace ) {
    var attribute,
      obj = {}
      , regex = new RegExp("^" + namespace, 'i');

    if ( 'undefined' === typeof this[ 0 ] ) {
      return {};
    }

    for ( var i in this[ 0 ].attributes ) {
      attribute = this[ 0 ].attributes[ i ];

      if ( 'undefined' !== typeof attribute && null !== attribute && attribute.specified && regex.test( attribute.name ) ) {
        obj[ camelize( attribute.name.replace( namespace, '' ) ) ] = deserializeValue( attribute.value );
      }
    }

    return obj;
  };

  // Zepto deserializeValue function
  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // JSON    => parse if valid
  // String  => self
  var deserializeValue = function( value ) {
    var num
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          !isNaN( num = Number( value ) ) ? num :
          /^[\[\{]/.test( value ) ? $.parseJSON( value ) :
          value )
        : value;
    } catch ( e ) {
      return value;
    }
  };

  // Zepto camelize function
  var camelize = function ( str ) {
    return str.replace( /-+(.)?/g, function ( match, chr ) {
      return chr ? chr.toUpperCase() : '';
    } )
  };

  // Zepto dasherize function
  var dasherize = function ( str ) {
    return str.replace( /::/g, '/' )
           .replace( /([A-Z]+)([A-Z][a-z])/g, '$1_$2' )
           .replace( /([a-z\d])([A-Z])/g, '$1_$2' )
           .replace( /_/g, '-' )
           .toLowerCase()
  };

  $.fn.logic.defaults = {
    namespace: 'logic-'                       
    , inputs: 'input, textarea, select'       
    , excluded: 'input[type=hidden], input[type=file], :disabled' 
    , priorityEnabled: true                     
    , trigger: false                            
    , animate: true                             
    , animateDuration: 300                      
    , scrollDuration: 500                       
    , focus: 'first'                          
    , validationMinlength: 3                    
    , successClass: 'logic-success'         
    , errorClass: 'logic-error'               
    , errorMessage: false                       
    , validators: {}                            
    , showErrors: true                          
    , useHtml5Constraints: true                 
    , messages: {}                             

    , validateIfUnchanged: false                                          
    , errors: {
        classHandler: function ( elem, isRadioOrCheckbox ) {}             
      , container: function ( elem, isRadioOrCheckbox ) {}             
      , errorsWrapper: '<ul></ul>'                                        
      , errorElem: '<li></li>'                                            
      }
    , listeners: {
        onFieldValidate: function ( elem, LogicField ) { return false; } 
      , onFormValidate: function ( isFormValid, event, LogicForm ) {}     
      , onFieldError: function ( elem, constraints, LogicField ) {}    
      , onFieldSuccess: function ( elem, constraints, LogicField ) {} 
    }
  }; */

  window.LogicValidator = LogicValidator;

//Support jQuery and Zepto
})( window.jQuery || window.Zepto, window, document );