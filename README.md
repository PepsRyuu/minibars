# Minibars 🍸

Small dependency-free templating engine using Mustache syntax.

## Why does this exist?

* I prefer separating the HTML to a separate file and want a templating engine which encourages that. Separation of concerns is more maintainable.
* I don't like solutions like Underscore templating where the JavaScript with all of the brackets are mixed in with the HTML, I prefer using simple conditionals with a cleaner syntax.
* Conditionals mixed in with the HTML as attributes can be confusing and easy to miss.
* Engines like Handlebars are too restrictive not letting any inline JavaScript or simple equality conditionals. You normally have to write a helper function which is more code.
* Typical templating engines usually require a runtime in production. I prefer something that compiled to dependency free JavaScript to maximise performance and portability.

## What does this do?

The compiler generates a JavaScript function which returns a string. The compiler will scan for braces and replace them with a JavaScript equivalent inline in the building of the string. Output is also escaped to prevent XSS vulnerabilities.

## Usage

```javascript
var template = '<div>{{message}}</div>';
var compiled = Minibars.compile(template);
var result = compiled({
    message: 'Hello World!'
});

// Output: <div>Hello World</div>
```

The Minibars compile function accepts a template string and returns a function which can be executed with data to generate a new string with the braces evaluated.

## What's Supported?

### Expressions

```handlebars
<div>{{message}}</div>
<div>{{message.indexOf('hello') > -1}}</div>
<div>{{new Date()}}</div>
```

Content between the braces are interpreted and evaluated as JavaScript and the result is added to the generated template.

### \#if

```handlebars
<div>
    {{#if message}}
        <p>{{message}}</p>
    {{/if}}
</div>
```

```handlebars
<div>
    {{#if message.length > 5}}
        <p>{{message}}</p>
    {{/if}}
</div>
```

```handlebars
<div>
    {{#if message}}
        <p>truthy path</p>
    {{else}}
        <p>falsey path</p>
    {{/if}}
</div>
```

The if statement allows for branching paths in a template. If the expression evaluates to true, then the conditional branch will be generated. If the expression evaluates to false, then the else branch is generated if it is defined. If there is no else branch, then nothing is generated.


### \#each

```handlebars
<div>
    {{#each item in items}}
        {{@index}} : {{item}}
    {{/each}}
</div>
```

The each statement allows you to iterate over arrays and objects. A special variable @index is available to access the array index or the object key that's currently being iterated over.