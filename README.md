## About
Vue-model is a Javascript plugin for Vue.js that gives you the ability to transform your plain data into rich models with built-in and customizable HTTP actions, computed properties, and methods.

This project started because I work in Vue relatively often and really wanted to be able to call `customer.save()`, have it `POST` the data to the server, show the user feedback that the action was in progress, and then apply the server's results to the model.

So that's what this plugin does.

## TOC
- [Installation](#installation)
- [Quick Examples](#quick-examples)
    - [Create a Model](#create-a-model)
    - [Update a Model](#update-a-model)
    - [Fetch or Delete a Model](#fetch-or-delete-a-model)
- [Defining Models](#defining-models)
    - [Definition Options](#definition-options)
        - [Attributes](#attributes)
        - [Methods & Computed](#methods--computed)
        - [HTTP](#http)
            - [Action Definitions](#action-definitions)
            - [Data](#data)
- [Registering Models](#registering-models)
- [Creating Models](#creating-models)
    - [Manually](#manually)
        - [A Single Model](#a-single-model)
        - [Multiple Models](#multiple-models)
    - [Automatically](#automatically)
- [Performing HTTP Actions](#performing-http-actions)
    - [Route Interpolation](#route-interpolation)
    - [Applying Response Data (or Not)](#applying-response-data-or-not)
- [Busy Indicators](#busy-indicators)
    - [Global](#global)
    - [Action-Specific](#action-specific)
- [Events](#events)
    - [Naming](#naming)
    - [Data](#data-1)
    - [Listeners](#listeners)
        - [Automatically Adding Listeners](#automatically-adding-listeners)
        - [Manually Adding Listeners](#manually-adding-listeners)

## Installation
 
```
> npm install --save vue-model
```
 
```javascript
Vue.use(require('vue-model'));
```

## Quick Examples

Here are a few very basic examples to show you a little bit of what you can do with vue-model.

### Create a Model

`POST` the model to the backend and show a spinner while it's happening.

```html
<button @click.prevent='customer.http.store()'>
    <template v-if='customer.http.createInProgress'>
        <i class='fa fa-spinner fa-spin'></i>
        Creating...
    </template>
    <template v-if='!customer.http.createInProgress'>
        Create Customer
    </template>
</button>
```

### Update a Model

The same as creating, but instead it issues a `PUT`.

```html
<button @click.prevent='customer.http.update()'>
    <template v-if='customer.http.updateInProgress'>
        <i class='fa fa-spinner fa-spin'></i>
        Saving...
    </template>
    <template v-if='!customer.http.updateInProgress'>
        Save Customer
    </template>
</button>
```

### Fetch or Delete a Model

Some of the other default actions you can execute, right out of the box.

```html
<div v-for='customer in customers'>
    {{ customer.name }}
    (<a href='#' @click.prevent='customer.http.fetch()'>Refresh</a>)
    (<a href='#' @click.prevent='customer.http.destroy()'>Delete</a>)
</div>
```

## Defining Models

Defining your models is as simple as providing a plain JSON object, but it's often better to keep them in dedicated files.

Here's an example of a `customer` model that defines a few of the model's attributes, some `http` options, methods, and computed properties.

```javascript
var Customer = module.exports = {
    attributes: [
        'id',
        'name',
        'email',
    ],

    http: {
        baseRoute: '/api/customers/',
        actions: {
            // Don't expose the destroy action
            destroy: false
        }
    },

    methods: {
        sayHello() {
            alert('Hello ' + this.name);
        }
    },

    computed: {
        is_aaron: function () {
            return this.email === 'aarondfrancis@gmail.com'
        }
    }
}
```

Once you create a model (which we'll talk about in a bit), you now have a super powerful object you can play with in your views.

Here's a simple form that allows a user to update their name and persist it to the backend. (Bonus: it also shows a loading indicator!)

```html
Change your name:
<input v-model='customer.name'>

<button @click='customer.http.update()'>
    <template v-if='customer.http.updateInProgress'>
        <i class='fa fa-spinner fa-spin'></i>
        Saving...
    </template>
    <template v-if='!customer.http.updateInProgress'>
        Save
    </template>
</button>
```

And here's the same form, with feedback for errors:

```html
Change your name:
<input v-model='customer.name' :class="{'error': customer.http.errors.has('name') }">

<div v-if='customer.http.errors.any()'>
    Uh oh!
    <ul>
        <li v-for='error in customer.http.errors.flat()'>
            {{ error.field }}: {{ error.message }}
        </li>
    </ul>
</div>

<button @click='customer.http.update()'>
    <template v-if='customer.http.updateInProgress'>
        <i class='fa fa-spinner fa-spin'></i>
        Saving...
    </template>
    <template v-if='!customer.http.updateInProgress'>
        Save
    </template>
</button>
```

The crazy thing about this it's all done right there with our model: putting the data, showing loading indicators, receiving the response, and mapping the validation errors!

### Definition Options

Your model definitions are merged with the values in `Defaults.js` to create a fully fleshed out model. Let's take a look at some of the options you can define.

#### Attributes
The top level `attributes` key defines your model's... attributes. When a model is created, we'll default all these keys to `null` so that Vue tracks them. Just like plain objects in Vue, if you set a previously undefined key on an object, Vue may not track it and you'll run into unexpected (and frustrating) results.

The `attributes` array also forms the basis for what data is sent to the server for HTTP requests. You can of course modify what data is sent, but the starting point is the keys in the `attributes` array.

#### Methods & Computed
This will be familiar to you if you're familiar with Vue. They work the same way.

#### HTTP
Now we're getting to the really good stuff. The top level `http` key holds all of our configuration for making requests. Let's look at some of the keys in the `http` object.

`baseRoute`: This may be something like `/customers/`, or `/api/customers/`, resulting in final urls like `/customers/{id}`

`eventPrefix`: The namespace for events sent from this model. If you don't define a value for this, then it is automatically set to the `name` that you register your model with. (See the Events section for more on this.)

`takeAtLeast`: If you want your actions to take at _least_ a certain amount of time, you can set this value to something greater than 0. Sometimes if an action takes < 100ms, it can seem like it didn't work. I learned this from watching an Adam Wathan live-stream, and then later saw it on [his twitter](https://twitter.com/adamwathan/status/885130802513752065). By default it's set to 0ms.

`axios`: a function that lets you customize the axios request configuration option, if you want.

`getDataFromResponse`: this is the function that takes the axios response from the server and turns it into a key-value map of data. This just depends on how your backend returns the data. You may return it in a nested `data` key, or you may return it with no nesting at all.

`getErrorsFromResponse`: same idea as `getDataFromResponse`, but for validation errors. This function takes the `response` and returns a map where keys are field names, and values are **arrays** of errors. By default this is set up for Laravel 5.5 by returning `response.data.errors`.

`isValidationError`: there are lots of things that can go wrong with a request, but we only want to try to map validation errors when the thing that went wrong was validation. This function receives an error and returns a bool if it was a validation error. By default, this is set up to return `true` if the response code is `422`, which is what Laravel sends when validation fails.

`errorKey`: by default, we nest the errors on the `http` key, making access from your model look something like `customer.http.errors.{method}`. If you don't like that, you can change it! You can set this value to e.g. `errors`, and it will live at the top of your model, making access a little easier: `customer.errors.{method}`. (Make sure your model doesn't have an `errors` attribute, method, or computed property though!)

##### Action Definitions

`actionDefaults` the defaults that are applied to every action:

```javascript
{
    // Apply the response data to the model
    apply: false,

    // The server validates this request and could
    // return a validation error in response
    validation: true,

    // Modify what data we should send to the server
    data: {
        // only: [],
        // with: [],
        // without: [],
        // custom: function(data, definition) {
        //     return data;
        // }
    }
}
```

The actions live in the `actions` key. This defines the http actions available on your model. You can simply use the defaults, or make up your own! By default, we have `index`, `store`, `fetch`, `update`, and `destroy`.

If you wanted to make your own, you could do so like this:

```javascript
{
    actions: {
        favorite: {
            method: 'PUT',
            route: '{id}/favorite',
            apply: true,
            data: false
        },
        unfavorite: {
            method: 'DELETE',
            route: '{id}/favorite',
            apply: true,
            data: false
        }
    }
}
```

Now you have two new methods on your model, `favorite` and `unfavorite`, which you'd call by e.g.: `customer.http.favorite()`. (Why you would favorite a customer is beyond me, but you get the idea.)

Assuming your `baseRoute` is `/customers/` and its `id` is 1, the favorite action will `PUT` to `/customers/1/favorite` with no data (`data`: false), and apply whatever response comes back from the server. (The server could respond with `{favorited: true}` for example.)

If you want to disable one of the default actions, just set the value to `false`

```javascript
{
    actions: {
        destroy: false
    }
}
```

`customer.http.destroy` will be undefined now.

##### Data

By default, we'll send all the keys + values from your model's `attributes` array. This may not be ideal in many cases though, so you can modify what data gets sent for each action. (Some of these examples may be contrived, but bear with me...)

- `false` means no data will be sent at all
    ```javascript
    {
        favorite: {
            data: false
        }
    }
    ```

- `only: []` defines the **only** keys from the `attributes` you want sent.
    ```javascript
    {
        setName: {
            data: {
                only: ['name']
            }
        }
    }
    ```

- `without: []` defines which keys you want to **exclude**
    ```javascript
    {
        update: {
            data: {
                // Maybe this a separate resource?
                without: ['favorited']
            }
        }
    }
    ```

- `with: []` keys present on `this` but not in `attributes` that you want to include, perhaps a computed property or method
    ```javascript
    {
        update: {
            data: {
                with: ['computed_property', 'method']
            }
        }
    }
    ```

- `custom: function` after all of the above are computed, as the very last step we'll check for a `custom` function. The function receives the `payload` we're about send as well as the action's definition. **You must return** a payload, otherwise nothing will be sent.
    ```javascript
    {
        recent: {
            data: {
                custom: function(payload, definition) {
                    payload.lastFetched = localStorage.get('last_fetched');
                    return payload;
                }
            }
        }
    }
    ```

`only`, `with`, and `without` can be arrays, or functions that return arrays.

The arrays themselves can be full of strings, which are accessible from the model (attributes, methods, computed properties) or they can be plain objects.

For example:

```javascript
{
    favorited: {
        route: '',
        method: 'GET',
        data: {
            only: [],
            with: [{
                active: 1,
                favorited: 1
            }]
        }
    }
}
```

That action would send a `GET` to `/customers/?active=1&favorited=1`. We dropped every key via the `only:[]`, and then added some static data via `with`.

## Registering Models

Now that we know alllll about model definition, let's talk about registration. The registration process is simple using the `Vue.models.register` method, eg:

```javascript
var VueModel = require('vue-model');
Vue.use(VueModel);

Vue.models.register('customer', {
    // model definition
});

Vue.models.register('foo', {
    // model definition
});
```

The first argument is the `name` argument, the second argument is a plain object that lets you define some options that are specific to your model.

Here's an example of registering a `customer` model that has a base route of `/customers`:
```javascript
Vue.models.register('customer', {
    http: {
        baseRoute: '/customers'
    }
});
```

You can also register many at once during the plugin install:

```javascript
var VueModel = require('vue-model');
Vue.use(VueModel, {
    customer: require('./models/customer'),
    foo: require('./models/foo'),
    bar: require('./models/bar'),
});
```

In this case, they key is the `name` and the value is the model's definition object.

Now you're ready to start creating and using your models.

## Creating Models

There are two different ways to create models in vue-model: You can create them manually whenever you please, or you can have vue-model create them automatically.

### Manually

#### A Single Model
To manually create a model, use the `$model()` Vue Instance method. 
  
Within a Vue Instance: 

```javascript
this.$model(name, data, options);
```

The `$model()` method accepts 3 parameters:
- `name`: (string) The type of model. This is the same key you used to register the model
- `data`: (object) The model data
- `options`: (object) Any _instance_ specific model definitions

You can create the model wherever you please. For example, you can call the method inside the `data` function: 

```javascript
new Vue({
    el: '#app',
    
    data: function() {
        return {
            customer: this.$model('customer', {
                name: 'Aaron'
            })
        };
    }
});
```

Or you can call it anywhere else! Here's an example where we instantiate a model within Vue's `created` lifecycle hook.
```javascript
new Vue({
    el: '#app',
    
    data: {
        customer: {
            name: 'Aaron'
        }
    },
    
    created: function() {
        this.customer = this.$model('customer', this.customer);
    }
});
```
#### Multiple Models
Do you have a whole set of models that need to be created? Great! Just use the `this.$models` method. It's the same as `this.$model` except the data parameter is an array of objects.

- `name`: (string) The type of model. This is the same key you used to register the model
- `data`: (array) A collection model data
- `options`: (object) Any _instance_ specific model definitions

This will return an array of models.

> You can definitely do this yourself using a `for` loop and the `this.$model` method, `this.$models` is just a little more convenient.

### Automatically
Manually creating models gives you ultimate flexibility, but sometimes you just want it to work right away. That's where automatic model creation comes into play.
 
To automatically create models, you simply need to add a `models` array to your Vue Instance. A `models` array element can take two forms. The first form is just a string: 

```javascript
new Vue({
    el: '#app',
    
    models: ['customer'],
    
    data: {
        customer: {
            name: 'Aaron'
        }
    }
});
```

When you pass a string in, the **model type the data key must be the same**. In the example above, the model type must be `customer`, and the data key must also be `customer`.
 
If you need more flexibility in naming, you can pass in a proper object.

```javascript
new Vue({
    el: 'body',

    models: [{
        type: 'customer'
        key: 'newCustomer'
    }],

    data: {
        newCustomer: {
            name: 'Aaron'
        }
    }
});
```
 
In this example, the model type is still `customer`, but the actual data lives on the data key `newCustomer`. 
 
> Under the hood, vue-model adds a mixin that latches on to the `created` lifecycle event to create models automatically. [Read more about the Vue Instance lifecycle](https://vuejs.org/guide/instance.html#Lifecycle-Diagram)

Depending on what the data is will depend on whether one or many models are automatically created. If the data is an array, many model will be created. For example:

```javascript
new Vue({
    el: '#app',

    models: [{
        type: 'customer'
        key: 'customers'
    }],

    data: {
        customers: [{
            name: 'Aaron'
        },{
            name: 'Evan'
        }]
    }
});
```

We told vue-model to automatically create the `customer` model for the data that lives at the `customers` key. Because the data at `customers` is an array, vue-model will loop through and make each item a model.
 

## Performing HTTP Actions

Performing HTTP Actions is the heart of vue-model. The whole purpose of this plugin is to make it painless for your models to interact with your application's backend. 
 
All the actions are available on the `http` key. To perform an action, you just need to call the corresponding method.

Examples:

```javascript
// Create a new customer
customer.http.store();

// Fetch this customer from the server
customer.http.fetch();

// Save this customer
customer.http.update();

// Delete this customer
customer.http.destroy();

// Retrieve a list of customers
customer.http.index()
```

These are the 5 actions that vue-model ships with, but you are welcome to disable those and/or set up your own.

### Route Interpolation

All of your action's routes will be interpolated with your model's data. So if your model has an `id` of `10`, a route of 

```
/videos/{id}
```

becomes

```
/videos/10
```

You can do this with any attribute from your model. If your model's `type` has a value of `watched`, a route defined as 

```
/videos/{type}/increment
```

would become

```
/videos/watched/increment
```


### Applying Response Data (or Not) 

Another great thing about vue-model is that you can automatically update your models with the response that comes back from the server.

If you define your action with `apply = true`, vue-model will take the response from the server, loop through all the data and set the values.

```javascript
{
    favorite: {
        method: 'PUT',
        route: '{id}/favorite',
        apply: true,
        data: false
    }
}
```

If the server returns 

```javascript
{
    favorited: 1
}
```

as its payload from the `complete` action, then the `completed` attribute on our model will automatically be updated. 

```javascript
customer.http.favorite();
// Once it finishes...
console.log(customer.favorited);
// > 1
```

That lets us create toggle buttons very easily, all in HTML.

```html
<button v-if="customer.favorited" @click.prevent="video.$.unfavorite()">
    Favorited
</button>

<button v-if="!customer.favorited" @click.prevent="video.$.favorite()">
    Mark as Favorite
</button>
```


## Busy Indicators

You'll often want to know when the model is busy, so that you can show loading indicators or prevent other actions. Vue-model provides two types of busy indicators: Global, and Action Specific.

### Global
The global busy indicator lives in the http object under the `inProgress` key.

For example, if you have a model named `customer`, you can observe the `customer.http.inProgress` attribute. This is helpful for showing/hiding elements or disabling buttons.

Here's one way you can disable a button, should the model be busy performing an HTTP action:

```html
<button @click='customer.http.complete()' :disabled='customer.http.inProgress'>
    Mark as Favorite
</button>
```

### Action-Specific

If you have loading indicators scattered across the page and only want to show the correct indicator based on the specific action, then you should use an action-specific busy indicator.

For every action, there is a corresponding property that indicates whether or not that action is currently in process. For example, if the action is named `update`, then the property would be named `updateInProgress`. 

Consider a case where you have a `complete` action for a `video` model and would like to show a loading indicator on the button.

```html
<button @click='video.http.complete()' :disabled='video.http.completeInProgress'>
    <i v-if='video.http.completeInProgress' class='fa fa-spinner fa-spin'></i>
    Mark as Complete
</button>
```

This button will disable itself and show the lovely Font Awesome loading indicator while the model finishes the `complete` action. This provides feedback and a good experience for your users. However, in this example if a different action is being performed, say a `favorite` action, the button will not show the loading indicator because it is bound to `completeInProgress` and not `inProgress` or `favoriteInProgress`.

> When _any_ of the action-specific loading indicators (`{action}InProgress`) are `true`, the global `inProgress` indicator will also be `true`.

## Events

Vue-model emits several events that you can listen for and respond to, giving you many different ways to seamlessly tie your app into vue-model.  

### Naming

Vue-model events follow a naming scheme of `{eventPrefix}.{action}.{result}`. The `eventPrefix` can be set in your model definition.

By default, if you don't pass in an `eventPrefix` while registering your model, vue-model will set it to the `name` of model you register.

```javascript

// No eventPrefix, model type is 'customer'
Vue.models.register('customer', {});

// --> eventPrefix is equal to 'customer'


// Explicit eventPrefix passed in
Vue.models.register('customer', {
    http: {
        eventPrefix: 'cst'
    }
});

// --> eventPrefix is equal to 'cst'
```

`{action}` is always equal to the name of the action on your API. If you call `customer.http.update()`, `action` will be equal to `update`.

`{result}` is one of the following:

- `before` - Before the action takes place
- `success` - Successful completion of the action
- `complete` - Action *finished*, regardless of outcome
- `error` - Action failed

Putting it all together, the event name will look similar to the following examples:

- `customer.update.before`
- `customer.destroy.success`
- `customer.list.complete`
- `customer.fetch.error`

### Data

Each event comes with `data` payload:

- `{eventPrefix}.{action}.before` - Before the action takes place. Receives a plain object with a function you can call to prevent the action from happening.
    
    ```javascript
    {
        cancel: fn
    }
    ```

- `{eventPrefix}.{action}.success` - Successful completion of the action. Receives the `response` from the server.

- `{eventPrefix}.{action}.error` - Action failed. Receives the axios `error` object.


- `{eventPrefix}.{action}.complete` - Action *finished*, regardless of outcome. No data. (Not fired if the action was cancelled manually by calling the `cancel` function in the `before` event.)

### Listeners

#### Automatically Adding Listeners

Events aren't much good without event listeners. To add event listeners, define a `listeners` key in your `models` option. Any model registration then moves to a `register` key. E.g:

```javascript
new Vue({
    el: '#app',

    models: {
        register: ['customer']
        listeners: [
            'customer.update.success'
        ]
    },
});
```

**When you add listeners automatically like this, they are bound during the Vue instance's `mounted` hook and automatically destroyed in the `beforeDestroy` lifecycle hook.**

There are a couple different ways to register listeners within the `listeners` array. The first is a simple string, e.g. `customer.update.success`. This serves as **both the event and the handler**. Vue-model will try to call a method named `customer.update.success`.

In that case, you'd set your Vue instance up like this:

```javascript
new Vue({
    el: '#app',

    models: {
        register: ['customer']
        listeners: [
            'customer.update.success'
        ]
    },

    methods: {
        'customer.update.success': function() {
            console.log('great success!')
        }
    }
});
```

If you don't like that, then you can add listeners as a map, with the key being the event and the value being the method to call, either a string or a function.

```javascript
new Vue({
    el: '#app',

    models: {
        register: ['customer']
        listeners: [{
            'customer.update.success': 'customerUpdated',
            'customer.update.error': function() {
                console.log('oh no!');
            }
        }]
    },

    methods: {
        customerUpdated: function() {
            console.log('great success!')
        }
    }
});
```

You can mix and match however you please. If you want to map multiple handlers to a single event, you're free to just keep adding elements to the array.

```javascript
new Vue({
    el: '#app',

    models: {
        register: ['customer']
        listeners: [
            'customer.update.success',
        {
            'customer.update.error': function() {
                console.log('oh no!');
            }
        }, {
            'customer.update.error': function() {
                console.log('two handlers for the same event, why not');
            }
        }]
    },

    methods: {
        'customer.update.success': function() {
            console.log('great success!')
        }
    }
});
```


#### Manually Adding Listeners

There may be times when you don't want to add listeners when your instance is mounted, which is when the automatic listeners are bound. If that's the case, you're in luck because you can use the `$addModelListeners` and `$removeModelListeners` methods.


```javascript
new Vue({
    el: '#app',

    // No automatic listeners
    models: {
        register: ['customer']
    },

    watch: {
        // Some property that determines if this
        // component is "active"
        componentIsActive: function(val) {
            var method = val ? '$add' : '$remove';

            // Add or remove our listeners
            this[method + 'ModelListeners']([
                'customer.update.success'
            ]);
        }
    }

    methods: {
        'customer.update.success': function() {
            console.log('great success!')
        }
    }
});
```


**Remember:** When you don't use automatic event listeners, you are responsible for cleaning up your event listeners.





