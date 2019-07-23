class ChunkProgressWebpackPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap('chunk-progress-webpack-plugin', function (compilation) {
			compilation.mainTemplate.hooks.localVars.tap('add-progress-vars', function (source) {
				return [
					source,
					functionBody(addProgressVars)
				].join('\n');
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
	return str.slice(str.indexOf("{") + 1, str.lastIndexOf("}"));
}

function addProgressVars() {
	// chunk-progress-webpack-plugin add-progress-vars start
	var progress = {
		totalSize: 0,
		activeLoadCount: 0,
		activeLoads: {},
	};
	// chunk-progress-webpack-plugin add-progress-vars end
}

function replaceRequireEnsure(chunkId) {
	// chunk-progress-webpack-plugin replace-require-ensure start
	var installedChunkData = installedChunks[chunkId];
	if (installedChunkData !== 0) { // 0 means "already installed".
		if (installedChunkData) {
			promises.push(installedChunkData[2]);
		} else {
			// setup Promise in chunk cache
			var promise = new Promise(function (resolve, reject) {
				installedChunkData = installedChunks[chunkId] = [resolve, reject];
			});

			var url = jsonpScriptSrc(chunkId);
			progress.activeLoads[url] = 0;
			progress.activeLoadCount += 1;
			promises.push(installedChunkData[2] = promise);

			var timeout = setTimeout(function () {
				onScriptComplete({
					type: 'timeout',
					target: script
				});
			}, 120000);

			new Promise(function (resolve, reject) {
					var xhr = new XMLHttpRequest();
					xhr.open('HEAD', url);
					xhr.onload = resolve;
					xhr.onerror = reject;
					xhr.send();
				}).then(function (event) {
					progress.totalSize += parseInt(event.target.getResponseHeader('content-length'), 10);
					return new Promise(function (resolve, reject) {
						var xhr = new XMLHttpRequest();
						xhr.open('GET', url);
						xhr.onload = resolve;
						xhr.onerror = reject;
						xhr.onprogress = function (event) {
							var loaded = Object.values(progress.activeLoads).reduce(function (sum, num) {
								return num + sum;
							});
							progress.activeLoads[url] = event.loaded;
							document.dispatchEvent(new CustomEvent(
								'chunk-progress-webpack-plugin', {
									detail: {
										originalEvent: event,
										loaded: loaded,
										total: progress.totalSize,
										resource: {
											url: url,
											loaded: event.loaded,
											total: event.total
										}
									}
								}));
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
					onScriptComplete(error)
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
				if (chunk !== 0) {
					if (chunk) {
						var errorType = event && (event.type === 'load' ? 'missing' : event.type);
						var realSrc = event && event.target && event.target.src;
						var error = new Error('Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')');
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
