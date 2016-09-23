(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.Minibars = factory();
    }
}(this, function () {

    var interfaces = ['Array', 'Date', 'Intl', 'JSON', 'Math', 'NaN', 'Number', 
                      'Object', 'URL', 'document', 'window', 'history', 'innerHeight', 
                      'innerWidth', 'localStorage', 'location', 'sessionStorage', 
                      'unescape', 'encodeURI', 'encodeURIComponent', 'decodeURI', 
                      'decodeURIComponent', 'escape', 'process', 'global'];

    var reserved = ['in', 'if', 'else', 'each',  
                    'for', 'false', 'true', 'function', 'instanceof',
                    'null', 'undefined', 'let', 'new', 'this', 'var', 'while'];

    function compile(content) {
        // Boilerplate code to prevent XSS vulnerabilities
        var escape = [
            'var _e = /[&<>"\'`=]/g;',
            'var _m = {',
            '\'&\': \'&amp;\',',
            '\'<\': \'&lt;\',',
            '\'>\': \'&gt;\',',
            '\'\"\': \'&quot;\',',
            '\'\\\'\': \'&#x27;\',',
            '\'`\': \'&#x60;\',',
            '\'=\': \'&#x3D;\'',
            '};',
            'var escape = function(input) {',
            'return (\'\' + input).replace(_e, function(match) {',
            'return _m[match];',
            '});',
            '};'
        ].join('');

        var output = escape;

        // Makes it easier to perform regex checks by removing the line-breaks.
        // In regards to the double quotes, this global escape will break any JavaScript expression
        // which uses double quotes, which is why the JS expressions are unescaped before outputting.
        content = content.replace(/\n/g, '').replace(/\r/g, '').replace(/"/g, '\\"');

        // Custom global detection
        var globals = [];
        content = content.replace(/{{@globals (.*?)}}/, function (match, group) {
            group.split(/,/g).forEach(function (name) {
                name = name.trim();
                globals.push(name);
            });
            return '';
        }).trim();

        var detectedVariables = {};

        var matches = content.match(/{{(.*?)}}/g);
        matches.forEach(function (match) {
            var parts = match.match(/([.#'@"a-zA-Z_][a-zA-Z0-9_]+)/g);
            parts.forEach(function(part) {
                // We purposely include some symbols so that we can pick
                // up and recognise which are methods and strings. We also check to see if 
                // it's not present in window to prevent overriding usage
                // of classes like Date accidentally. The only limitation to this is that you
                // cannot have a variable with the same name as a global in the passed options.        
                var valid = (part.indexOf('.') === -1) &&
                            (part.indexOf('\'') === -1) &&
                            (part.indexOf('\"') === -1) &&
                            (part.indexOf('#') === -1) &&
                            (part.indexOf('@') === -1) &&
                            (globals.indexOf(part) === -1) &&
                            (reserved.indexOf(part) === -1) &&
                            (interfaces.indexOf(part) === -1);

                if (valid) {
                    detectedVariables[part] = true;
                }
            });
        });

        for (var variable in detectedVariables) {
            output += 'var ' + variable + ' = options.' + variable + ';';
        }

        output += 'return "';

        content = content.replace(/{{#if (.*?)}}/g, function (match, cond) {
            return '" + ((function () { if (' + cond.replace(/\\"/g, '"') + '){ return "';
        });

        content = content.replace(/{{else}}/g, function () {
            return '"} else { return "';
        });

        content = content.replace(/{{\/if}}/g, function (match) {
            return '"}})() || \'\') + "';
        });

        content = content.replace(/{{#each (.*?) in (.*?)}}/g, function (match, key, cond) {
            return '" + (Object.keys(' + cond + ').map(function (' + key + ') { var _index = ' + key + '; ' + key + ' = ' + cond + '[' + key + ']; return "';
        });

        content = content.replace(/{{\/each}}/g, function (match) {
            return '"}).join("")) + "';
        });

        content = content.replace(/@index/g, function (match, inner) {
            return '_index';
        });

        content = content.replace(/{{(.*?)}}/g, function (match, inner) {
            return '" + escape(' + inner.replace(/\\"/g, '"') + ') + "';
        });  

        output += content + '"';

        return new Function('options', output);
    }

    return {
        compile: compile
    };
}));