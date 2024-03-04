# LewisStructuresWeb

This is a web element that is designed for homework/quiz purposes.  A student will be able to draw a Lewis Structure.  The web element can then return a Canonical SMILES representation of the structure (if it exists) along with information about perspective.  

Currently, this is being used in WeBWorK along with accompanying contextChemical.pl and parserLewisStructureTool.pl to grade student's drawings.  See https://github.com/WeBWorK-for-Chemistry/WeBWorKChemistry for more information.

## Demo ##
https://limefrogyank.github.io/LewisStructuresWeb/

## Usage ##
HTML:
```
<h5>
Question:  Draw the Lewis Structure for ammonia, NH₃.   
</h5>
<lewis-structure-canvas smiles="N"></lewis-structure-canvas>
```
Javascript:
(after student has drawn a structure)
```
const lewisStructureCanvas = document.getElementsByTagName("lewis-structure-canvas")[0];

// get analysis of drawn molecule compared to set SMILES attribute
const result = lewisStructureCanvas.getMolecule();

// get kekule mime format (chemical/x-kekule-json) of drawn molecule to store for answer
const kekule = lewisStructureCanvas.getKekuleMime();

// get mol mime format (chemical/x-mdl-molfile) of drawn molecule to store for answer
const mol = lewisStructureCanvas.getMolMime();

// get SVG of drawn molecule to store as a preview
const svg = lewisStructureCanvas.getSVG();


```
