import { Subject, BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Connector } from "./connector";
import { settingsService } from './lewisStructureCanvas';
import { Vertex } from './vertex';
import { InteractionMode } from './service/settingsService';
//import { SettingsService} from './service/settingsService';
import { SVG, ForeignObject as SvgForeignObject, Ellipse as SvgEllipse, Circle as SvgCircle, G as SvgGroup, Runner, Svg, Text as SvgText, Element }
	from '@svgdotjs/svg.js';
import { IDisposable, Position } from './interfaces';
import { hoverColor } from './constants';

export interface ILonePairOptions {
	owner: Vertex;
	radians?: number;
	molecule: Kekule.Molecule;
	svg: Svg;
	electronSet: Kekule.ChemMarker.UnbondedElectronSet
}

export class LonePair implements IDisposable {

	static dotRadius: number = 3;
	//static longRadius: number = 15;
	static extraMargin: number = 2; //8

	public owner: Vertex;
	private _ownerSubscription: Subscription;

	private _svg: Svg;
	private _group: SvgGroup;
	private _circle1: SvgCircle;
	private _circle2: SvgCircle;
	private _selectionEllipse: SvgEllipse;
	public radians: number;

	private _mouseMoveEventRef;
	private _mouseUpEventRef;

	private _position$: Subject<Position>;
	public Position$: Observable<Position>;

	private _molecule: Kekule.Molecule;
	private _electrons: Kekule.ChemMarker.UnbondedElectronSet;

	constructor(options: ILonePairOptions) {

		this._svg = options.svg;
		this._group = this._svg.group().attr("aria-label", "Lone Pair");
		this._circle1 = this._group.circle(LonePair.dotRadius * 2).cx(0).cy(Vertex.circleRadius / 3).fill('#000000');
		this._circle2 = this._group.circle(LonePair.dotRadius * 2).cx(0).cy(-Vertex.circleRadius / 3).fill('#000000');
		this._selectionEllipse = this._group.ellipse(LonePair.extraMargin * 2, Vertex.circleRadius * 2)
			.cx(0).cy(0).rotate(this.radians).attr({ 'fill-opacity': 0 })
			.stroke({ color: hoverColor, width: 1, opacity: 0 })
			.filterWith((add) => {
				add.gaussianBlur(1, 1);
			});

		this.owner = options.owner;
		this.radians = options.radians != null ? options.radians : 0;
		this._molecule = options.molecule;
		//this._electrons = new Kekule.ChemMarker.UnbondedElectronSet();
		this._electrons = options.electronSet;
		//this.owner.atom.appendMarker(this._electrons);  // GOING TO ADD LONE PAIR TO KEKULE MODEL BEFORE USING THIS CLASS.
		
		this.moveUsingRadians(this.radians);
		
		this._ownerSubscription = this.owner.Position$.subscribe(position => {
			if (this.radians == null) {
				return;
			}
			//console.log(this.radians);
			let vect: Position = { x: Math.cos(this.radians), y: Math.sin(this.radians) };

			this._group
				.untransform()
				.rotate(this.radians / Math.PI / 2 * 360)
				.translate(position.x, position.y)
				.translate(vect.x * (LonePair.extraMargin + Vertex.circleRadius), vect.y * (LonePair.extraMargin + Vertex.circleRadius));

			this._electrons.coord2D = {
				x: position.x + (vect.x * (LonePair.extraMargin + Vertex.circleRadius)),
				y: position.y + (vect.y * (LonePair.extraMargin + Vertex.circleRadius))
			};

			

		});



		this._group.mouseover(this.mouseOver.bind(this));
		this._group.mouseout(this.mouseOut.bind(this));

		this._group.mousedown(this.mouseDown.bind(this));
		//this._group.move(this.onObjectMoving.bind(this));


	}

	public updateKekulePosition(x: number, y: number) {
		this._electrons.coord2D = { x: x, y: y };
	}

	
	dispose() {
		this.owner.atom.removeMarker(this._electrons);

		this._circle1.remove();
		this._circle2.remove();
		this._group.remove();
	}

	mouseDown(ev: MouseEvent) {
		//console.log("mousedown!");


		if (settingsService.isMoveable) {
			this._mouseMoveEventRef = this.mouseMoveBondDrawing.bind(this);
			window.addEventListener('pointermove', this._mouseMoveEventRef);
			this._mouseUpEventRef = this.mouseUp.bind(this);
			window.addEventListener('pointerup', this._mouseUpEventRef);

		} else if (settingsService.isEraseMode) {
			this.owner.removeAttachment(this);
			this._ownerSubscription.unsubscribe();
			this.dispose();
		}

	}


	mouseMoveBondDrawing(ev: PointerEvent) {
		const bounds = this._svg.node.getBoundingClientRect();
		let canvasCoords : Position = {x:ev.clientX-bounds.left,y:ev.clientY-bounds.top};
		if (canvasCoords == null) {
			return;
		}
		//this._position.next(new fabric.Point(canvasCoords.x, canvasCoords.y));
		//console.log(`lonepair pointermove: ${canvasCoords.x}, ${canvasCoords.y} `);
		if (settingsService.isMoveable) {

			let vertexCenter = this.owner.Position;
			let vect = { x: canvasCoords.x - vertexCenter.x, y: canvasCoords.y - vertexCenter.y };
			let length = Math.sqrt(Math.pow(vect.x, 2) + Math.pow(vect.y, 2));
			let normVect = {x:vect.x / length, y: vect.y / length};
			let angle = Math.atan2(normVect.y, normVect.x);
			this.radians = angle;
			
			this._group
				.untransform()
				.rotate(this.radians / Math.PI / 2 * 360)
				.translate(vertexCenter.x, vertexCenter.y)
				.translate(normVect.x * (LonePair.extraMargin + Vertex.circleRadius), normVect.y * (LonePair.extraMargin + Vertex.circleRadius));

			this._electrons.coord2D = { x: vertexCenter.x + (normVect.x * (LonePair.extraMargin + Vertex.circleRadius)), y: vertexCenter.y + (normVect.y * (LonePair.extraMargin + Vertex.circleRadius)) };
		} else {
			// this._tempLine.setLineEndpoint(canvasCoords.x, canvasCoords.y);

		}

	}

	public moveUsingCoord(pos:Position){
		let vertexCenter = this.owner.Position;
		let vect = { x: pos.x - vertexCenter.x, y: pos.y - vertexCenter.y };
		let length = Math.sqrt(Math.pow(vect.x, 2) + Math.pow(vect.y, 2));
		let normVect = {x:vect.x / length, y: vect.y / length};
		let angle = Math.atan2(normVect.y, normVect.x);
		this.radians = angle;
		
		this._group
			.untransform()
			.rotate(this.radians / Math.PI / 2 * 360)
			.translate(vertexCenter.x, vertexCenter.y)
			.translate(normVect.x * (LonePair.extraMargin + Vertex.circleRadius), normVect.y * (LonePair.extraMargin + Vertex.circleRadius));

		this._electrons.coord2D = { x: vertexCenter.x + (normVect.x * (LonePair.extraMargin + Vertex.circleRadius)), y: vertexCenter.y + (normVect.y * (LonePair.extraMargin + Vertex.circleRadius)) };
	}

	public moveUsingRadians(radians:number){
		this.radians = radians;
		let center = this.owner.Position;
		let normx = Math.cos(radians);
		let normy = Math.sin(radians);
		
		
		this._group
			.untransform()
			.rotate(this.radians / Math.PI / 2 * 360)
			.translate(center.x, center.y)
			.translate(normx * (LonePair.extraMargin + Vertex.circleRadius), normy * (LonePair.extraMargin + Vertex.circleRadius));

		this._electrons.coord2D = { 
			x: center.x + (normx * (LonePair.extraMargin + Vertex.circleRadius)), 
			y: center.y + (normy * (LonePair.extraMargin + Vertex.circleRadius)) 
		};
	}

	// public reportPositionChanged(x :number, y:number){
	// 	this._position.next(new fabric.Point(x, y));
	// }

	mouseUp(ev: PointerEvent) {
		window.removeEventListener('pointermove', this._mouseMoveEventRef);
		window.removeEventListener('pointerup', this._mouseUpEventRef);
		this._svg.fire('change', this);
	}

	mouseOver(ev: MouseEvent) {
		this._selectionEllipse.animate(200, 0, 'now').attr({ 'stroke-opacity': 1 });
	}

	mouseOut(ev: MouseEvent) {
		this._selectionEllipse.animate(200, 0, 'now').attr({ 'stroke-opacity': 0 });
	}
}

