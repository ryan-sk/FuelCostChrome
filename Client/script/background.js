chrome.runtime.onInstalled.addListener(function (details) {
	//Open settings page on first install or update
	if(details.reason == "install" || details.reason == "update"){
		chrome.runtime.openOptionsPage();
	}
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "openSettings")
      chrome.runtime.openOptionsPage();
  });