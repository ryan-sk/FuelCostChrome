chrome.runtime.onInstalled.addListener(function (details) {
	//Open settings page on first install
	if(details.reason == "install"){
		chrome.runtime.openOptionsPage();
	}
});

//Chrome no longer allows content scripts to send cross domain requests.
//Instead, make the call here and send back the response to the content script.
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "request");
  port.onMessage.addListener(function(msg) {
		var reqPath = "?start=" + msg.start + "&end=" + msg.end + "&id=" + msg.id;
		var req = $.ajax({
					type : "GET",
					url : "https://fuelcostmapextension.nn.r.appspot.com/api/cost"
							+ reqPath,
					dataType : 'json'
				});

		var success = function(resp) {
			port.postMessage({isSuccess:true, resp:resp});
		}
		var failure = function(resp) {
			port.postMessage({isSuccess:false, resp:resp});
		}
		req.then(success, failure);
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "openSettings")
      chrome.runtime.openOptionsPage();
  });