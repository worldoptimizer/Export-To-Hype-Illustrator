/*!
 * Export to Hype
 * Copyright Max Ziebell 2022
 * v1.1.3
 */

/*
 * Version History
 *
 * 1.0.0  Initial Release
 * 1.0.1  GUI updates and JS export as Base64 encoding
 * 1.0.2  Visibility option, new font option, quickfix for underscores _x5F
 * 1.0.3  Export of named text layer based values
 * 1.0.4  Fixed exports text
 * 1.0.5  Fixed linefeed, seperate extras, inline SVG, remove SVG Glyph support
 * 1.0.6  added new CSS variables mode, fixed SVG Illustrator default group
 * 1.0.7  empty frames and text frame (beta)
 * 1.0.8  Non render blocking base 64 encoding
 * 1.0.9  SVG URI mode in based on CSS Tricks
 * 1.1.0  Various Bugfixes
 * 1.1.1  Settings file, Fontmapping
 * 1.1.2  Released as Open Source (MIT),
 *        Added Hype Template export type,
 * 1.1.3  Added optimization using Export To Hype Helper.app (SVG cleaner)
 *
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
(function () {

	polyfills();

	/* @const */
	const _version = '1.1.3';
		
	/* @const */
	const _linefeed = "unix"
	
	/*
	Load global settings
	This code is intended to read a JSON file with the same name as the script, but with a .json extension.
	For example, our script is named "Export To Hype (Illustrator).jsx", then the JSON file should be named "Export To Hype (Illustrator).json".
	*/
	var global_settings = {}

	var global_settings_file = new File($.fileName.replace('.jsx','.json'));
	if (global_settings_file.exists) {
		try{
			global_settings= JSON.parse(read_file(global_settings_file));
		} catch(e){
			alert('Global settings JSON file error! '+e)
		}
	}
	
	/*
	Load document settings
	This code is intended to read a JSON file with the same name as the document, but with a .json extension.
	For example, our document is named "My Document.ai", then the JSON file should be named "My Document.json".
	*/
	var document_settings = {}
	if (activeDocument.path.toString()!=''){
		var docPath = activeDocument.path;
		var docName = activeDocument.name.substr(0, activeDocument.name.lastIndexOf('.'));
		document_settings_file = new File(docPath+ '/'+docName+'.json');
		if (document_settings_file.exists) {
			try{
				document_settings = JSON.parse(read_file(document_settings_file));
			} catch(e){
				alert('Documents settings JSON file error! '+e)
			}
		}
	}
	
	/*
	Assign document settings to global settings
	This code is intended to assign the document settings to the global settings.
	For example, our document settings has a fontMappingForSVG, then the global settings will
	be overwritten with the document settings for fontMappingForSVG.
	*/
	function assign(o,p,b){
		if (typeof o != 'object' || typeof p != 'object' ) return;
		if (typeof o[b] != 'object') o[b] = {};
		if (typeof p[b] != 'object' ) return;
		for (var key in p[b]){
			o[b][key] = p[b][key];
		}
	}
	
	// map keys or create the if not present
	assign(global_settings, document_settings, 'fontMappingForSVG' );
	assign(global_settings, document_settings, 'fontMappingForHypeFonts');
	
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
		
	var radiobutton1 = exportType.add("radiobutton", undefined, undefined, {name: "radiobutton1"}); 
		radiobutton1.text = "Hype Template"; 
		radiobutton1.helpTip = "Select this export type to save a Hype Template.";
		radiobutton1.value = true; 
		
	var radiobutton2 = exportType.add("radiobutton", undefined, undefined, {name: "radiobutton2"});
		radiobutton2.helpTip = "Select this export type to save a Hype Symbol.";
		radiobutton2.text = "Hype Symbol"; 
		
	var radiobutton3 = exportType.add("radiobutton", undefined, undefined, {name: "radiobutton3"});
		radiobutton3.helpTip = "Select this export type to save only the resources (great for updating and relinking layer manually).";
		radiobutton3.text = "Resources only";
	
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
	var visibilityRow = panel1.add("group", undefined, {name: "visibilityRow"}); 
		visibilityRow.orientation = "row"; 
		visibilityRow.alignChildren = ["left","center"]; 
		visibilityRow.spacing = 5; 
		visibilityRow.margins = 0; 
	
	var visibilitytext1 = visibilityRow.add("statictext", undefined, undefined, {name: "visibilitytext1"}); 
		visibilitytext1.helpTip = ''; 	
		visibilitytext1.text = "Export"; 
	
	var VisibilityMode_array = ["visible", "all"]; 
	var VisibilityMode = visibilityRow.add("dropdownlist", undefined, undefined, {name: "FontMode", items: VisibilityMode_array}); 
		VisibilityMode.helpTip = "Determine top-level layers to be included in exports"
		VisibilityMode.selection = 0; 
		VisibilityMode.alignment = ["left","top"];
	
	var visibilitytext2 = visibilityRow.add("statictext", undefined, undefined, {name: "visibilitytext2"}); 
		visibilitytext2.helpTip = ''; 	
		visibilitytext2.text = "top-level layers in"; 
	
	var _EmbedMode_linked = 0;
	var _EmbedMode_inlined = 1;
	var _EmbedMode_webfont = 2;
	var EmbedMode_array = ["linked", "inlined", "webfont"]; 
	var EmbedMode = visibilityRow.add("dropdownlist", undefined, undefined, {name: "Embed", items: EmbedMode_array}); 
		EmbedMode.helpTip = "Determine if SVG are linked or inlined"
		EmbedMode.selection = 0;
		EmbedMode.alignment = ["left","top"];
		EmbedMode.onChange = function(){ 
			if (this.selection.index == _EmbedMode_webfont){
				FontMode.selection = _FontMode_regular_text_webfont;
			}
		};
	
	
	var visibilitytext3 = visibilityRow.add("statictext", undefined, undefined, {name: "visibilitytext3"}); 
		visibilitytext3.helpTip = ''; 	
		visibilitytext3.text = "mode"; 
	
	
	var visibilityRow2 = panel1.add("group", undefined, {name: "visibilityRow2"}); 
		visibilityRow2.orientation = "row"; 
		visibilityRow2.alignChildren = ["left","center"]; 
		visibilityRow2.spacing = 5; 
		visibilityRow2.margins = 0; 
	
		var visibilitytext4 = visibilityRow2.add("statictext", undefined, undefined, {name: "visibilitytext4"}); 
		visibilitytext4.helpTip = ''; 	
		visibilitytext4.text = "and render font layers"; 
	
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
	var FontMode = visibilityRow2.add("dropdownlist", undefined, undefined, {name: "FontMode", items: FontMode_array}); 
		FontMode.helpTip = "You can either rely on the browser or your project to deliver the CSS font-family or render the fonts to path outlines and embed them into your SVG files (default). Using paths produces bigger SVG files but is compatible with SVGs as background images."
		FontMode.selection = 0; 
		FontMode.alignment = ["left","top"];
		FontMode.onChange = function(){ 
			if (this.selection.index == _FontMode_regular_text_webfont && EmbedMode.selection!=_EmbedMode_webfont){
				EmbedMode.selection=_EmbedMode_webfont;
			}
		};

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
		shouldOptimize.value = canOptimize;
		shouldOptimize.enabled = canOptimize;
	
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
		enableAddons.onClick = function() {
			addonsMode.enabled = !!this.value;
			dataURItext1.enabled = !!this.value;
			DataURIMode.enabled = !!this.value;
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
		addonsMode.selection = 0; 
		addonsMode.alignment = ["left","center"];
		addonsMode.enabled = false;
	
	
	var dataURItext1 = base64Row.add("statictext", undefined, undefined, {name: "dataURItext1"}); 
		dataURItext1.helpTip = ''; 	
		dataURItext1.text = "using";
		dataURItext1.enabled = false;
	
	var _DataURIMode_svg = 0;
	var _DataURIMode_base64 = 1;
	var DataURIMode_array = ["SVG", "Base64"];
	var DataURIMode = base64Row.add("dropdownlist", undefined, undefined, {name: "DataURI", items: DataURIMode_array}); 
		DataURIMode.helpTip = "Determine if SVG is made URI safe or Base 64 encoded (bigger)."
		DataURIMode.selection = 0;
		DataURIMode.alignment = ["left","top"];
		DataURIMode.enabled = false;
	
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
    	prefix.text = "";
	
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
					shouldOptimize: shouldOptimize.value,
					prefix: prefix.text,
					FontMode : FontMode.selection.index,
					VisibilityMode : VisibilityMode.selection.index,
					EmbedMode : EmbedMode.selection.index,
					DataURIMode : DataURIMode.selection.index,
				});
			} catch (e){
				alert(e)
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
		var VisibilityMode = o.VisibilityMode || 0;
		var saveJS_uri = o.saveJS_uri || false;
		var saveJS_Data = o.saveJS_Data || false;
		var saveCSS_uri = o.saveCSS_uri || false;
		var saveCSS_Content = o.saveCSS_Content || false;
		var saveCSS_Variables = o.saveCSS_Variables || false;
		var EmbedMode = o.EmbedMode || 0;
		var DataURIMode = o.DataURIMode || 0;
		var shouldOptimize = o.shouldOptimize;
		var hypeExtension = saveAsSymbol? 'hypesymbol' : 'hypetemplate';
		
		// check if we have a doc path (doc is saved)
		try {
	 		if (activeDocument.path.toString() == '') throw new Error();
	 		var docPath = activeDocument.path;
		} catch(e) {
	 		alert("Export to Hype: You need to save the document before using this exporter!");
	 		return;
		}
	
		// check for unique names
		var uniqueNames = {};
		for (var i = 0; i < activeDocument.layers.length; i++) {
			var name = activeDocument.layers[i].name;
			if (uniqueNames.hasOwnProperty(name)) {
				alert('Export to Hype: The layer name "'+name+'" was at least used twice! This exporter requires unique top-level layer names.');
				return;
			} else {
				uniqueNames[name] = true;
			}	
		}
	
		// check if we got a custom save path request
		if (!!customSave) {
			var customPath = Folder.selectDialog("Export to Hype: Please, select an output folder");
			if (!customPath) return;
			docPath = customPath;
		}
	
		// prep more doc vars
		var docName = activeDocument.name.substr(0, activeDocument.name.lastIndexOf('.'));
		var docWidth = activeDocument.width;
		var docHeight = activeDocument.height;
		
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
		
		// store ruler
		var units = app.preferences.getIntegerPreference("rulerType", units);
		app.preferences.setIntegerPreference("rulerType", 6);
	
 	
		//app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
	
		// vars
		var docRef = app.activeDocument;
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
	
			// continue if layer hidden
			if (VisibilityMode==0 && !layerVisibility[layerIndex]) continue;
			
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
			
			// create text layer
			if (rectangleForText) {
				for(var i= 0; i < itemsForRectangles.length; ++i){
					var item = itemsForRectangles[i];
					
					// get layer bounds
					var lb = getLayerBoundsAsObject(item.geometricBounds);
					
					// determine style and weight and remap if needed
					var _fontStyle = item.textRange.textFont.style.indexOf('Italic')==-1? 'normal' : 'italic';
					var _fontWeight = item.textRange.textFont.style.indexOf('Bold')==-1? 'normal' : 'bold';
					var _fontFamily = item.textRange.textFont.family;
	
					if (global_settings['fontMappingForHypeFonts'][_fontFamily+' '+item.textRange.textFont.style]){
						_fontFamily = global_settings['fontMappingForHypeFonts'][_fontFamily+' '+item.textRange.textFont.style];
					} else if (global_settings['fontMappingForHypeFonts'][_fontFamily]){
						_fontFamily = global_settings['fontMappingForHypeFonts'][_fontFamily];
					}
					
					//check if we also transfer content and clean it if needed
					var _native = (FontMode == _FontMode_native_text);
					var _content = _native? item.contents : '';
					if(_native && _content!='') _content = _content
						.replace(/(?:\r\n|\r|\n)/gm, '<br />\n')
						.replace(/&/gm, '&amp;')
						.replace(/</gm, '&lt;')
						.replace(/>/gm, '&gt;');
					var _name = cleanLayerName+"_"+(item.name? item.name : lid);
					
					// shouldn't be necessary as we switched the entire original document to RGB
					// but it seems like one can have single elements with CMYK and other color spaces
					var _textColor = item.textRange.fillColor;
					// check if it is a CMYK and convert to RGB
					if (_textColor.typename == "CMYKColor"){ //docRef.documentColorSpace == DocumentColorSpace.CMYK || ){
						var c = [_textColor.cyan, _textColor.magenta, _textColor.yellow, _textColor.black];
						c = app.convertSampleColor(ImageColorSpace.CMYK, c, ImageColorSpace.RGB, ColorConvertPurpose.defaultpurpose);
						_textColor = new RGBColor();
						_textColor.red = c[0];
						_textColor.green = c[1];
						_textColor.blue = c[2];
					// if it's not a RGB at this point default to black
					} else if (_textColor.typename != "RGBColor"){
						_textColor = new RGBColor();
						_textColor.red = 0;
						_textColor.green = 0;
						_textColor.blue = 0;
					}
	
					elementsStr += textElementPlistString({
						name: _name,
						top: lb.top,
						left: lb.left,
						height: lb.height,
						// add a pixel to avoid line breaks
						width: lb.width+1,
						zIndex: 1000-lid,
						key: 10+lid,
						opacity: 100/100,
						className: _name,
						fontWeight: _fontStyle,
						fontFamily: _fontFamily,
						textColor: _textColor? RGBToHex(_textColor): '#000',
						fontSize: Math.floor(item.textRange.size),
						fontStyle: _fontWeight,
						paddingTop: 0, 
						paddingLeft: 0,
						paddingBottom: 0,
						paddingRight: 0,
						innerHTML: _content,
					});
					lid++;
				}
			}
			if (copyDocNewLayer.pageItems.length) {
				// trim
				app.executeMenuCommand('selectall');
				copyDoc.artboards[0].artboardRect = copyDoc.visibleBounds;
	
				// save
				// https://gist.github.com/iconifyit/2cbab3f0dd421b6d4bb520bfcf445f0d
				// http://jongware.mit.edu/iljscs6html/iljscs6/pc_ExportOptionsSVG.html
				var saveAsFileName = resourcesFolder.fullName + "/" + cleanLayerName +'.svg';
				var exportOptions = new ExportOptionsSVG();
				var saveFile = new File(saveAsFileName);
				exportOptions.DTD = SVGDTDVersion.SVG1_1; //SVGDTDVersion.SVG1_0;
				exportOptions.sVGAutoKerning = true
				//exportOptions.embedRasterImages = true;
				exportOptions.coordinatePrecision = 2;
				exportOptions.documentEncoding = SVGDocumentEncoding.UTF8;
				exportOptions.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
				//exportOptions.cssProperties = SVGCSSPropertyLocation.STYLEATTRIBUTES;
				//exportOptions.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;
				switch (FontMode) {
					// case  _FontMode_glyph_paths:
					// 	exportOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
					// 	exportOptions.fontType = SVGFontType.SVGFONT
					// 	break;
					
					case _FontMode_outlined_paths:
						exportOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;	
						exportOptions.fontType = SVGFontType.OUTLINEFONT;
						break;
					
					case _FontMode_regular_text_webfont:
						exportOptions.fontSubsetting = SVGFontSubsetting.None;
						break;
				}
				exportOptions.typename = ExportType.SVG;
				app.activeDocument.exportFile(saveFile, ExportType.SVG, exportOptions);
	
				// apply Font Mappings for SVG to file
				runFontMappingForSVG(saveAsFileName);

				// clean SVG Illustrator produces
				if(shouldOptimize) {
					runSvgCleaner(saveAsFileName);
				} else {
					runHomebrewCleaner(saveAsFileName);
				}
	
				// prep name
				var name = layer.name.split('.')[0];
				var fileName = cleanLayerName+'.svg'; 
	
				// get layer bounds
				var lb = getLayerBoundsAsObject(docRef.visibleBounds);
	
				// set original width and height
				var originalWidth = lb.width;
				var originalHeight = lb.height;
	
				// svg string
				var svg_string = '';
	
				// fontmode empty
				var keep_layer_with_text_empty = FontMode==_FontMode_empty_rectangle && hasText;
	
				// assume layers are linked (not inlined!)
				var linked_mode = true;
				// if globally requested to be inlined … inline!
				if (EmbedMode==_EmbedMode_inlined)  linked_mode = false;
				// if webfont mode is set … inline!
				if (EmbedMode==_EmbedMode_webfont && hasText)  linked_mode = false;
				// if requested by the layer itself directly … inline
				if (layer.name.indexOf('__inline') !=-1) linked_mode = false;
				
				// encode SVG
				var svgdata = '';
				if (DataURIMode==_DataURIMode_base64){
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
	
				if (!keep_layer_with_text_empty) {
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
						svg_string = read_file(saveAsFileName);
						if (svg_string) svg_string = svg_string
							.replace(/&/gm, '&amp;')
							.replace(/</gm, '&lt;')
							.replace(/>/gm, '&gt;');
					}
				}
	
				elementsStr += elementPlistString({
					resourceId: (linked_mode && !keep_layer_with_text_empty) ? lid : null,
					name: name,
					top: lb.top,
					left: lb.left,
					height: lb.height,
					width: lb.width,
					originalWidth: originalWidth,
					originalHeight: originalHeight,
					zIndex: 1000-lid,
					key: 10+lid,
					innerHTML: (linked_mode) ? null : svg_string, // TODO Text insert mode with Hype formats
					opacity: layer.opacity/100,
					className: cleanLayerName,
				});
	
				lid+=1;
			}
			
			// postprocessing
			layer.visible = false;
			copyDoc.close(SaveOptions.DONOTSAVECHANGES);
			copyDoc = null;
		}
		
		// save plist
		if (!onlyResources) saveAsPlistFile(hypePath+'/data.plist', dataPlistString({
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
				combine_files(css_files, docPath + '/'+docName+'-combined.css')
			}
			if (js_files.length>1){
				combine_files(js_files, docPath + '/'+docName+'-combined.js')
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
			if (svgCleanerFileExistsCounter > 20) {
				if (confirm("SVG Cleaner failed or is still running!\n\nWait for another 2 seconds?")) {
					svgCleanerFileExistsCounter = 0;
				} else {
					break;
				}
			}
			// if the file exists
			if (svgCleanerFile.exists) {
				// wait 100ms and read the file
				$.sleep(100);
				svgCleanerFile.open();
				minifiedSvg = svgCleanerFile.read();
				svgCleanerFile.close();
				break;
			}
			
			// wait 100ms and loop again
			$.sleep(100)
			svgCleanerFileExistsCounter++;
		}

		// if we got a minifed SVG replace original
		if (minifiedSvg) {
			svgCleanerFile = new File(filePath);
			svgCleanerFile.open('w');
			svgCleanerFile.write(minifiedSvg);
			svgCleanerFile.close();
			return true;
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
	 * @param {string} filename The filename to read
	 * @return {string} The content of the file
	 */
	function read_file(filename){
		if (!filename) return;
		var content = '', f;
		if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('r')) {
			content += f.read();
			f.close();
		}
		return content;
	}
	

	/**
	 * Read one or more files and write the content into a new file
	 *
	 * @param {Array} files Array of file to read
	 * @param {String} new_filename New file to create
	 */	
	function combine_files(files, new_filename){
		var content = '', f;
		for (var i=0; i < files.length; ++i){
			var filename = files[i];
			if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('r')) {
				content += f.read();
				f.close();
			}
		}
		if ((f = new File(new_filename)) && (f.encoding = 'UTF8') && f.open('w')) {
			f.lineFeed = _linefeed;
			f.write(content);
			f.close();
		}
	}

	/**
	 * Save svg data to css file with background-uri property
	 *
	 * @param {String} filename Path to the file
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsCSS_uri(filename, entries, docName){
		if (!filename) return;
		var f;
		// save base64
		if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('w')) {
			f.lineFeed = _linefeed;
			for (var i=0; i<entries.length; i++) {
				var className = entries[i].className;
				var svgdata = entries[i].svgdata;
				f.writeln(className+" {background: url(\""+svgdata+"\") no-repeat 50% 50%/contain !important;}");
			}
			f.close();
		} else {
			alert ('Error writing base64 CSS file');
		}
	}
	
	/**
	 * Create a CSS file with content
	 * 
	 * @param {String} filename Path to the file
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsCSS_content(filename, entries, docName){
		if (!filename) return;
		var f, hasData = false;
		// check if we have data to process later
		for (var i=0; i<entries.length; i++) {
			var vardata = entries[i].vardata;
			if (countProperties(vardata)) hasData =  true;
		}
		if (hasData){
			if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('w')) {
				f.lineFeed = _linefeed;
				var fnc = 'writeln'; // 'write';
				var t = fnc=='write' ? '': "\t";
				for (var i=0; i<entries.length; i++) {
					var varName = entries[i].varName;
					var vardata = entries[i].vardata;
					if (countProperties(vardata)){
						for (var key in vardata){
							var value = fixContentForCSS(vardata[key].contents);
							f[fnc]("."+varName+"_"+key+"::before { content : '"+value+"'; white-space: pre-wrap;}");
						}
					}
				}
				f.close();
			} else {
				alert ('Error writing content CSS file');
			}
		}
	}
	
	/**
	 * Save text layers entires as CSS variables
	 *
	 * @param {String} filename Path to the file
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsCSS_variables(filename, entries, docName){
		if (!filename) return;
		var f, hasData = false;
		// check if we have data to process later
		for (var i=0; i<entries.length; i++) {
			var vardata = entries[i].vardata;
			if (countProperties(vardata)) hasData =  true;
		}
		if (hasData){
			if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('w')) {
				f.lineFeed = _linefeed;
				var fnc = 'writeln'; // 'write';
				var t = fnc=='write' ? '': "\t";
				f[fnc](":root {");
				for (var i=0; i<entries.length; i++) {
					var varName = entries[i].varName;
					var vardata = entries[i].vardata;
					if (countProperties(vardata)){
						for (var key in vardata){
							var css_variable_name = ("--"+varName+"-"+key).replace('_','-');
							var value = fixContentForCSS(vardata[key].contents);
							f[fnc](t+css_variable_name+": '"+value+"';");
						}
					}
				}
				f[fnc]("}");
				f[fnc]("");
				for (var i=0; i<entries.length; i++) {
					var varName = entries[i].varName;
					var vardata = entries[i].vardata;
					if (countProperties(vardata)){
						for (var key in vardata){
							var css_variable_name = ("--"+varName+"-"+key).replace('_','-');
							f[fnc]("."+varName+"_"+key+"::before { content : var("+css_variable_name+"); white-space: pre-wrap;}");
						}
					}
				}
				f.close();
			} else {
				alert ('Error writing content CSS file');
			}
		}
	}
	
	/**
	 * Write a javascript file with the embedded images data encoded in base64 format.
	 *
	 * @param {String} filename Path to the file
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsJS_uri(filename, entries, docName){
		if (!filename) return;
		var f;
		if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('w')) {
			f.lineFeed = _linefeed;
			for (var i=0; i<entries.length; i++) {
				var varName = entries[i].varName;
				var svgdata = entries[i].svgdata;
				f.writeln("window['Inline-"+varName+"']=window['"+cleanName(docName)+"_"+varName+"']=\""+svgdata+"\";");
			}
			f.close();
		} else {
			alert ('Error writing base 64 JS file');
		}
	}
	
	/**
	 * Save named text layers entires as JavaScript object variables 
	 *
	 * @param {String} filename Path to the file
	 * @param {Array} entries Array of entries
	 * @param {String} docName Name of the document
	 */
	function saveLayerAsJS_content(filename, entries, docName){
		if (!filename) return;
		var f, hasData = false;
		// check if we have data to process later
		for (var i=0; i<entries.length; i++) {
			var vardata = entries[i].vardata;
			if (countProperties(vardata)) hasData = true;
		}
		if (hasData){
			if ((f = new File(filename)) && (f.encoding = 'UTF8') && f.open('w')) {
				f.lineFeed = _linefeed;
				var fnc = 'writeln'; // 'write';
				var t = fnc=='write' ? '': "\t";
				//if (fnc=='writeln') f.writeln();
				f[fnc]("window['Content_"+cleanName(docName)+"'] = {");
				for (var i=0; i<entries.length; i++) {
					var varName = entries[i].varName;
					var vardata = entries[i].vardata;
					if (countProperties(vardata)){
						f[fnc](t+"'"+varName+"' : {");
						for (var key in vardata){
							var value = fixContentForJS(vardata[key].contents);
							f[fnc](t+t+"'"+key+"' : '"+value+"', ");
						}
						f[fnc](t+"}");
					}
				}
				f[fnc]("}");
				f.close();
			} else {
				alert ('Error writing content JS file');
			}		
		}
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
				var extracted = extractTemplateVars(layer.layers[i]);
				for (var key in extracted) {
					data[key] = extracted[key];
				}
			}
		}
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
	 * left, top, right, bottom, width and height
	 *
	 * @param  {Array} 	lb bounds array
	 * @return {Object} object with the properties left, top, right, bottom, width and height
	 */
	function getLayerBoundsAsObject(lb){
		return {
			left: Math.round(lb[0]),
			top: Math.round(-lb[1]),
			right:	Math.round(lb[2]),
			bottom: Math.round(-lb[3]),
			width: Math.abs(Math.round(lb[2]-lb[0])),
			height: Math.abs(Math.round(lb[1]-lb[3])),
		};
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
     * @param {File} f - the SVG file
     * @returns {string} - the URL-safe data URI
     */
	function fileToTinyDataUri(f) {
    	var s = null;
    	if (f && (f = new File(f)) && (f.encoding = 'UTF8') && f.open('r')) {
        	s = f.read();
        	f.close();
    	}
    	return s && svgToTinyDataUri(s);
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
	 * @param {File|string} f - The file to access.
	 * @returns {string} - The file as base64 encoded string.
	 */
	function fileToBase64( /*File|str*/ f) {
    	var s = null;
    	if (f && (f = new File(f)) && (f.encoding = 'BINARY') && f.open('r')) {
        	s = f.read();
        	f.close();
    	}
    	return s && ('data:image/svg+xml;base64,'+base64Encode(s));
	};
	
	/**
	 * Cleans up an SVG file as outputted by Illustrator. 
	 * This is a temporary solution until we have a binary to do the job.
	 *
	 * @param	{File|str}	filePath	File to clean.
	 * @param	{Object}	o	Options.
	 * @returns	{Boolean}	true if file could be cleaned.
	 */
	function runHomebrewCleaner(filePath, o) {
    	var fileContents = null;
    	var svgFile = new File(filePath);
    	if (svgFile && (svgFile.encoding = 'UTF8') && svgFile.open('r')) {
        	fileContents = svgFile.read();
        	svgFile.close();
	
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
			// replace quotes
			fileContents = fileContents.replace(/"/g, "'")
				// fix collateral after quotes replacement
				.replace(new RegExp("=''","gm"), "='")
				.replace(/''\s/g, "' ")
			
			// save
			svgFile.open('w');
			svgFile.write(fileContents);
			svgFile.close();
    	}
    	return true;
	};

	/**
	 * Applies the font mapping to an SVG file.
	 * 
	 * @param	{File|str}	filePath	File to clean.
	 * @returns	{Boolean}	true if file could be cleaned.
	 */
	function runFontMappingForSVG(filePath) {
    	var fileContents = null;
    	var svgFile = new File(filePath);
    	if (svgFile && (svgFile.encoding = 'UTF8') && svgFile.open('r')) {
        	fileContents = svgFile.read();
        	svgFile.close();
			
			fileContents = applyFontMappingForSVG(fileContents, global_settings);
			
			// save
			svgFile.open('w');
			svgFile.write(fileContents);
			svgFile.close();
    	}
    	return true;
	};

	/**
	* Apply font names using mapping (fontMappingForSVG)
	*
	* @param {string} svgString - SVG string
	* @param {object} settings - settings object
	* @returns {string} - SVG string with fixed font names
	*/
	function applyFontMappingForSVG(svgString, settings) {
		for (var fontFamily in settings['fontMappingForSVG']){
			var fontFamilyLookup = settings['fontMappingForSVG'][fontFamily];
			var newFontString = '';
			if (typeof fontFamilyLookup == 'object') {
				if (fontFamilyLookup.hasOwnProperty('family')) {
					newFontString += "font-family='"+fontFamilyLookup['family']+"'";
				}
				if (fontFamilyLookup.hasOwnProperty('weight')) {
					newFontString += " font-weight='"+fontFamilyLookup['weight']+"'";
				}
				if (fontFamilyLookup.hasOwnProperty('style')) {
					newFontString += " font-style='"+fontFamilyLookup['style']+"'";
				}

			} else {
				newFontString = "font-family='"+fontFamilyLookup+"'";
			}
			svgString = svgString.replace(new RegExp("font-family=\"'"+fontFamily+"'\"","gm"), newFontString);
		}
		return svgString;
	}

	/**
	 * Open the URL in the default browser.
	 *
	 * @param {string} url - The URL to open.
	 */
	function openURL(url) {
		var file = new File(Folder.temp + '/temp.webloc');
		file.open('w');
		file.write('<?xml version="1.0" encoding="UTF-8"?>\n');
		file.write('<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n');
		file.write('<plist version="1.0">\n');
		file.write('<dict>\n');
		file.write('\t<key>URL</key>\n');
		file.write('\t<string>' + url + '</string>\n');
		file.write('</dict>\n');
		file.write('</plist>\n');
		file.close();
		file.execute();
	}
	
	/**
	 * Gnerate suitable names by using the
	 * object name value as input string
	 *
	 * @param lname - the name value
	 * @param c - the character to use to replace the dashes
	 * @returns the cleaned object name
	 */
	function cleanName(lname, c) {
		c = c || '_';
		return lname.replace(/\s\-\s/g, '_').replace(/\-/g, c).replace(/\s/g, c).replace(/[\-:\/\\*\?\"\<\>\|]/g, '');
	}
	
	
	/**
	 * Saves content as a property list file
	 *
	 * @param {String} filePath File path to save
	 * @param {String} content Content to save
	 * @returns {String | null} Returns null if succeeds, otherwise error message
	 */
	function saveAsPlistFile(filePath, content) {
		var saveFile = new File(filePath);
		saveFile.encoding = "UTF8";
		saveFile.open("w");
		if (saveFile.error) return saveFile.error;
		saveFile.write(content);
		if (saveFile.error) return saveFile.error;
		saveFile.close(); 
		if (saveFile.error) return saveFile.error;
		return null;
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

	function textElementPlistString(a){var b=a.name,c=a.top+"px",f=a.left+"px",g=a.height+"px",h=a.width+"px",k=a.zIndex,l=a.key,m=a.opacity,n=a.className,d=a.innerHTML,e="";d&&(e="\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>InnerHTML</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+d+"</string>\n\t\t\t\t\t\t</dict>");return"\n\t\t\t\t\t<key>"+l+"</key>\n\t\t\t\t\t<array>"+e+"\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>DisplayName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	b+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Left</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+f+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Opacity</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+m+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ExplicitDimensions</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>YES</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Height</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	g+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Overflow</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>visible</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Width</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+h+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Top</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	c+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ZIndex</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+k+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+n+"</string>\n\t\t\t\t\t\t</dict>\n\n\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontFamily</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	a.fontFamily+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontWeight</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+a.fontWeight+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>TextColor</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+a.textColor+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontSize</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	(a.fontSize+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Display</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>inline</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>WordWrap</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>break-word</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassType</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>Text</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>FontStyle</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+
	a.fontStyle+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>WhiteSpaceCollapsing</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>preserve</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Position</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>absolute</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Overflow</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>visible</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>DisplayName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>Text</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>TagName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>div</string>\n\t\t\t\t\t\t</dict>\n\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingBottom</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	(a.paddingBottom+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingRight</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+(a.paddingRight+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingLeft</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+(a.paddingLeft+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>PaddingTop</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>")+
	(a.paddingTop+"px</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t</array>\n\t")}

	function elementPlistString(a){var b=a.resourceId,c=a.name,f=a.top+"px",g=a.left+"px",h=a.height+"px",k=a.width+"px",l=a.originalHeight+"px",m=a.originalWidth+"px",n=a.zIndex,d=a.key,e=a.opacity,r=a.width/a.height,t=a.className;a=a.innerHTML;var p="",q="";a&&(p="\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>InnerHTML</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+a+"</string>\n\t\t\t\t\t\t</dict>");b&&(q="\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>BackgroundImageResourceGroupOid</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	b+"</string>\n\t\t\t\t\t\t</dict>");return"\n\t\t\t\t\t<key>"+d+"</key>\n\t\t\t\t\t<array>"+p+"\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>DisplayName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+c+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Position</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>absolute</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>OriginalWidth</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	m+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>SizeRatio</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+r+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Left</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+g+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>OriginalHeight</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	l+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Display</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>inline</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Opacity</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+e+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ConstrainProportions</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>YES</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Height</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	h+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Overflow</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>visible</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Width</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+k+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>Top</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	f+"</string>\n\t\t\t\t\t\t</dict>"+q+"\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>BackgroundSize</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>100% 100%</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>BackgroundRepeat</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>no-repeat</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>TagName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>div</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>AccessibilityRole</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>img</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ZIndex</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+
	n+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassType</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>Image</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t\t<dict>\n\t\t\t\t\t\t\t<key>identifier</key>\n\t\t\t\t\t\t\t<string>ClassName</string>\n\t\t\t\t\t\t\t<key>objectValue</key>\n\t\t\t\t\t\t\t<string>"+t+"</string>\n\t\t\t\t\t\t</dict>\n\t\t\t\t\t</array>\n\t"};
	
// IIFE end
})();

function polyfills(){
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
							<string>DisplayName</string>
							<key>objectValue</key>
							<string>Text</string>
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
