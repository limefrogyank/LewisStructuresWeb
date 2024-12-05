import 'reflect-metadata';
import { 
	provideFASTDesignSystem, 
	fastCard, 
	fastButton,
	DesignSystemProvider
  } from '@microsoft/fast-components';
import { LewisStructureCanvas } from './lewisStructureCanvas';
import { BondType, InteractionMode, SettingsService } from './service/settingsService';
import { Button } from '@microsoft/fast-foundation';


// const foobarRequire = m => eval('require')(m); // trick webpack
// foobarRequire;

DesignSystemProvider;
Button;
LewisStructureCanvas;

provideFASTDesignSystem()
	.register(
		fastCard(),
		fastButton()
	);

// export function getMolecule(lewisStructureCanvas: LewisStructureCanvas){
// 	lewisStructureCanvas.getMolecule();
// }
// export function getSVG(lewisStructureCanvas: LewisStructureCanvas){
// 	lewisStructureCanvas.getMolecule();
// }


//(window as any).getMolecule = getMolecule;
// export var settingsService = new SettingsService();


// let modeButtons = document.getElementsByClassName("toolButton");
// for (let i=0; i< modeButtons.length; i++){
// 	let input = (modeButtons.item(i) as HTMLInputElement);
// 	if (input){
// 		input.onchange = (ev) =>{
// 			let option = (ev.target as HTMLInputElement).value;
// 			switch (option){
// 				case 'draw':
// 					settingsService.setDrawMode(InteractionMode.draw);
// 					break;
// 				case 'move':
// 					settingsService.setDrawMode(InteractionMode.move);
// 					break;
// 				case 'erase':
// 					settingsService.setDrawMode(InteractionMode.erase);
// 					break;
// 			}
// 		};
// 	}
// }

// let elementButtons = document.getElementsByClassName("elementButton");
// for (let i=0; i< elementButtons.length; i++){
// 	let input = (elementButtons.item(i) as HTMLInputElement);
// 	if (input){
// 		input.onchange = (ev) =>{
// 			//settingsService.currentElement = (ev.target as HTMLInputElement).value;
// 		};
// 	}
// }

// let electronButtons = document.getElementsByClassName("electronButton");
// for (let i=0; i< electronButtons.length; i++){
// 	let input = (electronButtons.item(i) as HTMLInputElement);
// 	if (input){
// 		input.onchange = (ev) => {
// 			settingsService.currentBondType = BondType[(ev.target as HTMLInputElement).value];
// 			if (BondType[(ev.target as HTMLInputElement).value] == BondType.lonePair){
// 				for (let i=0; i< elementButtons.length; i++){
// 					let input = (elementButtons.item(i) as HTMLInputElement);
// 					input.disabled=true;
// 				}
// 			} else {
// 				for (let i=0; i< elementButtons.length; i++){
// 					let input = (elementButtons.item(i) as HTMLInputElement);
// 					input.disabled=false;
// 				}
// 			}
// 		};
// 	}
// }

// settingsService.whenMode.subscribe(mode=>{
// 	if (mode == InteractionMode.draw){
// 		if (settingsService.currentBondType !== BondType.lonePair){
// 			for (let i=0; i< elementButtons.length; i++){
// 				let input = (elementButtons.item(i) as HTMLInputElement);
// 				input.disabled=false;
// 			}
// 		}
// 		for (let i=0; i< electronButtons.length; i++){
// 			let input = (electronButtons.item(i) as HTMLInputElement);
// 			input.disabled=false;
// 		}
// 	} else {
// 		for (let i=0; i< elementButtons.length; i++){
// 			let input = (elementButtons.item(i) as HTMLInputElement);
// 			input.disabled=true;
// 		}
// 		for (let i=0; i< electronButtons.length; i++){
// 			let input = (electronButtons.item(i) as HTMLInputElement);
// 			input.disabled=true;
// 		}
// 	}
// }); 


