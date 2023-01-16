import { fabric } from "fabric";  
import { copiedTextStyle } from "fabric/fabric-impl";
import { Vertex, IVertexOptions } from "./vertex";
import { settingsService } from './lewisStructureCanvas';
import { BondType } from './service/settingsService';
import { Subscription, Observable, BehaviorSubject, Subject } from "rxjs";
import {Kekule}	from './kekuleTypings';

interface IConnectorOptions extends fabric.ILineOptions{
	vertex1: Vertex;
	vertex2: Vertex;
	bondType: BondType;
	molecule: Kekule.Molecule;
	bond?: Kekule.Bond;
}


export class Connector extends fabric.Line{

	//_testVariable:number;
	//_ellipse:fabric.Ellipse;
	_selectableCircle: fabric.Ellipse; 
	//_bondType:BondType;
	_vertex1:Vertex|null;
	_vertex2:Vertex|null;
	_vertex1PositionSubscription:Subscription;
	_vertex2PositionSubscription:Subscription;
	_vertex1SymbolSubscription:Subscription;
	_vertex2SymbolSubscription:Subscription;

	_molecule: Kekule.Molecule;
	public bond: Kekule.Bond;

	
	private _bondType: BehaviorSubject<BondType>;
	public BondType: Observable<BondType>;
	public get CurrentBondType() {
		return this._bondType?.value;
	} 

	private _vertexChange: Subject<Vertex>;
	public VertexChange: Observable<Vertex>;

	// public get bondType(): BondType{
	// 	return this._bondType;
	// }

	constructor( points: number[], options : IConnectorOptions){

		options.stroke = options.stroke || 'black';
		options.strokeWidth = options.strokeWidth || 2;
		options.selectable = options.selectable|| false;
		options.moveCursor = options.moveCursor || 'none';
		options.evented = options.evented || false;
		options.originX = options.originX || 'center';
		options.originY = options.originY || 'center';
		options.hoverCursor='null';
		options.lockMovementX=true;
		options.lockMovementY=true;
		options.padding=15;
		
		super(points, options);

		this._bondType = new BehaviorSubject<BondType>(options.bondType);
		this.BondType = this._bondType.asObservable();

		this._vertexChange = new Subject();
		this.VertexChange = this._vertexChange.asObservable();

		//this._bondType=options.bondType;
		this._vertex1=options.vertex1;
		this._vertex2=options.vertex2;

		if (options.bond) {
			this.bond = options.bond;
			this.bond.canvasConnector = this;
		} else {
			this._molecule=options.molecule;
			this.bond = new Kekule.Bond();
			this.bond.canvasConnector = this;
			this.bond.setConnectedObjs([options.vertex1.atom, options.vertex2.atom]);
			this._molecule.appendConnector(this.bond);
		}

		this._bondType.subscribe(x=>{
			//this.setBondType(x);
			switch (x){
				case BondType.single:
					this.bond.setBondOrder(1);
					this.bond.stereo = Kekule.BondStereo.NONE;
					break;
				case BondType.solid:
					this.bond.setBondOrder(1);
					this.bond.stereo = Kekule.BondStereo.UP;
					break;
				case BondType.dashed:
					this.bond.setBondOrder(1);
					this.bond.stereo = Kekule.BondStereo.DOWN;
					break;
				case BondType.double:
					this.bond.setBondOrder(2);
					this.bond.stereo = Kekule.BondStereo.NONE;
					break;
				case BondType.triple:
					this.bond.setBondOrder(3);
					this.bond.stereo = Kekule.BondStereo.NONE;
					break;
			}
		});

		let center = this.getCenterPoint();
		let linePoints = this.calcLinePoints();
		let distance = Math.sqrt(Math.pow(linePoints.x2 - linePoints.x1,2) + Math.pow(linePoints.y2-linePoints.y1,2));
		let angle = Math.atan2(linePoints.y2-linePoints.y1, linePoints.x2-linePoints.x1);

		this._selectableCircle = new fabric.Ellipse({
			rx: distance/3,
			ry: 10,
			left: center.x,
			top: center.y,
			centeredRotation:true,
			angle:angle * 360 / 2 / Math.PI,
			originX:'center',
			originY:'center',
			fill:'transparent',
			stroke:'black',
			opacity:0,
			strokeWidth:2,
			strokeDashArray: [5,5],
			selectable:false,
			hasControls:false,
			evented:false,
			hoverCursor:'null'
		});
		
		this.on('added', ev =>{
			this.canvas?.add(this._selectableCircle);
			this._selectableCircle.on('mouseover', this.mouseOverObject.bind(this));
			this._selectableCircle.on('mouseout', this.mouseOutObject.bind(this));
			this._selectableCircle.bringToFront();
			this._selectableCircle.on('mousedown', this.mouseDown.bind(this));
		});
		this.on('removed', ev =>{
			console.log('removed connector');
			this.canvas?.remove(this._selectableCircle);
		});
		
		if (options.vertex1 !== null) {
			this._vertex1SymbolSubscription = options.vertex1.Symbol.subscribe(symbol=>{
				this._vertexChange.next(options.vertex1);
			});
			
			this._vertex1PositionSubscription = options.vertex1.Position.subscribe(point=>{
				this._vertexChange.next(options.vertex1);
				(this as fabric.Line).set({
					x1: point.x,
					y1: point.y,
					dirty:true
				});
				let center = this.getCenterPoint();
				let linePoints = this.calcLinePoints();
				let distance = Math.sqrt(Math.pow(linePoints.x2 - linePoints.x1,2) + Math.pow(linePoints.y2-linePoints.y1,2));
				let angle = Math.atan2(linePoints.y2-linePoints.y1, linePoints.x2-linePoints.x1);

				this._selectableCircle.set({
					left:center.x,
					top:center.y,
					rx: distance/3,
					angle:angle * 360 / 2 / Math.PI,
					dirty:true
				});
				this.setCoords();
				this._selectableCircle.setCoords();
				if (this.canvas !== undefined) {
					this.canvas.renderAll();
				}
			});
		}
		if (options.vertex2 !== null){
			this._vertex2SymbolSubscription = options.vertex2.Symbol.subscribe(symbol=>{
				this._vertexChange.next(options.vertex2);
			});

			this._vertex2PositionSubscription = options.vertex2.Position.subscribe(point=>{
				this._vertexChange.next(options.vertex2);
				(this as fabric.Line).set({
					x2: point.x,
					y2: point.y,
					dirty:true
				});
				let center = this.getCenterPoint();
				let linePoints = this.calcLinePoints();
				let distance = Math.sqrt(Math.pow(linePoints.x2 - linePoints.x1,2) + Math.pow(linePoints.y2-linePoints.y1,2));
				let angle = Math.atan2(linePoints.y2-linePoints.y1, linePoints.x2-linePoints.x1);

				//console.log('center coords: ' + center);
				this._selectableCircle.set({
					left:center.x,
					top:center.y,
					rx: distance/3,
					angle:angle * 360 / 2 / Math.PI,
					dirty:true
				});
				this.setCoords();
				this._selectableCircle.setCoords();
				if (this.canvas !== undefined) {
					this.canvas.renderAll();
				}
			});
		}

		
		
	}

	public setBondType(bondType:BondType){
		//this._bondType=bondType;
		this._bondType.next(bondType);
	}

	public dispose(){
		this.canvas?.remove(this);
		this._molecule.removeConnector(this.bond);
		this._vertex1PositionSubscription.unsubscribe();
		this._vertex2PositionSubscription.unsubscribe();
		this._vertex1SymbolSubscription.unsubscribe();
		this._vertex2SymbolSubscription.unsubscribe();
		this._vertex1=null;
		this._vertex2=null;
	}

	public setEvented(isEvented:boolean){
		console.log("set evented on selectableCircle");
		this._selectableCircle.set({
			evented: isEvented
		});
	}

	mouseDown(ev:fabric.IEvent){
		console.log("mousedown!");
		
		if (settingsService.isEraseMode){
			this._vertex1?.removeAttachment(this);
			this._vertex2?.removeAttachment(this);
			//this._vertex1.dispose();
			//this._vertex2.dispose();
			//this._vertex1Subscription.unsubscribe();
			//this._vertex2Subscription.unsubscribe();
			//this.canvas.remove(this);
			this.dispose();
		} else if (settingsService.isDrawMode){
			// change bond order
			if (settingsService.currentBondType === BondType.lonePair){
				// don't change a bond into a lone pair.
				return;
			}
			if (this._bondType.value !== settingsService.currentBondType){
				this._bondType.next(settingsService.currentBondType);
				//this._bondType = settingsService.currentBondType;
				(this as fabric.Line).set({dirty:true});
				this.canvas?.renderAll();
			}

		}
	}

	toSVG(reviver?: Function): string {
		let p = this.calcLinePoints();

		let vector = new fabric.Point(p.x2-p.x1, p.y2-p.y1);
		let length = Math.sqrt(Math.pow(vector.x,2) + Math.pow(vector.y,2));
		let normVector = new fabric.Point(vector.x/length, vector.y/length);
		let perpVector = new fabric.Point(normVector.y, -normVector.x);
		let svg = "";
		switch (this._bondType.value){
			case BondType.single:
				return super.toSVG(reviver);
			case BondType.double:
				perpVector = new fabric.Point(perpVector.x * 4, perpVector.y * 4);
				svg += `<path d="M${p.x1 + (normVector.x * 15) + perpVector.x + this.left!} ${p.y1 + (normVector.y * 15) + perpVector.y + this.top!} `; 
				svg += `L${p.x2 - (normVector.x * 15) + perpVector.x + this.left!} ${p.y2 - (normVector.y * 15) + perpVector.y + this.top!} `;
				svg += `Z" stroke='black' stroke-width='${this.strokeWidth}' />`; 
				svg += `<path d="M${p.x1 + (normVector.x * 15) - perpVector.x + this.left!} ${p.y1 + (normVector.y * 15) - perpVector.y + this.top!} `; 
				svg += `L${p.x2 - (normVector.x * 15) - perpVector.x + this.left!} ${p.y2 - (normVector.y * 15) - perpVector.y + this.top!} `;
				svg += `Z" stroke='black' stroke-width='${this.strokeWidth}' />`; 
				return svg;
			default:
				return super.toSVG(reviver);
		}
	}


	public _render(ctx:CanvasRenderingContext2D){
		let p = this.calcLinePoints();
		let vector = new fabric.Point(p.x2-p.x1, p.y2-p.y1);
		let length = Math.sqrt(Math.pow(vector.x,2) + Math.pow(vector.y,2));
		let normVector = new fabric.Point(vector.x/length, vector.y/length);
		let perpVector = new fabric.Point(normVector.y, -normVector.x);
		

		switch (this._bondType.value){
			case BondType.single:
				super._render(ctx);
				break;
			case BondType.double:
				perpVector = new fabric.Point(perpVector.x * 4, perpVector.y * 4);
				ctx.beginPath();
				ctx.moveTo(p.x1 + (normVector.x * 15) + perpVector.x, p.y1 + (normVector.y * 15) + perpVector.y);
				ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
				ctx.closePath();
				ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
				ctx.strokeStyle = 'black';
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(p.x1 + (normVector.x * 15) - perpVector.x, p.y1 + (normVector.y * 15) - perpVector.y);
				ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
				ctx.closePath();
				ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
				ctx.strokeStyle = 'black';
				ctx.stroke();
				break;
			case BondType.triple:
				perpVector = new fabric.Point(perpVector.x * 6, perpVector.y * 6);
				ctx.beginPath();
				ctx.moveTo(p.x1 + (normVector.x * 15) + perpVector.x, p.y1 + (normVector.y * 15) + perpVector.y);
				ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
				ctx.closePath();
				ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
				ctx.strokeStyle = 'black';
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(p.x1 + (normVector.x * 15) - perpVector.x, p.y1 + (normVector.y * 15) - perpVector.y);
				ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
				ctx.closePath();
				ctx.lineWidth = this.strokeWidth != null ? this.strokeWidth : 0;
				ctx.strokeStyle = 'black';
				ctx.stroke();
				super._render(ctx);
				break;
			case BondType.lonePair:
				//no bond
				break;
			case BondType.solid:
				perpVector = new fabric.Point(perpVector.x * 6, perpVector.y * 6);
				ctx.beginPath();
				ctx.moveTo(p.x1 + (normVector.x * 15), p.y1 + (normVector.y * 15));
				ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
				ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
				ctx.closePath();
				ctx.fillStyle = 'black';
				ctx.fill();
				
				break;	
			case BondType.dashed:
				perpVector = new fabric.Point(perpVector.x * 6, perpVector.y * 6);
				ctx.beginPath();
				ctx.moveTo(p.x1 + (normVector.x * 15), p.y1 + (normVector.y * 15));
				ctx.lineTo(p.x2 - (normVector.x * 15) + perpVector.x, p.y2 - (normVector.y * 15) + perpVector.y);
				ctx.lineTo(p.x2 - (normVector.x * 15) - perpVector.x, p.y2 - (normVector.y * 15) - perpVector.y);
				ctx.closePath();
				let gradient = ctx.createLinearGradient(p.x2 - (normVector.x * 15), p.y2 - (normVector.y * 15),p.x1 + (normVector.x * 15), p.y1 + (normVector.y * 15));
				gradient.addColorStop(0, 'black');
				gradient.addColorStop(0.1, 'black');
				gradient.addColorStop(0.1, 'white');
				gradient.addColorStop(0.2, 'white');
				gradient.addColorStop(0.2, 'black');
				gradient.addColorStop(0.3, 'black');
				gradient.addColorStop(0.3, 'white');
				gradient.addColorStop(0.4, 'white');
				gradient.addColorStop(0.4, 'black');
				gradient.addColorStop(0.5, 'black');
				gradient.addColorStop(0.5, 'white');
				gradient.addColorStop(0.6, 'white');
				gradient.addColorStop(0.6, 'black');
				gradient.addColorStop(0.7, 'black');
				gradient.addColorStop(0.7, 'white');
				gradient.addColorStop(0.8, 'white');
				gradient.addColorStop(0.8, 'black');
				gradient.addColorStop(0.9, 'black');
				gradient.addColorStop(0.9, 'white');
				gradient.addColorStop(1, 'white');
				ctx.fillStyle = gradient
				ctx.fill();

				break;
			default:
				super._render(ctx);
				break;
		}
	}

	mouseOverObject(ev:fabric.IEvent){

		console.log('mouse over connector');
		// this.canvas.add(this._ellipse);
		// this._ellipse.sendToBack();
		let canvas = this.canvas;
		this._selectableCircle.animate('opacity',1, {
			from:0,
			duration:100,
			onChange: canvas?.renderAll.bind(canvas)
		});

	}
	
	mouseOutObject(ev:fabric.IEvent){

		this._selectableCircle.animate('opacity',0, {
			from:1,
			duration:100,
			onChange: this.canvas?.renderAll.bind(this.canvas)
			
		});

	} 
}


interface IConnectorOptions extends fabric.ILineOptions{
	identity?: string;
	vertex?: Vertex;
}
