/*
 *	do-js/do.js - A JavaScript API for talking to Digital Ocean
 *
 *	http://code.google.com/p/do-js/
 *
 *	MIT License: http://opensource.org/licenses/mit-license.php
 *
 *	Copyright (c) 2013 Austin David France
 *
 *	Permission is hereby granted, free of charge, to any person obtaining a copy 
 *	of this software and associated documentation files (the "Software"), to deal
 *	in the Software without restriction, including without limitation the rights
 *	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 *	copies of the Software, and to permit persons to whom the Software is furnished
 *	to do so, subject to the following conditions:
 *
 *	The above copyright notice and this permission notice shall be included in
 *	all copies or substantial portions of the Software.
 *
 *	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *	SOFTWARE.
 */

(function(global, module){
	var DigitalOcean = function(params) {

		// private variables
		var _request = require('request'),
			_api = 'https://api.digitalocean.com/',
			_apiKey = params.apiKey,
			_clientId = params.clientId,
			_pr = function(err, response, html) {
					if (err) throw new Error(err);
					var o = JSON.parse(html);
					if (o.status != "OK") {
						throw new Error(o.description);
					}
					return o;
			},

			_mixin = function(d,s) {
				for (k in s) if (s.hasOwnProperty(k)) d[k] = s[k];
				return d;
			},

			_wait = function(event_id, event, wait) {
				wait(_mixin({ time: new Date(), id: event_id }, event));
				_interface.events.wait(event_id, function(_ev) { _ev.time = new Date(); wait(_mixin(_ev, event)); });
			},

			_command = function(command, wait, event) {
				_request.get({ uri: _api + command + 
						(command.indexOf('/?') == -1 ? '/?' : '&') + 'client_id='+_clientId+'&api_key='+_apiKey }, 
					function(err, response, html) {
						var o = _pr(err,response,html);
						if (wait) _wait(o.event_id, event, wait)
					}
				);
			},

			// public interface
			_interface = {
				droplets: {
					// Query Droplets
					list: function(callback) {
						_request.get({ uri: _api + 'droplets/?client_id='+_clientId+'&api_key='+_apiKey },
							function(err, response, html) {
								var o = _pr(err,response,html);
								if (callback) callback(o.droplets);
							}
						);
					},
					get: function(id, callback) {
						_request.get({ uri: _api + 'droplets/' + id + '/?client_id='+_clientId+'&api_key='+_apiKey }, 
							function(err, response, html) {
								var o = _pr(err,response,html);
								if (callback) callback(o.droplet);
							}
						);
					},
					getByName: function(name, callback) {
						this.list(function(droplets) {
							for (var i = 0; i < droplets.length; i++) {
								var droplet = droplets[i];
								if (droplet.name == name) {
									callback(droplet);
									return;
								}
							}
							callback();
						});
					},

					// Control droplets
					power: function(id, on, wait) {
						_command('droplets/' + id + '/power_' + (on ? "on" : "off"), wait, { droplet_id: id });
					},

					reboot: function(id, wait) {
						_command('droplets/' + id + '/reboot', wait, { droplet_id: id });
					},

					shutdown: function(id, wait) {
						_command('droplets/' + id + '/shutdown', wait, { droplet_id: id });
					},

					snapshot: function(id, name, wait) {
						_command('droplets/' + id + '/snapshot/?name='+name, wait, { droplet_id: id });
					}
				},

				events: {
					// Query Event
					get: function(id, callback) {
						_request.get({ uri: _api + 'events/' + id + '/?client_id='+_clientId+'&api_key='+_apiKey }, 
							function(err, response, html) {
								var o = _pr(err,response,html);
								if (callback) callback(o.event);
							}
						);
					},
					wait: function(id, progress) {
						var events = this,
							wait = function() {
								events.get(id, function(event) {
									if (progress) progress(event);
									if (!event.action_status) {
										setTimeout(wait, 1000);
									}
								});
							};
						wait();
					}
				}

			};
		return _interface;
	};

	// If defining a nodejs module, export the DigitalOcean object, else set the DigitalOcean global object
	// in the globel context
	module ? module.exports = DigitalOcean : global.DigitalOcean = DigitalOcean;
})(global || this, module);
