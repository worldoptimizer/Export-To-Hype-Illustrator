/*!
 * Export to Hype
 * Copyright Max Ziebell 2023
 * v1.1.8
 */

/*
 * Version History
 *
 * 1.0.0  Initial Release
 * 1.0.1  GUI updates and JS export as Base64 encoding
 * 1.0.2  Visibility option, new font option, quickfix for underscores _x5F
 * 1.0.3  Export of named text layer based values
 * 1.0.4  Fixed exports text
 * 1.0.5  Fixed linefeed, separate extras, inline SVG, remove SVG Glyph support
 * 1.0.6  added new CSS variables mode, fixed SVG Illustrator default group
 * 1.0.7  empty frames and text frame (beta)
 * 1.0.8  Non render blocking base 64 encoding
 * 1.0.9  SVG URI mode in based on CSS Tricks
 * 1.1.0  Various Bugfixes
 * 1.1.1  Settings file, Fontmapping
 * 1.1.2  Released as Open Source (MIT),
 *        Added Hype Template export type,
 * 1.1.3  Added optimization using Export To Hype Helper.app (SVG cleaner)
 * 1.1.4  Refactored and cleaned code using writeFile and readFile
 *        Added FontManager to map fonts visually
 * 1.1.5  Simplified interface by refactoring webfont setting
 *        Fixed document width and height determination using crop box
 * 1.1.6  Added check if is saved with .ai extension
 *        Added option to rename duplicate layer names
 *        Fixed offset when art board isn't at 0,0
 *        Fixed rounding error when exporting to Hype
 *        Fixed 1346458189 ('MRAP') bug, zero width/height caused export to fail
 * 1.1.7  Save settings on a document basis in settings file or remove settings if not needed
 *        Fixed bug where FontManager wouldn't save settings with document based settings file
 *        Fixed size/position by getting artboard bounds from copy of artboard not original
 *        Fixed font weight and style mapping on fonts
 * 1.1.8  Hype native fonts are now named like the layer and get the same class name
 *        FontManager displays only changed fonts allowing to set any font name
 *        Added a better rounding approach, see getLayerBoundsAsObjectMaxed
 */

/* 
// BEGIN__HARVEST_EXCEPTION_ZSTRING
 
<javascriptresource>
	<name>Export to Hype...</name>
	<category>scriptexport</category>
	<enableinfo>true</enableinfo>
	<menu>export</menu>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING
*/

//@target illustrator

// IIFE begin
;(function () {

	polyfills();

	/* @const */
	const _version = '1.1.8';

	// Load settings
	var localDocumentSettings = loadDocumentSettings();
	
	// DIALOG
	// ======
	var dialog = new Window("dialog"); 
		dialog.text = "Export to Hype"; 
		dialog.orientation = "column"; 
		dialog.alignChildren = ["center","top"]; 
		dialog.spacing = 10; 
		dialog.margins = 16; 
	
	// HEADERGROUP
	// ===========
	var headerGroup = dialog.add("group", undefined, {name: "headerGroup"}); 
		headerGroup.orientation = "row"; 
		headerGroup.alignChildren = ["left","center"]; 
		headerGroup.spacing = 10; 
		headerGroup.margins = 0; 
	
	var headerImage = headerGroup.add("image", undefined, File.decode(getLogoImage()), {name: "headerImage"}); 
		headerImage.helpTip = "Export To Hype"; 
		headerImage.preferredSize.width = 180;
		headerImage.preferredSize.height = 70;
		
	var headerTextContentForLoop = [
			"This tool exports top-level layers",
			"to cropped SVG files and creates a",
			"file usable in Tumult Hype 4 based",
			"on your Illustrator document.",
		]
	
	var headerGroupCol = headerGroup.add("group", undefined, {name: "headerGroupCol"});
		headerGroupCol.orientation = "column";
		headerGroupCol.alignChildren = ["left","center"];
		headerGroupCol.spacing = 0;
		headerGroupCol.margins = 0;
	
	for (var i = 0; i < headerTextContentForLoop.length; i++) {
		var headerText = headerGroupCol.add("statictext", undefined , {name: "headerText"});
			headerText.preferredSize.width = 210;
			headerText.preferredSize.height = 13;
			headerText.alignChildren = ["left","center"];
			headerText.text = headerTextContentForLoop[i];
			headerText.graphics.foregroundColor = headerText.graphics.newPen(headerText.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5], 1);
			headerText.graphics.font = "dialog:9";
	}
		
	// EXPORTPANEL
	// ===========
	var exportPanel = dialog.add("panel", undefined, undefined, {name: "exportPanel"}); 
		exportPanel.text = "Export as"; 
		exportPanel.orientation = "column"; 
		exportPanel.alignChildren = ["left","top"]; 
		exportPanel.margins = 10;
		exportPanel.preferredSize.width = 400;
		
	// EXPORTTYPE
	// ==========
	var exportType = exportPanel.add("group", undefined, {name: "exportType"}); 
		exportType.orientation = "column"; 
		exportType.alignChildren = ["left","center"]; 
		exportType.spacing = 6; 
		exportType.margins = [0,10,0,0]; 
		
	var radioButton1 = exportType.add("radiobutton", undefined, undefined, {name: "radioButton1"}); 
		radioButton1.text = "Hype Template"; 
		radioButton1.helpTip = "Select this export type to save a Hype Template.";
	//	radioButton1.value = true; 
		
	var radioButton2 = exportType.add("radiobutton", undefined, undefined, {name: "radioButton2"});
		radioButton2.helpTip = "Select this export type to save a Hype Symbol.";
		radioButton2.text = "Hype Symbol"; 
		
	var radioButton3 = exportType.add("radiobutton", undefined, undefined, {name: "radioButton3"});
		radioButton3.helpTip = "Select this export type to save only the resources (great for updating and relinking layer manually).";
		radioButton3.text = "Resources only";
	

	// Set the selected radio button based on the localDocumentSettings.exportType
	if (localDocumentSettings.exportType === "symbol") {
		radioButton2.value = true;
	} else if (localDocumentSettings.exportType === "resources") {
		radioButton3.value = true;
	} else {
		// template is the default
		radioButton1.value = true;
	}

	// Update the localDocumentSettings.exportType whenever the radio buttons are clicked
	radioButton1.onClick = function() {
		delete localDocumentSettings.exportType;
	}
	radioButton2.onClick = function() {
		localDocumentSettings.exportType = "symbol";
	}
	radioButton3.onClick = function() {
		localDocumentSettings.exportType = "resources";
	}

	// OPTIONTABS
	// ==========
	var optionTabs = dialog.add("tabbedpanel", undefined, undefined, {name: "optionTabs"}); 
		optionTabs.alignChildren = "fill"; 
		optionTabs.preferredSize.width = 400; 
		optionTabs.margins = 0; 
	
	// BASICOPTIONS
	// ============
	var basicOptions = optionTabs.add("tab", undefined, undefined, {name: "basicOptions"}); 
		basicOptions.text = "Pick your options"; 
		basicOptions.orientation = "column"; 
		basicOptions.alignChildren = ["left","top"]; 
		basicOptions.spacing = 10; 
		basicOptions.margins = 10; 
	
	// extraOptions
	// ===============
	var extraOptions = optionTabs.add("tab", undefined, undefined, {name: "extraOptions"}); 
		extraOptions.text = "Export addons"; 
		extraOptions.orientation = "column"; 
		extraOptions.alignChildren = ["left","top"]; 
		extraOptions.spacing = 10; 
		extraOptions.margins = 10; 
	
	// OPTIONTABS
	// ==========
	optionTabs.selection = basicOptions; 

	// PANEL1
	// ======
	var panel1 = basicOptions.add("group", undefined, undefined, {name: "panel1"}); 
		panel1.orientation = "column"; 
		panel1.alignChildren = ["left","top"]; 
		//panel1.spacing = 10; 
		panel1.margins = [5,10,0,5];
	
	// Visibility
	var optionsRow = panel1.add("group", undefined, {name: "optionsRow"}); 
		optionsRow.orientation = "row"; 
		optionsRow.alignChildren = ["left","center"]; 
		optionsRow.spacing = 5; 
		optionsRow.margins = 0; 
	
	var optionsText1 = optionsRow.add("statictext", undefined, undefined, {name: "optionsText1"}); 
		optionsText1.helpTip = ''; 	
		optionsText1.text = "Export"; 
	
	var visibilityMode_array = ["visible", "all"]; 
	var visibilityMode = optionsRow.add("dropdownlist", undefined, undefined, {name: "FontMode", items: visibilityMode_array}); 
		visibilityMode.helpTip = "Determine top-level layers to be included in exports"
		visibilityMode.alignment = ["left","top"];

	// Set the selection based on localDocumentSettings.visibilityMode
	visibilityMode.selection = localDocumentSettings.visibilityMode || 0;

	// Store the new value in localDocumentSettings.visibilityMode when the user changes the setting
	visibilityMode.onChange = function() {
		if (visibilityMode.selection.index != 0) {
			localDocumentSettings.visibilityMode = visibilityMode.selection.index;
		} else {
			delete localDocumentSettings.visibilityMode;
		}
	};
	
	var optionsText2 = optionsRow.add("statictext", undefined, undefined, {name: "optionsText2"}); 
		optionsText2.helpTip = ''; 	
		optionsText2.text = "top-level layers in"; 
	
	var _embedMode_linked = 0;
	var _embedMode_inlined = 1;
	// var _embedMode_webfont = 2;
	var embedMode_array = ["linked", "inlined"]; //, "webfont"]; 
	var embedMode = optionsRow.add("dropdownlist", undefined, undefined, {name: "Embed", items: embedMode_array}); 
		embedMode.helpTip = "Determine if SVG are linked or inlined"
		embedMode.alignment = ["left","top"];
	
	// Set the selection based on localDocumentSettings.embedMode
	embedMode.selection = localDocumentSettings.embedMode || 0;

	// Store the new value in localDocumentSettings.embedMode when the user changes the setting
	embedMode.onChange = function() {
		if (embedMode.selection.index != 0) {
			localDocumentSettings.embedMode = embedMode.selection.index;
		} else {
			delete localDocumentSettings.embedMode;
		}
	};

	var optionsText3 = optionsRow.add("statictext", undefined, undefined, {name: "optionsText3"}); 
		optionsText3.helpTip = ''; 	
		optionsText3.text = "mode"; 
	
	
	var optionsRow2 = panel1.add("group", undefined, {name: "optionsRow2"}); 
		optionsRow2.orientation = "row"; 
		optionsRow2.alignChildren = ["left","center"]; 
		optionsRow2.spacing = 5; 
		optionsRow2.margins = 0; 
	
		var optionsText4 = optionsRow2.add("statictext", undefined, undefined, {name: "optionsText4"}); 
		optionsText4.helpTip = ''; 	
		optionsText4.text = "and render font layers"; 
	
	// FONTMODE
	// ========

	var _FontMode_outlined_paths = 0;
	var _FontMode_regular_text_webfont = 1;
	var _FontMode_empty_rectangle = 2;
	var _FontMode_native_text = 3;
	var _FontMode_not_at_all = 4;
	//var _FontMode_glyph_paths = 5;
	var FontMode_array = [
		"as outlined paths (flattend)",
		"as regular text (using webfonts)",
		"as empty rectangles (CSS class)",
		"as native Hype text elements",
		"not at all (ignore)",
	//	"as outlined glyphs (depreciated)",
	];
	var FontMode = optionsRow2.add("dropdownlist", undefined, undefined, {name: "FontMode", items: FontMode_array}); 
		FontMode.helpTip = "You can either rely on the browser or your project to deliver the CSS font-family or render the fonts to path outlines and embed them into your SVG files (default). Using paths produces bigger SVG files but is compatible with SVGs as background images.";
		FontMode.alignment = ["left","top"];

		// Set the selection based on localDocumentSettings.FontMode
		FontMode.selection = localDocumentSettings.FontMode || 0;
		
		FontMode.onChange = function(){ 
			//store the new value in localDocumentSettings.FontMode
			if (FontMode.selection.index != 0) {
				localDocumentSettings.FontMode = FontMode.selection.index;
			} else {
				delete localDocumentSettings.FontMode;
			}
			// enable/disable the fontMapperBtn
			optionsRow3.enabled = (FontMode.selection.index == _FontMode_regular_text_webfont || FontMode.selection.index == _FontMode_native_text);
		};
		
	
	// FONTMAPPER
	// ==========
	var optionsRow3 = panel1.add("group", undefined, {name: "optionsRow3"}); 
	optionsRow3.orientation = "row"; 
	optionsRow3.alignChildren = ["left","center"]; 
	optionsRow3.spacing = 5; 
	optionsRow3.margins = 0;
	// trigger FontMode.onChange to set the enabled state of the fontMapperBtn
	FontMode.onChange();
	
	var optionsText5 = optionsRow3.add("statictext", undefined, undefined, {name: "optionsText5"}); 
	optionsText5.helpTip = ''; 	
	optionsText5.text = "For web or Hype fonts setup the";
	
	var fontMapperBtn = optionsRow3.add("button", undefined, undefined, {name: "fontMapperBtn"}); 
	fontMapperBtn.text = "Font Mapper"; 
	fontMapperBtn.preferredSize.height = 20; 
	fontMapperBtn.onClick = function() {
		try {
			FontMapperDialog(localDocumentSettings);
		} catch (e){
			alert(e)
		}
	}
		
		
	// DIVIDER
	// ==========
	var divider1 = panel1.add ("panel", undefined, undefined, {name: "dividerl"});
		divider1.alignment = "fill";
		divider1.preferredSize.height = 1;


	// OPTIONS
	// ==========
	var exportHelperPath = getExportToHypeHelperPath();
	var canOptimize = exportHelperPath!==null;
	var shouldOptimize = panel1.add("checkbox", undefined, undefined, { name: "shouldOptimize" });
		shouldOptimize.helpTip = "Uncheck this if you don't want to use SVG Cleaner on your export (depends on Export To Hype Helper)).";
		shouldOptimize.text = "Run SVG Cleaner on export (using Export To Hype Helper)";
		shouldOptimize.alignment = ["left", "top"];
		shouldOptimize.value = localDocumentSettings.shouldOptimizIsFalse? false : canOptimize;
		shouldOptimize.enabled = canOptimize;
	
	// Store the new value in localDocumentSettings.shouldOptimize when the user changes the setting
	shouldOptimize.onClick = function() {
		if (!shouldOptimize.value) {
			localDocumentSettings.shouldOptimizIsFalse = true;
		} else {
			delete localDocumentSettings.shouldOptimizIsFalse;
		}
	};
	
	if (!canOptimize){
		// OPTIMGROUP
		// ==========
		var optimGroup = panel1.add("group", undefined, {name: "optimGroup"}); 
			optimGroup.orientation = "row"; 
			optimGroup.alignChildren = ["left","center"]; 
			optimGroup.spacing = 0; 
			optimGroup.margins = [7,0,0,0]; 
		
		var optimDivider = optimGroup.add("panel", undefined, undefined, {name: "optimDivider"}); 
			optimDivider.alignment = "fill";
		
		var optimText = optimGroup.add("statictext", undefined, undefined, {name: "optimText"}); 
			optimText.text = "    To enable cleaning install"; 
			optimText.preferredSize.width = 180;
			
		var optimBtn = optimGroup.add("button", undefined, undefined, {name: "optimBtn"}); 
			optimBtn.text = "Export To Hype Helper";
			optimBtn.onClick = function() {
				openURL('https://github.com/worldoptimizer/Export-To-Hype-Illustrator')
			} 
	}

	var customSave = panel1.add("checkbox", undefined, undefined, {name: "customSave"}); 
		customSave.helpTip = "If you check this option Export to Hype will ask you for a folder to save the symbol."; 
		customSave.text = "Save at custom destination (rather then alongside .AI)"; 
		customSave.alignment = ["left","top"];

	customSave.value = localDocumentSettings.customSave || false;

	// Store the new value in localDocumentSettings.customSave when the user changes the setting
	customSave.onClick = function() {
		if (customSave.value) {
			localDocumentSettings.customSave = customSave.value;
		} else {
			delete localDocumentSettings.customSave;
		}
	};
	
	// PANEL2
	// ======
	var panel2 = extraOptions.add("group", undefined, undefined, {name: "panel1"}); 
		panel2.orientation = "column"; 
		panel2.alignChildren = ["left","top"]; 
		//panel2.spacing = 10; 
		panel2.margins = [5,10,0,5];
		
	// Base 64
	var base64Row = panel2.add("group", undefined, {name: "base64Row"}); 
		base64Row.orientation = "row"; 
		base64Row.alignChildren = ["left","center"]; 
		base64Row.spacing = 5; 
		base64Row.margins = 0; 
	
	var enableAddons = base64Row.add("checkbox", undefined, undefined, {name: "enableAddons"}); 
		enableAddons.helpTip = "Check this if you want to export URI encoded SVG into a CSS file, targeting your SVG image rectangles by CSS class names. It offers an option to also export data for tools like Hype Data Magic."; 
		enableAddons.text = "Export"; 
		enableAddons.alignment = ["left","center"];

		enableAddons.value = localDocumentSettings.enableAddons || false;

		enableAddons.onClick = function() {
			if (enableAddons.value) {
				localDocumentSettings.enableAddons = true;
			} else {
				delete localDocumentSettings.enableAddons;
			}
			addonsMode.enabled = !!enableAddons.value;
			dataURItext1.enabled = !!enableAddons.value;
			dataURIMode.enabled = !!enableAddons.value;
		}
	
	var addonsMode_array = [
		"CSS file (URI)", 						// 0
		"CSS file (Content)",					// 1
		"CSS files (URI, Content)",				// 2
		"CSS file (Variables)",					// 3
		"CSS files (URI, Variables)",			// 4
		"JavaScript file (URI)",				// 5
		"JavaScript file (Data)",				// 6
		"JavaScript files (URI, Data)",			// 7
		"all available formats"					// 8
	]; 
	var addonsMode = base64Row.add("dropdownlist", undefined, undefined, {name: "addonsMode", items: addonsMode_array}); 
		addonsMode.helpTip = ""
		addonsMode.selection = localDocumentSettings.addonsMode || 0;
		addonsMode.alignment = ["left","center"];
		addonsMode.enabled = false;
	
		addonsMode.onChange = function() {
			if (localDocumentSettings.addonsMode != 0) {
				localDocumentSettings.addonsMode = addonsMode.selection.index;
			} else {
				delete localDocumentSettings.addonsMode;
			}
		}

	
	var dataURItext1 = base64Row.add("statictext", undefined, undefined, {name: "dataURItext1"}); 
		dataURItext1.helpTip = ''; 	
		dataURItext1.text = "using";
		dataURItext1.enabled = false;
	
	var _dataURIMode_svg = 0;
	var _dataURIMode_base64 = 1;
	var dataURIMode_array = ["SVG", "Base64"];
	var dataURIMode = base64Row.add("dropdownlist", undefined, undefined, {name: "DataURI", items: dataURIMode_array}); 
		dataURIMode.helpTip = "Determine if SVG is made URI safe or Base 64 encoded (bigger)."
		dataURIMode.selection = localDocumentSettings.dataURIMode || 0;
		dataURIMode.alignment = ["left","top"];
		dataURIMode.enabled = false;

		dataURIMode.onChange = function() {
			if (localDocumentSettings.dataURIMode != 0) {
				localDocumentSettings.dataURIMode = dataURIMode.selection.index;
			} else {
				delete localDocumentSettings.dataURIMode;
			}
		}

	// trigger the onClick function to set the initial state of the UI
	enableAddons.onClick();
	
	var prefixRow = panel2.add("group", undefined, {name: "prefixRow"}); 
    	prefixRow.orientation = "row"; 
    	prefixRow.alignChildren = ["left","center"]; 
    	prefixRow.spacing = 10; 
    	prefixRow.margins = 0; 
	
	var statictext8 = prefixRow.add("statictext", undefined, undefined, {name: "statictext8"}); 
		statictext8.helpTip = 'Given your layer is named "Layer 1" the resulting SVG file will be "Layer_1.svg" and if you added a prefix called "myProject_" it would become "myProject_Layer_1.svg".'; 	
		statictext8.text = "Prefix for file and CSS class names:"; 
	
	var prefix = prefixRow.add('edittext {properties: {name: "prefix"}}'); 
		prefix.preferredSize.width = 150;
    	prefix.text = localDocumentSettings.prefix || "";

		prefix.onChange = function() {
			prefix.text = prefix.text.replace(/[^a-zA-Z0-9_]/g, '');
			if (prefix.text) {
				localDocumentSettings.prefix = prefix.text;
			} else {
				delete localDocumentSettings.prefix;
			}
		}
	
	// GROUP1
	// ======
	var group1 = dialog.add("group", undefined, {name: "group1"}); 
		group1.orientation = "row"; 
		group1.alignChildren = ["left","bottom"]; // before center
		//group1.spacing = 20; 
		group1.margins = 0;
		group1.preferredSize.height = 40;
		
		// Using this workaround to make the about text and version behave as one entity
		// https://github.com/adamdehaven/Specify/blob/master/Specify.jsx
		function customDraw() {
			this.graphics.drawOSControl();
			this.graphics.rectPath(0, 0, this.size[0], this.size[1]);
			if (this.text) this.graphics.drawString(this.text, this.textPen, 0, 3, this.graphics.font);
			this.graphics.drawString( "Version "+_version, this.textPen, 0, 18, this.graphics.font);
		}
	
	var aboutToolButton = group1.add('iconbutton', undefined, undefined, { name: 'aboutToolButton', style: 'toolbutton' });
		aboutToolButton.size = [135, 30];
		aboutToolButton.text = "Disclaimer & About";
		aboutToolButton.textPen = aboutToolButton.graphics.newPen(aboutToolButton.graphics.PenType.SOLID_COLOR, [0.5,0.5, 0.5], 1);
		aboutToolButton.onDraw = customDraw;
		aboutToolButton.onClick = function() {
			
			// DIALOGABOUT
			// ===========
			var dialogAbout = new Window("dialog"); 
				dialogAbout.text = "Disclaimer and About"; 
				dialogAbout.preferredSize.width = 200; 
				//dialogAbout.preferredSize.height = 400; 
				dialogAbout.orientation = "column"; 
				//dialogAbout.alignChildren = ["center","top"]; 
				dialogAbout.spacing = 10; 
				dialogAbout.margins = 16; 

			var credits = dialogAbout.add("group"); 
				credits.preferredSize.width = 300; 
				credits.orientation = "column"; 
				credits.alignChildren = ["left","center"]; 
				credits.spacing = 0; 
			
				credits.add("statictext", undefined, "This tool is put together by Max Ziebell,", {name: "credits"}); 
				credits.add("statictext", undefined, "https://maxziebell.de, copyright 2021. Inspired", {name: "credits"}); 
				credits.add("statictext", undefined, "by work from Sergey Osokin (creold). Many", {name: "credits"}); 
				credits.add("statictext", undefined, "thanks to Kalle Tewes and the 'Visueller", {name: "credits"}); 
				credits.add("statictext", undefined, "Faktencheck' team (Deutsche Presse Agentur)", {name: "credits"}); 
				credits.add("statictext", undefined, "for support, funding and feedback.", {name: "credits"}); 
				credits.preferredSize.width = 300; 

			var disclaimer = dialogAbout.add("group"); 
				disclaimer.preferredSize.width = 300; 
				disclaimer.orientation = "column"; 
				disclaimer.alignChildren = ["left","center"]; 
				disclaimer.spacing = 0; 
			
				disclaimer.add("statictext", undefined, "This tool is based on ExtendScript and Script-", {name: "disclaimer"}); 
				disclaimer.add("statictext", undefined, "UI. It offers functionality that is heavily", {name: "disclaimer"}); 
				disclaimer.add("statictext", undefined, "dependent on the undocumented file format of", {name: "disclaimer"}); 
				disclaimer.add("statictext", undefined, "Tumult Hype Symbol templates and therefor", {name: "disclaimer"}); 
				disclaimer.add("statictext", undefined, "the functionality cannot be guaranteed.", {name: "disclaimer"}); 
				disclaimer.preferredSize.width = 300; 

			var warranty = dialogAbout.add("group"); 
				warranty.preferredSize.width = 300; 
				warranty.preferredSize.height = 230;
				warranty.orientation = "column"; 
				warranty.alignChildren = ["left","center"]; 
				warranty.spacing = 0; 

				warranty.add("statictext", undefined, "THE SOFTWARE IS PROVIDED \u0022AS IS\u0022, WITHOUT", {name: "warranty"}); 
				warranty.add("statictext", undefined, "WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,", {name: "warranty"}); 
				warranty.add("statictext", undefined, "INCLUDING BUT NOT LIMITED TO THE", {name: "warranty"}); 
				warranty.add("statictext", undefined, "WARRANTIES OF MERCHANTABILITY, FITNESS", {name: "warranty"}); 
				warranty.add("statictext", undefined, "FOR A PARTICULAR PURPOSE AND", {name: "warranty"}); 
				warranty.add("statictext", undefined, "NONINFRINGEMENT. IN NO EVENT SHALL THE", {name: "warranty"}); 
				warranty.add("statictext", undefined, "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE", {name: "warranty"}); 
				warranty.add("statictext", undefined, "FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,", {name: "warranty"}); 
				warranty.add("statictext", undefined, "WHETHER IN AN ACTION OF CONTRACT, TORT", {name: "warranty"}); 
				warranty.add("statictext", undefined, "OR OTHERWISE, ARISING FROM, OUT OF OR IN", {name: "warranty"}); 
				warranty.add("statictext", undefined, "CONNECTION WITH THE SOFTWARE OR THE USE", {name: "warranty"}); 
				warranty.add("statictext", undefined, "OR OTHER DEALINGS IN THE SOFTWARE.", {name: "warranty"}); 
				warranty.preferredSize.width = 300; 
				warranty.preferredSize.height = 230;
				
			var donation = dialogAbout.add("group"); 
				donation.preferredSize.width = 300; 
				donation.preferredSize.height = 40;
				donation.orientation = "column"; 
				donation.alignChildren = ["left","center"]; 
				donation.spacing = 0; 
				
				var donationText1 = donation.add("statictext", undefined, "Please, consider a donations or sponsorship", {name: "donation"}); 
				var donationText2 = donation.add("statictext", undefined, "to support the development of tools like this.", {name: "donation"});
				donationText1.graphics.foregroundColor = donationText1.graphics.newPen (donationText1.graphics.PenType.SOLID_COLOR, [0.5 ,1, 0.5], 1);
				donationText2.graphics.foregroundColor = donationText1.graphics.newPen (donationText2.graphics.PenType.SOLID_COLOR, [0.5 ,1, 0.5], 1);
				
				donation.preferredSize.width = 300; 
				donation.preferredSize.height = 40;
			
			var donationGroup = dialogAbout.add("group", undefined, {name: "donationGroup"}); 
				donationGroup.orientation = "row"; 
				donationGroup.alignChildren = ["left","center"]; 
				donationGroup.spacing = 10; 
				donationGroup.margins = 0; 
				donationGroup.alignment = ["left","top"]; 
			
			var donationBtn = donationGroup.add("button", undefined, undefined, {name: "donationBtn"}); 
				donationBtn.text = "Donation";
				donationBtn.preferredSize.height = 30;	
				donationBtn.onClick = function() {
					openURL('https://www.buymeacoffee.com/MaxZiebell')
				}
			
			var cancelBtn = donationGroup.add("button", undefined, undefined, {name: "cancelBtn"}); 
				cancelBtn.text = "Acknowledge and close"; 
				cancelBtn.preferredSize.height = 30; 
				cancelBtn.onClick = function() {
					dialogAbout.close();
				}

			dialogAbout.show();
		}
	
	
	var cancelBtn = group1.add("button", undefined, undefined, {name: "cancelBtn"}); 
		cancelBtn.text = "Cancel"; 
		cancelBtn.preferredSize.height = 30; 
		cancelBtn.onClick = function() {
			dialog.close();
		}
	
	var exportBtn = group1.add("button", undefined, undefined, {name: "exportBtn"}); 
		exportBtn.helpTip = "Click this button to export"; 
		exportBtn.text = "Export"; 
		exportBtn.preferredSize.width = 150; 
		exportBtn.preferredSize.height = 30; 
		exportBtn.onClick = function() {
			// "a CSS file (Base64)", 							// 0
			// "a CSS file (Content)",							// 1
			// "a CSS file (Base64, Content)",					// 2
			// "a CSS file (Variables)",						// 3
			// "a CSS file (Base64, Variables)",				// 4
			// "a JavaScript file (Base64)",					// 5
			// "a JavaScript file (Variables)",					// 6
			// "a JavaScript file (Base64,  Variables)",		// 7
			// "all available formats"							// 8
			var am = addonsMode.selection.index;
			var saveJS_uri = am==5||am==7||am==8;
			var saveJS_Data = am==6||am==7||am==8;
			var saveCSS_uri = am==0||am==2||am==4||am==8;
			var saveCSS_Content = am==1||am==2||am==8;
			var saveCSS_Variables = am==3||am==4||am==8;
			try{
				// Save settings or remove them if there are none
				if (countProperties(localDocumentSettings)) {
					saveDocumentSettings(localDocumentSettings);
				} else {
					removeDocumentSettings();
				}

				// Export the document
				HypeLayerExporter({
					enableAddons: enableAddons.value,
					saveJS_uri: saveJS_uri,
					saveJS_Data: saveJS_Data,
					saveCSS_uri: saveCSS_uri,
					saveCSS_Content: saveCSS_Content,
					saveCSS_Variables: saveCSS_Variables,
					customSave: customSave.value,
					onlyResources: exportType.children[2].value == true,
					saveAsSymbol: exportType.children[1].value == true,
					shouldOptimize: shouldOptimize.enabled && shouldOptimize.value,
					prefix: prefix.text,
					FontMode : FontMode.selection.index,
					visibilityMode : visibilityMode.selection.index,
					embedMode : embedMode.selection.index,
					dataURIMode : dataURIMode.selection.index,
				});
				
				
			} catch (e){
				alert(e + "\n Error on line: " + e.line)
			}
			dialog.close();
		}
	
	// start
	dialog.show();
		
	
	function HypeLayerExporter(o){
	
		if (!documents.length) return;
	
		// local
		var customSave = o.customSave || false;
		var onlyResources = o.onlyResources || false;
		var saveAsSymbol = o.saveAsSymbol || false; 
		var enableAddons = o.enableAddons || false;
		var prefix = o.prefix || '';
		var FontMode = o.FontMode || 0;
		var visibilityMode = o.visibilityMode || 0;
		var saveJS_uri = o.saveJS_uri || false;
		var saveJS_Data = o.saveJS_Data || false;
		var saveCSS_uri = o.saveCSS_uri || false;
		var saveCSS_Content = o.saveCSS_Content || false;
		var saveCSS_Variables = o.saveCSS_Variables || false;
		var embedMode = o.embedMode || 0;
		var dataURIMode = o.dataURIMode || 0;
		var shouldOptimize = o.shouldOptimize;
		var hypeExtension = saveAsSymbol? 'hypesymbol' : 'hypetemplate';
		
		// load settings
		var settings = loadSettings();

		// check if we have a doc path (doc is saved) and it is an AI file
		try {
	 		if (activeDocument.path.toString() == '') throw new Error();
			if (activeDocument.name.split('.').pop().toLowerCase() != 'ai') throw new Error();
	 		var docPath = activeDocument.path;
		} catch(e) {
	 		alert("Export to Hype: You need to save the document as an Illustrator file (.ai) before using this exporter!");
	 		return;
		}

		// prep more doc vars
		var docRef = app.activeDocument;
		var docWidth = docRef.width;
		var docHeight = docRef.height;
		var docName = docRef.name.substr(0, docRef.name.lastIndexOf('.'));

		// loop over top level layers and determine if we have unique names (offer to fix them if needed)
		var layerNames = {};
		for (var i = 0; i < docRef.layers.length; i++) {
			var layer = docRef.layers[i];
			if (layer.visible) {
				if (layerNames[layer.name]) {
					var result = confirm("Export to Hype: The layer '" + layer.name + "' is not unique. Do you want to rename it automatically to '" + layer.name + " " + layerNames[layer.name] + "'? "+"\n"+" Cancel to rename manually!");
					if (result) {
						layer.name = layer.name + " " + layerNames[layer.name];
						layerNames[layer.name] = 1;
					} else {
						return;
					}
				} else {
					layerNames[layer.name] = 1;
				}
			}
		}
		
		// check if we got a custom save path request
		if (!!customSave) {
			var customPath = Folder.selectDialog("Export to Hype: Please, select an output folder");
			if (!customPath) return;
			docPath = customPath;
		}

		// check and create folder structure for symbol
		var hypePath, hypeFolder, resourcesPath, resourcesFolder;
		try {
			if (onlyResources){
				resourcesPath = docPath + '/'+docName+' Resources';
				resourcesFolder = new Folder(resourcesPath);
				if (!resourcesFolder.exists) resourcesFolder.create();
			
			} else {	
				hypePath = docPath + '/'+docName  + '.' + hypeExtension;
				hypeFolder = new Folder(hypePath);
				if (!hypeFolder.exists) hypeFolder.create();
	
				resourcesPath = docPath + '/'+docName+ '.' + hypeExtension + '/Resources';
				resourcesFolder = new Folder(resourcesPath);
				if (!resourcesFolder.exists) resourcesFolder.create();
	
			}
		} catch(e) {
			if (onlyResources){
				alert("Export to Hype: Failed to create resource folder!");
			} else {
				alert("Export to Hype: Failed to create symbol folder!");
			}
			return;
		}
	
		// prep vars for plist recursive walk
		var resourcesStr = '';
		var groupsStr = '';
		var elementsStr = '';
		var svgEntries = [];
		var lid = 2;
		
		// store ruler and set to pixels
		var units = app.preferences.getIntegerPreference("rulerType", units);
		app.preferences.setIntegerPreference("rulerType", 6);

		// make sure we are using the right coordinate system
		app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
	
		var totalLayers = docRef.layers.length;
		var layerIndex;
		var layer;
		var layerVisibility = []
		var colorSpace = docRef.documentColorSpace;

	
		if (docRef.documentColorSpace == DocumentColorSpace.CMYK) {
			app.executeMenuCommand("doc-color-rgb");
		}
	
		// store visibility
		for (layerIndex = 0; layerIndex < totalLayers; layerIndex++) {
			layerVisibility[layerIndex] = docRef.layers[layerIndex].visible;
		}
	
		// hide all layers
		hideAllLayers(docRef);
		
		for (layerIndex = 0; layerIndex < totalLayers; layerIndex++) {
			// preparation
			layer = docRef.layers[layerIndex];
	
			// continue if no content
			if (!layer.pageItems.length) continue;
	
			// continue if layer hidden and user only wants visible layers
			if (visibilityMode==0 && !layerVisibility[layerIndex]) continue;
			
			// show
			layer.visible = true;
			
			// clean layer name
			var cleanLayerName = cleanName(prefix+layer.name);
	
			// copy and set color space
			var copyDoc = copyDocument(docRef);
			var copyDocNewLayer = copyDoc.layers.add();
			var rectangleForText = FontMode==_FontMode_empty_rectangle || FontMode == _FontMode_native_text;
			
			// transfer the needed and wanted properties
			transferLayerProperties(layer, copyDocNewLayer);
	
			// copy over page items based on options and return information about them
			var itemsForRectangles = copyLayerPageItems(layer, copyDocNewLayer, {
				ignoreText: FontMode == _FontMode_not_at_all, 
				rectangleForText: rectangleForText,
			});

			// check if we have text frames to consider
			var hasText = checkIfHasText(layer);
			
			// create text layer (Hype Font)
			if (rectangleForText) {
				for(var i= 0; i < itemsForRectangles.length; ++i){
					
					// shorthands
					var item = itemsForRectangles[i];
					
					// get layer bounds
					var lb = getLayerBoundsAsObjectMaxed(item.geometricBounds);

					// determine style and weight and remap if needed
					var textFontStyle = item.textRange.textFont.style;
					var _fontWeight = textFontStyle.toLowerCase().indexOf('bold')==-1? 'normal' : 'bold';
					var _fontStyle = textFontStyle.toLowerCase().indexOf('italic')==-1? 'normal' : 'italic';
					var _fontFamily = item.textRange.textFont.family;
					
					// check if we have a custom mapping or a Hype mapping
					var key = fontKey(_fontFamily, textFontStyle)
					var fontMappingCustom = settings['fontMappingCustom'][key];

					// lookup if there is a custom mapping 
					if (fontMappingCustom && fontMappingCustom.family){
						_fontFamily = fontMappingCustom.family;
						_fontWeight = fontMappingCustom.bold? 'bold': 'normal';
						_fontStyle = fontMappingCustom.italic? 'italic': 'normal';
					
					// lookup if there is a mapping in default Hype fonts
					} else if (settings['fontMappingHype'][key]){
						_fontFamily = settings['fontMappingHype'][key];
					
					// lookup if there is a mapping in default Hype fonts by font family alone
					} else if (settings['fontMappingHype'][_fontFamily]){
						_fontFamily = settings['fontMappingHype'][_fontFamily];
					
					}

					// Hype Quirk: if we have a bold italic font, we need to set the style to bold
					// also note that we are doing it after the custom mapping lookup to allow for custom mappings 
					// to lookup and override this based on native text range font style (see also FontMapper)
					if (_fontStyle == 'normal' && _fontWeight == 'bold') {
						_fontStyle = 'bold';
					}

					//check if we also transfer content and clean it if needed
					var _native = (FontMode == _FontMode_native_text);
					var _content = _native? item.contents : '';
					if(_native && _content!='') _content = _content
						.replace(/(?:\r\n|\r|\n)/gm, '<br />\n')
						.replace(/&/gm, '&amp;')
						.replace(/</gm, '&lt;')
						.replace(/>/gm, '&gt;');

					var _className = cleanLayerName+"_"+(item.name? cleanKey(item.name) : lid);
					// prep name (remove inline notation from name)
					var _name = layer.name.split('.')[0]+(item.name? ' ('+item.name+')': '');
					
					// Get the text color, note that each 
					var _textColor = item.textRange.fillColor;

					if (_textColor.typename == "SpotColor") {
						// create a new RGB color based on the spot color values
						var _rgbColor = new RGBColor();
						_rgbColor.red = _textColor.spot.color.red;
						_rgbColor.green = _textColor.spot.color.green;
						_rgbColor.blue = _textColor.spot.color.blue;

						// update the _textColor object with the new RGB color values
						_textColor = _rgbColor;
					}

					// check if it is a CMYK and convert to RGB
					if (_textColor.typename == "CMYKColor") {
						var c = [_textColor.cyan, _textColor.magenta, _textColor.yellow, _textColor.black];
						c = app.convertSampleColor(ImageColorSpace.CMYK, c, ImageColorSpace.RGB, ColorConvertPurpose.defaultpurpose);

						var _rgbColor = new RGBColor();
						_rgbColor.red = c[0];
						_rgbColor.green = c[1];
						_rgbColor.blue =c[2];

						// update the _textColor object with the new RGB color values
						_textColor = _rgbColor;
					}

					// if it's not a RGB at this point default to black
					if (_textColor.typename != "RGBColor") {
					var _rgbColor = new RGBColor();
						_rgbColor.red = 0;
						_rgbColor.green =0;
						_rgbColor.blue =0;

						// update the _textColor object with the new RGB color values
						_textColor = _rgbColor;
					}

					// add the text element to the list of elements
					elementsStr += textElementPlistString({
						name: _name, // 'Text', <-- old varation of naming it by type
						top: lb.top,
						left: lb.left,
						height: lb.height,
						// add a pixel to avoid line breaks
						width: lb.width+1,
						zIndex: 1000-lid,
						key: 10+lid,
						opacity: 100/100,
						className: _className,
						fontWeight: _fontWeight,
						fontFamily: _fontFamily,
						textColor: _textColor? RGBToHex(_textColor): '#000',
						fontSize: Math.floor(item.textRange.size),
						fontStyle: _fontStyle,
						paddingTop: 0, 
						paddingLeft: 0,
						paddingBottom: 0,
						paddingRight: 0,
						innerHTML: _content,
					});

					// increment the layer id
					lid++;
				}
			}
			if (copyDocNewLayer.pageItems.length) {
				//  trim copyDoc artboard to content on artboard
				app.executeMenuCommand('selectall');

				// get layer bounds
				var lb = getLayerBoundsAsObjectMaxed(copyDoc.visibleBounds);

				try{
					// try to assign artboardRect array at once
					copyDoc.artboards[0].artboardRect = [lb.left, -lb.top, lb.right, -lb.bottom];
				} catch(e){
					// if that fails, do it manually
					var ar = copyDoc.artboards[0].artboardRect, vb = copyDoc.visibleBounds;
					if (vb[2]-vb[0] < 1) vb[2] = vb[0]+1;
					if (vb[1]-vb[3] < 1) vb[3] = vb[1]-1;
					ar = [vb[0], vb[1], vb[2], vb[3]];
					copyDoc.artboards[0].artboardRect = ar;
				}

				// save
				// https://gist.github.com/iconifyit/2cbab3f0dd421b6d4bb520bfcf445f0d
				// http://jongware.mit.edu/iljscs6html/iljscs6/pc_ExportOptionsSVG.html
				var saveAsFileName = resourcesFolder.fullName + "/" + cleanLayerName +'.svg';
				var exportOptions = new ExportOptionsSVG();
				var saveFile = new File(saveAsFileName);
				//exportOptions.DTD = SVGDTDVersion.SVG1_1;
				exportOptions.DTD = SVGDTDVersion.SVG1_0;
				
				exportOptions.coordinatePrecision = 2;
				exportOptions.documentEncoding = SVGDocumentEncoding.UTF8;
				exportOptions.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
				
				// I am still evaluating the best default settings for this
				exportOptions.optimizeForSVGViewer = true;
				exportOptions.embedAllFonts = false;
				//exportOptions.sVGAutoKerning = true
				//exportOptions.embedRasterImages = true;
					
				switch (FontMode) {
					case _FontMode_outlined_paths:
						exportOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;	
						exportOptions.fontType = SVGFontType.OUTLINEFONT;
						break;
					
					case _FontMode_regular_text_webfont:
						exportOptions.fontSubsetting = SVGFontSubsetting.None;
						break;

					default:
						exportOptions.fontSubsetting = SVGFontSubsetting.None;
						break;
				}

				// export
				app.activeDocument.exportFile(saveFile, ExportType.SVG, exportOptions);
	
				// apply Font mappings to SVG to file (text replacement)
				runFontMappingOnSvgFile(saveAsFileName, $.assign({},
					settings.fontMappingCustom,
				));

				// clean SVG Illustrator produces
				if(shouldOptimize) {
					runSvgCleaner(saveAsFileName);
				} else {
					runHomebrewCleaner(saveAsFileName);
				}
	
				// prep name (remove inline notation from name)
				var name = layer.name.split('.')[0];
				var fileName = cleanLayerName+'.svg';
	
				// set original width and height
				var originalWidth = lb.width;
				var originalHeight = lb.height;
	
				// svg string
				var svg_string = '';
	
				// fontmode empty
				// this seems like we don't need this anymore, since we can just use the layer bounds)
				// var keep_layer_with_text_empty = FontMode==_FontMode_empty_rectangle && hasText;
				// tracked as #change 1.1.8#1 to be removed in the future
				
				// assume layers are linked (not inlined!)
				var linked_mode = true;
				// if globally requested to be inlined … inline!
				if (embedMode==_embedMode_inlined) linked_mode = false;
				// if webfont mode is set … inline!
				if (FontMode==_FontMode_regular_text_webfont && hasText) linked_mode = false;
				// if requested by the layer itself directly … inline
				if (layer.name.match(/\.inline\s*$/)) linked_mode = false;
				
				// encode SVG
				var svgdata = '';
				if (dataURIMode==_dataURIMode_base64){
					svgdata = fileToBase64(saveAsFileName)
				} else {
					svgdata = fileToTinyDataUri(saveAsFileName)
				}
	
				// svgdata
				if (enableAddons) svgEntries.push({
					className: '.'+cleanLayerName,
					varName: cleanLayerName,
					svgdata : svgdata,
					vardata : extractTemplateVars(layer),
				});
	
				// if (!keep_layer_with_text_empty) { // #change 1.1.8#1
					if (linked_mode) {
						// generate plist chunks
						groupsStr += groupPlistString({
							resourceId: lid,
							name: name,
							fileName: fileName,
						});
	
						// generate
						resourcesStr += resourcePlistString({
							resourceId: lid,
							name: name,
							fileName: fileName,
							fileSize: saveFile.length,
							// TODO think about md5 and date given missing shell
							modified: '2020-08-14T19:11:51Z',//formatDate(saveFile.modified),
							md5: 'F22A3B6E8D45689658852B3FB7EFF563', //md5ForFile(saveFile.fsName).toUpperCase(),
							originalPath: '',
						});
	
					} else {
						
						// read SVG to insert it in innerHTML
						svg_string = readFile(saveAsFileName);
						if (svg_string) svg_string = svg_string
							.replace(/&/gm, '&amp;')
							.replace(/</gm, '&lt;')
							.replace(/>/gm, '&gt;');
					}
				// } // #change 1.1.8#1
	
				elementsStr += elementPlistString({
					// #change 1.1.8#1
					// resourceId: (linked_mode && !keep_layer_with_text_empty) ? lid : null,
					resourceId: (linked_mode)? lid : null,
					name: name,
					top: lb.top,
					left: lb.left,
					height: Math.max(1, lb.height),
					width: Math.max(1, lb.width),
					originalWidth: originalWidth,
					originalHeight: originalHeight,
					zIndex: 1000-lid,
					key: 10+lid,
					innerHTML: (linked_mode) ? null : svg_string,
					opacity: layer.opacity/100,
					className: cleanLayerName,
				});
	
				// increment the layer id
				lid++;
			}
			
			// postprocessing
			layer.visible = false;
			copyDoc.close(SaveOptions.DONOTSAVECHANGES);
			copyDoc = null;
		}
		
		// save plist
		if (!onlyResources) writeFile(hypePath+'/data.plist', dataPlistString({
			hypeName: docName,
			saveAsSymbol: saveAsSymbol,
			width: Math.round(parseInt(docWidth)),
			height: Math.round(parseInt(docHeight)),
			resources: resourcesStr,
			groups: groupsStr,
			elements: elementsStr,
		}));
	
		// restore visibility
		for (layerIndex = 0; layerIndex < totalLayers; layerIndex++) {
			docRef.layers[layerIndex].visible = layerVisibility[layerIndex];
		}
	
		// restore ruler
		app.preferences.setIntegerPreference("rulerType", units);
	
		//restore color space if needed
		if (colorSpace == DocumentColorSpace.CMYK) {
			app.executeMenuCommand("doc-color-cmyk");
		}
	
		// save CSS
		if (enableAddons){
			var js_files = [];
			var css_files = [];
	
			if (saveCSS_uri) {
				// push into combined files
				css_files.push(docPath + '/'+docName+'-uri.css');
				// write single file
				saveLayerAsCSS_uri (
					docPath + '/'+docName+'-uri.css',
					svgEntries,
					docName,
				);
			}
			if (saveCSS_Content) {
				// push into combined files
				css_files.push(docPath + '/'+docName+'-content.css');
				// write single file
				saveLayerAsCSS_content (
					docPath + '/'+docName+'-content.css', 
					svgEntries,
					docName,
				);
			}
			if (saveCSS_Variables) {
				// push into combined files
				css_files.push(docPath + '/'+docName+'-variables.css');
				// write single file
				saveLayerAsCSS_variables (
					docPath + '/'+docName+'-variables.css', 
					svgEntries,
					docName,
				);
			}
			// save JS
			if (saveJS_uri) {
				// push into combined files
				js_files.push(docPath + '/'+docName+'-uri.js');
				// write single file
				saveLayerAsJS_uri (
					docPath + '/'+docName+'-uri.js', 
					svgEntries,
					docName,
				);
			}
	
			if (saveJS_Data) {
				// push into combined files
				js_files.push(docPath + '/'+docName+'-data.js');
				// write single file
				saveLayerAsJS_content (
					docPath + '/'+docName+'-data.js', 
					svgEntries,
					docName,
				);
			}
			
			// write additional combined if more than one file was produced
			if (css_files.length>1){
				combineFiles(css_files, docPath + '/'+docName+'-combined.css')
			}
			if (js_files.length>1){
				combineFiles(js_files, docPath + '/'+docName+'-combined.js')
			}
	
		}
	}

	

	/**
	 * SVG Cleaner is an application that cleans SVG files from unnecessary data, such as editor metadata, 
	 * comments, hidden elements, default or non-optimal values and other stuff that can be safely removed 
	 * or converted without affecting SVG rendering result. It also has a tool to remove attributes or 
	 * elements by their id or class.
	 *
	 * This function runs the SVG Cleaner Application, creates a copy of the passed file in the temp folder, 
	 * runs SVG Cleaner and overwrites the file with the cleaned SVG.
	 *
	 * @param {string} filePath - The path to the SVG file that should be cleaned
	 * @returns {boolean} true - If the SVG could be cleaned
	 * @returns {boolean} false - If the SVG could not be cleaned
	 */
	function runSvgCleaner(filePath) {
		var minifiedSvg = null;
	
		// just wait 100ms for any running exports
		$.sleep(100);
	
		// Remove temp files if needed
		var svgCleanerFile = new File(Folder.temp+'/temp.svg');
		if (svgCleanerFile.exists) svgCleanerFile.remove();
		
		var svgCleanerFile = new File(Folder.temp+'/temp.min.svg');
		if (svgCleanerFile.exists) svgCleanerFile.remove();
	
		// copy file to temp.svg
		var svgCleanerFile = new File(filePath);
		svgCleanerFile.copy(Folder.temp+'/temp.svg');
		
		// execute Export To Hype Helper.app
		var exportToHypeHelperApp = new File("/Applications/Export To Hype Helper.app");
		exportToHypeHelperApp.execute();
		
		// refresh reference (just to be safe)
		svgCleanerFile = new File(Folder.temp+'/temp.min.svg');
		
		// wait for max 2 seconds for file creation
		var svgCleanerFileExistsCounter = 0;
		while (true) {
			if (svgCleanerFileExistsCounter > 40) {
				if (confirm("SVG Cleaner failed or is still running!\n\nWait for another 4 seconds?")) {
					svgCleanerFileExistsCounter = 0;
				} else {
					break;
				}
			}
			// if the file exists
			if (svgCleanerFile.exists) {
				// wait 100ms and read the file
				$.sleep(100);
				minifiedSvg = readFile(svgCleanerFile);
				break;
			}
			
			// wait 100ms and loop again
			$.sleep(100)
			svgCleanerFileExistsCounter++;
		}

		// if we got a minifed SVG replace original
		if (minifiedSvg) {
			return writeFile(filePath, minifiedSvg);
		}
		return false;
	}


	/**
	 * This function gets the Export To Hype Helper path if it is installed
	 *
	 * @return {String} 
	 */
	function getExportToHypeHelperPath() {
		try {
			return new Folder('/Applications/Export To Hype Helper.app').exists? '/Applications/Export To Hype Helper.app' : null;
		} catch (e) {
			alert("Export to Hype: Error checking if Export To Hype Helper.app is installed", "Error", true);
			return null;
		}
	}
	
	
	/**
	 * decimalToHex takes a number and returns it converted base 16, aka hex
	 * @param {number} decimal number to convert to hex
	 * @returns {String} a hex string
	 */
	function decimalToHex(decimal) {
		var hex = decimal.toString(16);
		return hex;
	}

	/**
	 * padPrefix takes a string `s`, a desired width `width`, and a padding
	 * character `padChar`, and returns a string. If the length of `s` is
	 * less than `width`, `padChar` will be used to fill in the space.
	 * @param {String} s string to be padded
	 * @param {number} width desired width for the string
	 * @param {String} padChar character to pad string
	 * @returns {String} the padded string
	 */
	function padPrefix(s, width, padChar) {
		var paddedS = s;

		if(s.length < width) {
			var padding = new Array(width - paddedS.length + 1).join(padChar);
			var paddedS = padding + s;
		}

		return paddedS;
	}

	/**
 	 * RGBToHex takes numeric values for red, green, and blue, and returns
 	 * a hex string.
 	 * https://gist.github.com/jmsdnns/f170599dc98f036ba72a2618797f525d
 	 * @param {number} r red
 	 * @param {number} g green
 	 * @param {number} b blue
 	 * @returns {String} a hex string
 	 */
	function RGBToHex(o) {
		var r = o.red;
		var g = o.green;
		var b = o.blue;
	
		if (r < 0 || r > 255) alert("Red value should be between 0-255: " + r);
		if (g < 0 || g > 255) alert("Green value should be between 0-255: " + g);
		if (b < 0 || b > 255) alert("Blue value should be between 0-255: " + b);
		
		// Convert to hex
		r_hex = decimalToHex(r);
		g_hex = decimalToHex(g);
		b_hex = decimalToHex(b);
	
		// Pad any values that are a single character
		r_hex = padPrefix(r_hex, 2, "0");
		g_hex = padPrefix(g_hex, 2, "0");
		b_hex = padPrefix(b_hex, 2, "0");
	
		// Create hex string
		hex = "#" + r_hex + g_hex + b_hex;
	
		return hex;
	}
	
	/**
	 * Reads a file and returns the content
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @return {string} The content of the file
	 */
	 function readFile(file){
		if (!file) return null;
		var content = null, f;
		if (file instanceof File) {
			f = file;
		} else {
			f = new File(file);
			f.encoding = 'UTF8';
		}
		if (f.open('r')) {
			content = f.read();
			f.close();
		}
		return content;
	}
	
	/**
	 * Writes a file
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @param {string} content The content to write
	 * @return {boolean} True if the file was written
	 */
	 function writeFile(file, content){
		if (!file) return;
		var f;
		if (file instanceof File) {
			f = file;
		} else {
			f = new File(file);
			f.encoding = 'UTF8';
			f.lineFeed = 'unix';
		}
		if (f.open('w')) {
			f.write(content);
			f.close();
			return true;
		}
		return false;
	}
	 
	
	/**
	 * This code loads the global settings from a JSON file with the same name as the script, and then loads
	 * the document settings from a JSON file with the same name as the document. The document settings are
	 * then assigned to the global settings, overwriting any existing values.
	 *
	 * @returns {object} The global settings, with the document settings applied.
	 */
	function loadSettings(){
		// load
		var globalSettings = loadGlobalSettings();
		var documentSettings = loadDocumentSettings();
		// make sure keys exist
		//if (!globalSettings.fontMappingCustom) globalSettings.fontMappingCustom = {}
		//if (!documentSettings.fontMappingCustom) documentSettings.fontMappingCustom = {}
				
		// assign
		var settings = {}
		settings.fontMappingCustom = $.assign({},
			globalSettings.fontMappingCustom,
			documentSettings.fontMappingCustom
		);
		
		settings.fontMappingHype = $.assign({},
			globalSettings.fontMappingHype,
			documentSettings.fontMappingHype
		);
		// return
		return settings;
	}
	
	
	
	/**
	 * Get the global settings from the JSON file
	 * depends on the JSON Polyfill
	 *
	 * @returns {boolean|*}
	 */
	function loadGlobalSettings(){
		return loadSettingsFromPath($.fileName.replace('.jsx','.json'));
	}
	 
	 /**
	  * Get the document settings from the JSON file
	  * depends on the JSON Polyfill and the loadSettingsFromPath function
	  *
	  * @returns {boolean|*}
	  */
	 function loadDocumentSettings(){
		if(!activeDocument.path) return {};
		var docPath = activeDocument.path;
		var docName = activeDocument.name.substr(0, activeDocument.name.lastIndexOf('.'));
		document_settings_file = new File(docPath+ '/'+docName+'.json');
		return loadSettingsFromPath(document_settings_file);
	}
	 
	 /**
	  * Loads settings from a JSON file
	  * @param {string} path - Path to the JSON file
	  * @returns {object} - Settings object
	  */
	 function loadSettingsFromPath(path){
		 var settings_file = new File(path);
		 if (!settings_file.exists) return {};
		 
		 try{
			 return JSON.parse(readFile(settings_file));
		 } catch(e){
			 alert('Settings JSON file error! '+e)
		 }
	 }
	 
		 
	 /**
	  * Saves settings to a JSON file
	  * @param {string} path - Path to the JSON file
	  * @param {object} settings - Settings object
	  */
	 function saveSettingsToPath(path, settings){
		var settings_file = new File(path);
		return writeFile(settings_file, JSON.stringify(settings, null, '\t'));
	 }
	 
	 /**
	  * Saves the document settings to a JSON file
	  * depends on the JSON Polyfill and the saveSettingsToPath function
	  *
	  * @param {object} settings - Settings object
	  */
	 function saveDocumentSettings(settings){
		 if(!activeDocument.path) return false;
		 var docPath = activeDocument.path;
		 var docName = activeDocument.name.substr(0, activeDocument.name.lastIndexOf('.'));
		 document_settings_file = new File(docPath+ '/'+docName+'.json');
		 return saveSettingsToPath(document_settings_file, settings);
	 }
	 
	 
	 function removeDocumentSettings(){
		if(!activeDocument.path) return false;
		var docPath = activeDocument.path;
		var docName = activeDocument.name.substr(0, activeDocument.name.lastIndexOf('.'));
		document_settings_file = new File(docPath+ '/'+docName+'.json');
		if (document_settings_file.exists) {
			document_settings_file.remove();
			return true;
		}
		return false;
	 }
	 
	/**
	  * Read one or more files and write the content into a new file
	  *
	  * @param {Array} files Array of files or file paths to read
	  * @param {String|File} file Path to the file or a File object
	  */	
	 function combineFiles(files, file){
		 var content = '';
		 for (var i=0; i < files.length; ++i){
			 var filename = files[i];
			 content += readFile(filename);
		 }
		 writeFile(file, content);
	 }

	/**
	 * Save svg data to css file with background-uri property
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsCSS_uri(file, entries, docName){
		if (!file || !entries) return;
		var content = '';
		for (var i=0; i < entries.length; i++) {
			var className = entries[i].className;
			var svgdata = entries[i].svgdata;
			content += className+" {background: url(\""+svgdata+"\") no-repeat 50% 50%/contain !important;}\n";
		}
		return writeFile(file, content);
	}
	
	
	
	/**
	 * Create a CSS file with content
	 * 
	 * @param {String|File} file Path to the file or a File object
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsCSS_content(file, entries, docName){
		if (!file) return;
		var hasData = false;
		// check if we have data to process later
		for (var i=0; i<entries.length; i++) {
			var vardata = entries[i].vardata;
			if (countProperties(vardata)) hasData =  true;
		}
		if (hasData){
			var content = "";
			for (var i=0; i<entries.length; i++) {
				var varName = entries[i].varName;
				var vardata = entries[i].vardata;
				if (countProperties(vardata)){
					for (var key in vardata){
						var value = fixContentForCSS(vardata[key].contents);
						content += "."+varName+"_"+key+"::before { content : '"+value+"'; white-space: pre-wrap;}\n";
					}
				}
			}
			return writeFile(file, content);
		} else {
			return false;
		}
	}
	
	/**
	 * Save text layers entires as CSS variables
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsCSS_variables(file, entries, docName){
		if (!file) return;
		var hasData = false;
		// check if we have data to process later
		for (var i=0; i<entries.length; i++) {
			var vardata = entries[i].vardata;
			if (countProperties(vardata)) hasData =  true;
		}
		if (hasData){
			var content = ":root {\n";
			for (var i=0; i<entries.length; i++) {
				var varName = entries[i].varName;
				var vardata = entries[i].vardata;
				if (countProperties(vardata)){
					for (var key in vardata){
						var css_variable_name = ("--"+varName+"-"+cleanKey(key));
						var value = fixContentForCSS(vardata[key].contents);
						content += "\t"+css_variable_name+": '"+value+"';\n";
					}
				}
			}
			content += "}\n\n";
			for (var i=0; i<entries.length; i++) {
				var varName = entries[i].varName;
				var vardata = entries[i].vardata;
				if (countProperties(vardata)){
					for (var key in vardata){
						var css_variable_name = ("--"+varName+"-"+cleanKey(key));
						content += "."+varName+"_"+cleanKey(key)+"::before { content : var("+css_variable_name+"); white-space: pre-wrap;}\n";
					}
				}
			}
			writeFile(file, content);
		}
	}
	
	/**
	 * Write a javascript file with the embedded images data encoded in base64 format.
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsJS_uri(file, entries, docName){
		if (!file) return;
		var content = '';
		for (var i=0; i<entries.length; i++) {
			var varName = entries[i].varName;
			var svgdata = entries[i].svgdata;
			content += "window['Inline-"+varName+"']=window['"+cleanName(docName)+"_"+varName+"']=\""+svgdata+"\";\n";
		}
		return writeFile(file, content);
	}
	
	
	/**
	 * Save named text layers entires as JavaScript object variables 
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsJS_content(file, entries, docName){
		if (!file) return;
		var hasData = false;
		// check if we have data to process later
		for (var i=0; i<entries.length; i++) {
			var vardata = entries[i].vardata;
			if (countProperties(vardata)) hasData = true;
		}
		if (!hasData) return;
		var content = "window['Content_"+cleanName(docName)+"'] = {";
		for (var i=0; i<entries.length; i++) {
			var varName = entries[i].varName;
			var vardata = entries[i].vardata;
			if (countProperties(vardata)){
				content += "\n\t'"+varName+"' : {";
				for (var key in vardata){
					var value = fixContentForJS(vardata[key].contents);
					content += "\n\t\t'"+key+"' : '"+value+"', ";
				}
				content += "\n\t},";
			}		
		}
		content += "\n}";
		return writeFile(file, content);
	}

	/**
	 * Replace linebreaks with \a
	 *
	 * @param   {String} txt - Text to fix
	 * @returns {String} - Fixed text 
	 */
	function fixContentForCSS(txt){
		return txt.replace(/(?:\r\n|\r|\n)/gm, '\\a ')
	}
	

	/**
	 * Escapes new lines and tabs so that it can be used as a JavaScript string
	 *
	 * @param {string} txt the string to fix up
	 * @return {string} the fixed up string
	 */
	function fixContentForJS(txt){
		return txt.replace(/(?:\r\n|\r|\n)/gm, '\\n').replace(/(\t)/gm, '\\t')
	}
	
	/**
	 * Counts the number of properties in an object.
	 *
	 * @param {object} obj The object whose properties will be counted.
	 * @returns {number} The number of properties in the object.
	 */
	function countProperties(obj) {
    	var count = 0;
    	for(var prop in obj) {
        	if(obj.hasOwnProperty(prop))
            	++count;
    	}
    	return count;
	}
	
	/**
	 * Create a copy of the given document and return it. The copy has the same
	 * width, height, color space, and units as the original, but has no other
	 * layers or page items.
	 *
	 * @param {Document} doc the document to copy
	 * @return {Document} a copy of the document
	 */
	function copyDocument(doc) {
		var preset = new DocumentPreset();
		preset.width = doc.width;
		preset.height = doc.height;
		preset.colorMode = DocumentColorSpace.RGB;//doc.documentColorSpace;
		preset.units = doc.rulerUnits;
		var copy = app.documents.addDocument(DocumentColorSpace.RGB, preset);//doc.documentColorSpace, preset);
		// remove empty layer from new document preset
		for (i = 0; i < copy.layers.length; i++) {
		 	if (!copy.layers[i].pageItems.length) copy.layers[i].remove();
		}
		return copy;
	}
	
	/**
	 * Copy layer properties and from one layer to another.
	 *
	 * @param {Object} from
	 * @param {Object} to
	 */
	function transferLayerProperties(from, to) {
		to.artworkKnockout = from.artworkKnockout;
		to.blendingMode = from.blendingMode;
		to.color = from.color;
		to.dimPlacedImages = from.dimPlacedImages;
		to.isIsolated = from.isIsolated;
		to.name = from.name;
		to.opacity = from.opacity;
		to.preview = from.preview;
		to.printable = from.printable;
		to.sliced = from.sliced;
		to.typename = from.typename;
	}
	
	/**
	 * Copies all page items from one layer to another offering
	 *
	 * @param {Layer} from - The layer to copy from
	 * @param {Layer} to - The layer to copy to
	 * @param {Object} options - Settings that determine how to copy the page items
	 * @param {boolean} options.ignoreText - If true, will not copy any text frames
	 * @param {boolean} options.rectangleForText - If true, will collect text frames items to create Hype rectangles later on
	 * @returns {PageItem[]} An array of the rectangles that replaced the text frames (if any)
	 */
	function copyLayerPageItems(from, to, options) {
		var itemsForRectangles = [];
		var items = from.pageItems;
		for (var i = 0; i < items.length; ++i) {
			if (items[i].typename == 'TextFrame') {
				if(options.ignoreText) continue;
				if(options.rectangleForText) {
					itemsForRectangles.push(items[i]);//ref to original not copy!
					continue;
				}
			}
			items[i].duplicate(to, ElementPlacement.PLACEATEND);
		}
		return itemsForRectangles;
	}

	/**
	 * Checks if a layer contains any text.
	 *
	 * @param {Layer} layer The layer to check
	 * @return {boolean}
	 */
	function checkIfHasText(layer) {
		for (var i = 0; i < layer.pageItems.length; ++i) {
			if (layer.pageItems[i].typename == 'TextFrame') return true;
		}
		return false;
	}

	/**
	 * Extracts data from a template layer
	 *
	 * @param {Layer} layer - the layer containing the template
	 * @returns {Object} - an object containing all the editable elements as keys
	 */
	function extractTemplateVars(layer) {
		var data = {}
		for (var i = 0; i < layer.pageItems.length; ++i) {
			var item = layer.pageItems[i];
			if (item.typename == 'TextFrame' && item.name){
				data[cleanName(item.name)] = item;
			}
		}
		// recursive
		if (layer.layers.length > 0) {
			for (var i = 0; i < layer.layers.length; ++i) {
				// call recursively and merge results
				var extracted = extractTemplateVars(layer.layers[i]);
				for (var key in extracted) {
					data[key] = extracted[key];
				}
			}
		}
		// return to caller
		return data
	}
	
	/**
	 * Hide all layers in Illustrator document.
	 *
	 * @param {Document} document Illustrator document.
	 */
	function hideAllLayers(document) {
		var totalLayers = document.layers.length;
		var layerIndex;
		var layer;
		for (layerIndex = 0; layerIndex < totalLayers; layerIndex++) {
			layer = document.layers[layerIndex];
			layer.visible = false;
		}
	}

	/**
	* Transforms the bounds array [left, top, right, bottom] into an object with the properties
	* left, top, right, bottom, width, height
	* BUT maximize area to next integer (meaning to round down left and top, and round up right and bottom)
	*
	* @param  {Array}   lb  bounds array [left, top, right, bottom]
	* @return {Object}  object with the properties left, top, right, bottom, width, height, x and y
	*/
	function getLayerBoundsAsObjectMaxed(lb) {
		// Extract the left, top, right, and bottom values from the array
		const left = lb[0];
		const top = -lb[1];
		const right = lb[2];
		const bottom = -lb[3];

		// Calculate the width and height of the rectangle
		const width = right - left;
		const height = bottom - top;

		// Determine the center point of the rectangle
		const centerX = (left + right) / 2;
		const centerY = (top + bottom) / 2;

		// Determine the new left, top, right, and bottom points by snapping them to the nearest even number
		const newLeft = Math.floor(centerX - (width / 2)) % 2 === 0 ? Math.floor(centerX - (width / 2)) : Math.floor(centerX - (width / 2)) + 1;
		const newTop = Math.floor(centerY - (height / 2)) % 2 === 0 ? Math.floor(centerY - (height / 2)) : Math.floor(centerY - (height / 2)) + 1;
		const newRight = Math.ceil(centerX + (width / 2)) % 2 === 0 ? Math.ceil(centerX + (width / 2)) : Math.ceil(centerX + (width / 2)) - 1;
		const newBottom = Math.ceil(centerY + (height / 2)) % 2 === 0 ? Math.ceil(centerY + (height / 2)) : Math.ceil(centerY + (height / 2)) - 1;

		// Calculate the new width and height of the rectangle
		const newWidth = newRight - newLeft;
		const newHeight = newBottom - newTop;

		// Return the new rectangle as an object with the new left, top, right, bottom, width, and height properties
		return {
			left: newLeft,
			top: newTop,
			right: newRight,
			bottom: newBottom,
			width: newWidth,
			height: newHeight,
		};
	}

	/**
	 * Function that returns a number with the specified number of decimal places.
	 *
	 * @param  {Number} n number to round
	 * @param  {Number} decimals number of decimal places (optional, default: 2)
	 * @return {Number} rounded number
	 */
	function toFixed(n, decimals) {
		decimals = decimals || 2;
		const factor = Math.pow(10, decimals);
		const num = Math.round(n * factor) / factor;
		return num;
	}

	/**
	 * base64Encode
	 * based on https://www.labnol.org/code/19920-encode-decode-base64-javascript
	 *
	 * @param {string} e - the string to encode
	 * @return {string} the base64 encoded string
	 */
	
	function base64Encode(e) {
		var k = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var t = "";
		var n, r, i, s, o, u, a;
		var f = 0;
		//e = utf8_encode(e);
		l = e.length;
		var c = 0;
		while (c<l) {
			c+=1000;
			while (f < l && f < c) {
				n = e.charCodeAt(f++);
				r = e.charCodeAt(f++);
				i = e.charCodeAt(f++);
				s = n >> 2;
				o = (n & 3) << 4 | r >> 4;
				u = (r & 15) << 2 | i >> 6;
				a = i & 63;
				if (isNaN(r)) {
					u = a = 64
				} else if (isNaN(i)) {
					a = 64
				}
				t = t + k.charAt(s) + k.charAt(o) +
					k.charAt(u) + k.charAt(a)
			}
			$.sleep(1);
		}
		return t
	}
	
	/**
	 * This function is intended to remove all whitespace from a string,
	 * except for a single space between words.
	 *
	 * @param {String} str - the string to be compressed
	 * @returns {String} - the compressed string
	 */
	function collapseWhitespace(str) {
		str = trim(str);
		return str.replace(/\s+/g, ' ');
	}
	
	/**
	 * Encode the string parameter to be used as the payload of a data URI.
	 * 
	 * @param {string} string - the string to encode
	 * @returns {string} - the encoded string
	 */
	function dataURIPayload(string) {
		return encodeURIComponent(string)
		.replace(/%[\dA-F]{2}/g, specialHexEncode);
	}
	
	/**
	 * Encode some special characters to compresses the payload better
	 *
	 * @param {string} match - the matched character
	 * @returns {string} - the encoded character
	 */
	function specialHexEncode(match) {
		switch (match) { // Browsers tolerate these characters, and they're frequent
		case '%20': return ' ';
		case '%3D': return '=';
		case '%3A': return ':';
		case '%2F': return '/';
		default: return match.toLowerCase(); // compresses better
		}
	}
	
	/**
	 * This function converts SVG string to an URL-safe data URI.
	 *
	 * @param {string} svgString - the SVG string
	 * @returns {string} - the URL-safe data URI
	 */
	function svgToTinyDataUri(svgString) {
		if (typeof svgString !== 'string') return;
		// Strip the Byte-Order Mark if the SVG has one
		if (svgString.charCodeAt(0) === 0xfeff) { svgString = svgString.slice(1) }
		return 'data:image/svg+xml,' + dataURIPayload(collapseWhitespace(svgString));
	}

 	/**
  	* This function converts SVG file to an URL-safe data URI.
  	*
  	* @param {String|File} file Path to the file or a File object
  	* @returns {string} - the URL-safe data URI
  	*/
 	function fileToTinyDataUri(file) {
	 	return svgToTinyDataUri(readFile(file));
 	}
	
	/**
	 * Trim the leading and/or trailing white space
	 *
	 * @param {String} str
	 * @return {String}
	 */
	function trim (str) {
		return str.replace(/^\s+/,'').replace(/\s+$/,'');
	}

	/**
	 * Access a local file and convert it to base64
	 *
	 * @function fileToBase64
	 * @param {String|File} file Path to the file or a File object
	 * @returns {string} - The file as base64 encoded string.
	 */
	function fileToBase64(file) {
		var content = readFile(file);
		return content && ('data:image/svg+xml;base64,'+base64Encode(content));
	};
	
	/**
	 * Cleans up an SVG file as outputted by Illustrator. 
	 * This is a temporary solution until we have a binary to do the job.
	 *
	 * @param {String|File} file Path to the file or a File object
	 * @returns	{Boolean} true if file could be cleaned.
	 */
	function runHomebrewCleaner(file) {
		if (file) {
			var fileContents = readFile(file);
			if (!fileContents) return false;

			// cleanups
			// remove tabs, newlines
			fileContents = fileContents.replace( /[\r\n\t]+/gm, '');
			// remove escaped undescores
			fileContents = fileContents.replace('_x5F',''); //TODO better with regex only in classname
			// remove XML declaration
			fileContents = fileContents.replace('<?xml version="1.0" encoding="utf-8"?>', '');
			// remove comments
			fileContents = fileContents.replace( /<!--[\s\S]*?-->/gm,'');
			// remove SVG version
			fileContents = fileContents.replace(/<svg version="[\d.]*"/, '<svg');
			// remove empty group defenitions
			fileContents = fileContents.replace(/<g><\/g>/gm, '');
			// replace HTML IDs with classes
			fileContents = fileContents.replace(/ id="/gm, ' class="');
			
			/*
			// moved to font mapping routine…
			// replace quotes
			fileContents = fileContents.replace(/"/g, "'")
				// fix collateral after quotes replacement
				.replace(new RegExp("=''","gm"), "='")
				.replace(/''\s/g, "' ")
			*/
			// save
			return writeFile(file, fileContents);
		}
		return false;
	};

	/**
	 * Applies the font mapping to an SVG file.
	 * 
	 * @param {String|File} file Path to the file or a File object
	 * @returns	{Boolean} true if file could be mapped.
	 */
	function runFontMappingOnSvgFile(file, mapping) {
    	if (file) {
			var fileContents = readFile(file);
			if (fileContents!=null){
				fileContents = applyFontMappingToSvgString(fileContents, mapping);
				return writeFile(file, fileContents);
			}
    	}
    	return false;
	};

	/**
	* Apply font names using mapping (fontMappingForSVG)
	*
	* @param {string} svgString - SVG string
	* @param {object} mapping - mapping object
	* @returns {string} - SVG string with fixed font names
	*/
	function applyFontMappingToSvgString(svgString, mapping) {
		// Remove all mentions of "MT" that are not part of a font family name
		// This is a workaround for a bug in Illustrator using "MT" in font names
		// svgString = svgString.replace(/MT'"/g, '\'"');
		svgString = svgString.replace(new RegExp("MT'","gm"), "'");
		
		// loop through all font families
		for (var fontFamily in mapping){
			var fontMapping = mapping[fontFamily];
			var fontFamilyMapped = '';
			
			// font mapping can be a string or an object
			// This is to support complex settings like weight and style
			if (typeof fontMapping == 'object') {
				if (fontMapping.family) {
					fontMapping.family = trim(fontMapping.family)
						.replace(new RegExp("$'", "g"), '')
						.replace(new RegExp("'|", "g"), '');
					fontFamilyMapped += "font-family='"+fontMapping.family+"'";
				}
				// convert bold boolean to weight setting if not given
				if (fontMapping.bold && !fontMapping.weight) {
					fontMapping.weight = fontMapping.bold? 'bold' : 'normal';
				}
				// generate weight notation
				if (fontMapping.weight) {
					fontFamilyMapped += " font-weight='"+fontMapping.weight+"'";
				}
				// convert italic boolean to weight setting if not given
				if (fontMapping.italic && !fontMapping.style) {
					fontMapping.style = fontMapping.italic? 'italic' : 'normal';
				}
				// generate style notation
				if (fontMapping.style) {
					fontFamilyMapped += " font-style='"+fontMapping.style+"'";
				}
			// if fontMapping is a string, just use it
			} else {
				fontFamilyMapped = "font-family='"+fontMapping+"'";
			}

			// Replace font name in SVG string
			var fontFamilyCompact = fontFamily.split(' ').join('');
			
			// do a first pass to replace the font-family name based on a version without '-Regular'
			if(fontFamilyCompact.indexOf('-Regular') > -1) {
				svgString = svgString.replace(new RegExp("font-family=\"'"+fontFamilyCompact.replace('-Regular','')+"'\"","gm"), fontFamilyMapped);
			}
			
			// Do a second pass to replace the font-family name based on the compact version
			svgString = svgString.replace(new RegExp("font-family=\"'"+fontFamilyCompact+"'\"","gm"), fontFamilyMapped);

		}

		// replace quotes
		/*
		svgString = svgString.replace(/"/g, "'")
			// fix collateral after quotes replacement
			.replace(new RegExp("=''","gm"), "='")
			.replace(/''\s/g, "' ")
		*/
		// return SVG string
		return svgString;
	}
	
	function booleanOrValue(trueReturn, falseReturn, value) {
		if (typeof value === 'boolean'){
			return value? trueReturn : falseReturn;
		} else {
			return value;
		}
	}

	/**
	 * Opens a URL in the default browser
	 *
	 * @param {string} url The URL to open
	 * @return {boolean} True if the URL was opened
	 */
	function openURL(url){
		var file = new File(Folder.temp + '/temp.webloc');
		var content = '<?xml version="1.0" encoding="UTF-8"?>\n';
		content += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
		content += '<plist version="1.0">\n';
		content += '<dict>\n';
		content += '\t<key>URL</key>\n';
		content += '\t<string>' + url + '</string>\n';
		content += '</dict>\n';
		content += '</plist>\n';
		if (writeFile(file, content)) {
			file.execute();
			return true;
		}
		return false;
	}
	
	/**
	 * Generate suitable names by using the
	 * object name value as input string
	 *
	 * @param lname - the name value
	 * @returns the cleaned object name
	 */
	function cleanName(lname) {
		return lname.replace(/^\s+|\s+$/gm, '') // trim spaces
			.replace(/\s+[\-]+\s+/g, '_') // replace spaces, dashes, spaces with underscore
			.replace(/\-/g, '_') // replace dash with underscore
			.replace(/\s/g, '_') // replace space with underscore
			.replace(/[\\\*\/\?;:"\|<>]/g, '');  // remove all special characters			
	}

	/**
	 * Generate suitable keys by using the
	 * object name value as input string
	 * Precaution: for now, this is the same as cleanName, 
	 * but might change in the future and allows for customisation.
	 *
	 * @param lname - the name value
	 * @returns the cleaned object name
	 */
	function cleanKey(lname) {
		return lname.replace(/^\s+|\s+$/gm, '') // trim spaces
			.replace(/\u00E4/g, 'ae') // replace umlaut
			.replace(/\u00F6/g, 'oe') // replace umlaut
			.replace(/\u00FC/g, 'ue') // replace umlaut
			.replace(/\u00DF/g, 'ss') // replace umlaut
			.replace(/\s+[\-]+\s+/g, '_') // replace spaces, dashes, spaces with underscore
			.replace(/\-/g, '_') // replace dash with underscore
			.replace(/\s/g, '_') // replace space with underscore
			.replace(/[\\\*\/\?;:"\|<>]/g, '');  // remove all special characters			
	}

		
	/**
 	* function returning embeded image
 	*
	* @returns {String} Returns image string
 	*/
	function getLogoImage() {
		var imgString = "%C2%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%C2%AF%00%00%00%3C%08%03%00%00%00'%C2%BE%1A%C2%AA%00%00%00%04gAMA%00%00%C2%B1%C2%8F%0B%C3%BCa%05%00%00%00%01sRGB%00%C2%AE%C3%8E%1C%C3%A9%00%00%00%60PLTE%C3%A9%C3%A9%C3%A9%C3%A2%C3%A1%C3%A2%C2%A5%C2%A4%C2%A3%C3%AD%C2%AE%5B%C2%85%C2%83%C2%82%C3%B79%05%C3%B3%C2%BAiSSS%C3%86%C3%86%C3%87%C3%B0%C3%B6%C3%B6%1C%1C%1C%C3%BD%C3%BE%C3%BE%C3%B8%C2%A21%C3%BC%C2%91%10%40%40Ausq%C3%99%C3%99%C3%99%C3%BES%03%C2%B4%C2%B4%C2%B4a%60%5E%C3%B7%0F%00001%03%05%09%C3%8D%C2%9B_%C3%8F%C3%91%C3%91%C2%A6%C2%8Ap%C2%97%C2%96%C2%95%C3%B0%C2%B2%C2%9A%C3%B4hH%C2%AFg%3C%C3%B7%C3%9C%C3%95%C3%B6%C2%8Dx%07%12%C3%94%C2%80%00%00%07FIDATh%C3%9E%C3%AD%C2%9A%C2%8Bv%C3%A28%0C%C2%86m'4%C3%97b7%06r!%C2%81%C3%B7%7F%C3%8B%C2%95%C3%A4K%C3%AC%C3%9C%C3%A8%C3%8Ct%C2%B7%C2%9DsVd%18%08i%C3%BC%C3%A5%C2%8F%24K%06%C2%96%C3%BD%5D%C3%86%C3%BE%C3%A7%C3%BD%C2%8Fx%C2%B5L%C3%BBC%C2%93%C3%BA%07%C3%B1%C3%AA%C2%BEM%C2%92%C3%A4%C2%8D%1E%C3%BE%C3%BF%C2%B7%C3%B9%C2%81%C3%AF%C3%9A%5E%C3%BE%14%C3%9E%1E!_Z%C2%92%C3%B4%C3%BA'%C3%B0%C3%AA%C2%96%60%13%C3%BAg%C2%B9%C2%93%16%1E%C3%915%C3%90%C3%87%C2%89%C3%BC~%5E%C3%84MfR%40%05_%C3%95%3A%C2%83%7F%C2%B2o%C2%93%C2%85%C3%84%C3%B2%C3%9By%C3%9B%C3%9A%C3%81%C3%A2S%0B%C3%B7%C3%BC%1CX%26%C3%9B%08%C2%B8%C3%BD%C2%AA%C2%A1%C3%93T%C3%BE%16oZ%C2%9B%C3%98%22%C3%A6V%12%C3%AC%C3%95%C2%B0%5E%C3%81%C3%A0%C2%B5%0E%C2%89%C2%93%3E%3AA%C3%8EfK%C2%B3%C2%AC%C3%89%C3%81%C2%88c%C2%B0%C2%AFR%C3%B7i%C3%9E%04%7CCg%C3%B6%C2%A5%C3%8B%C3%B3p%7BX%C3%8A%22Kg%C3%9E%C3%96%C3%84%3Fm%7D%24%C2%AD%25%06f%C3%A9%C3%94G%C2%8F%C3%90%07%C2%BC4L%C2%83%1F(%C3%84Y%0C%C3%9C%C3%98%3F%C2%95%C2%9D%C2%A3c%C2%B9%5E%C2%9FG%1C%C3%B1%C3%AA%C3%84%C3%99%5B%C2%A2%C2%BD%C2%B2%06%C3%96%C3%A2%C2%96%C3%A55k%7D%C3%94%25%C3%A9%01%C2%AFy%0F%0A%0DnG4pn%C2%92'_%C3%AD%C2%8A%C3%8E%C2%83%C3%80%C2%BB%C2%BC%C2%A9%C2%83%7Dk%C2%97%C3%A2%C2%9E%C2%AF%C2%96%C2%B8%2C%C3%8Bs%C3%AB%24%C2%AE%C3%BB%25%2F%C3%8F%C2%8D%C3%A1%C2%8D%C2%94v%C2%BC%C3%9C%C2%A1%18%C3%85%C2%85h%C2%98%C2%BD%12%C3%8B%C3%86%1B%C2%91%7B5%C3%8D%3E%25%C2%84%C3%9D%C2%A73%C2%89'%C2%A4%C3%9B%C3%90y%17%23%C3%9E%C2%BE%C2%B6%C3%80%1B%C2%B8N_%C2%92%C2%B8usI%C2%BB%C3%A4%C3%8D%C3%83%1D%C3%88%C3%85%C2%B5%C3%B4p%C2%A9%C2%93GF%C2%B7%C2%9AK%C3%BFJG%C3%A7%11%C2%B8o%C2%B0!%19J%1B%C3%B0%C3%96%60%13%C2%AA%C2%88v%C2%A5%C3%8D%C3%98%C2%AD%C2%BCy%2B'%3C%0E%0E%3E%C3%A65X%C3%82%C2%B9q0fg%0Fmf%C2%8A%19n%3E%C3%8F%C2%AC%C3%B9%26o%0B%C3%A9%C3%A1%0E6%C2%A4%C2%A9%C3%99%C2%9C%C3%89T%C2%86%06%C3%89%18%0F%03%C2%89%C2%8Fy%09G)'o0%C2%A6%3B%14%C2%BDW%05%17%C2%97%C3%BF%22o%7D%2F%C3%90*g%C3%B4%C2%8E1%C3%9C%0A%7C%C3%A6%5C)%C3%95)%C2%95%C3%A7M%C2%937%C3%B5%C2%9A%17%C3%BD%0E%C3%8C%C2%95%226%C2%9A%C2%9A%C3%A5%C2%98%C3%9C%C3%AC%C3%94%C3%81%C2%87%3E%C2%8B%C3%8C%C2%BC%C3%83%0B%7F%40%5Edb%5Ca~%C3%A1%1D%C3%A7%C3%88%C3%96%C2%A9%C2%AE%C2%83gp%C3%B6%0E)%C3%9D%C2%96%C2%8B%C2%BAn%C3%B5v~p%C2%BB%04%C2%9BC%2B%18%C2%B3%C2%B1%20i%20%C2%A0%C3%B9%C3%B3%C2%90w%C3%A0%5B%7F%1B%C3%B36%1C%C3%A5-%3AT%C2%B1%23Fk%C2%8D%C2%91T%60x%C2%8B%5C%C3%A1%1E%01%1E%C2%9C%1D%C3%B3J%C2%93X%C2%B3%60L8%25q(%7D%C3%84kS%C3%B2%C2%AC%C3%BE%0Eo%2BztPa%C3%81%C2%A2m6%C2%B8%C2%93%19%C3%96%13u%C2%B2%C3%90%C2%97%2Fx%C3%8D%C3%90%3C%C3%94%C3%88%C2%B1%C3%B8%C2%A4%C2%B0%C3%8F%C2%8BW%C2%A7%0Fy%C2%93%C3%BA%C3%BD%0C%C2%A9%C3%A0%C2%AC(%C3%A5%C2%81%C2%BE%24%C2%B4%C2%B5%C2%8E%0C%3E%60%1Ar%C3%84%15%12%C3%84%C3%9A%1F%3A%13%C2%A0Y%0C%C3%98%C2%ACx%3B%C3%A9%03%C3%8A%C2%A9%C3%8FC%C3%BFu%C2%B3%C2%85%3F%C3%BF%5E~h1%C3%99%C3%A6%15%C2%B7JA%C2%94Yc%14y%C2%8C%C3%BC%C2%9BA%1E.!%09%C2%AF%C3%B4%5D%C3%A4%07%C3%9C%C3%93%C2%B08%3F%C3%A0%05%0B%19%C3%84X%C2%98%1F%C2%9A%20nYt%C2%BA%3D%C3%9E%09f%06%5D)%C3%8E-%C2%B1%C3%A14%C3%99%C3%81%C3%90B%C2%8E%C2%A8%C3%A4%C3%ADZ%C3%AA%C2%97%C2%BC)M%01%3E%C3%AE7%C3%86l%C3%A6%0C%C3%90%2C%C3%B3o%13%1D%C2%BD%C3%A7%0FP7%C2%94b%C3%A6-%02%C2%85%C2%9D%C2%BC%5C%159N%26%C3%89%2B%5EE%C2%8A%C3%B9%C3%B2acL%C3%A9%5D%C2%99%C2%8ER%C3%A1y(%19v%2Fx%13%C2%9C%7C%3B%C2%86%C2%BC%18%3C%0E%C2%B6b6%0D%C2%93%C2%BE%C3%B0%19x98%C3%84%C2%9A%C3%97%C3%95%0F%C2%83C%C2%90%C3%861%C2%BB%C3%AD1w%C3%AB%C2%87%C3%9C%25Cq%C3%8C%0B%C3%AE%7B%C3%8D%0C%C2%94%C3%B7%C2%86%C2%8A%1EN%60%C3%94WU%1A%1Cb%C3%9A%C3%A0%0D%C3%AB%40e%1D%C3%92%C3%8F%C2%B4%1B%C2%BC%C2%BA%0Bk%C3%8C%C3%B8%3E%C2%91%C3%80%5C%1F%C3%B2%C2%A2%C3%BB%C3%8Abv%C2%87%C3%82%C3%B0%120%2Bf%07No%C3%97%C3%9B%0B%5E%C3%A1F%C2%A0q%7D%C2%BA%C2%8DyC%C3%A0f%C3%A9Wbsn%5C%C3%B2%C2%96i%11%C2%BA%2F%C3%A1V%C3%B6%C3%89%C2%8A%C3%8C%2B%01%C3%A5%C2%8F%06%C3%9El%C2%97W%C3%BB%C3%BC%C3%A4o%C3%AC%16%C3%AFN%7F%C2%91%C3%BB%00X%C3%95%1E%2B%7D%07%0A%C2%B7%C3%99%1DL%25%C3%B1p%C3%8E%C2%8B%C2%A9%C2%98%09Hh%19%C3%8E%C3%87Z%7F_%C3%BFF%C2%BC%C3%99u%08%C3%B5%C2%AD%2C%C3%B0%C3%A3%C2%B4m%C2%97%C3%A9%C3%BB%C3%BAc%C2%98%C2%8F%C2%A7%C2%B3%C3%A3%0D%C3%83%0D%C2%8C%C2%9F.%3F%C2%8F%C3%B7%C2%9Dxg%C3%BF5%C3%A9%C2%8C%C3%B2%03%1B%03%C3%88%0Fo%C2%A7K%C3%BF%C2%BD%C2%BC%C3%A0%0F%1A%C3%AA%C3%89yz%C2%AB%2C%C3%B1x%C3%99%04~%C3%89%2B%C3%93T%C3%BF%7B%C2%BC5%C2%B6j%C2%8A%05%02%C2%BB%C3%A9m%C2%9Bw%C3%96w%C2%B3%C2%8B%C2%95%C2%8D%C2%A9%1D%C3%85%02%19%C3%97%26%5C%C2%B6%C2%A5%C3%99E%C3%A7~%C2%8F%C2%B4%C3%B3%C2%8DK7*%1F%C3%B4V%03ny!%C2%A1%C2%89%22%C2%A8%1F%1C%C3%B0%C3%B3r%C2%BA%3C%C3%B9%23%C2%B2%11x%C3%93%03%5E1%C2%97%C2%8FC%C2%B6%C3%93%3A%C3%99%5C7%C2%97E%C3%82t%C3%85a%19%C3%8C%C3%93%5D%C3%9E%C2%A9%3C%C2%97%C2%B2Rq%C3%81%C3%83%1C%C2%AF%C3%95%C3%9A%C2%B5K%C3%A0%C3%93%17%C2%B9%C3%8F%2B%C2%B6%C2%96%0Dvx%7D%C3%8B%C3%AC%C2%A7%C3%85h%19B%C3%AE%C3%B1%C2%B6%25t%C3%AE%C2%AAp%05%043%C3%8D%1Bs%C2%BCf%C3%8As%C2%BC%C3%A0%0F'%C3%87%C2%BB%5E%250W%C3%90%C2%89F%C2%B1%60b%C3%9D%C3%A15%C2%BDiPu%C3%B8vPE%C2%8D%C3%A8%C2%BC%C3%80ax%C3%9F%C2%AF8sUa~0%C3%A5%C3%83%1Dx%C3%87%C2%A2%C3%A0%23%C3%9A%C2%93%C2%9EG%C3%A4%C3%95%C3%8B%0A%C3%92%2BI%C2%A7G%C2%A5t%1EV.%3B%C2%BC%C3%92V%19MX%06%C3%A7%C2%9B%C2%8D%C3%9D%1Co%C3%AF%C3%89%C2%BD%C3%87%C3%A6%1D%C3%9A%08l%2F%C3%9D%C2%86%C3%8A%09%C3%83%C3%8B.%60%C2%A7%0F%17q%C2%A7q%C2%97W.V%C2%9D%C3%941%C2%AF)%C3%AEM%C3%8B%2C%C3%97mr%C2%BA%C3%8D%7B%C3%AF%C3%80%0D%0A%C3%AEz%C3%8C%06L%C3%90%C3%96%0C%C3%A0%C2%AB%23%C3%A8%7DB%5E%C2%9F%25.c%C2%B6%C3%87%1B%C2%AE%C3%8E%04M%C3%86.%2FU%C3%B7%04%C2%97%C3%87%C3%87%C2%A4%07%C2%BC-.1%C3%98%0D%3B7%C3%9B%C3%89C%C3%9F%C3%96%20!%C3%B0%C3%9Eg%7B%02%C3%AF%C2%B4%C3%8B%1B2%0E%C2%8B%C2%88%0B%C2%96*%C3%A2%C2%BA%C2%97%C2%8A%C2%9Ft%C2%A3L%C2%93%C2%AB%05%0E%C2%A3o%14%C3%BFA%C3%ABV(%C3%A4%7D%14a%C2%BC%C3%9DOG%C2%BCy%C3%90(%C2%A7%0B%07%C3%8E%C3%A3d%22%C3%BCA%5D%C2%BCL%C2%89%2F%C2%A5w%C2%A6x%C3%81%C3%80%C3%A8%C2%8B%26%C3%8F%C2%9A%2C%C3%83%C2%877%2C%16%1EQ%3E%7B%C2%9E%C2%96%C3%93%C3%9B%C3%AF%C3%B0r%C3%BF%C2%89-%C2%85%C2%87%C2%A8%5D%C3%A9X%C3%A4%C3%A1!o%C3%BF%5E%C2%BF%C2%A3M%C2%B7-%C2%9B%20%19%3C%C3%AF%C3%8F%C2%A7u%C2%86%C3%87%1F%C3%B2%C3%B2%C2%95%C2%BE%C3%86k%7C%5C%C3%A6%C2%AB%C3%8E%23%5E%C3%A00%C2%BC%C3%B0%00%C2%BB%C3%9D%C3%8A%C2%A5%11%C3%AF%C3%85%1AJ%C2%8D%C3%93%C3%85%11%C2%AF%08%C3%BCWl%C3%B8%C2%AF%5D%C2%AA%08%C2%AFD%05%C3%B2F%C3%8B%10%5B%0B%1C%C3%84%5B%C2%9B%C2%AD.o%5B%C2%BC%C2%97'c%C2%90%C2%87)%C2%99%15%C2%86W%C3%AE%C3%B2%0E%C2%BF%C2%98%1F%C3%9Ce-%C3%9B%C3%97%C3%86%C2%95%0F%C2%AB%C3%BC%20%C3%81%17%1C%C3%B0y)%C2%B1%C3%A1%C2%A5y%03xO%1F8%1D%7F%C2%9C%0Ex%C3%A5%7Cs%25%C3%BBD%C3%BE%C3%9D%C3%A2%C3%8D%C2%B3%C3%BD%05%5B%C3%BC%C2%BE%C3%85%C3%A2%22%C3%B0T%C3%86%C3%84%C2%B7%C2%B3%C3%A1%7D%C2%8C%C3%A0%15%1F%1FO3%1D%1F%C3%B0%1AQ%1B%C3%9FS%0E_%C3%8Fk%05%C2%B6%12g%C2%B4%C2%94NK%C3%AB%C2%8Ew%C2%A4%C3%AA%C2%87%C2%82%C2%AD%C2%AA%C3%98j%3A%C2%8EyeT%3F(%C3%BD%25%C2%BC%C3%B3%02%07%7D_hp%5D%C3%9CM%C3%97%20%3F%C2%94%C3%84%1B%C3%A4%C2%B3%C3%87%0B%5E%1B%C3%AF%2CZ%C2%A3%C3%BCS%C3%9E9%04%C3%A9%C3%BB%C3%98%C3%B1%C2%9D%24%26%60%C3%8A%14%C3%93%C3%99%7C%C2%83q%3DO8a%C2%8C%C3%8F%3B'%C3%9E%07%C3%8En%C3%8B%C3%A9x%C3%99u%0F%3B%C2%B8_%C3%86%C2%9B%C3%A9%C3%96%02%07%C3%88%C2%B5%7DC%C3%AD%25%C3%A4%C2%B2%11fb%085*%1F%C2%A6C%C3%9E%C3%9D%C3%BE%C3%A2%C3%8Bx3Hj%7B%C3%A6%5B%C3%A2%C2%8Bo%C2%88%3E%C3%91%1D%C3%BF%C2%8B%C3%BD%C2%9B%C3%BF%C2%BD%C3%866%2Fq%C2%86%C3%AD%1B%C2%90%7F%5B7%1F%C3%BD~GB%0D%C3%9C%C3%8B%3EM%7B9%3Fd%3A%C2%B9Z%12Y%C3%B1%C3%B58%C3%89%1F%C3%81%C2%BBgZ%C3%B6%13%C2%B9%03rO%C3%9F%C3%BC3%C2%9EO%C3%BE%3E%C2%8Ad%C2%9E~%C3%80O%C2%8E%3E%C3%BF%7B.%C3%BD%C2%A3~%1F%C3%B5%C3%B7%C3%BD%C3%BE%C3%AC%C3%AF%C2%B0%7F%00l%130%1E%054%C3%B9%C3%AC%00%00%00%00IEND%C2%AEB%60%C2%82"; 
		return imgString;
	}
	
 	
 	/**
 	* function from below compiled with closure compile to support template literals in JSX
 	*
 	*/
	var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.createTemplateTagFirstArg=function(a){return a.raw=a};$jscomp.createTemplateTagFirstArgWithRaw=function(a,b){a.raw=b;return a};
	
	function dataPlistString(a){var b=a.width,c=a.height;return'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\n\t<key>documentVersion</key>\n\t<string>648</string>\n\n\t<key>lastCheckDate</key>\n\t<date>2020-10-05T19:20:24Z</date>\n\n\t<key>oidCounter</key>\n\t<integer>11</integer>\n\t<key>resourcesInfo</key>\n\t<dict>\n\t\t<key>groups</key>\n\t\t<array>\n\t\t\t'+a.groups+
	"\n\t\t</array>\n\t\t<key>posterImageExportSettings</key>\n\t\t<dict>\n\t\t\t<key>exportName</key>\n\t\t\t<string>poster</string>\n\t\t\t<key>format</key>\n\t\t\t<string>jpg</string>\n\t\t\t<key>resolution</key>\n\t\t\t<string>@1x</string>\n\t\t</dict>\n\t\t<key>resources</key>\n\t\t<array>\n\t\t\t"+a.resources+"\n\t\t</array>\n\t</dict>\n\n\t<key>sceneContainers</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>currentSceneOid</key>\n\t\t\t<string>12</string>\n\t\t\t<key>name</key>\n\t\t\t<string>Symbol</string>\n\t\t\t<key>oid</key>\n\t\t\t<string>13</string>\n\t\t\t<key>scenes</key>\n\t\t\t<array>\n\t\t\t\t<dict>\n\t\t\t\t\t<key>canvasSize</key>\n\t\t\t\t\t<string>{0, 0}</string>\n\t\t\t\t\t<key>hypeScene</key>\n\t\t\t\t\t<dict>\n\t\t\t\t\t\t<key>backgroundColor</key>\n\t\t\t\t\t\t<string>#FFF</string>\n\t\t\t\t\t\t<key>breakpointWidth</key>\n\t\t\t\t\t\t<real>600</real>\n\t\t\t\t\t\t<key>name</key>\n\t\t\t\t\t\t<string>Untitled Layout</string>\n\t\t\t\t\t\t<key>perspective</key>\n\t\t\t\t\t\t<real>600</real>\n\t\t\t\t\t\t<key>sceneScalePercentageSize</key>\n\t\t\t\t\t\t<string>{1, 1}</string>\n\t\t\t\t\t\t<key>sceneSize</key>\n\t\t\t\t\t\t<string>{"+
	b+", "+c+"}</string>\n\t\t\t\t\t\t<key>shouldScaleSceneHeight</key>\n\t\t\t\t\t\t<false/>\n\t\t\t\t\t\t<key>shouldScaleSceneWidth</key>\n\t\t\t\t\t\t<false/>\n\t\t\t\t\t</dict>\n\t\t\t\t\t<key>oid</key>\n\t\t\t\t\t<string>12</string>\n\t\t\t\t\t<key>rootSymbolControllerOid</key>\n\t\t\t\t\t<string>8</string>\n\t\t\t\t\t<key>scrollViewOffset</key>\n\t\t\t\t\t<string>{0, 0}</string>\n\t\t\t\t</dict>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n\n\t<key>symbolDisplayMode</key>\n\t<integer>0</integer>\n\t<key>symbols</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>documentIdentifier</key>\n\t\t\t<string>E583F3EB-7A7F-48E6-AECE-2889E0765764-3465-00001E61DF926BF9</string>\n\t\t\t<key>selectedObjects</key>\n\t\t\t<array/>\n\t\t\t<key>symbol</key>\n\t\t\t<dict>\n\t\t\t\t<key>addToNewSceneControllers</key>\n\t\t\t\t<false/>\n\t\t\t\t<key>currentTimelineIdentifier</key>\n\t\t\t\t<string>kTimelineDefaultIdentifier</string>\n\t\t\t\t<key>customBehaviors</key>\n\t\t\t\t<array/>\n\t\t\t\t<key>elements</key>\n\t\t\t\t<dict>\n\t\t\t\t\t"+
	a.elements+"\n\t\t\t\t</dict>\n\t\t\t\t<key>isPersistentSymbol</key>\n\t\t\t\t<false/>\n\t\t\t\t<key>name</key>\n\t\t\t\t<string>"+a.hypeName+"</string>\n\t\t\t\t<key>oid</key>\n\t\t\t\t<string>8</string>\n\t\t\t\t<key>onTopDuringSceneTransition</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>preferredSize</key>\n\t\t\t\t<string>{"+b+", "+c+"}</string>\n\t\t\t\t<key>properties</key>\n\t\t\t\t<dict>\n\t\t\t\t\t<key>PhysicsGravityAngle</key>\n\t\t\t\t\t<real>180</real>\n\t\t\t\t\t<key>PhysicsGravityForce</key>\n\t\t\t\t\t<real>1</real>\n\t\t\t\t\t<key>PhysicsGravityInheritFromParent</key>\n\t\t\t\t\t<false/>\n\t\t\t\t\t<key>PhysicsGravityUsesDeviceTilt</key>\n\t\t\t\t\t<false/>\n\t\t\t\t</dict>\n\t\t\t\t<key>removeWhenNoLongerReferenced</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>showInResourceLibrary</key>\n\t\t\t\t<"+
	(a.saveAsSymbol?"true":"false")+"/>\n\t\t\t\t<key>timelines</key>\n\t\t\t\t<array>\n\t\t\t\t\t<dict>\n\t\t\t\t\t\t<key>animations</key>\n\t\t\t\t\t\t<array/>\n\t\t\t\t\t\t<key>firstKeyframeIsRelative</key>\n\t\t\t\t\t\t<false/>\n\t\t\t\t\t\t<key>framesPerSecond</key>\n\t\t\t\t\t\t<integer>30</integer>\n\t\t\t\t\t\t<key>hidden</key>\n\t\t\t\t\t\t<false/>\n\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t<string>kTimelineDefaultIdentifier</string>\n\t\t\t\t\t\t<key>loop</key>\n\t\t\t\t\t\t<false/>\n\t\t\t\t\t\t<key>name</key>\n\t\t\t\t\t\t<string>Main Timeline</string>\n\t\t\t\t\t\t<key>userDefinedDuration</key>\n\t\t\t\t\t\t<real>0.0</real>\n\t\t\t\t\t</dict>\n\t\t\t\t</array>\n\t\t\t</dict>\n\t\t</dict>\n\t</array>\n\n</dict>\n</plist>\n"};
	
	function groupPlistString(a){return"\n\t\t\t<dict>\n\t\t\t\t<key>expanded</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>isPosterImageGroup</key>\n\t\t\t\t<false/>\n\t\t\t\t<key>name</key>\n\t\t\t\t<string>"+a.name+"</string>\n\t\t\t\t<key>oid</key>\n\t\t\t\t<string>"+a.resourceId+"</string>\n\t\t\t\t<key>resources</key>\n\t\t\t\t<array>\n\t\t\t\t\t<string>"+a.fileName+"</string>\n\t\t\t\t</array>\n\t\t\t</dict>\n\t"}

	function resourcePlistString(a){return"\n\t\t\t<dict>\n\t\t\t\t<key>fileModificationDate</key>\n\t\t\t\t<date>"+a.modified+"</date>\n\t\t\t\t<key>fileSize</key>\n\t\t\t\t<integer>"+a.fileSize+"</integer>\n\t\t\t\t<key>md5</key>\n\t\t\t\t<string>"+a.md5+"</string>\n\t\t\t\t<key>notifyOnBookmarkChange</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>originalPath</key>\n\t\t\t\t<string>"+a.originalPath+"</string>\n\t\t\t\t<key>resourceName</key>\n\t\t\t\t<string>"+a.fileName+"</string>\n\t\t\t\t<key>shouldAutoResize</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>shouldIncludeInDocumentHeadHTML</key>\n\t\t\t\t<false/>\n\t\t\t\t<key>shouldPreload</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>shouldRemoveWhenNoLongerReferenced</key>\n\t\t\t\t<true/>\n\t\t\t\t<key>type</key>\n\t\t\t\t<string>FileResource</string>\n\t\t\t</dict>\n\t"}

	function textElementPlistString(a){var b=a.name,e=a.top+"px",f=a.left+"px",g=a.height+"px",h=a.width+"px",k=a.zIndex,l=a.key,m=a.opacity,n=a.className,c=a.innerHTML,d="";c&&(d="\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>InnerHTML</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+c+"</string>\n\t\t\t\t\t\t</dict>");return"\n\t\t\t\t\t<key>"+l+"</key>\n\t\t\t\t\t<array>"+d+"\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>DisplayName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	b+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Left</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+f+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Opacity</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+m+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ExplicitDimensions</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>YES</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Height</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	g+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Overflow</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>visible</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Width</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+h+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Top</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	e+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ZIndex</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+k+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+n+"</string>\n\t\t\t\t\t\t</dict>\n\n\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontFamily</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	a.fontFamily+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontWeight</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+a.fontWeight+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>TextColor</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+a.textColor+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontSize</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	(a.fontSize+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Display</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>inline</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>WordWrap</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>break-word</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassType</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>Text</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontStyle</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+
	a.fontStyle+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>WhiteSpaceCollapsing</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>preserve</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Position</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>absolute</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Overflow</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>visible</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>TagName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>div</string>\n\t\t\t\t\t\t</dict>\n\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingBottom</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	(a.paddingBottom+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingRight</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+(a.paddingRight+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingLeft</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+(a.paddingLeft+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingTop</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+
	(a.paddingTop+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t</array>\n\t")};

	function elementPlistString(a){var b=a.resourceId,c=a.name,f=a.top+"px",g=a.left+"px",h=a.height+"px",k=a.width+"px",l=a.originalHeight+"px",m=a.originalWidth+"px",n=a.zIndex,d=a.key,e=a.opacity,r=a.width/a.height,t=a.className;a=a.innerHTML;var p="",q="";a&&(p="\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>InnerHTML</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+a+"</string>\n\t\t\t\t\t\t</dict>");b&&(q="\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>BackgroundImageResourceGroupOid</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	b+"</string>\n\t\t\t\t\t\t</dict>");return"\n\t\t\t\t\t<key>"+d+"</key>\n\t\t\t\t\t<array>"+p+"\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>DisplayName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+c+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Position</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>absolute</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>OriginalWidth</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	m+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>SizeRatio</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+r+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Left</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+g+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>OriginalHeight</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	l+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Display</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>inline</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Opacity</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+e+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ConstrainProportions</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>YES</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Height</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	h+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Overflow</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>visible</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Width</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+k+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Top</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	f+"</string>\n\t\t\t\t\t\t</dict>"+q+"\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>BackgroundSize</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>100% 100%</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>BackgroundRepeat</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>no-repeat</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>TagName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>div</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>AccessibilityRole</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>img</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ZIndex</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	n+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassType</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>Image</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+t+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t</array>\n\t"};	
		
	/**
	 * ---------------------------------
	 * FONT MAPPER DIALOG
	 * ---------------------------------
	 */
	 
	function fontKey(family, style) {
		return family + ' - ' + style;
	}

	function FontMapperDialog(localDocumentSettings){
		var documentSettings = localDocumentSettings || loadDocumentSettings();
		var mapping = documentSettings.fontMappingCustom || {};
		
		function buildDialog(selectedIndex){
			// init the fonts array
			var fonts = [];
		
			// get all text items
			var items = getTextItems(app.activeDocument);
		
			// get the font family and style
			for(var i = 0; i < items.length; i++){
				// init the map family and style
				var item = items[i];
				var family = item.textRange.textFont.family;
				var style = item.textRange.textFont.style;
				// mapping if given
				var key = fontKey(family, style);
				var mappedTo = mapping[key] || {};
				var mapFamily = mappedTo['family'] || ''; //item.textRange.textFont.family;
				var mapBold = mappedTo['bold'] || style.toLowerCase().indexOf('bold')!=-1;
				var mapItalic = mappedTo['italic'] || style.toLowerCase().indexOf('italic')!=-1;
				
				// check if the font is already in the array		
				var match = false;
				for(var j = 0; j < fonts.length; j++) {
					var test = fonts[j];
					if(test.family === family && test.style === style) {
						match = true;
						break;
					}
				}
		
				// if not, add it
				if(!match) {
					var element = {
						family: family, 
						style: style, 
						mapFamily: mapFamily, 
						mapBold: mapBold, 
						mapItalic: mapItalic,
					};
					fonts.push(element);
				}
			}
			
			// init the dialog
			var dialogFontManager = new Window('dialog', 'Font Mapper');
			
			// add the listbox
			var list = dialogFontManager.add('listbox', undefined);
			list.preferredSize.width = 300;
			list.preferredSize.height = 200;
	
			// add the input group
			var inputGroup = dialogFontManager.add("panel", undefined, undefined, {name: "inputGroup"});
			inputGroup.text = 'Selected font is mapped to ...';
			inputGroup.orientation = 'row'; 
			inputGroup.margins = 20;
			inputGroup.enabled = selectedIndex != null;
			
			// add reset button
			var reset = inputGroup.add('button', undefined, '\u21A9');
			reset.helpTip = 'Reset the mapping for this font.';
			reset.preferredSize.width = 20;
			reset.preferredSize.height = 20;
			
			// add input field
			var edit = inputGroup.add('edittext', undefined, '');
			edit.preferredSize.width = 150;
			
			// add the bold and italic checkboxes
			var bold = inputGroup.add('checkbox', undefined, 'bold');
			var italic = inputGroup.add('checkbox', undefined, 'italic');
			italic.value = false;
			bold.value = false;
					
			// add the buttons
			var buttonGroup = dialogFontManager.add('group');
			buttonGroup.alignChildren = ["left","top"];
			
			var btn_close = buttonGroup.add('button', undefined, 'Close');
			var btn_apply = buttonGroup.add('button', undefined, 'Apply');
			
			// add all fonts 
			for(var i = 0; i < fonts.length; i++){
				var family = fonts[i].family;
				var style = fonts[i].style;
				var mapFamily = fonts[i].mapFamily;
				var modified = isFontModified(fonts[i]);
				var node = list.add('item', listFontName(fonts[i]));
				node.mapFamily = mapFamily;
				node.itemIndex = i;
			}
			
			list.onChange = function(){
				var item = fonts[list.selection.itemIndex];
				edit.text = item.mapFamily;
				bold.value = item.mapBold;
				italic.value = item.mapItalic;
				inputGroup.enabled = true;
			}
			
			reset.onClick = function(){
				var index = list.selection.itemIndex;
				var key = fontKey(fonts[index].family, fonts[index].style);
				delete mapping[key];	
				dialogFontManager.close();
				buildDialog(index);
			}
			
			// on change and changing event for the edit text
			 edit.onChange = edit.onChanging = function(){
				var font = fonts[list.selection.itemIndex];
				// sanitize the input allowing only letters, numbers, spaces, commas and single dashes
				var sanitizedText = edit.text.replace(/"/g, "'");
				// Replace any character that is not a letter, number, space, comma, single dash, or single quote with an empty string
				sanitizedText = sanitizedText.replace(/[^a-zA-Z0-9,' \-]/g, '');
				// Replace any double spaces with single spaces
				sanitizedText = sanitizedText.replace(/  +/g, ' ');
				// set the mapping
				font.mapFamily = sanitizedText;
				list.selection.text = listFontName(font, sanitizedText);
				// reset the mapping if the input is empty
				if (edit.text == '') {
					reset.onClick();
				} else {
					refreshControl(list);
				}
			}
			
			// on click event for the bold checkbox
			bold.onClick = function(){
				var item = fonts[list.selection.itemIndex];
				item.mapBold = bold.value;
			}
			
			// on click event for the italic checkbox
			italic.onClick = function(){
				var item = fonts[list.selection.itemIndex];
				item.mapItalic = italic.value;
			}
			
			// on click event for the apply button
			btn_apply.onClick = function(){
				var fontMappingCustom = fontMappingToObject(fonts);
				documentSettings.fontMappingCustom = {}

				if (countProperties(fontMappingCustom) == 0) {
					delete documentSettings.fontMappingCustom;
				} else {
					// map items
					for (var key in fontMappingCustom){
						documentSettings.fontMappingCustom[key] = fontMappingCustom[key];
					}
				}
				
				dialogFontManager.close(1);
			}
			
			// on click event for the close button
			btn_close.onClick = function(){
				dialogFontManager.close();
				return null; // <-- this is probably not needed anymore
			}
			
			// activate the node defined in selectedIndex if given
			if(selectedIndex) {
				list.selection = selectedIndex;
				list.onChange();
			}
				
			// show the dialog
			var closeValue = dialogFontManager.show();
			return closeValue;
		}
		
		// initial dialog
		buildDialog();
		
		/**
		 * Get all text items in the document
		 *
		 * @param {Object} parent - the parent item
		 * @return {Array} items - the items array
		 */
		function getTextItems(parent){
			var items = [];
			for(var i = 0; i < parent.pageItems.length; i++){
				var item = parent.pageItems[i];
				if(item.typename == 'GroupItem'){
					var childItems = getTextItems(item);
					items = items.concat(childItems);
				}else if(item.typename == 'TextFrame'){
					items.push(item);
				}
			}
			return items;
		}
		
		/**
		 * Return font name with given font object
		 *
		 * @param  {object} font Font object
		 * @return {string}      Font name with style
		 */
		function listFontName(font, mapFamily){
			if (mapFamily) return font.family + " (" + font.style + ")" + ' \u27F6 '+mapFamily;
			var modified = isFontModified(font);
			return font.family + " (" + font.style + ")" + (modified?' \u27F6 '+font.mapFamily:'');
		}
		
		/**
		 * Check if the font has been modified
		 *
		 * @param {Object} font - the font object
		 * @return {Boolean} - true if the font has been modified
		 */
		
		function isFontModified(font){
			var family = font.family;
			var style = font.style;
			var mapFamily = font.mapFamily;
			var mapBold = font.mapBold;
			var mapItalic = font.mapItalic;
			
			if(mapFamily != '' || style.toLowerCase().indexOf('bold')!=-1 != mapBold || style.toLowerCase().indexOf('italic')!=-1 != mapItalic){
				return true;
			}
			return false;
		}
		
		/**
		 * Refresh a control (Workaround for a bug in ScriptUI)
		 *
		 * @param {Object} control - the control to refresh
		 */
		function refreshControl (control) {
			var wh = control.size;
			control.size = [1+wh[0], 1+wh[1]];
			control.size = [wh[0], wh[1]];
		}

		
		/**
		 * Convert the fonts mapping to a object
		 *
		 * @param {Array} fonts - the fonts array
		 * @return {Object}
		 */
		function fontMappingToObject(fonts){
			var obj = {};
			for(var i = 0; i < fonts.length; i++){
				var font = fonts[i];
				if(isFontModified(font)){
					var key = fontKey(font.family, font.style);
					obj[key] = {
						family: font.mapFamily,
						bold: font.mapBold,
						italic: font.mapItalic
					}
				}
			}
			return obj;
		}
	}
	
// IIFE end
})();

function polyfills(){
	
	$.assign = function(target, varArgs) {
		'use strict';
		if (target == null) { // TypeError if undefined or null
			throw new TypeError('Cannot convert undefined or null to object');
		}
	
		var to = Object(target);
	
		for (var index = 1; index < arguments.length; index++) {
			var nextSource = arguments[index];
	
			if (nextSource != null) { // Skip over if undefined or null
				for (var nextKey in nextSource) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	}
	
	/*
	JSON for ExtendScript
	*/
	// https://github.com/douglascrockford/JSON-js/blob/master/json2.js
	"object"!==typeof JSON&&(JSON={});
	(function(){function n(b){return 10>b?"0"+b:b}function r(){return this.valueOf()}function t(b){u.lastIndex=0;return u.test(b)?'"'+b.replace(u,function(e){var c=w[e];return"string"===typeof c?c:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+b+'"'}function p(b,e){var c,h=f,a=e[b];a&&"object"===typeof a&&"function"===typeof a.toJSON&&(a=a.toJSON(b));"function"===typeof m&&(a=m.call(e,b,a));switch(typeof a){case "string":return t(a);case "number":return isFinite(a)?String(a):"null";case "boolean":case "null":return String(a);
	case "object":if(!a)return"null";f+=q;var g=[];if("[object Array]"===Object.prototype.toString.apply(a)){var k=a.length;for(c=0;c<k;c+=1)g[c]=p(c,a)||"null";var d=0===g.length?"[]":f?"[\n"+f+g.join(",\n"+f)+"\n"+h+"]":"["+g.join(",")+"]";f=h;return d}if(m&&"object"===typeof m)for(k=m.length,c=0;c<k;c+=1){if("string"===typeof m[c]){var l=m[c];(d=p(l,a))&&g.push(t(l)+(f?": ":":")+d)}}else for(l in a)Object.prototype.hasOwnProperty.call(a,l)&&(d=p(l,a))&&g.push(t(l)+(f?": ":":")+d);d=0===g.length?"{}":
	f?"{\n"+f+g.join(",\n"+f)+"\n"+h+"}":"{"+g.join(",")+"}";f=h;return d}}var x=/^[\],:{}\s]*$/,y=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,z=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,A=/(?:^|:|,)(?:\s*\[)+/g,u=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,v=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;"function"!==typeof Date.prototype.toJSON&&
	(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+n(this.getUTCMonth()+1)+"-"+n(this.getUTCDate())+"T"+n(this.getUTCHours())+":"+n(this.getUTCMinutes())+":"+n(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=r,Number.prototype.toJSON=r,String.prototype.toJSON=r);var f,q,m;if("function"!==typeof JSON.stringify){var w={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};JSON.stringify=function(b,e,c){var h;q=f="";if("number"===
	typeof c)for(h=0;h<c;h+=1)q+=" ";else"string"===typeof c&&(q=c);if((m=e)&&"function"!==typeof e&&("object"!==typeof e||"number"!==typeof e.length))throw Error("JSON.stringify");return p("",{"":b})}}"function"!==typeof JSON.parse&&(JSON.parse=function(b,e){function c(a,g){var k,d=a[g];if(d&&"object"===typeof d)for(k in d)if(Object.prototype.hasOwnProperty.call(d,k)){var l=c(d,k);void 0!==l?d[k]=l:delete d[k]}return e.call(a,g,d)}b=String(b);v.lastIndex=0;v.test(b)&&(b=b.replace(v,function(a){return"\\u"+
	("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(x.test(b.replace(y,"@").replace(z,"]").replace(A,""))){var h=eval("("+b+")");return"function"===typeof e?c({"":h},""):h}throw new SyntaxError("JSON.parse");})})();
}
/*
These are the PLIST functions as template literals. 
Sadly ExtendScript doesn't support ES6 syntax, so after modifications
please compile them down to ES5 using something like Closure Compiler
and replace the corresponding function above.
*/ 

/*

function dataPlistString(o){
	var hypeName = o.hypeName;
	var width = o.width;
	var height = o.height;
	var resources = o.resources;
	var groups = o.groups;
	var elements = o.elements;
	var showInResourceLibrary = o.saveAsSymbol? 'true' : 'false';

	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	
	<key>documentVersion</key>
	<string>648</string>
	
	<key>lastCheckDate</key>
	<date>2020-10-05T19:20:24Z</date>
	
	<key>oidCounter</key>
	<integer>11</integer>
	<key>resourcesInfo</key>
	<dict>
		<key>groups</key>
		<array>
			${groups}
		</array>
		<key>posterImageExportSettings</key>
		<dict>
			<key>exportName</key>
			<string>poster</string>
			<key>format</key>
			<string>jpg</string>
			<key>resolution</key>
			<string>@1x</string>
		</dict>
		<key>resources</key>
		<array>
			${resources}
		</array>
	</dict>		

	<key>sceneContainers</key>
	<array>
		<dict>
			<key>currentSceneOid</key>
			<string>12</string>
			<key>name</key>
			<string>Symbol</string>
			<key>oid</key>
			<string>13</string>
			<key>scenes</key>
			<array>
				<dict>
					<key>canvasSize</key>
					<string>{0, 0}</string>
					<key>hypeScene</key>
					<dict>
						<key>backgroundColor</key>
						<string>#FFF</string>
						<key>breakpointWidth</key>
						<real>600</real>
						<key>name</key>
						<string>Untitled Layout</string>
						<key>perspective</key>
						<real>600</real>
						<key>sceneScalePercentageSize</key>
						<string>{1, 1}</string>
						<key>sceneSize</key>
						<string>{${width}, ${height}}</string>
						<key>shouldScaleSceneHeight</key>
						<false/>
						<key>shouldScaleSceneWidth</key>
						<false/>
					</dict>
					<key>oid</key>
					<string>12</string>
					<key>rootSymbolControllerOid</key>
					<string>8</string>
					<key>scrollViewOffset</key>
					<string>{0, 0}</string>
				</dict>
			</array>
		</dict>
	</array>

	<key>symbolDisplayMode</key>
	<integer>0</integer>
	<key>symbols</key>
	<array>
		<dict>
			<key>documentIdentifier</key>
			<string>E583F3EB-7A7F-48E6-AECE-2889E0765764-3465-00001E61DF926BF9</string>
			<key>selectedObjects</key>
			<array/>
			<key>symbol</key>
			<dict>
				<key>addToNewSceneControllers</key>
				<false/>
				<key>currentTimelineIdentifier</key>
				<string>kTimelineDefaultIdentifier</string>
				<key>customBehaviors</key>
				<array/>
				<key>elements</key>
				<dict>
					${elements}
				</dict>
				<key>isPersistentSymbol</key>
				<false/>
				<key>name</key>
				<string>${hypeName}</string>
				<key>oid</key>
				<string>8</string>
				<key>onTopDuringSceneTransition</key>
				<true/>
				<key>preferredSize</key>
				<string>{${width}, ${height}}</string>
				<key>properties</key>
				<dict>
					<key>PhysicsGravityAngle</key>
					<real>180</real>
					<key>PhysicsGravityForce</key>
					<real>1</real>
					<key>PhysicsGravityInheritFromParent</key>
					<false/>
					<key>PhysicsGravityUsesDeviceTilt</key>
					<false/>
				</dict>
				<key>removeWhenNoLongerReferenced</key>
				<true/>
				<key>showInResourceLibrary</key>
				<${showInResourceLibrary}/>
				<key>timelines</key>
				<array>
					<dict>
						<key>animations</key>
						<array/>
						<key>firstKeyframeIsRelative</key>
						<false/>
						<key>framesPerSecond</key>
						<integer>30</integer>
						<key>hidden</key>
						<false/>
						<key>identifier</key>
						<string>kTimelineDefaultIdentifier</string>
						<key>loop</key>
						<false/>
						<key>name</key>
						<string>Main Timeline</string>
						<key>userDefinedDuration</key>
						<real>0.0</real>
					</dict>
				</array>
			</dict>
		</dict>
	</array>
	
</dict>
</plist>
`;
}



function groupPlistString (o){
	var name = o.name;
	var fileName = o.fileName;
	var resourceId = o.resourceId;

	return `
			<dict>
				<key>expanded</key>
				<true/>
				<key>isPosterImageGroup</key>
				<false/>
				<key>name</key>
				<string>${name}</string>
				<key>oid</key>
				<string>${resourceId}</string>
				<key>resources</key>
				<array>
					<string>${fileName}</string>
				</array>
			</dict>
	`;
}

function resourcePlistString (o){
	var name = o.name;
	var fileName = o.fileName;
	var fileSize = o.fileSize;
	var originalPath = o.originalPath;
	var resourceId = o.resourceId;
	var modified = o.modified;
	var md5 = o.md5;

	return `
			<dict>
				<key>fileModificationDate</key>
				<date>${modified}</date>
				<key>fileSize</key>
				<integer>${fileSize}</integer>
				<key>md5</key>
				<string>${md5}</string>
				<key>notifyOnBookmarkChange</key>
				<true/>
				<key>originalPath</key>
				<string>${originalPath}</string>
				<key>resourceName</key>
				<string>${fileName}</string>
				<key>shouldAutoResize</key>
				<true/>
				<key>shouldIncludeInDocumentHeadHTML</key>
				<false/>
				<key>shouldPreload</key>
				<true/>
				<key>shouldRemoveWhenNoLongerReferenced</key>
				<true/>
				<key>type</key>
				<string>FileResource</string>
			</dict>
	`;
}


function textElementPlistString (o){
	var name = o.name;
	var top = o.top+'px';
	var left = o.left+'px';
	var height = o.height+'px';
	var width = o.width+'px';
	var zIndex = o.zIndex;
	var key = o.key;
	var opacity = o.opacity;
	var className = o.className;
	var innerHTML = o.innerHTML;

	var innerHTML_dict = '';

	if (innerHTML) {
		innerHTML_dict = `
						<dict>
							<key>identifier</key>
							<string>InnerHTML</string>
							<key>objectValue</key>
							<string>${innerHTML}</string>
						</dict>`;
	}

	var fontWeight = o.fontWeight;
	var fontFamily = o.fontFamily;
	var textColor = o.textColor;//#HEX
	var fontSize = o.fontSize+'px';
	var fontStyle = o.fontStyle;//normal

	var paddingTop = o.paddingTop+'px';
	var paddingLeft = o.paddingLeft+'px';
	var paddingBottom = o.paddingBottom+'px';
	var paddingRight = o.paddingRight+'px';

	return `
					<key>${key}</key>
					<array>${innerHTML_dict}
						<dict>
							<key>identifier</key>
							<string>DisplayName</string>
							<key>objectValue</key>
							<string>${name}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Left</string>
							<key>objectValue</key>
							<string>${left}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Opacity</string>
							<key>objectValue</key>
							<string>${opacity}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ExplicitDimensions</string>
							<key>objectValue</key>
							<string>YES</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Height</string>
							<key>objectValue</key>
							<string>${height}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Overflow</string>
							<key>objectValue</key>
							<string>visible</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Width</string>
							<key>objectValue</key>
							<string>${width}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Top</string>
							<key>objectValue</key>
							<string>${top}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ZIndex</string>
							<key>objectValue</key>
							<string>${zIndex}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ClassName</string>
							<key>objectValue</key>
							<string>${className}</string>
						</dict>


						<dict>
							<key>identifier</key>
							<string>FontFamily</string>
							<key>objectValue</key>
							<string>${fontFamily}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>FontWeight</string>
							<key>objectValue</key>
							<string>${fontWeight}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>TextColor</string>
							<key>objectValue</key>
							<string>${textColor}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>FontSize</string>
							<key>objectValue</key>
							<string>${fontSize}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Display</string>
							<key>objectValue</key>
							<string>inline</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>WordWrap</string>
							<key>objectValue</key>
							<string>break-word</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ClassType</string>
							<key>objectValue</key>
							<string>Text</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>FontStyle</string>
							<key>objectValue</key>
							<string>${fontStyle}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>WhiteSpaceCollapsing</string>
							<key>objectValue</key>
							<string>preserve</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Position</string>
							<key>objectValue</key>
							<string>absolute</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Overflow</string>
							<key>objectValue</key>
							<string>visible</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>TagName</string>
							<key>objectValue</key>
							<string>div</string>
						</dict>

						<dict>
							<key>identifier</key>
							<string>PaddingBottom</string>
							<key>objectValue</key>
							<string>${paddingBottom}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>PaddingRight</string>
							<key>objectValue</key>
							<string>${paddingRight}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>PaddingLeft</string>
							<key>objectValue</key>
							<string>${paddingLeft}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>PaddingTop</string>
							<key>objectValue</key>
							<string>${paddingTop}</string>
						</dict>
					</array>
	`;
}

function elementPlistString (o){
	var resourceId = o.resourceId;
	var name = o.name;
	var top = o.top+'px';
	var left = o.left+'px';
	var height = o.height+'px';
	var width = o.width+'px';
	var originalHeight = o.originalHeight+'px';
	var originalWidth = o.originalWidth+'px';
	var zIndex = o.zIndex;
	var key = o.key;
	var opacity = o.opacity;
	var sizeRatio = o.width/o.height;
	var className = o.className;
	var innerHTML = o.innerHTML;

	var innerHTML_dict = '';
	var resourceId_dict = '';

	if (innerHTML) {
		innerHTML_dict = `
						<dict>
							<key>identifier</key>
							<string>InnerHTML</string>
							<key>objectValue</key>
							<string>${innerHTML}</string>
						</dict>`;
	}

	if (resourceId) {
		resourceId_dict = `
						<dict>
							<key>identifier</key>
							<string>BackgroundImageResourceGroupOid</string>
							<key>objectValue</key>
							<string>${resourceId}</string>
						</dict>`;
	}

	return `
					<key>${key}</key>
					<array>${innerHTML_dict}
						<dict>
							<key>identifier</key>
							<string>DisplayName</string>
							<key>objectValue</key>
							<string>${name}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Position</string>
							<key>objectValue</key>
							<string>absolute</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>OriginalWidth</string>
							<key>objectValue</key>
							<string>${originalWidth}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>SizeRatio</string>
							<key>objectValue</key>
							<string>${sizeRatio}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Left</string>
							<key>objectValue</key>
							<string>${left}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>OriginalHeight</string>
							<key>objectValue</key>
							<string>${originalHeight}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Display</string>
							<key>objectValue</key>
							<string>inline</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Opacity</string>
							<key>objectValue</key>
							<string>${opacity}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ConstrainProportions</string>
							<key>objectValue</key>
							<string>YES</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Height</string>
							<key>objectValue</key>
							<string>${height}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Overflow</string>
							<key>objectValue</key>
							<string>visible</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Width</string>
							<key>objectValue</key>
							<string>${width}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>Top</string>
							<key>objectValue</key>
							<string>${top}</string>
						</dict>${resourceId_dict}
						<dict>
							<key>identifier</key>
							<string>BackgroundSize</string>
							<key>objectValue</key>
							<string>100% 100%</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>BackgroundRepeat</string>
							<key>objectValue</key>
							<string>no-repeat</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>TagName</string>
							<key>objectValue</key>
							<string>div</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>AccessibilityRole</string>
							<key>objectValue</key>
							<string>img</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ZIndex</string>
							<key>objectValue</key>
							<string>${zIndex}</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ClassType</string>
							<key>objectValue</key>
							<string>Image</string>
						</dict>
						<dict>
							<key>identifier</key>
							<string>ClassName</string>
							<key>objectValue</key>
							<string>${className}</string>
						</dict>
					</array>
	`;
}
 
*/
