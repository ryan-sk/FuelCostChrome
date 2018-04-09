
class Dropdown {
  //Wrapper to control SemanticUI dropdown
  
  /*
  
  $element -> the dropdown jQuery element.
  onSelect -> when a selection has been made, fire onSelect (the next REST call) to populate the next dropdown.
  
  */
  constructor($element, onSelect) {
    this.$element = $element;
    this.selectedValue = "";
    this.disable();
	
	
    this.$element.dropdown({
      onChange: (function(value, text) {
        if (value !== this.selectedValue && value !== "") {
          this.resetUiNoSelection();
          this.selectedValue = value;
          onSelect();
        }
        console.log('changed:' + this.$element.attr('id') + ' text:' + text + " value:" + value) //alert("changed")

      }).bind(this),
	  direction: "downward"
    });
  }
  
  //Resets the UI to a empty state if all dropdowns have not been selected.
  resetUiNoSelection(){
	  if (!SettingsController.active_instance.saveButton.hasClass('disabled')) {
		SettingsController.active_instance.saveButton.addClass('disabled')
	  }
	  SettingsController.active_instance.highwayEconomyNode.text("---");
	  SettingsController.active_instance.cityEconomyNode.text("---");
	  SettingsController.active_instance.fuelTypeNode.text("---");
	  
	  $('.vehicle-info-container').css('opacity','0.4');
  }

  //Makes dropdown not clickable.
  disable() {
    this.$element.addClass("disabled");
  }

  //Makes dropdown clickable.
  enable() {
    this.$element.removeClass("disabled");
  }

  //Set value of dropdown.
  setSelected(val) {
    this.$element.dropdown('set selected', val)
  }

  //Expands dropdown.
  show() {
    this.$element.dropdown('show');
  }

  //Reintializes internal Semantic dropdown code for the new HTML. Typically called after new items elements are added (addItemsFromXml)
  refresh() {
    this.$element.dropdown('refresh');
  }
  
  getFocus() {
	this.$element.find('input').focus();
  }
  
  //msg -> The message to popup from the dropdown
  popupMessage(msg){
	setTimeout(function(){this.$element.find('input').popup({
					content : msg,
					on: 'click'
					}).popup('show');
	}.bind(this),3000);
					
	setTimeout(function(){
		this.$element.find('input').popup('hide');
		setTimeout(function(){this.$element.find('input').popup('destroy');}.bind(this), 500);
	}.bind(this),6000);
  }

  //Add elements to the dropdown from the Fuel Economy web service XML response.
  addItemsFromXml(xml) {
    var $menu = this.$element.find(".menu");

    $(xml).find('menuItem').each(function() {
		
	

      var text = $(this).find("text").text();
      var value = $(this).find("value").text();
	  
	  //Prevent vehicles from the year ahead from being displayed. Nobody can drive those cars.
	  if (parseInt(value) !== ((new Date()).getFullYear() + 1)){

		  var $item = jQuery('<div/>', {
			"class": 'item',
			"data-value": value,
			"text": text
		  })


		  $item.appendTo($menu);
	  }
    })


  }


  clearSelectedAndRemoveAllItems() {
    this.$element.dropdown("clear");
    this.selectedValue = undefined;

    this.$element.find('.item').each(function() {

      $(this).remove()
    });
  }


}

class SettingsController {
  constructor() {
    this.yearDropdown = new Dropdown($('#year'), this.getMakes.bind(this));
    this.makeDropdown = new Dropdown($('#make'), this.getModels.bind(this));
    this.modelDropdown = new Dropdown($('#model'), this.getTypes.bind(this));
    this.typeDropdown = new Dropdown($('#type'), this.getVehicle.bind(this));
	
	this.highwayEconomyNode = $('#highway-economy');
	this.cityEconomyNode = $('#city-economy');
	this.fuelTypeNode = $('#fuel-type')

	this.saveButton = $('#save')
	
	this.saveButton.on('click', function() {
    //get menu
		console.log('clicked')
		this.saveButton.addClass('disabled')
		
	
		
		var saveFields = {
			year: this.yearDropdown.selectedValue,
			make: this.makeDropdown.selectedValue,
			model: this.modelDropdown.selectedValue,
			type: this.typeDropdown.selectedValue,
			highwayText: this.highwayEconomyNode.text(),
			cityText: this.cityEconomyNode.text(),
			fuelText: this.fuelTypeNode.text()
			
		}
		console.log(saveFields)
		chrome.storage.sync.set(saveFields, function() {
			console.log('saved!!');
			this.saveButton.popup({
					content : "Saved! You're all set!",
					on: 'click'
					}).popup('show');
			
			setTimeout(function(){window.open('https://www.google.ca/maps/dir/Mountain+View,+CA,+USA/Palo+Alto,+CA,+USA','_blank')}, 1500);
			
			

			

		}.bind(this));
  
	}.bind(this));
	
    //Set global variables
    SettingsController.active_instance = this

  }


  getYears() {
    var callback = function(xml) {
      this.yearDropdown.enable();
      this.yearDropdown.addItemsFromXml(xml);
      this.yearDropdown.refresh();
      this.yearDropdown.show();


    }.bind(this)

    this._getYears().then(callback)
  }

  _getYears() {
    return $.ajax({
      type: "GET",
      url: "https://www.fueleconomy.gov/ws/rest/vehicle/menu/year",
	  dataType: "xml"
    })
  }

  getMakes() {
    this.makeDropdown.clearSelectedAndRemoveAllItems()
    this.makeDropdown.disable();
    this.makeDropdown.refresh();

    this.modelDropdown.clearSelectedAndRemoveAllItems()
    this.modelDropdown.disable();
    this.modelDropdown.refresh();

    this.typeDropdown.clearSelectedAndRemoveAllItems()
    this.typeDropdown.disable();
    this.typeDropdown.refresh();

    var callback = function(xml) {
      this.makeDropdown.enable();
      this.makeDropdown.addItemsFromXml(xml);
      this.makeDropdown.refresh();
	  //this.makeDropdown.popupMessage('Type here to search...');
      this.makeDropdown.show();

    }.bind(this)

    this._getMakes(this.yearDropdown.selectedValue).then(callback)

  }

  _getMakes(yearId) {
    return $.ajax({
      type: "GET",
      url: "https://www.fueleconomy.gov/ws/rest/vehicle/menu/make",
      data: {
        year : yearId
      },
      dataType: "xml"
    })


  }

  getModels() {
    this.modelDropdown.clearSelectedAndRemoveAllItems()
    this.modelDropdown.disable();
    this.modelDropdown.refresh();

    this.typeDropdown.clearSelectedAndRemoveAllItems()
    this.typeDropdown.disable();
    this.typeDropdown.refresh();

    var callback = function(xml) {
      this.modelDropdown.enable();
      this.modelDropdown.addItemsFromXml(xml);
      this.modelDropdown.refresh();
	  //this.modelDropdown.popupMessage('Type here to search...');
      this.modelDropdown.show();
	  //this.modelDropdown.click();
    }.bind(this)

    this._getModels(this.yearDropdown.selectedValue, this.makeDropdown.selectedValue).then(callback)
  }

  _getModels(yearId, makeId) {
    return $.ajax({
      type: "GET",
      url: "https://www.fueleconomy.gov/ws/rest/vehicle/menu/model",
      data: {
        year: yearId,
		make: makeId
      },
      dataType: "xml"
    })

  }

  getTypes() {
    this.typeDropdown.clearSelectedAndRemoveAllItems()
    this.typeDropdown.disable();
    this.typeDropdown.refresh();


    var callback = function(xml) {
      this.typeDropdown.enable();
      this.typeDropdown.addItemsFromXml(xml);
      this.typeDropdown.refresh();
	 // this.typeDropdown.getFocus();
      this.typeDropdown.show();
    }.bind(this)

    this._getTypes(this.yearDropdown.selectedValue, this.makeDropdown.selectedValue, this.modelDropdown.selectedValue).then(callback)
  }

  _getTypes(yearId, makeId, modelId) {
    return $.ajax({
      type: "GET",
      url: "https://www.fueleconomy.gov/ws/rest/vehicle/menu/options",
      data: {
        year: yearId,
		make: makeId,
		model: modelId
      },
      dataType: "xml"
    })

  }

  getVehicle() {
	var parseVehicleInfo = function(xml){
		var usaHighwayEconomy = parseFloat($(xml).find('highway08U').text());
		var usaCityEconomy = parseFloat($(xml).find('city08U').text());
		var fuelType = $(xml).find('fuelType1').text();
		
		//Use rounded economy value if unrounded value is not entered (Vehicles before 2011)
		if(usaHighwayEconomy == 0){
			usaHighwayEconomy = parseFloat($(xml).find('highway08').text());
		}		
		if(usaCityEconomy == 0){
			usaCityEconomy = parseFloat($(xml).find('city08').text());
		}
		
		
		var imperialHighwayEconomy = usaHighwayEconomy * 0.425144;
		var imperialCityEconomy = usaCityEconomy * 0.425144;
		
		var highwayText = String(usaHighwayEconomy.toFixed(1) + "mpg / " + imperialHighwayEconomy.toFixed(1) + "kpl");
		var cityText = String(usaCityEconomy.toFixed(1) + "mpg / " + imperialCityEconomy.toFixed(1) + "kpl");
		
		
		return {highwayText : highwayText, cityText : cityText, fuelTypeText : fuelType}	

	}
	  
	var callback = function(xml) {
		var result = parseVehicleInfo(xml)
		

		this.fuelTypeNode.text(result.fuelTypeText);
	  
		if (this.fuelTypeNode.text() == "Electricity" || this.fuelTypeNode.text() == "Natural Gas"){
			this.saveButton.popup({
			content : "Vehicle save is disabled. This extension only works for gasoline based vehicles.",
			on: 'click'
			}).popup('show');	
		
			setTimeout(function(){
				this.saveButton.popup('hide');
				setTimeout(function(){this.saveButton.popup('destroy');}.bind(this), 500);
			}.bind(this),10000);
			
		}
		else{
			$('.vehicle-info-container').css('opacity','1');
			
			this.highwayEconomyNode.text(result.highwayText);
			this.cityEconomyNode.text(result.cityText);
			
			this.saveButton.removeClass('disabled');		
			this.saveButton.transition('jiggle');
		}
		
    }.bind(this);
	
	
	this._getVehicle(this.typeDropdown.selectedValue).then(callback);
  

  }
  
  _getVehicle(typeId) {
	  return $.ajax({
      type: "GET",
      url: "https://www.fueleconomy.gov/ws/rest/vehicle/" + typeId,
      dataType: "xml"
    })
  }

  loadStateFromStorage(items) {
	
	var year = items.year;
	var make = items.make;
	var model = items.model;
	var type = items.type;
	
	var highwayText = items.highwayText;
	var cityText = items.cityText;
	var fuelText = items.fuelText;
	
    this._getYears().then(function(xml) {
      this.yearDropdown.addItemsFromXml(xml);

      return this._getMakes(year);

    }.bind(this)).then(function(xml) {
      this.makeDropdown.addItemsFromXml(xml);
      return this._getModels(year,make);

    }.bind(this)).then(function(xml) {
      this.modelDropdown.addItemsFromXml(xml);
      return this._getTypes(year,make,model);

    }.bind(this)).then(function(xml) {
      this.typeDropdown.addItemsFromXml(xml);

    }.bind(this)).then(function() {
      this.yearDropdown.enable();
      this.makeDropdown.enable();
      this.modelDropdown.enable();
      this.typeDropdown.enable();

      this.yearDropdown.selectedValue = year;
      this.makeDropdown.selectedValue = make;
      this.modelDropdown.selectedValue = model;
      this.typeDropdown.selectedValue = type;

      this.yearDropdown.setSelected(year);
      this.makeDropdown.setSelected(make);
      this.modelDropdown.setSelected(model);
      this.typeDropdown.setSelected(type);

      this.yearDropdown.refresh();
      this.makeDropdown.refresh();
      this.modelDropdown.refresh();
      this.typeDropdown.refresh();
	  
	  this.highwayEconomyNode.text(highwayText);
	  this.cityEconomyNode.text(cityText);
	  this.fuelTypeNode.text(fuelText);
	  
	  $('.vehicle-info-container').css('opacity','1');
	  
    }.bind(this))


  }


  loadNew() {
    this.getYears();
  }


  initialize() {

	  chrome.storage.sync.get(null, function(items) {
		  
		 console.log(items);
	 
	  if(items.hasOwnProperty("type")){
		 
		
		this.loadStateFromStorage(items);
	  
	  }else{
		   //load from 
		this.loadNew();
	  }
    // Update status to let user know options were saved.
   // var status = document.getElementById('status');
   }.bind(this));

  }


}

$(document).ready(function() {
  console.log("ready!");

  settingsController = new SettingsController();
  settingsController.initialize();

  var vehicleId;

});
//$('.ui.dropdown').dropdown({
// onChange: function(text, value) {
//get menu


//}
//});

