var expect = chai.expect;

mocha.setup('bdd');

describe('Minibars', function() {
    
    describe('Variable Detection', function () {
        it ('should support standard variables', function () {
            var template = [
                '<div>',
                '   <p>{{message1}}</p>',
                '   <p>{{message2}}</p>',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                message1: 'Hello',
                message2: 'World'
            });
            expect(result).to.equal([
                '<div>',
                '   <p>Hello</p>',
                '   <p>World</p>',
                '</div>'
            ].join(''))
        });

        it ('should support JavaScript expressions', function () {
            var template = '<div>{{message.indexOf(\'Hello\') > -1}}</div>';
            var compiled = Minibars.compile(template);

            var result = compiled({
                message: 'Hello World'
            });
            expect(result).to.equal('<div>true</div>');

            result = compiled({
                message: 'Lol'
            });
            expect(result).to.equal('<div>false</div>');
        });

        it ('should support multi-variable JavaScript expressions', function () {
            var template = '<div>{{message1 === message2}}</div>';
            var compiled = Minibars.compile(template);
            var result = compiled({
                message1: 'abc',
                message2: 'abc'
            });
            expect(result).to.equal('<div>true</div>');
        });

        it ('should support using global interfaces in JavaScript expressions', function () {
            var template = '<div>{{new Date().toLocaleDateString()}}</div>';
            var compiled = Minibars.compile(template);
            var result = compiled();
            expect(result).to.equal('<div>' + new Date().toLocaleDateString() + '</div>');

            var template = '<div>{{Array.isArray(items)}}</div>';
            var compiled = Minibars.compile(template);
            var result = compiled({items: []});
            expect(result).to.equal('<div>true</div>');
        });

        it ('should recognise JavaScript keywords', function () {
            var template = '<div>{{message instanceof Array}}</div>';
            var compiled = Minibars.compile(template);
            var result = compiled({
                message: []
            });
            expect(result).to.equal('<div>true</div>');
        });

        it ('should allow dynamic global variable declarations', function () {
            window.myglobalvariable = 'hello';
            window.anotherglobal = 'world';

            var template = [
                '{{@globals myglobalvariable, anotherglobal}}',
                '',
                '<div>',
                '   <p>{{myglobalvariable}}-{{anotherglobal}}</p>',
                '</div>'
            ].join('\n');

            var compiled = Minibars.compile(template);
            var result = compiled();
            expect(result.replace(/ /g, '')).to.equal('<div><p>hello-world</p></div>');
            delete window.myglobalvariable;
            delete window.anotherglobal;
        });
    });

    describe('#if statement', function () {
        it ('should support simple truthy if statements', function () {
            var template = [
                '<div>',
                '   {{#if message}}',
                '   <p>truthy</p>',
                '   {{/if}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                message: 'hello'
            });
            expect(result.replace(/ /g, '')).to.equal('<div><p>truthy</p></div>');
        });

        it ('should support complex if statements', function () {
            var template = [
                '<div>',
                '   {{#if message1 === message2}}',
                '   <p>truthy</p>',
                '   {{/if}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                message1: 'hello',
                message2: 'hello'
            });
            expect(result.replace(/ /g, '')).to.equal('<div><p>truthy</p></div>');

            result = Minibars.compile(template)({
                message1: 'hello',
                message2: 'hello1'
            });
            expect(result.replace(/ /g, '')).to.equal('<div></div>');
        });

        it ('should support else branch for if statements', function () {
            var template = [
                '<div>',
                '   {{#if message1 === message2}}',
                '   <p>truthy</p>',
                '   {{else}}',
                '   <p>falsey</p>',
                '   {{/if}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                message1: 'hello',
                message2: 'hello'
            });
            expect(result.replace(/ /g, '')).to.equal('<div><p>truthy</p></div>');

            result = Minibars.compile(template)({
                message1: 'hello',
                message2: 'hello1'
            });
            expect(result.replace(/ /g, '')).to.equal('<div><p>falsey</p></div>');
        });

        it ('should support nested if statements', function () {
            var template = [
                '<div>',
                '   {{#if message1}}',
                '       <p>truthy message1</p>',
                '       {{#if message2.indexOf(\'lol\') > -1}}',
                '           <p>truthy message2</p>',
                '       {{else}}',
                '           <p>falsey message2</p>',
                '       {{/if}}',
                '   {{/if}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                message1: 'hello',
                message2: 'hello'
            });
            expect(result.replace(/ /g, '')).to.equal('<div><p>truthymessage1</p><p>falseymessage2</p></div>');
        });

    });

    describe ('#each statement', function () {
        it ('should be able to iterate over arrays of values', function () {
            var template = [
                '<div>',
                '   {{#each item in items}}',
                '   <p>{{item}}</p>',
                '   {{/each}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                items: [1, 2, 3]
            });

            expect(result.replace(/ /g, '')).to.equal('<div><p>1</p><p>2</p><p>3</p></div>');
        });

        it ('should be able to iterate over arrays of objects and access properties on those objects', function () {
            var template = [
                '<div>',
                '   {{#each item in items}}',
                '   <p>{{item.name}}</p>',
                '   {{/each}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                items: [{name: 1}, {name: 2}, {name: 3}]
            });

            expect(result.replace(/ /g, '')).to.equal('<div><p>1</p><p>2</p><p>3</p></div>');
        });

        it ('should be able to get the index of the array', function () {
            var template = [
                '<div>',
                '   {{#each item in items}}',
                '   <p>{{@index}}</p>',
                '   {{/each}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                items: ['lol', 'lol', 'lol']
            });

            expect(result.replace(/ /g, '')).to.equal('<div><p>0</p><p>1</p><p>2</p></div>');
        });

        it ('should be able to iterate over objects and access both the key and value', function () {
            var template = [
                '<div>',
                '   {{#each item in items}}',
                '   <p>{{@index}}:{{item.name}}</p>',
                '   {{/each}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                items: {
                    lol1: {name: 'p1'},
                    lol2: {name: 'p2'},
                    lol3: {name: 'p3'},
                }
            });

            expect(result.replace(/ /g, '')).to.equal('<div><p>lol1:p1</p><p>lol2:p2</p><p>lol3:p3</p></div>');
        });

        it ('should support nested each statements', function () {
            var template = [
                '<div>',
                '   {{#each item in items}}',
                '       <p>{{@index}}</p>',
                '       {{#each prop in item}}',
                '           <p>{{@index}}:{{prop}}</p>',
                '       {{/each}}',
                '       <p>end</p>',
                '   {{/each}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                items: {
                    lol1: {name: 'p1'},
                    lol2: {name: 'p2'}
                }
            });
            expect(result.replace(/ /g, '')).to.equal('<div><p>lol1</p><p>name:p1</p><p>end</p><p>lol2</p><p>name:p2</p><p>end</p></div>');
        });
    });

    describe('Escaping', function () {
        it ('special characters that can create XSS vulnerabilities should be escaped', function () {
            var template = '<div>{{message}}</div>';
            var compiled = Minibars.compile(template);
            expect(compiled({message: '<script>alert</script>'})).to.equal('<div>&lt;script&gt;alert&lt;/script&gt;</div>');
        });
    })

    describe('Scenarios', function () {
        it ('Scenario 1 - Each with if statement inside', function () {
            var template = [
                '<div>',
                '   {{#each item in items}}',
                '       {{#if item === true}}',
                '       <p>truthy</p>',
                '       {{else}}',
                '       <p>falsey</p>',
                '       {{/if}}',
                '   {{/each}}',
                '</div>'
            ].join('');

            var result = Minibars.compile(template)({
                items: [true, true, false]
            });

            expect(result.replace(/ /g, '')).to.equal('<div><p>truthy</p><p>truthy</p><p>falsey</p></div>');
        });


        it ('Scenario 2 - Elements with attributes', function () {
            var template = '<div class="lol">{{message}}</div>';
            var compiled = Minibars.compile(template);
            var result = compiled({message: 'hello'});
            expect(result).to.equal('<div class="lol">hello</div>');
        });

        it ('Scenario 3 - Quotes in braces should not be escaped', function () {
            var template = '<div class="lol">{{message.indexOf("hello") > -1}}</div>';
            var compiled = Minibars.compile(template);
            var result = compiled({message: 'hello world'});
            expect(result).to.equal('<div class="lol">true</div>');
        });

        it ('Scenario 4 - Quotes in the text content of a tag', function () {
            var template = '<div class="lol">"{{message}}"</div>';
            var compiled = Minibars.compile(template);
            var result = compiled({message: 'hello'});
            expect(result).to.equal('<div class="lol">"hello"</div>');
        });

        it ('Scenario 5 - Double quotes all over the place!', function () {
            var template = [
                '<div class="lol">',
                '   {{#if message.indexOf("\\"hello\\"") > -1}}',
                '       <p>"{{message}}"</p>',
                '   {{/if}}',
                '</div>'
            ].join('\n');

            var compiled = Minibars.compile(template);
            var result = compiled({message: "\"hello\""});
            expect(result.replace(/ /g, '')).to.equal('<divclass="lol"><p>"&quot;hello&quot;"</p></div>');
        })
    });

    
});

