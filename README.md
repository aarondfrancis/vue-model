## About
Vue-model is a Javascript plugin for Vue.js that gives you the ability to transform your plain data into rich models with built-in and customizable HTTP actions. 

This project started because I work in Vue relatively often and really really wanted to be able to call `customer.save()`, have it `POST` the data to the server, show the user feedback that the action was in progress, and then apply the server's results to the model.

So that's what this plugin does. And much more!

See more at [aaronfrancis.com](http://aaronfrancis.com).

## Installation
 
```javascript
Vue.use(require('vue-model'));
```

> **Note:** This is my first node.js package, so the module setup may not be quite perfect. Please feel free to submit pull-requests. 

## Quick Examples

Here are a few quick examples to show you what you can do with vue-model.

### Edit a Model

```html
<div v-if='!customer.$.editing'>
    @{{ customer.name }}
    <br>
    <a href='#' @click.prevent='customer.$.edit()'>Edit</a>
</div>

<div v-if="customer.$.editing">
    <input type='text' v-model='customer.name' :disabled='customer.$.inProgress'>
    <br>
    <a href='#' @click.prevent='customer.$.update()'>Save</a> or
    <a href='#' @click.prevent='customer.$.cancel()'>Cancel</a>
</div>
```

### Update a Model 

```html
<input type='text' v-model='customer.name' :disabled='customer.$.inProgress'>
<button @click.prevent='customer.$.update()' :disabled='customer.$.updateInProgress'>
    <template v-if='customer.$.updateInProgress'>
        <i class='fa fa-spinner fa-spin'></i>
        Updating...
    </template>
    <template v-if='!customer.$.updateInProgress'>
        Update Customer
    </template>
</button>
```

### Delete a Model

```html
<div v-for='customer in customers'>
    @{{ customer.name }} (<a href='#' @click.prevent='customer.$.destroy()'>Delete</a>)
</div>
```

### Listen for Events

```javascript
new Vue({
    el: 'body',
    
    models: ['customer'],
    
    data: {
        customer: {
            id: 1
        }
    },
    
    events: {
        'customer.fetch.success': function(data) {
            console.log('Customer fetched!');
            console.log(data.sent);
            console.log(data.received);
        }
    }
})

```

## Registering Models

Before you can create models, you need to register them with vue-model. The registration process is simple using the `Vue.models.register` method. 

```javascript
Vue.models.register(type, options);
```

The first argument is the `type` argument, which gives your model a "name". The second argument is a plain object that lets you define some options that are specific to your model. (We'll talk later on about all the ways to customize your model.)

Here's an example of registering a `customer` model that has a base route of `/customers`: 
```javascript
Vue.models.register('customer', {
    baseRoute: '/customers',
});
```

Now you're ready to start creating and using your models.

## Creating Models

There are two different ways to create models in vue-model: You can create them manually whenever you please, or you can have vue-model create them automatically.

### Manually

To manually create a model, use the `$model()` Vue Instance method. 
  
Within a Vue Instance: 

```javascript
this.$model(type, data, options);
```

The `$model()` method accepts 3 parameters:
- `type`: (string) The type of model. This is the same key you used to register the model 
- `data`: (object) The model data
- `options`: (object) Any _instance_ specific options

You can create the model wherever you please. For example, you can call the method inside the `data` function: 

```javascript
new Vue({
    el: 'body',
    
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
    el: 'body',
    
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

#### Ad-hoc Model Creation

There may be times when you are using a model in a single place and don't want to register it, say in the case of a form. To create a model on-the-fly, just skip the `type` parameter. Your model's `data` becomes the first param, and the `options` become second.

```javascript
new Vue({
    el: 'body',
    
    data: function() {
        var formData = {
            
        };
        var formOptions = {
            baseRoute: '/forms/something'
        };
    
        return {
            form: this.$model(formData, formOptions)
        };
    }
});
```

### Automatically
Manually creating models gives you ultimate flexibility, but sometimes you just want it to work right away. That's where automatic model creation comes into play.
 
To automatically create models, you simply need to add a `models` array to your Vue Instance. A `models` array element can take two forms. The first form is just a string: 

```javascript
new Vue({
    el: 'body',
    
    models: ['customer'],
    
    data: {
        customer: {
            name: 'Aaron'
        }
    }
});
```

When you pass a string in, the model type the data key must be the same. In the example above, the model type must be `customer`, and the data key must also be `customer`. 
 
If you need more flexibility in naming, you can pass in a proper object.

```javascript
new Vue({
 el: 'body',
 
 models: [{
    type: 'customer'
    dataKey: 'newCustomer'
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
 
In the case where you need to pass options in, you can do that as well:

```javascript
new Vue({
  el: 'body',
  
  models: [{
     type: 'customer'
     dataKey: 'newCustomer',
     options: {
        eventPrefix: 'new-customer'
     }
  }],
  
  data: {
      newCustomer: {
          name: 'Aaron'
      }
  }
});
```

### Creating Many Models At Once
In the case where you want to create many models at once, you can use the `this.$models` method. The second parameter should be an array of data and vue-model will loop through and create a model for each element.

```javascript
new Vue({
    el: 'body',
    
    data: function() {
        var customers = [{
            // customer 1 data
        },{
            // customer 2 data
        },{
            // customer 3 data
        }];
    
        return {
            customers: this.$models('customer', customers)
        };
    }
});
```

> You can definitely do this yourself using a `for` loop and the `this.$model` method, `this.$models` is just a little more convenient.


## The API Object
Everything that vue-model provides lives on a single key on your data. By default, this key is `$`, although you can change it. Taking one of the model creation examples from above:

```javascript
new Vue({
    el: 'body',
    
    models: ['customer'],
    
    data: {
        customer: {
            name: 'Aaron'
        }
    }
});
```

Your `customer` object now contains two properties: 
- `name`: the original property that was passed in (value of `Aaron`)
- `$`: the vue-model API

You may be (correctly) wondering why we're adding this new `$` key instead of using prototypical inheritance like you might do traditionally. The reason we have to do that is because [Vue.js requires that observed data be __plain__ objects](http://vuejs.org/guide/reactivity.html), which means we can't use object-like functions and their prototypes.

## Performing HTTP Actions

Performing HTTP Actions is the heart of vue-model. The whole purpose of this plugin is to make it painless for your models to interact with your application's backend. 
 
All the actions are available on the vue-model key (`$` by default). To perform an action, you just need to call the corresponding method.

Examples:

```javascript
// Create a new customer
customer.$.create();

// Fetch this customer from the server
customer.$.fetch();

// Save this customer
customer.$.update();

// Delete this customer
customer.$.destroy();

// Retrieve a list of customers
customer.$.list()
```

These are the 5 actions that vue-model ships with, but you are welcome to disable those and/or set up your own.

### Action Definition

Actions are defined using the `action` key when you customize your model (which can be done in several places and will be covered in the __Customizing Your Models__ section).   

For simplicity, let's assume you are registering a `video` model and want to add two new actions: `complete` and `uncomplete`. That would be done as follows: 
 
```javascript
Vue.models.register('video', {
    baseRoute: '/videos',
    actions: {
        complete: {
            method: 'POST',
            route: '/{id}/complete'
        },
        uncomplete: {
            method: 'DELETE',
            route: '/{id}/complete'
        }
    }
});
```

#### Route Interpolation

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

#### Disabling Default Actions

If you'd like to disable some of the default actions, you can do so by setting that action to `false`.

Example:

```javascript
{
    actions: {
        list: false,
        destroy: false
    }
}
```

The resulting model will only have the `create`, `fetch`, and `update` methods. 


### Refining Data

It's probable that you'll want to send different data to the server based on what action it is that's being executed. When you send a off a `create` request, you'll send all the data. But when you send a `destroy` request, you really shouldn't be sending any data at all. Vue-model accomplishes this through the its DataPipeline.
 
The DataPipeline comes with several useful methods by default:  
 
- `none()` - Don't send _any_ data at all
- `only(keys)` - _Only_ send certain `keys`
- `with(data)` - Add additional `data`
- `without(keys)` - All the data, but without certain `keys` 
- `callback(fn)` - Return whatever data you like from a callback `fn` function
 
There are a couple of different ways to use the DataPipeline. The first is by defining it in your action definition:
 
  
```javascript
Vue.models.register('video', {
    baseRoute: '/videos',
    actions: {
        complete: {
            method: 'POST',
            route: '/{id}/complete',
            pipeline: function(DataPipeline) {
                // Don't post *any* data
                DataPipeline.none();
            }
        }
    }
});
```

Now, every time you call `video.$.complete()`, the data will run through the action's pipeline which will strip all the data out. 

The other option would be to define the pipleline inline by using the `$.data` object.

```javascript
video.$.data
    // Drop all model data
    .none()
    // Add some arbitrary data
    .with({
        forUser: 100 
    });
    
video.$.list();
```

All DataPipeline methods return the DataPipeline, so you can chain them.

And if you want to do it _really_ in line, your `apiKey` also lives on the `data` object so you can access your actions again.

```javascript
video.$.data.none().$.complete();
```

If you find yourself doing this too often, you should probably make that the default for the action. 


### Applying Response Data (or Not) 

Another great thing about vue-model is that you can automatically update your models with the response that comes back from the server.

If you define your action with `apply = true`, vue-model will take the response from the server, loop through all the data, and call `Vue.set` on the keys that have changed.

```javascript
Vue.models.register('video', {
    baseRoute: '/videos',
    actions: {
        complete: {
            method: 'POST',
            route: '/{id}/complete',
            // Apply the returned data
            apply: true
        }
    }
});
```

If the server returns 

```json
{
    completed: 1
}
```

as its payload from the `complete` action, then the `completed` attribute on our model will automatically be updated. 

```javascript
video.$.complete();
// Once it finishes...
console.log(video.completed);
// > 1
```

That lets us create toggle buttons very easily, all in HTML.

```html
<button v-if="video.completed" @click.prevent="video.$.uncomplete()">
    Completed
</button>

<button v-if="!video.completed" @click.prevent="video.$.complete()">
    Mark as Complete
</button>
```


### Preventing Simultaneous Actions

By default, vue-model will prevent another action from being initiated while another action is running. If you want to turn this behavior off, you can pass `false` in for the `preventSimultaneousActions` option.

## Busy Indicators

You'll often want to know when the model is busy, so that you can show loading indicators or prevent other actions. Vue-model provides two types of busy indicators: Global, and Action Specific.

### Global
The global busy indicator lives in the API object under the `inProgress` key.

For example, if you have a model named `customer`, you can observe the `customer.$.inProgress` attribute. This is helpful for showing/hiding elements or disabling buttons.

Here's one way you can disable a button, should the model be busy performing an HTTP action:

```html
<button @click='video.$.complete()' :disabled='video.$.inProgress'>
    Mark as Complete
</button>
```

### Action-Specific

If you have loading indicators scattered across the page and only want to show the correct indicator based on the specific action, then you should use an action-specific busy indicator.

For every action, there is a corresponding property that indicates whether or not that action is currently in process. For example, if the action is named `update`, then the property would be named `updateInProgress`. 

Consider a case where you have a `complete` action for a `video` model and would like to show a loading indicator on the button.

```html
<button @click='video.$.complete()' :disabled='video.$.completeInProgress'>
    <i v-if='video.$.completeInProgress' class='fa fa-spinner fa-spin'></i>
    Mark as Complete
</button>
```

This button will disable itself and show the lovely Font Awesome loading indicator (<i class='fa fa-spinner fa-spin'></i>) while the model finishes the `complete` action. This provides feedback and a good experience for your users. However, in this example if a different action is being performed, say a `favorite` action, the button will not show the loading indicator because it is bound to `completeInProgress` and not `inProgress` or `favoriteInProgress`.

> When _any_ of the action-specific loading indicators (`{action}InProgress`) are `true`, the global `inProgress` indicator will also be `true`.

## Events

Vue-model emits several events that you can listen for and respond to, giving you many different ways to seamlessly tie your app into vue-model.  

### Naming

Vue-model events follow a naming scheme of `{eventPrefix}.{action}.{result}`. The `eventPrefix` can be set when you are registering or instantiating your models. (See __Customizing Your Models__ for more information on how to set this.)

By default, if you don't pass in an `eventPrefix` while registering your model, vue-model will set it to the `type` of model you register.

```javascript

// No eventPrefix, model type is 'customer'
Vue.models.register('customer', {
    baseRoute: '/customers'
});
// --> eventPrefix is equal to 'customer'


// Explicit eventPrefix passed in
Vue.models.register('customer', {
    baseRoute: '/customers',
    eventPrefix: 'cst'
});
// --> eventPrefix is equal to 'cst'
```

`{action}` is always equal to the name of the action on your API. If you call `customer.$.update()`, `action` will be equal to `update`. 

`{result}` is one of the following:

- `before` - Before the action takes place
- `success` - Successful completion of the action
- `error` - Action failed
- `complete` - Action *finished*, regardless of outcome
- `canceled` - Action canceled by because a `before` callback returned `false`
- `prevented` - Action prevented because another action was still in progress

Putting it all together, the event name will look similar to the following examples:

- `customer.update.before`
- `customer.destroy.success`
- `customer.fetch.error`
- `customer.list.complete`
- `customer.create.canceled`
- `customer.update.prevented`

### Data

Each event comes with `data` payload:

- `{eventPrefix}.{action}.before` - Before the action takes place
    
    ```javascript
    {
        // The object that is about to 
        // be sent to the server
        sending: {}
    }
    ```
    
- `{eventPrefix}.{action}.success` - Successful completion of the action

    ```javascript
    {
        // The object that was sent to the server
        sent: {},
        
        // Data that was received from the server
        received: {}
    }
    ```

- `{eventPrefix}.{action}.error` - Action failed

    ```javascript
    {
        // The object that was sent to the server
        sent: {},
        
        // The failed XHR object
        received: {}
    }
    ```


- `{eventPrefix}.{action}.complete` - Action *finished*, regardless of outcome

    ```javascript
    {
        // The object that was sent to the server
        sent: {},
        
        // Data that was received from the server
        // OR an failed XHR, depending on success
        // or failure of the request
        received: {}
    }
    ```

- `{eventPrefix}.{action}.canceled` - Action canceled by because a `before` callback returned `false`

    No data.

- `{eventPrefix}.{action}.prevented` - Action prevented because another action was still in progress

    ```javascript
    {
        // The action that was prevented
        action: {}
    }
    ```
    

> Vue-model also emits an `{eventPrefix}.prevented` event every time __any__ action is prevented. For this event, the `name` of the event is also attached. 
```javascript
{
        // The name of the event (create, update, destroy, etc)
        name: '',
        // The action that was prevented
        action: {}
}
```

### The Event Emitter

Vue-model needs to know _how_ to emit events before it can actually do so. By default, vue-model uses the `$emit` method on the instance that you used to create your models. This lets you put your listeners right in your Vue instance

```javascript
new Vue({
    el: 'body',
    models: ['customer'],

    data: {
        customer: {
            id: 1
        }
    },
    
    events: {
        'customer.fetch.success': function(data) {
            console.log('Got some new data from the server!');
            console.log(data.received);
        }
    }
});
```

If you don't want to use the `$emit` method, you can pass use Vue's `$broadcast` or `$dispatch` methods by passing in `broadcast` or `dispatch`, respectively. (Leave off the leading `$`.)

You could also pass in your own callback if you don't want to use any of Vue's methods.

```javascript
// Emitter for your customer model
Vue.models.register('customer', {
    emitter: function(action, data) {
        // Pass the event on to...
        // Pusher
        // PubNub
        // Websocket
        // etc etc
     }
});

// Emitter for *every* model
Vue.use(require('vue-model'), {
    emitter: function(action, data) {
        // Pass the event on to...
        // Pusher
        // PubNub
        // Websocket
        // etc etc
     }
});
```

See more in the __Customizing Your Models__ section.

## Errors
### Is it a Validation Error Response?
### Transform Errors

## Customizing Your Models

Vue-model has been created to be as configurable as possible, but still remain very easy to use. We've also included several places where you can introduce model customization, so that you can worry about it as infrequently as possible.   

### Precedence

Since there are so many ways to customize your models, let's talk about order of importance.

#### 4. Least Important: Vue-model Defaults.
 
Vue-model ships with a `ModelDefaults.js` file that defines all the possible defaults. This is the _least_ important, but provides a solid base to get you started. (See below for a copy of the `ModelDefaults.js`)
  
#### 3. Somewhat Important: User Defaults

If you have specific defaults that you'd like to apply to __every__ model you ever create, you can pass in your own defaults that override the vue-model defaults. You do that when you call `Vue.use`.
 
For example, if you want all your models to use the underscore `_` as the api key instead of the default `$`, you could easily do that one time and then forget about it:

```javascript
Vue.use(require('vue-model'), {
    apiKey: '_'
});
```

Your new `apiKey` will override the vue-model default `apiKey` so that every model you create will have the api under `_`, making your actions look more like this:

```javascript
video._.complete();
```

#### 2. Moderately Important: Model Defaults

When you register a model using `Vue.models.register`, you have the ability to pass in `options` as a third parameter. If, for example, you don't want a certain model to have the `destroy` action, you can disable it for a single model:
 
```javascript
Vue.models.register('customer', {
    actions: {
        destroy: false
    }
});
```

With this configuration, every time you call `this.$model('customer', {})`, there will be no `destroy` action, because you declared it `false` upon registration.

#### 1. Most Important: Instance Options

The highest priority for options are _instance_ specific options. Instance specific options can override every other option. Instance specific options are (optionally) declared when you create a model. For example, if you'd like to change the event emitter for a _single instance_, you can:

```javascript
this.$model('customer', data, {
    // This model will not emit events (noop)
    emitter: function() {}
});
```

If you are automatically creating models and want to pass in different options than the options you registered with, just make `models` a proper object and include an `options` object.

```javascript
new Vue({
    el: 'body',
    
    models: [{
        type: 'customer'
        dataKey: 'newCustomer',
        options: {
            emitter: function() {}
        }
    }],
    
    data: {
        newCustomer: {
            name: 'Aaron'
        }
    }
});
```


### Available Options

This is the `ModelDefaults.js` file that vue-model ships with and contains all the available options.

```javascript
{
    // The key that contains vue-model API
    apiKey: '$',

    // Any keys we don't want to send up to the server
    // or apply from the server. Often, this can be
    // used for related models, etc.
    excludeKeys: [],

    // Prepended to each of the action routes
    baseRoute: '',

    // Prepended to each event that gets emitted. If 
    // you leave this blank when your register your 
    // models, vue-model will set eventPrefix equal
    // to the `type` that you registered. Event 
    // naming schema: {eventPrefix}.{action}.{status}
    // Eg: "customer.fetch.success"
    eventPrefix: '',

    // The function that emits events. You can pass 
    // a string name of one of the Vue.js instance 
    // event methods here and vue-model will convert
    // it to a proper function using the Vue instance 
    // from which you instantiated the model.
    // Allowed: 'emit', 'broadcast', 'dispatch', or 
    // a callback function.
    emitter: 'emit',

    // Prevent an action from being invoked while
    // another action is still running
    preventSimultaneousActions: true,

    // Default HTTP Actions that every model gets
    actions: {
        list: {
            method: 'GET',
            route: '',
            pipeline: function(DataPipeline) {
                DataPipeline.none();
            }
        },
        create: {
            method: 'POST',
            route: '',
        },
        fetch: {
            method: 'GET',
            route: '/{id}',
            apply: true,
            pipeline: function(DataPipeline) {
                DataPipeline.none();
            }
        },
        update: {
            method: 'PUT',
            route: '/{id}',
            apply: true
        },
        destroy: {
            method: 'DELETE',
            route: '/{id}',
            pipeline: function(DataPipeline) {
                DataPipeline.none();
            }
        }
    },

    // Base defaults for every action
    actionDefaults: {
        // Apply data that's returned 
        // from the server 
        apply: false,
        
        // Load validation errors into the 
        // model if the server returns them
        validation: true,
        
        // Perform before the action. Return
        // false to cancel the action
        before: function() {
            //
        },
        
        // Perform after the action completes
        after: function(data) {
            //
        }
    },

    // Model validation errors coming from the server
    validationErrors: {
        // Function to determine whether or not an
        // error response is a validation error.
        // 422 is the correct status code, so if
        // you use Laravel, no need to update this.
        isValidationError: function(xhr) {
            return xhr.status === 422;
        },

        // The error object should have the field names
        // as the keys and an array of errors as the
        // values. Laravel does this automatically.
        transformResponse: function(xhr) {
            return xhr.responseJSON;
        }
    }
}
```

## API

This is the API that vue-model appends to your object. By default, this is attached to your data under a `$` key, although you can specify the key by declaring an `apiKey` for your model.
    
- __`list()`__

    The `list` HTTP action

- __`create()`__

    The `create` HTTP action

- __`fetch()`__ 

    The `fetch` HTTP action

- __`update()`__ 

    The `update` HTTP action

- __`destroy()`__

    The `destroy` HTTP action
    
- __`copy()`__

    Returns a plain object copy of the model's `data`, without any vue-model extras. 

- __`edit()`__

    Copies the current `data` into a cache and sets the `editing` flag to `true`

- __`cancel()`__

    Applies the old `data` that was copied into the cache by the `edit` function, and sets the `editing` flag back to `false`

- __`apply(newData)`__

    Load an object into the model's `data`. (This is the same function that vue-model uses to apply the data from the server's response.)

- __`inProgress`__

    `boolean` Global loading indicator
    
- __`listInProgress`__ 

    `boolean` Loading indicator for the `list` action

- __`createInProgress`__ 

    `boolean` Loading indicator for the `create` action

- __`fetchInProgress`__ 

    `boolean` Loading indicator for the `fetch` action

- __`updateInProgress`__ 

    `boolean` Loading indicator for the `update` action

- __`destroyInProgress`__ 

    `boolean` Loading indicator for the `destroy` action

- __`editing`__ 
    
    `boolean` Indicator as to whether or not the model is in editing mode.

- __`errors`__
    - __`hasAny()`__
        
        `boolean` Whether or not there are _any_ errors
        
    - __`has(field)`__
        
        `boolean` Whether or not there are errors for `field` 
        
    - __`first(field)`__
        
        `string|undefined` The first error for `field`
        
    - __`get(field)`__
        
        `array|undefined` All the errors for `field`
        
    - __`clear(field)`__
        
        Clear the errors for a `field`
        
    - __`push(field, value)`__
        
        Add a new error `value` for `field`
        
    - __`set(collection)`__
        
        Completely overwrite all the errors with a new object. Keys should be field names and values should be arrays full of strings.
        
    - __`all`__
            
        A raw object of all the errors so Vue.js can observe and react to changes in errors.
        
- __`data`__
   
    - __`none()`__
        
        Drop all data
        
    - __`only(keys)`__
        
        Of all the attributes in your data, only keep ones that are in the `keys` array
        
    - __`with(data)`__
        
        Add any additional data that you please
        
    - __`without(keys)`__
        
        Drop `keys` out of your object
        
    - __`callback(fn)`__
        
        Pass in any callback function `fn` to process the `data`. The first argument to your `fn` will be the `data` as it currently exists. You can also pass args in to `callback` and they will be passed on to your `fn`. Example:
        
        ```javascript
        var processData = function(data, foo, bar) {
            // In this example:
            // foo === 'foo-arg'
            // bar === 'bar-arg'
            
            // Do something with the data...
            return data;
        };
        
        video.$.data.callback(processData, 'foo-arg', 'bar-arg');
        ```
        
    - __`forAction(name)`__
        
        Returns the `data` that would be sent for an action. Useful for debugging.
        
        ```javascript
        // Get the data that would be posted for the 'update' action
        var dataToBePosted = video.$.data.with({test: 1}).forAction('update');
        
        // Inspect the data
        console.log(dataToBePosted);
        ```
        
    - __`$`__ (or whatever your `apiKey` is)
        
        A reference back to your API object
        
        ```javascript
        video.$.data.none().$.complete();
        ```
        
        Allows you to get back up a level from your data pipeline operations.