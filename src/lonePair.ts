// import { Subject,BehaviorSubject, Observable, Subscription } from 'rxjs';
// import { fabric } from "fabric"; 
// import { Connector} from "./connector";
// import {  settingsService } from './lewisStructureCanvas';
// import { Vertex } from './vertex';
// import { InteractionMode } from './service/settingsService';
// //import { SettingsService} from './service/settingsService';
// import { Kekule } from './kekuleTypings';

// export interface ILonePairOptions extends fabric.IGroupOptions{
// 	owner: Vertex;
// 	radians?: number; 
// 	molecule: Kekule.Molecule;
// }

// export class LonePair extends fabric.Group{

// 	static longRadius: number = 15;
// 	static shortRadius: number = 8;

// 	public owner: Vertex;
// 	private _ownerSubscription: Subscription;

// 	private _circle1: fabric.Circle;
// 	private _circle2: fabric.Circle;
// 	private _selectionEllipse: fabric.Ellipse;
// 	public radians: number;

// 	private _mouseMoveEventRef;
// 	private _mouseUpEventRef;

// 	private _position: Subject<fabric.Point>;
// 	public Position: Observable<fabric.Point>;

// 	private _molecule: Kekule.Molecule;
// 	private _electrons: Kekule.ChemMarker.UnbondedElectronSet;

// 	constructor(options: ILonePairOptions) {
		
// 		options.originX = 'center'; 
// 		options.originY = 'center';
// 		options.selectable=false;
// 		options.lockMovementX=true;
// 		options.lockMovementY=true;
// 		options.hasControls=false;
// 		options.hoverCursor=settingsService.eraserCursor;

		

// 		let circle1 = new fabric.Circle({
// 			radius:3,
// 			fill:'black',
// 			left: 0,
// 			top: LonePair.longRadius/3,
// 			originX:'center',
// 			originY:'center'
// 		});
// 		let circle2 = new fabric.Circle({
// 			radius:3,
// 			fill:'black',
// 			left: 0,
// 			top: -LonePair.longRadius/3,
// 			originX:'center',
// 			originY:'center'
// 		});
// 		let selectionEllipse = new fabric.Ellipse({
// 			rx:LonePair.shortRadius,
// 			ry:LonePair.longRadius,
// 			stroke:'black',
// 			fill:'transparent',
// 			strokeDashArray: [5,5],
// 			strokeWidth:2,
// 			originX:'center',
// 			originY:'center',
// 			evented:true,
// 			hoverCursor:'null',
// 			opacity:0
// 		});

		
// 		super([selectionEllipse,circle1,circle2],options);
// 		this.radians = options.radians != null ? options.radians : 0;
// 		this._circle1 = circle1;
// 		this._circle2 = circle2;
// 		this._selectionEllipse=selectionEllipse;

// 		// this._selectionEllipse.on('mouseover', this.mouseOverObject.bind(this));
// 		// this._selectionEllipse.on('mouseout', this.mouseOutObject.bind(this));
// 		this._selectionEllipse.bringToFront();

// 		this.owner = options.owner;

// 		this._molecule = options.molecule;
// 		this._electrons = new Kekule.ChemMarker.UnbondedElectronSet();
// 		this._electrons.canvasLonePair = this;
// 		this.owner.atom.appendMarker(this._electrons);

// 		this._ownerSubscription = this.owner.Position.subscribe(position=>{
// 			if (this.angle == null){
// 				return;
// 			}
// 			let radians = this.angle/360*2*Math.PI;
// 			console.log(radians);
// 			let vect = new fabric.Point(Math.cos(radians), Math.sin(radians));
				
// 			(this as fabric.Group).set({
				
// 				left: position.x + (vect.x * (LonePair.shortRadius + Vertex.circleRadius)),
// 				top: position.y + (vect.y * (LonePair.shortRadius + Vertex.circleRadius))
// 			});
// 			this.setCoords();
// 			this._electrons.coord2D = {x: position.x + (vect.x * (LonePair.shortRadius + Vertex.circleRadius)), y: position.y + (vect.y * (LonePair.shortRadius + Vertex.circleRadius))}
// 		});

		

// 		this.on('mouseover', this.mouseOverObject);
// 		this.on('mouseout', this.mouseOutObject);

// 		this.on('mousedown', this.mouseDown);
// 		this.on('moving', this.onObjectMoving);

// 		// settingsService.whenMode.subscribe(mode =>{
// 		// 	console.log('whenMovable changed on vertex');
// 		// 	(this as fabric.Group).set({
// 		// 		lockMovementX: mode != InteractionMode.move,
// 		// 		lockMovementY: mode != InteractionMode.move,
// 		// 		selectable: mode == InteractionMode.move
// 		// 	});
// 		// });

// 	}  

// 	public updateKekulePosition(x:number,y:number){
// 		this._electrons.coord2D = {x:x,y:y};
// 	}



// 	private onObjectMoving(ev:fabric.IEvent){
// 		console.log('lonepair moving!');
// 		//let coords = .getCoords();
// 		//this._position.next(new fabric.Point(ev.pointer.x, ev.pointer.y));
// 		//this._position.next(new fabric.Point(this.left, this.top));
// 	}

// 	public _render(ctx:CanvasRenderingContext2D){
// 		// if (this.attachments.length == 0 || this.text !== "C"){
// 			super._render(ctx);

// 	}


// 	mouseDown(ev:fabric.IEvent){
// 		console.log("mousedown!");

		
// 		if (settingsService.isMoveable) {
// 			this._mouseMoveEventRef = this.mouseMoveBondDrawing.bind(this);
// 			window.addEventListener('pointermove', this._mouseMoveEventRef);
// 			this._mouseUpEventRef = this.mouseUp.bind(this);
// 			window.addEventListener('pointerup', this._mouseUpEventRef);

// 		} else if (settingsService.isEraseMode) {
// 			this.owner.removeAttachment(this);	
// 			this._ownerSubscription.unsubscribe();
// 			this.canvas?.remove(this);
			 
// 		}
		
// 	}


// 	mouseMoveBondDrawing(ev:PointerEvent){
// 		let canvasCoords = this.canvas?.getPointer(ev);
// 		if (canvasCoords == null){
// 			return;
// 		}
// 		//this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
// 		console.log(`lonepair pointermove: ${ev.x}, ${ev.y} `);
// 		if (settingsService.isMoveable){
			
// 			let vertexCenter = this.owner.getCenterPoint();
				
// 			let vect = new fabric.Point(canvasCoords.x-vertexCenter.x,canvasCoords.y-vertexCenter.y);
// 			let length = Math.sqrt(Math.pow(vect.x,2) + Math.pow(vect.y,2));
// 			let normVect = new fabric.Point(vect.x/length, vect.y/length);
// 			let angle = Math.atan2(normVect.y, normVect.x);
						
// 			(this as LonePair).set({
// 				angle:angle/Math.PI/2*360,
// 				left: vertexCenter.x + (normVect.x * (LonePair.shortRadius + Vertex.circleRadius)),
// 				top: vertexCenter.y + (normVect.y * (LonePair.shortRadius + Vertex.circleRadius))
// 			});
// 			this.setCoords();
// 			this._electrons.coord2D = {x:  vertexCenter.x + (normVect.x * (LonePair.shortRadius + Vertex.circleRadius)), y: vertexCenter.y + (normVect.y * (LonePair.shortRadius + Vertex.circleRadius))};

// 			this.canvas?.renderAll();


// 			//this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
// 		} else {
// 			// this._tempLine.setLineEndpoint(canvasCoords.x, canvasCoords.y);
			
// 		}
	
// 	}

// 	public reportPositionChanged(x :number, y:number){
// 		this._position.next(new fabric.Point(x, y));
// 	}

// 	mouseUp(ev:PointerEvent){
// 		window.removeEventListener('pointermove', this._mouseMoveEventRef);
// 		window.removeEventListener('pointerup', this._mouseUpEventRef);
		
// 	}

// 	mouseOverObject(ev:fabric.IEvent){
// 		console.log('mouseoverobject id: ' + this );
// 		let canvas = this.canvas;
// 		this._selectionEllipse.animate('opacity',1, {
// 			from:0,
// 			duration:100,
// 			onChange: canvas?.renderAll.bind(canvas)
// 		});
// 	}
	
// 	mouseOutObject(ev:fabric.IEvent){
// 		console.log('mouseoutobject');
// 		let canvas = this.canvas;
// 		this._selectionEllipse.animate('opacity',0, {
// 			from:1,
// 			duration:100,
// 			onChange: this.canvas?.renderAll.bind(this.canvas)
			
// 		});
// 	} 
// }

