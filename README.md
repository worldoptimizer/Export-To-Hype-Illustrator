# Export To Hype (Illustrator)
## A Third-Party Solution for Seamless Export to Tumult Hype 4

Export To Hype Illustrator is a powerful tool that seamlessly exports graphics from Adobe Illustrator to Tumult Hype 4. It is a third-party solution that simplifies the export process by creating a PLIST on the fly and bundling the necessary resources into a hypetemplate or hypesymbol.

This exporter tool was developed after the initial exploration of the concept with Export Hype Photoshop. It has been a game-changer for designers, developers, and publishers who need to create interactive HTML5 content quickly and easily.

The good news is that Export To Hype Illustrator is now open source, thanks to the German press agency, which has contributed to its development costs. It is currently used by the agency for many of their infographics, which are bought and used in newspapers worldwide.

With Export To Hype Illustrator, designers and developers can export their vector graphics from Adobe Illustrator to Tumult Hype 4 without any hassle, ensuring seamless integration and optimal performance. So, if you want to take your interactive HTML5 content to the next level, Export To Hype Illustrator is the perfect tool for you.


## Installation

To use Export to Hype Illustrator on Mac, you need to first install an ExtendScript .jsx file for Illustrator. This script provides the necessary functionality to export your Illustrator files to Hype. To install the script, follow these steps:

* Open Finder and navigate to your Illustrator scripts folder. The default path is: `/Applications/Adobe Illustrator CC [version]/Presets/[language]/Scripts`
* Copy the "`Export To Hype (Illustrator).jsx`" and "`Export To Hype (Illustrator).json`" files to this folder.
* (Re)Launch Adobe Illustrator and open the file you want to export.

## Getting Started with Exporting to Hype from Illustrator

Exporting to Hype Illustrator is a powerful feature that allows you to easily export your Illustrator designs to use in Hype. This tutorial will guide you through the process of exporting your Illustrator file to Hype and explain the various options available to you.

### Step 1: Prepare your Illustrator File

Before you can export your Illustrator file to Hype, you need to make sure that it is set up correctly. Here are some guidelines to follow:

*   Organize your artwork into separate layers and groups as needed.
*   Make sure that all of your layers and groups are named appropriately and have uniqe names.
*   To export your desired elements, make sure they are located in your top-level layers and not nested within other layers. However, grouping elements together is still permissible.
*   Save your file as an .ai file.

### Step 2: Launch Export to Hype (Illustrator)

Once your Illustrator file is ready, it's time to export it to Hype. Here's how:

1.  Make sure your your Illustrator file saved.
2. Select "`Export To Hype (Illustrator)`" from the Scripts menu (`File > Scripts > Export To Hype (Illustrator)`).
3. Follow the prompts to choose your export settings …

### Step. 3: Hype Template, Hype Symbol or Resources only

When exporting your Illustrator file to Hype, you have three options for the type of file you want to create: Hype Template, Hype Symbol, or Only Resources.

#### Export as Hype Template
> This option creates a new Hype document using your Illustrator file as a template. The layers and groups in your Illustrator file will be converted into corresponding elements in Hype, such as divs or images. This option is useful if you want to create a new Hype project based on your Illustrator design.

#### Export as Hype Symbol
> This option exports your Illustrator file as a reusable Hype Symbol, which is a group of elements that can be used repeatedly in your Hype project. When you drag a Hype Symbol into your Hype project, it will retain its original properties and animations. This option is useful if you want to create a reusable element for your Hype project.

#### Export as Resources only
> This option exports only the resources used in your Illustrator file and doesn't update or create a Hype file. This option is useful if you want to update the resources in your Hype project or just want to relink a file.

Each of these options has its own benefits, depending on your specific needs. Consider the purpose of your project and choose the option that best fits your requirements.

### Step. 4: Pick Your Export Options

When exporting your Illustrator file to Hype, you have several options to customize how the file is exported. Here's an overview of each option:

#### Visible or All layers
> This option allows you to choose whether to include only visible layers or all layers, including hidden ones. If you select "Visible," only top-level layers with the eye icon turned on in Illustrator will be exported. If you select "All," all top-level layers in your Illustrator file will be exported, regardless of their visibility.

#### Link or Inline SVG Content
> This option allows you to choose whether to link or inline the SVG content produced. **Linked** will reference an external SVG file, while *inlined** will embed the SVG content directly in the HTML. Linking can be useful if you have multiple instances of the same SVG in your project, as it can reduce the file size. Inlining can be useful if you want to ensure that the SVG content is always available, without an dependency on an external file or if you would like to edit it manually or on the fly (using script). **Empty** allows you to choose whether to create empty rectangles in the dimensions of the SVG layer or to include the SVG content. If you choose this option empty rectangles will be created in Hype with the dimensions of the SVG layer.

#### Font Handling
> This option allows you to choose how to handle fonts. You can **outline fonts to paths (flattend)**, which converts the text to outlines and creates paths for each character. This option is the most compatible, as it ensures that the text looks the same in any browser. Alternatively, you can include them **as regular text (using webfonts)** with a font-family attribute, which will reference a font file in your project's resources and inline the layers (as background images are sandboxed). This option ensures that the text looks the same regardless of the browser and reduces the SVG size, but it requires the fonts to be installed (either as a webfont or as a system font). You can also create text layers **as empty rectangles (CSS class)**, which will create empty elements in Hype with the dimensions of the text and attach a class name to the layer. This option is useful if you want to add text to your project later or assign it using CSS, data or variables (more advanced use-cases). Finally, you can include text **as native Hype text elements**, which will include the text as HTML inside the Hype element. This option is useful if you would like to retain the ability to edit the text in Hype. Finnal, you can also choose to disregard text layers altogether by choosing **not at all (ignore)** if you do not want to include any text in your exported file.

Each of these options allows you to fine-tune the export settings to meet your specific needs. Consider the requirements of your project and choose the option that best fits your needs.


### Step. 5: Export and open in Hype

After you have customized your export settings, it's time to export your Illustrator file and open it in Hype. Here are some key takeaways to keep in mind:

#### Hype Template
> When you export your Illustrator file as a Hype Template, you will create a file that, when clicked, will open a new Hype file based on the template. This allows you to easily create new Hype projects based on your Illustrator design.

#### Hype Symbol
> When you export your Illustrator file as a Hype Symbol, after double clicking the Hype symbol it will be imported as a nested symbol into the Hype file that is currently open. Alternatively, you can drag the Hype Symbol into any open Hype file. This allows you to easily reuse your Illustrator design in multiple Hype projects.

#### Resources Only
> If you choose to export your Illustrator file as resources, you can use the resources in your Hype project by relinking them with the resources library. This allows you to easily update resources in Hype projects exported using Export To Hype.

To relink a resource in Tumult Hype, you can follow these steps:
1. In the Tumult Hype document, select the element that contains the resource you want to relink.
2. In the "Element Info" pane on the right side of the Tumult Hype interface, locate the "Resource Library" section.
3. Click the "Browse" button next to the "Resource" field. This will open a file browser.
4. Locate the new resource file you want to use and select it.
5. Click the "Choose" button to close the file browser and update the resource in the "Resource Library" section.
6. Click the "Update" button to update the element with the new resource file.

