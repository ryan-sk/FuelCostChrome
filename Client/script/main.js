//Global handle for the added widget
var $widget = null;

// Records the previous direction lookup
var lastStartAddress = null;
var lastEndAddress = null;

// Removes widget from the screen
var clearWidget = function() {
	if ($widget) {
		$widget.remove();
	}
}

// Renders a widget with 3 panels from the response and items from local storage
var renderWidgetFromResp = function(resp) {

	chrome.storage.sync.get(null,function(items) 
	{
		// Format the calculated values from the server
		var routeCost = parseFloat(resp.result.total_cost).toFixed(2);
		var fuelVolume = parseFloat(resp.result.total_gas_volume).toFixed(2);
		var gasPrice = Math.floor(parseFloat(resp.result.gas_price) * 1000) / 10;
		var economy = parseFloat(resp.result.average_economy).toFixed(1);

		// Substitute values into HTML template
		var source = '<div id="rcmeWidget"><div class="menu-wrapper"><div class="ui small compact inverted menu" style="position: relative;"><a id="cost" class="item"><i class="money icon"></i>${{routeCost}}</a><a id="volume" class="item"><i class="theme icon"></i>{{fuelVolume}}</a><a id="price" class="item"><i class="filter icon"></i>{{gasPrice}}</a></div></div></div>';
		var template = Handlebars.compile(source);
		var context = {
			routeCost : routeCost,
			fuelVolume : fuelVolume,
			gasPrice : gasPrice
		};
		var html = template(context);

		// Add the widget to the DOM and keep a pointer to it
		$('body').append($.parseHTML(html));
		$widget = $('#rcmeWidget');

		var currency;
		var volumeUnit;
		var economyUnit;
		var fuelType = items.fuelText;

		if (resp.is_metric) {
			currency = "CAD"
			volumeUnit = "Litres"
			economyUnit = "L/100km"
		} else {
			currency = "USD"
			volumeUnit = "Gallons"
			economyUnit = "mpg"
		}

		// Add descriptive popups to all three panes (Cost, Volume, Gas Price) with
		// localized units
		var source = "<div class='header'>Trip Fuel Cost ({{currency}})</div><div class='content'>Approximate gas cost for the fastest route based on current traffic.<br><br> Estimated economy on route: <span id='economy-value'>{{economy}}</span> <span id='economy-unit'>{{economyUnit}}</span>. *<br><br><span class='disclaimer'>*Your fuel economy will vary. Factors such as stop-and-go traffic and excessive idling can lower your fuel economy by roughly 10% to 40%.</span></div>";
		var template = Handlebars.compile(source);
		var context = {
			currency : currency,
			economy : economy,
			economyUnit : economyUnit
		};
		var popupHtml = template(context);

		$('#cost').popup({
			title : "Trip Fuel Cost (" + currency + ")",
			html : popupHtml,
			variation : "mini inverted wide"
		});

		$('#volume').popup({
			title : "Fuel Volume (" + volumeUnit + ")",
			content : "Approximate amount of gas consumed on this trip.",
			variation : "mini inverted"
		});

		$('#price')
				.popup(
						{
							title : "Local Gas Price (" + fuelType + ")",
							content : "Today's gas price at stations near the starting location. This figure is used to determine the total fuel cost of the trip.",
							variation : "mini inverted"
						});
	});
}

// Takes in the json error response from the server and displays a widget with
// the message.
var renderFailWidgetFromResp = function(resp) {
	try {
		r = JSON.parse(resp.responseText)
		if (r.status == "NO_GASPRICE" || r.status == "NO_VEHICLE") {
			var source = '<div id="rcmeWidget"><div class="menu-wrapper"><div class="ui small compact inverted menu" style="position: relative;"><a id="error" class="item"><i class="ban icon"></i>{{message}}</a></div></div></div>';
			var template = Handlebars.compile(source);
			var context = {
				message : r.message
			};
			var html = template(context);

			$('body').append($.parseHTML(html));
			$widget = $('#rcmeWidget');
		}
	} catch (err) {

	}
}

// Adds widget with a prompt to select a vehicle in the Chrome Extensions
// options page.
var renderVehiclePrompt = function() {
	var source = '<div id="rcmeWidget"><div class="menu-wrapper"><div class="ui small compact inverted menu" style="position: relative;"><a id="error" class="item"><i class="ban icon"></i>{{message}}</a></div></div></div>';
	var template = Handlebars.compile(source);
	var context = {
		message : "A vehicle has not been selected. Please select one by going to this extension's 'Options' page at 'chrome://extensions/' "
	};
	var html = template(context);

	$('body').append($.parseHTML(html));
	$widget = $('#rcmeWidget');
}


// Open a two way connection with the background script to make cross domain requests.
var port = chrome.runtime.connect({name: "request"});

// Basically uses the background script as a proxy for the endpoint we were using before.
// This is the callback on the response.
port.onMessage.addListener(function(msg) {
  if (msg.isSuccess){
    clearWidget();
	renderWidgetFromResp(msg.resp);
  }
  else{
	clearWidget();
	renderFailWidgetFromResp(msg.resp);    
  }
});

// Main function. Periodically check if the user is in Directions mode.
setInterval(
		function() {
			var path = window.location.pathname.split('/');
			if (path[1] == 'maps' && path[2] == 'dir' && path[3] != ""
					&& path[4] != "") {
				if (path[3] != lastStartAddress || path[4] != lastEndAddress) {

					lastStartAddress = path[3];
					lastEndAddress = path[4];

					chrome.storage.sync
							.get(
									null,
									function(items) {
										// If vehicle has been chosen, send
										// requests as usual. Otherwise, display
										// prompt to select vehicle in settings
										// page.
										
										if (items.hasOwnProperty('type')) {
											var type = items.type;

											port.postMessage({start: path[3], end:path[4], id:type});
										} else {
											renderVehiclePrompt();
										}
									})
				}
			} else {
				// Mark the state as dirty to fire off a new search
				// when start and end are populated. Otherwise, second search
				// wont fire for two consecutive of the same searches.
				lastStartAddress = null;
				lastEndAddress = null;

				clearWidget();
			}
		}, 333);

//Programmaticly injected styles allows for CSS debugging with browser tools
function injectStyles(url) {
	var elem = document.createElement('link');
	elem.rel = 'stylesheet';
	elem.setAttribute('href', url);
	document.body.appendChild(elem);
}
