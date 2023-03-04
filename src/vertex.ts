import { Subject, BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
//import { fabric } from "fabric"; 
import { Connector } from "./connector";
import { settingsService } from './lewisStructureCanvas';
//import { LonePair } from './lonePair';
import { InteractionMode, BondType } from './service/settingsService';
import { Range } from './rangeRadians';
import { SVG, ForeignObject as SvgForeignObject, Circle as SvgCircle, G as SvgGroup, Runner, Svg, Text as SvgText, Element } from '@svgdotjs/svg.js';
import { IDisposable, Position } from './interfaces';
import { LonePair } from './lonePair';
import { hoverColor } from './constants';


export interface IVertexOptions {
	identity?: string;
	//vertex?: Vertex;
	svg: Svg;
	molecule: Kekule.Molecule;
	atom?: Kekule.Atom;
	x: number;
	y: number;
	//settingsService: SettingsService;

}


export class Vertex implements IDisposable {

	static circleRadius: number = 15;

	private attachments: Object[];
	private attachmentSubs: Map<Object, Subscription[]>;

	private _svg: Svg;
	private _group: SvgGroup;
	private _text: SvgText;
	private _circle: SvgCircle;
	private _foreignObject: SvgForeignObject;
	private _div: Element;
	private _runner: Runner;


	private _tempLine: Connector | null;
	private _tempVertex: Vertex | null;
	private _tempLP: LonePair;

	public disableEvents: boolean = false;
	private _hasMoved: boolean;
	private _mouseMoveEventRef;
	private _mouseUpEventRef;

	private _position$: BehaviorSubject<Position>;
	public Position$: Observable<Position>;
	get Position(): Position {
		return this._position$.value;
	}

	private _symbol$: BehaviorSubject<string>;
	public Symbol$: Observable<string>;

	private _subscription: Subscription;

	private _molecule: Kekule.Molecule;
	public atom: Kekule.Atom;

	//private _settingsService :SettingsService;
	private _tabDiv: HTMLDivElement;
	private _ariaLabel: string;

	public type: string;

	constructor(options: IVertexOptions) {

		this._svg = options.svg;
		this._group = options.svg.group().attr("tabindex", "0").attr("aria-label", "Atom");
		this._group.translate(options.x, options.y);
		//this._group.draggable();
		this._group.on('dragmove.namespace', (e: any) => {
			const { handler, box } = e.detail;
			e.preventDefault();
			this._group.translate((box.x2 + box.x) / 2, (box.y2 + box.y) / 2);
		});
		// this._div = SVG('<div tabindex="0" aria-label="TESTING" style="background:transparent;width:100%;height:100%;opacity:0;">' + options.identity + '.</div>');
		// this._foreignObject = this._group.foreignObject(Vertex.circleRadius * 2, Vertex.circleRadius * 2).cx(0).cy(0).add(this._div);
		// this._div.node.textContent = "CHANGED it!"


		this._circle = this._group.circle(Vertex.circleRadius * 2 - 4);
		//this._circle.cx(options.x).cy(options.y);
		this._circle.cx(0).cy(0);
		//this._circle.move(-Vertex.circleRadius, -Vertex.circleRadius);
		this._circle.fill({ color: '#ffffff', opacity: 1 });
		this._circle.stroke({ color: hoverColor, width: 4, opacity: 0 }).filterWith((add) => {
			add.gaussianBlur(2, 2);
		});

		this._text = this._group.text(options.identity !== undefined ? options.identity : "");
		this._text.font({ size: 20 });
		this._text.css({ cursor: 'default' });
		//this._text.move(-10, -10);
		//this._text.cx(options.x).cy(options.y);
		this._text.cx(0).cy(0);


		//super([circle,text], options);
		this.type = "Vertex";

		this._position$ = new BehaviorSubject<Position>({ x: options.x, y: options.y });
		this.Position$ = this._position$.asObservable();
		//this.Position = this._position$.value;

		this._symbol$ = new BehaviorSubject<string>(options.identity!);
		this.Symbol$ = this._symbol$.asObservable();


		this._molecule = options.molecule;
		if (options.atom) {
			this.atom = options.atom;
			//this.atom.canvasVertex = this;
		} else {
			this.atom = new Kekule.Atom();
			//this.atom.canvasVertex = this;
			//this.atom.setCoord2D({x:this.left, y:this.top}).setSymbol(options.identity);
			this._molecule.appendNode(this.atom);
		}

		this._tabDiv = document.createElement('div');
		this._tabDiv.tabIndex = 0;
		this._tabDiv.onfocus = (ev) => {
			//his.mouseOverObject({e:ev});
		};
		this._tabDiv.onblur = (ev) => {
			//this.mouseOutObject({e:ev});
		};
		settingsService.keyboardDiv?.appendChild(this._tabDiv);

		//console.log(Kekule.IO.saveMimeData(this._molecule,'chemical/x-kekule-json'));


		// this._text = text;
		// this._circle = circle;

		this._position$.subscribe(pos => {
			this._group.transform({ translateX: pos.x, translateY: pos.y });
			this.atom.setCoord2D({ x: pos.x, y: pos.y });
			// this.atom.setCoord2D({x:this.left!, y:this.top!});
			// this.updateAriaLabel();
		});


		this._symbol$.subscribe(x => {
			this.atom.setSymbol(x);
			//this.updateAriaLabel();
		});

		this.attachments = [];
		this.attachmentSubs = new Map<Object, Subscription[]>();

		this.updateAriaLabel();

		//this.dirty=true;


		this._group.on('dragmove', (ev) => {
			const transform = this._group.transform();
			this._position$.next({ x: transform.translateX ?? 0, y: transform.translateY ?? 0 });
		});

		this._group.click((ev: MouseEvent) => { 
			ev.preventDefault(); 
			ev.stopPropagation(); 
			//console.log("TRYING TO STOP PROP of click"); 
		});

		this._group.mousedown(this.mouseDown.bind(this));
		//this._circle.mousedown(this.mouseDown);
		this._group.mouseenter(this.mouseEnter.bind(this));
		this._group.mouseleave(this.mouseLeave.bind(this));

		this._group.mouseover(this.mouseOver.bind(this));
		this._group.mouseout(this.mouseOut.bind(this));

		//this._circle.click((ev)=>(ev as MouseEvent).stopPropagation());
		// // this.on('touchstart', this.mouseDown);
		// this.on('moving', this.onObjectMoving);

		this._subscription = settingsService.whenMode.subscribe(mode => {
			switch (mode) {
				case InteractionMode.move:
					this._group.draggable();
					break;
				default:
					this._group.draggable(false);
					break;
			}
		});
		// this._subscription = settingsService.whenMode.subscribe(mode =>{
		// 	console.log('whenMovable changed on vertex');
		// 	(this as fabric.Group).set({
		// 		lockMovementX: mode != InteractionMode.move,
		// 		lockMovementY: mode != InteractionMode.move,
		// 		selectable: mode == InteractionMode.move
		// 	});
		// });

	}

	setDraggable(yes: boolean) {
		this._group.draggable(yes ? true : false);
	}

	moveTo(x: number, y: number) {
		// this._circle.cx(x).cy(y);
		// this._text.cx(x).cy(y);
		this._position$.next({ x: x, y: y });
		// this._group.transform({translateX:x, translateY:y});
		// this.atom.setCoord2D({x:x, y:y});
	}

	mouseOver(ev: MouseEvent) {
		settingsService.hoveredVertex = this;
	}
	mouseOut(ev: MouseEvent) {
		//if (settingsService.hoveredVertex != null){
		settingsService.hoveredVertex = null;
		//}
	}


	mouseEnter(ev: MouseEvent) {
		if (this.disableEvents) {
			ev.preventDefault();
			return;
		}
		this._runner?.reset();
		this._runner = this._circle
			.animate({
				duration: 200,
				delay: 0,
				when: 'now',
				swing: false,
				times: 1,
				wait: 0
			}).attr({ 'stroke-opacity': 1 });
	}

	mouseLeave(ev: MouseEvent) {
		if (this.disableEvents) {
			ev.preventDefault();
			return;
		}
		//this._circle.timeline().stop();
		this._circle.transform({ rotate: 0 });
		this._runner?.reset();
		this._runner = this._circle.animate(200).attr({ 'stroke-opacity': 0 });
	}

	public dispose() {

		this._group.mousedown(null);
		this._circle.remove();
		this._text.remove();
		this._group.remove();

		let index = this.attachments.length - 1;
		while (index >= 0){
			(this.attachments[index] as any).dispose();
			index -= 1;
		}
		this._position$.complete();
		this._symbol$.complete();
		// settingsService.keyboardDiv?.removeChild(this._tabDiv);
		// this.canvas?.remove(this);
		this._molecule.removeNode(this.atom);
		this._subscription.unsubscribe();

	}

	public _render(ctx: CanvasRenderingContext2D) {
		// if (this.attachments.length == 0 || this.text !== "C"){
		//	super._render(ctx);
		// }
	}

	// toObject() {
	//  	let call = super.toObject();
	//  	call.atomProp = this.atom;
	//  	return call;
	// }

	public static fromObject(rawObj: Vertex) {
		//let vertex = new Vertex({})
	}

	updateAriaLabel() {
		if (this.atom.symbol === undefined) {
			return;
		}
		let selfElement = new Kekule.Element(this.atom.symbol);
		this._ariaLabel = selfElement.name.toString() + ' atom ';
		let nodes = this.atom.getLinkedChemNodes();
		let bonds = this.atom.getLinkedBonds();
		// console.log('getMarkersOfType error?');
		let lps : Kekule.ChemMarker.UnbondedElectronSet[] = this.atom.getMarkersOfType(Kekule.ChemMarker.UnbondedElectronSet, false);

		if (lps.length > 0) {
			this._ariaLabel += "with " + lps.length + " lone pair" + (lps.length > 1 ? "s" : "") + " of electrons ";
		}

		if (nodes.length > 0) {
			this._ariaLabel += "bonded to ";
		}
		let atomMap = new Map<string, number>();
		for (let i = 0; i < nodes.length; i++) {
			let otherAtom = <Kekule.Atom>nodes[i];
			let otherElement = new Kekule.Element(otherAtom.symbol);
			let angle = Math.atan2(-(otherAtom.coord2D.y - this.atom.coord2D.y), (otherAtom.coord2D.x - this.atom.coord2D.x)); //y coordinate is upside-down
			angle *= 360 / 2 / Math.PI;
			angle = Math.round(angle);

			let foundBond: Kekule.Bond | null = null;
			for (let k = 0; k < bonds.length; k++) {
				let linked = bonds[k].getConnectedChemNodes();
				for (let j = 0; j < linked.length; j++) {
					let linkedAtom = <Kekule.Atom>linked[j];
					if (linkedAtom == otherAtom) {
						foundBond = bonds[k];
						break;
					}
				}
				if (foundBond != null) {
					break;
				}
			}

			this._ariaLabel += otherElement.name.toString() + " at " + angle + " degrees ";

			// if (foundBond != null && foundBond.canvasConnector != null) {
			// 	switch (foundBond.canvasConnector.CurrentBondType) {
			// 		case BondType.single:
			// 			this._ariaLabel += "with a single bond " ; 
			// 			break;
			// 		case BondType.solid:
			// 			this._ariaLabel += "with a solid wedge bond " ; 
			// 			break;
			// 		case BondType.dashed:
			// 			this._ariaLabel += "with a dashed wedge bond " ; 
			// 			break;
			// 		case BondType.double:
			// 			this._ariaLabel += "with a double bond " ; 
			// 			break;
			// 		case BondType.triple:
			// 			this._ariaLabel += "with a triple bond " ; 
			// 			break;
			// 	}
			// }


			if (i == nodes.length - 2) {
				this._ariaLabel += "and ";
			}

		}

		this._tabDiv.innerText = this._ariaLabel;
	}

	mouseDown(ev: MouseEvent) {
		ev.stopPropagation();
		this._hasMoved = false;

		if (settingsService.isMoveable) {


		} else if (settingsService.isEraseMode) {

			this.dispose();

		} else if (settingsService.isDrawMode) {

			this._mouseMoveEventRef = this.mouseMove.bind(this);
			this._mouseUpEventRef = this.mouseUp.bind(this);
			this._svg.mousemove(this._mouseMoveEventRef);
			this._svg.mouseup(this._mouseUpEventRef);

			let centerX = this._group.transform().translateX;
			let centerY = this._group.transform().translateY;
			if (centerX === undefined) {
				throw ('Translate X was not defined.')
				centerX = 0;
			}
			if (centerY === undefined) {
				throw ('Translate Y was not defined.')
				centerY = 0;
			}

			if (settingsService.currentBondType == BondType.lonePair) {
				// check if lone pair already exists... draw the lone pair starting at a slightly different angle 
				// so the first one is not hidden
				let angles: number[] = [];
				for (let i = 0; i < this.attachments.length; i++) {
					if (this.attachments[i] instanceof LonePair) {
						let lonePair = this.attachments[i] as LonePair;
						angles.push(lonePair.radians);
					} else {
						// it's a connector, find the attached angle
						let connector = this.attachments[i] as Connector;
						let angle = connector.getAngleFrom(this);
						angles.push(angle);
					}
				}
				let newAngle = this.findNewAngle(angles);

				const electronSet = new Kekule.ChemMarker.UnbondedElectronSet();
				this.atom.appendMarker(electronSet);
				this._tempLP = new LonePair({
					radians: newAngle,
					owner: this,
					molecule: this._molecule,
					svg: this._svg,
					electronSet: electronSet
				});

				this.attachments.push(this._tempLP);

			} else {

				const bounds = this._svg.node.getBoundingClientRect();
				this._tempVertex = new Vertex({
					identity: settingsService.currentElement,
					x: ev.clientX - bounds.left,
					y: ev.clientY - bounds.top,
					molecule: this._molecule,
					svg: this._svg
				});
				//this._tempVertex.disableEvents=true;
				this._tempVertex._group.addClass("eventless");

				this._tempLine = new Connector({
					vertex1: this,
					vertex2: this._tempVertex,
					bondType: settingsService.currentBondType,
					molecule: this._molecule,
					svg: this._svg
				});
				this._tempLine._group.addClass("eventless");

				// 			this.canvas?.add(this._tempLine);
				// 			this._tempLine.sendToBack();

				this.addConnector(this._tempLine);
				// 			//this.attachments.push(this._tempLine);

				// 			//this._tempVertex.attachments.push(this._tempLine);
				this._tempVertex.addConnector(this._tempLine);

				// 			this._tempVertex.evented=false;
				// 			this.canvas?.add(this._tempVertex);
				// 			this._tempVertex.bringToFront();

				// 			this._tempLine.setCoords();
				// 			this.canvas?.renderAll();
			}


		}

	}

	mouseUp(ev: MouseEvent) {
		// if (this.disableEvents){
		// 	ev.preventDefault();
		// 	return;
		// }
		(ev as MouseEvent).stopImmediatePropagation();
		this._svg.off('mousemove', this._mouseMoveEventRef);
		this._svg.off('mouseup', this._mouseUpEventRef);
		// 	this.canvas?.off('mouse:up', this._mouseUpEventRef);

		if (settingsService.currentBondType == BondType.lonePair) {
				
				// this.updateAriaLabel();

		} else {

			//Re-enable events 
			this._tempVertex?._group.removeClass("eventless");
			this._tempLine?._group.removeClass("eventless");
			// 		this._tempVertex.evented=true;
			// 		this._tempLine.setEvented(true);
			if (settingsService.hoveredVertex !== null || !this._hasMoved) {
				// hovering over an existing vertex
				if (settingsService.hoveredVertex == this || !this._hasMoved) {
					console.log("Overwriting vertex with temp one");
					// we're releasing mouse on same vertex we started with, just change vertex id to new atom (if different)
					this._text.text(settingsService.currentElement);
					this.atom.setSymbol(settingsService.currentElement);
					this._symbol$.next(settingsService.currentElement);
					// 				//this.canvas.remove(this._tempLine);
					//			this.canvas.remove(this._tempVertex);
					this._tempLine?.dispose();
					this._tempVertex?.dispose();
					// 				this.attachments.splice(this.attachments.indexOf(this._tempLine),1);

					// 				this._symbol.next(settingsService.currentElement);
				} else {
					// attach bond to existing atom
					this._tempVertex?.dispose();
					//removing the tempvertex will remove the tempconnector too, so dispose of it (again) and remove the references to it on this vertex
					this._tempLine?.dispose();
					if (this._tempLine != null) {
						this.attachments.splice(this.attachments.indexOf(this._tempLine), 1);
					}
					//this.canvas.remove(this._tempLine);
					//this.canvas.remove(this._tempVertex);
					//this._tempLine?.dispose();

					// if (this._tempLine != null)
					// 	this.attachments.splice(this.attachments.indexOf(this._tempLine),1);

					// is there a connector already drawn between those two atoms?
					let connectorExists: boolean = false;
					for (var i = 0; i < this.attachments.length; i++) {
						if (this.attachments[i] instanceof Connector) {
							let connector = this.attachments[i] as Connector;
							if (connector._vertex1 == settingsService.hoveredVertex || connector._vertex2 == settingsService.hoveredVertex) {
								// so one of the connectors on the starting vertex has a connected vertex of the hovered vertex... 
								// we need to transform that connector to whatever we have selected and not add anything new.
								connector.setBondType(settingsService.currentBondType);
								//connector._bondType = settingsService.currentBondType;
								//							connector.set({dirty:true});
								// 							this.canvas?.renderAll();
								connectorExists = true;
							}
						}
					}
					if (!connectorExists) {
						if (settingsService.hoveredVertex == null) {
							throw "Hovered vertex should not be null.";
						}
						this._tempLine = new Connector({
							vertex1: this,
							vertex2: settingsService.hoveredVertex,
							bondType: settingsService.currentBondType,
							molecule: this._molecule,
							svg: this._svg
						});
						this.addConnector(this._tempLine);
						settingsService.hoveredVertex.addConnector(this._tempLine);

					}
				}


			} else {
				// This is a new vertex.  lose tempvertex ref.
				//this._tempLine?._group.removeClass("eventless");
				this._tempLine = null;
				//this._tempVertex?._group.removeClass("eventless");
				this._tempVertex = null;
				// 			this._tempVertex.setCoords();
			}
			// 		this._tempLine.setCoords();

		}

		// 	this.canvas?.renderAll();
		// 	//console.log('mouseup!');
	}

	public addConnector(connector: Connector) {
		this.attachments.push(connector);
	}

	public addLonePair(lonePair:LonePair){
	 	this.attachments.push(lonePair);
	}

	public removeAttachment(item: Object) {
		let subs = this.attachmentSubs.get(item);
		if (subs != null) {
			subs.forEach(v => {
				v.unsubscribe();
			});
			this.attachmentSubs.delete(item);
		}

		this.attachments.splice(this.attachments.indexOf(item), 1);
	}

	mouseMove(ev: MouseEvent) {
		if (this.disableEvents) {
			ev.preventDefault();
			return;
		}
		const bounds = this._svg.node.getBoundingClientRect();
		//console.log("mouse move!");
		const old = this._group.transform();
		this._hasMoved = true;
		if (old.translateX === undefined) {
			throw "ERROR!";
		}
		if (old.translateY === undefined) {
			throw "ERROR!";
		}
		// if (old.translateX !== undefined && old.translateY !== undefined) {
		// 	this._group.translate(ev.clientX - bounds.left - old.translateX, ev.clientY - bounds.top - old.translateY);
		// }

		if (settingsService.isMoveable) {
			//this._position.next(new fabric.Point(canvasCoords.x,canvasCoords.y));
			//this.reportPositionChanged(canvasCoords.x, canvasCoords.y);
			//this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
		} else {

			if (settingsService.currentBondType == BondType.lonePair) {
				
				let canvasCoords : Position = {x:ev.clientX-bounds.left,y:ev.clientY-bounds.top};
				this._tempLP.moveUsingCoord(canvasCoords);

			} else {

				// console.log("X: " + (ev.clientX - bounds.left - old.translateX).toString() + ",  Y: " + (ev.clientY - bounds.top - old.translateY).toString());
				// this._tempVertex.moveTo(ev.clientX - bounds.left - old.translateX, ev.clientY - bounds.top - old.translateY);
				//console.log("X: " + (ev.clientX - bounds.left).toString() + ",  Y: " + (ev.clientY - bounds.top).toString());
				this._tempVertex?.moveTo(ev.clientX - bounds.left, ev.clientY - bounds.top);
				//this._tempVertex.atom.setCoord2D({ev.clientX - bounds.left - old.translateX, ev.clientY - bounds.top - old.translateY});

				//.set({
				// 	left: canvasCoords.x,
				// 	top: canvasCoords.y,
				// 	dirty:true
				// });
				// //this._tempVertex.atom.setCoord2D({x: canvasCoords.x, y: canvasCoords.y});
				// this._tempVertex.reportPositionChanged(canvasCoords.x,canvasCoords.y);
				// this._tempVertex.setCoords();
				// this._tempLine.setCoords();
			}
		}
	}
	// mouseMoveBondDrawing(ev:any){
	// 	let canvasCoords = this.canvas?.getPointer(ev);
	// 	if (canvasCoords == null){
	// 		return;
	// 	}
	// 	this._hasMoved=true;
	// 	//this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
	// 	//console.log(`mousemoving: ${ev.x}, ${ev.y} `);
	// 	if (settingsService.isMoveable){
	// 		this._position.next(new fabric.Point(canvasCoords.x,canvasCoords.y));
	// 		//this.reportPositionChanged(canvasCoords.x, canvasCoords.y);
	// 		//this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
	// 	} else {

	// 		if (settingsService.currentBondType == BondType.lonePair) {
	// 			let vertexCenter = this._tempLP.owner.getCenterPoint();

	// 			let vect = new fabric.Point(canvasCoords.x-vertexCenter.x,canvasCoords.y-vertexCenter.y);
	// 			let length = Math.sqrt(Math.pow(vect.x,2) + Math.pow(vect.y,2));
	// 			let normVect = new fabric.Point(vect.x/length, vect.y/length);
	// 			let angle = Math.atan2(normVect.y, normVect.x);

	// 			this._tempLP.set({
	// 				angle:angle/Math.PI/2*360,
	// 				left: vertexCenter.x + (normVect.x * (LonePair.shortRadius + Vertex.circleRadius)),
	// 				top: vertexCenter.y + (normVect.y * (LonePair.shortRadius +  Vertex.circleRadius))
	// 			});
	// 			this._tempLP.setCoords();
	// 			this._tempLP.updateKekulePosition(
	// 				vertexCenter.x + (normVect.x * (LonePair.shortRadius + Vertex.circleRadius)), 
	// 				vertexCenter.y + (normVect.y * (LonePair.shortRadius + Vertex.circleRadius))
	// 				);


	// 		} else {

	// 			this._tempVertex.set({
	// 				left: canvasCoords.x,
	// 				top: canvasCoords.y,
	// 				dirty:true
	// 			});
	// 			//this._tempVertex.atom.setCoord2D({x: canvasCoords.x, y: canvasCoords.y});
	// 			this._tempVertex.reportPositionChanged(canvasCoords.x,canvasCoords.y);
	// 			this._tempVertex.setCoords();
	// 			this._tempLine.setCoords();
	// 		}
	// 	}

	// 	this.canvas?.renderAll();
	// }


	// public reportPositionChanged(x :number, y:number){
	// 	//this.atom.setCoord2D({x: x, y: y});
	// 	this._position.next(new fabric.Point(x, y));
	// 	//this.updateAriaLabel();

	// }

	// mouseUp(ev:any){
	// 	//window.removeEventListener('mousemove', this._mouseMoveEventRef);
	// 	//window.removeEventListener('mouseup', this._mouseUpEventRef);
	// 	this.canvas?.off('mouse:move', this._mouseMoveEventRef);
	// 	this.canvas?.off('mouse:up', this._mouseUpEventRef);

	// 	if (settingsService.currentBondType == BondType.lonePair) {
	// 		// let vertexCenter = this._tempLP.owner.getCenterPoint();
	// 		// let currentPoint = this.canvas.getPointer(ev);
	// 		// let vect = new fabric.Point(currentPoint.x-vertexCenter.x,currentPoint.y-vertexCenter.x);
	// 		// let angle = Math.atan2(vect.y, vect.x);
	// 		// let length = Math.sqrt(Math.pow(vect.x,2) + Math.pow(vect.y,2));
	// 		// let normVect = new fabric.Point(vect.x/length, vect.y/length);

	// 		// this._tempLP.set({
	// 		// 	angle:angle,
	// 		// 	left: normVect.x * (this._tempLP.rx + this._circle.radius),
	// 		// 	top: normVect.y * (this._tempLP.rx + this._circle.radius)
	// 		// });
	// 		this.updateAriaLabel();

	// 	} else {

	// 		this._tempVertex.evented=true;
	// 		this._tempLine.setEvented(true);

	// 		if (settingsService.hoveredVertex !== null || !this._hasMoved){
	// 			// hovering over an existing vertex
	// 			if (settingsService.hoveredVertex == this || !this._hasMoved){
	// 				// we're releasing mouse on same vertex we started with, just change vertex id to new atom (if different)
	// 				this._text.set({
	// 					text: settingsService.currentElement
	// 				});
	// 				//this.canvas.remove(this._tempLine);
	// 				//this.canvas.remove(this._tempVertex);
	// 				this._tempLine.dispose();
	// 				this._tempVertex.dispose();
	// 				this.attachments.splice(this.attachments.indexOf(this._tempLine),1);
	// 				//this.atom.setSymbol(settingsService.currentElement);
	// 				this._symbol.next(settingsService.currentElement);
	// 			} else {
	// 				// attach bond to existing atom
	// 				//this.canvas.remove(this._tempLine);
	// 				//this.canvas.remove(this._tempVertex);
	// 				this._tempLine.dispose();
	// 				this._tempVertex.dispose();
	// 				this.attachments.splice(this.attachments.indexOf(this._tempLine),1);

	// 				// is there a connector already there?
	// 				let connectorExists:boolean = false;
	// 				for (var i=0; i<this.attachments.length; i++){
	// 					if (this.attachments[i] instanceof Connector){
	// 						let connector = this.attachments[i] as Connector;
	// 						if (connector._vertex1 == settingsService.hoveredVertex || connector._vertex2 == settingsService.hoveredVertex){
	// 							// so one of the connectors on the starting vertex has a connected vertex of the hovered vertex... 
	// 							// we need to transform that connector to whatever we have selected and not add anything new.
	// 							connector.setBondType(settingsService.currentBondType);
	// 							//connector._bondType = settingsService.currentBondType;
	// 							connector.set({dirty:true});
	// 							this.canvas?.renderAll();
	// 							connectorExists=true;
	// 						}
	// 					}
	// 				}
	// 				if (!connectorExists){
	// 					if (settingsService.hoveredVertex == null){
	// 						return;
	// 					}
	// 					let center = this.getCenterPoint();
	// 					let otherCenter = settingsService.hoveredVertex.getCenterPoint();
	// 					this._tempLine = new Connector([center.x, center.y, otherCenter.x, otherCenter.y],{
	// 						vertex1: this,
	// 						vertex2: settingsService.hoveredVertex,
	// 						bondType: settingsService.currentBondType,
	// 						evented:false,
	// 						molecule:this._molecule
	// 					});
	// 					this.canvas?.add(this._tempLine);
	// 					this._tempLine.sendToBack();

	// 					this.addConnector(this._tempLine);
	// 					//this.attachments.push(this._tempLine);	
	// 					settingsService.hoveredVertex.addConnector(this._tempLine);

	// 					//settingsService.hoveredVertex.attachments.push(this._tempLine);
	// 				}
	// 			}


	// 		} else {
	// 			this._tempVertex.setCoords();
	// 		}
	// 		this._tempLine.setCoords();

	// 	}

	// 	this.canvas?.renderAll();
	// 	//console.log('mouseup!');
	// }

	// mouseOverObject(ev:fabric.IEvent){
	// 	console.log(this);
	// 	console.log('mouseoverobject id: ' + this );
	// 	settingsService.hoveredVertex=this;
	// 	//  this._circle.set({
	// 	//  	stroke: 'black',
	// 	//  	strokeWidth: 2,
	// 	// // 	strokeDashArray: [5,5]

	// 	//  });
	// 	this._circle.animate('strokeWidth', 2, {
	// 		from:0,
	// 		duration: 150,
	// 		onChange: this.canvas?.renderAll.bind(this.canvas)
	// 	})

	// 	if (settingsService.readAloudAtoms){
	// 		let u = new SpeechSynthesisUtterance();
	// 		u.text = this._ariaLabel;
	// 		if (window.speechSynthesis.speaking) {
	// 			window.speechSynthesis.cancel();
	// 		}
	// 		window.speechSynthesis.speak(u);
	// 	}
	// 	//this.canvas.renderAll();
	// }

	// mouseOutObject(ev:fabric.IEvent){
	// 	console.log('mouseoutobject');
	// 	if (settingsService.hoveredVertex == this){
	// 		settingsService.hoveredVertex = null;
	// 	}
	// 	// this._circle.set({
	// 	// 	//stroke: 'white',
	// 	// 	//strokeWidth: 0
	// 	// });
	// 	this._circle.animate('strokeWidth',0,{
	// 		duration: 150,
	// 		onChange: this.canvas?.renderAll.bind(this.canvas)
	// 	});
	// 	//this.canvas.renderAll();
	// 	if (settingsService.readAloudAtoms) {
	// 		window.speechSynthesis.cancel();
	// 	}

	// } 
	public bondCount(){
		let bondCount= 0;
		for (let i = 0; i < this.attachments.length; i++) {
			if (this.attachments[i] instanceof Connector) {
				bondCount++;
			}
		}
		return bondCount;
	}

	public getAngleThatFits(coordinationNumber:number = 0){
		let angles: number[] = [];
		for (let i = 0; i < this.attachments.length; i++) {
			if (this.attachments[i] instanceof LonePair) {
				let lonePair = this.attachments[i] as LonePair;
				angles.push(lonePair.radians);
			} else {
				// it's a connector, find the attached angle
				let connector = this.attachments[i] as Connector;
				let angle = connector.getAngleFrom(this);
				angles.push(angle);
			}
		}
		let newAngle = this.findNewAngle(angles, coordinationNumber);
		return newAngle;
	}

	findNewAngle(angles: number[], coordinationNumber:number = 0): number {
		let newAngle: number = 0;

		// We don't know the overall coordination number, so just make them fit well up to a point...
		// Also, if we get a coordination number that is too small for the number of angles we're trying to fit.
		if (coordinationNumber== 0 || angles.length >= coordinationNumber){
			if (angles.length == 0) {
				return newAngle;
			} else if (angles.length == 1) {
				return angles[0] + (Math.PI / 2);
			} else if (angles.length == 2) {
				// check if angles are ~90 apart
				const diff = angles[1]-angles[0];
				if (Math.abs(diff) - (Math.PI/2) < 0.1){
					if (diff > 0){
						return angles[1] + (Math.PI / 2);
					} else {
						return angles[1] - (Math.PI / 2);
					}
				} else {
					return this.useBlockedRangeMethod(angles);
				}
			} else if (angles.length == 3){
				angles.forEach(v=>{
					if (Math.sign(v) == -1){
						v+=Math.PI;
					}
				});
				const diffs = [angles[1]-angles[0],angles[2]-angles[1], angles[2]-angles[0]];
				var indexOfMaxValue = diffs.reduce((iMax, x, i, arr) => Math.abs(x) > Math.abs(arr[iMax]) ? i : iMax, 0);
				let rightAngles=true;
				diffs.forEach((v,i)=>{
					if (i != indexOfMaxValue && Math.abs(v) - (Math.PI/2) > 0.1){
						rightAngles=false;
					}
				});
				if (rightAngles){
					switch (indexOfMaxValue){
						case 0:
							return angles[2] + Math.PI;
						case 1:
							return angles[0] + Math.PI;
						case 2:
							return angles[1] + Math.PI;
						default:
							return this.useBlockedRangeMethod(angles);
					}
				} else {
					return this.useBlockedRangeMethod(angles);
				}
			} else {
				return this.useBlockedRangeMethod(angles);
			}
		}else{
			return this.useBlockedRangeMethod(angles, coordinationNumber);
		}
	}

	useBlockedRangeMethod(angles: number[], coordinationNumber: number = 0):number{
		let blockedRange = new Range(coordinationNumber);
		for (let i = 0; i < angles.length; i++) {
			blockedRange.addRadian(angles[i]);
		}
		const newAngle = blockedRange.getFirstOpenSpace();
		return newAngle;
	}
}

