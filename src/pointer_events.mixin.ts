// import { fabric } from "fabric"; 

// var addListener = fabric.util.addListener,
// removeListener = fabric.util.removeListener,
// RIGHT_CLICK = 3, MIDDLE_CLICK = 2, LEFT_CLICK = 1,
// addEventOptions = { passive: false };

// declare module 'fabric' {
// 	export namespace fabric{
// 		export interface Canvas {
// 			initializePointerEvents(): void;
// 		}
// 	}
// }



// fabric.Canvas.prototype.initializePointerEvents = () =>{
// 	console.log("This worked!");
// };

// fabric.util.object.extend(fabric.Canvas.prototype, {

	

// 	addOrRemove: function(functor,eventjsFunctor){
// 		var canvasElement = this.upperCanvasEl,
//           eventTypePrefix = this._getEventPrefix();
//       functor((fabric as any).window, 'resize', this._onResize);
//       functor(canvasElement, eventTypePrefix + 'down', this._onMouseDown);
//       functor(canvasElement, eventTypePrefix + 'move', this._onMouseMove, addEventOptions);
//       functor(canvasElement, eventTypePrefix + 'out', this._onMouseOut);
//       functor(canvasElement, eventTypePrefix + 'enter', this._onMouseEnter);
//       functor(canvasElement, 'wheel', this._onMouseWheel);
//       functor(canvasElement, 'contextmenu', this._onContextMenu);
//       functor(canvasElement, 'dblclick', this._onDoubleClick);
//       functor(canvasElement, 'dragover', this._onDragOver);
//       functor(canvasElement, 'dragenter', this._onDragEnter);
//       functor(canvasElement, 'dragleave', this._onDragLeave);
//       functor(canvasElement, 'drop', this._onDrop);
//       if (!this.enablePointerEvents) {
//         functor(canvasElement, 'touchstart', this._onTouchStart, addEventOptions);
//       }
      
//     },

// 	_bindEvents: function() {
// 		if (this.eventsBound) {
// 		  // for any reason we pass here twice we do not want to bind events twice.
// 		  return;
// 		}
// 		this._onMouseDown = this._onMouseDown.bind(this);
// 		this._onTouchStart = this._onTouchStart.bind(this);
// 		this._onMouseMove = this._onMouseMove.bind(this);
// 		this._onMouseUp = this._onMouseUp.bind(this);
// 		this._onTouchEnd = this._onTouchEnd.bind(this);
// 		this._onResize = this._onResize.bind(this);
// 		this._onGesture = this._onGesture.bind(this);
// 		this._onDrag = this._onDrag.bind(this);
// 		this._onShake = this._onShake.bind(this);
// 		this._onLongPress = this._onLongPress.bind(this);
// 		this._onOrientationChange = this._onOrientationChange.bind(this);
// 		this._onMouseWheel = this._onMouseWheel.bind(this);
// 		this._onMouseOut = this._onMouseOut.bind(this);
// 		this._onMouseEnter = this._onMouseEnter.bind(this);
// 		this._onContextMenu = this._onContextMenu.bind(this);
// 		this._onDoubleClick = this._onDoubleClick.bind(this);
// 		this._onDragOver = this._onDragOver.bind(this);
// 		this._onDragEnter = this._simpleEventHandler.bind(this, 'dragenter');
// 		this._onDragLeave = this._simpleEventHandler.bind(this, 'dragleave');
// 		this._onDrop = this._simpleEventHandler.bind(this, 'drop');
// 		this.eventsBound = true;
// 	  },
	
// 	  _on: function(e) {
// 		e.preventDefault();
// 		if (this.mainTouchId === null) {
// 		  this.mainTouchId = this.getPointerId(e);
// 		}
// 		this.__onMouseDown(e);
// 		this._resetTransformEventData();
// 		var canvasElement = this.upperCanvasEl,
// 			eventTypePrefix = this._getEventPrefix();
// 		addListener(fabric.document, 'touchend', this._onTouchEnd, addEventOptions);
// 		addListener(fabric.document, 'touchmove', this._onMouseMove, addEventOptions);
// 		// Unbind mousedown to prevent double triggers from touch devices
// 		removeListener(canvasElement, eventTypePrefix + 'down', this._onMouseDown);
// 	  },
// });
