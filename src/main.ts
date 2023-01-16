import { 
	provideFASTDesignSystem, 
	fastCard, 
	fastButton,
	DesignSystemProvider
  } from '@microsoft/fast-components';
import { LewisStructureCanvas } from './lewisStructureCanvas';
import { BondType, InteractionMode, SettingsService } from './service/settingsService';
import { fabric } from "fabric"; 
import { Button } from '@microsoft/fast-foundation';

const foobarRequire = m => eval('require')(m); // trick webpack
foobarRequire;

DesignSystemProvider;
Button;
LewisStructureCanvas;

provideFASTDesignSystem()
	.register(
		fastCard(),
		fastButton()
	);

export function getMolecule(lewisStructureCanvas: LewisStructureCanvas){
	lewisStructureCanvas.getMolecule();
	console.log("FUNCTION");
}
(window as any).getMolecule = getMolecule;
export var settingsService = new SettingsService();

declare module 'fabric' {
	export namespace fabric {
		export interface ICanvasOptions{
			enablePointerEvents:boolean;
		}
		export interface Canvas{
			enablePointerEvents:boolean;
		}
	}
}

// var _container = document.getElementsByClassName('content')[0];
// console.log(_container);

// var _canvas = new fabric.Canvas('canvas1',{
// 	width: _container.clientWidth,
// 	height: _container.clientHeight,
// 	selection: false,
// 	enablePointerEvents: true
	
// });

// console.log(_canvas.enablePointerEvents);

//_canvas.initializePointerEvents();

let modeButtons = document.getElementsByClassName("toolButton");
for (let i=0; i< modeButtons.length; i++){
	let input = (modeButtons.item(i) as HTMLInputElement);
	if (input){
		input.onchange = (ev) =>{
			let option = (ev.target as HTMLInputElement).value;
			switch (option){
				case 'draw':
					settingsService.setDrawMode(InteractionMode.draw);
					break;
				case 'move':
					settingsService.setDrawMode(InteractionMode.move);
					break;
				case 'erase':
					settingsService.setDrawMode(InteractionMode.erase);
					break;
			}
		};
	}
}

let elementButtons = document.getElementsByClassName("elementButton");
for (let i=0; i< elementButtons.length; i++){
	let input = (elementButtons.item(i) as HTMLInputElement);
	if (input){
		input.onchange = (ev) =>{
			//settingsService.currentElement = (ev.target as HTMLInputElement).value;
		};
	}
}

let electronButtons = document.getElementsByClassName("electronButton");
for (let i=0; i< electronButtons.length; i++){
	let input = (electronButtons.item(i) as HTMLInputElement);
	if (input){
		input.onchange = (ev) => {
			settingsService.currentBondType = BondType[(ev.target as HTMLInputElement).value];
			if (BondType[(ev.target as HTMLInputElement).value] == BondType.lonePair){
				for (let i=0; i< elementButtons.length; i++){
					let input = (elementButtons.item(i) as HTMLInputElement);
					input.disabled=true;
				}
			} else {
				for (let i=0; i< elementButtons.length; i++){
					let input = (elementButtons.item(i) as HTMLInputElement);
					input.disabled=false;
				}
			}
		};
	}
}

settingsService.whenMode.subscribe(mode=>{
	if (mode == InteractionMode.draw){
		if (settingsService.currentBondType !== BondType.lonePair){
			for (let i=0; i< elementButtons.length; i++){
				let input = (elementButtons.item(i) as HTMLInputElement);
				input.disabled=false;
			}
		}
		for (let i=0; i< electronButtons.length; i++){
			let input = (electronButtons.item(i) as HTMLInputElement);
			input.disabled=false;
		}
	} else {
		for (let i=0; i< elementButtons.length; i++){
			let input = (elementButtons.item(i) as HTMLInputElement);
			input.disabled=true;
		}
		for (let i=0; i< electronButtons.length; i++){
			let input = (electronButtons.item(i) as HTMLInputElement);
			input.disabled=true;
		}
	}
}); 

function movingObject(ev:fabric.IEvent){
	let center = ev.target?.getCenterPoint();

}

function mouseOverObject(ev:fabric.IEvent){
	console.log('mouseover');
}
function mouseOutObject(ev:fabric.IEvent){
	console.log('mouseout');
}

function addEventsToObject(obj:fabric.Object){
	obj.on('moving', movingObject);
	obj.on('mouseover', mouseOverObject);
	obj.on('mouseout', mouseOutObject);
}
