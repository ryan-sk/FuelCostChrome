chrome.runtime.onInstalled.addListener(function (details) {
	//Open settings page if extension was installed first time or has been updated.
	if(details.reason == "install" || details.reason == "update"){
		chrome.runtime.openOptionsPage();
	}
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "openSettings")
      chrome.runtime.openOptionsPage();
  });