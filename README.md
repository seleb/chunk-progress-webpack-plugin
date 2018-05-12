# chunk-progress-webpack-plugin

Replaces the default async chunk loader with one which uses XHR and triggers progress event on `document`.

## Install

```sh
npm i --save-dev chunk-progress-webpack-plugin
```

or

```sh
yarn add --dev chunk-progress-webpack-plugin
```

## Use

In config:

```js
const ChunkProgressWebpackPlugin = require('chunk-progress-webpack-plugin');
...
{
	plugins: [
		new ChunkProgressWebpackPlugin()
	]
}
```

In application:

```js
document.addEventListener('chunk-progress-webpack-plugin', function(event) {
	event.detail.loaded; // total bytes loaded
	event.detail.total; // total bytes requested
	event.detail.loaded / event.detail.total * 100; // total progress percentage
	const resource = event.detail.resource; // info about resource that triggered the event
	resource.loaded;
	resource.total;
	resource.url;
});
```

The root `loaded`/`total` values are reset to 0 when all concurrent loads complete. This is particularly useful for cases where user interaction is blocked while resources are loading (e.g. startup of a SPA or web game). In cases where multiple unrelated sections of code are importing resources asynchronously, the `resource` values are likely to be more useful.

A complete/100% progress event is not provided under the assumption that this can be handled on the complete of the original resource import; e.g. `import('resource').then(()=>{/* fully loaded */})`

## XHR Caveats

Because this plugin makes webpack use XHR instead of JSONP to load resources, there are some things to keep in mind:

- You may run into CORS issues (e.g. you won't be able to run the bundled result over `file://` protocol in Chrome)
- Extra `HEAD` requests are made to determine file-sizes
