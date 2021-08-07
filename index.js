class ChunkProgressWebpackPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap('chunk-progress-webpack-plugin', function (compilation) {
			compilation.mainTemplate.hooks.localVars.tap('add-progress-vars', function (source) {
				return [source, functionBody(addProgressVars)].join('\n');
			});
			compilation.mainTemplate.hooks.requireEnsure.tap('replace-require-ensure', function () {
				return functionBody(replaceRequireEnsure);
			});
		});
	}
}

module.exports = ChunkProgressWebpackPlugin;

// helper for returning contents of a function
function functionBody(fn) {
	const str = fn.toString();
	return str.slice(str.indexOf('{') + 1, str.lastIndexOf('}'));
}

function addProgressVars() {
	// chunk-progress-webpack-plugin add-progress-vars start
	var progress = {
		totalSize: 0,
		activeLoadCount: 0,
		activeLoads: {},
	};
	var installedChunks = {
		main: 0,
	};
	// chunk-progress-webpack-plugin add-progress-vars end
}

function replaceRequireEnsure(chunkId) {
	// chunk-progress-webpack-plugin replace-require-ensure start
	var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
	if (installedChunkData !== 0) {
		// 0 means "already installed".
		if (installedChunkData) {
			promises.push(installedChunkData[2]);
		} else {
			// setup Promise in chunk cache
			var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
			promises.push((installedChunkData[2] = promise));

			// start chunk loading
			var url = __webpack_require__.p + __webpack_require__.u(chunkId);
			// create error before stack unwound to get useful stacktrace later
			var error = new Error();
			progress.activeLoads[url] = 0;
			progress.activeLoadCount += 1;

			var timeout = setTimeout(function () {
				onScriptComplete({
					type: 'timeout',
					target: script,
				});
			}, 120000);

			new Promise(function (resolve, reject) {
				var xhr = new XMLHttpRequest();
				xhr.open('HEAD', url);
				xhr.onload = resolve;
				xhr.onerror = reject;
				xhr.send();
			})
				.then(function (requestEvent) {
					progress.totalSize += parseInt(requestEvent.target.getResponseHeader('content-length'), 10);
					return new Promise(function (resolve, reject) {
						var xhr = new XMLHttpRequest();
						xhr.open('GET', url);
						xhr.onload = resolve;
						xhr.onerror = reject;
						xhr.onprogress = function (progressEvent) {
							var loaded = Object.values(progress.activeLoads).reduce(function (sum, num) {
								return num + sum;
							});
							progress.activeLoads[url] = progressEvent.loaded;
							document.dispatchEvent(
								new CustomEvent('chunk-progress-webpack-plugin', {
									detail: {
										originalEvent: progressEvent,
										originalRequestEvent: requestEvent,
										loaded: loaded,
										total: progress.totalSize,
										resource: {
											url: url,
											loaded: progressEvent.loaded,
											total: progressEvent.total,
										},
									},
								})
							);
						};
						xhr.send();
					});
				})
				.then(function (event) {
					return event.target.responseText;
				})
				.then(function (js) {
					var head = document.getElementsByTagName('head')[0];
					var script = document.createElement('script');
					script.textContent = js;
					head.appendChild(script);
				})
				.then(function () {
					onScriptComplete();
				})
				.catch(function (error) {
					onScriptComplete(error);
				});

			function onScriptComplete(event) {
				progress.activeLoadCount -= 1;
				if (progress.activeLoadCount <= 0) {
					progress.totalSize = 0;
					progress.activeLoadCount = 0;
					progress.activeLoads = {};
				}
				clearTimeout(timeout);
				var chunk = installedChunks[chunkId];
				if (!event) {
					chunk[0]();
					return;
				}
				if (__webpack_require__.o(installedChunks, chunkId)) {
					if (chunk !== 0) installedChunks[chunkId] = undefined;
					if (chunk) {
						var errorType = event && (event.type === 'load' ? 'missing' : event.type);
						var realSrc = event && event.target && event.target.src;
						error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
						error.name = 'ChunkLoadError';
						error.type = errorType;
						error.request = realSrc;
						chunk[1](error);
					}
					installedChunks[chunkId] = undefined;
				}
			}
		}
	}
	// chunk-progress-webpack-plugin replace-require-ensure end
}
