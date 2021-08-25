import {
	EventDispatcher,
	Matrix4,
	Plane,
	Raycaster,
	Vector2,
	Vector3
} from 'three';

const _plane = new Plane();
const _raycaster = new Raycaster();

const _pointer = new Vector2();
const _lastPointer = new Vector2();

const _offset = new Vector3();
const _intersection = new Vector3();
const _worldPosition = new Vector3();
const _inverseMatrix = new Matrix4();

class ThreeDragControls extends EventDispatcher {

	constructor( _objects, _camera, _domElement ) {

		super();

		_domElement.style.touchAction = 'none'; // disable touch scroll

		let _selected = null, _hovered = null;

		const _intersections = [];

		let _pointerCount = 0;
        let _isPointerDown = false;
        let _dragPointerId = -1;
        let _isDragging = false;
		const scope = this;

		function activate() {

			_domElement.addEventListener( 'pointermove', onPointerMove );
			_domElement.addEventListener( 'pointerdown', onPointerDown );
			_domElement.addEventListener( 'pointerup', onPointerCancel );
			//_domElement.addEventListener( 'pointerleave', onPointerCancel );

		}

		function deactivate() {

			_domElement.removeEventListener( 'pointermove', onPointerMove );
			_domElement.removeEventListener( 'pointerdown', onPointerDown );
			_domElement.removeEventListener( 'pointerup', onPointerCancel );
			//_domElement.removeEventListener( 'pointerleave', onPointerCancel );

			_domElement.style.cursor = '';

		}

		function dispose() {

			deactivate();

		}

		function getObjects() {

			return _objects;

		}

		function onPointerMove( event ) {
            if (!_isPointerDown) return;
            if ( scope.enabled === false ) return;
            if (event.pointerId != _dragPointerId) return;
            updatePointer( event );
            // if (!_isDragging) {
            //     return;
            //     //console.log(event);
            //     //if ([event.movementX, event.movementY].some(m => Math.abs(m) > 0.1)) return;
            //     //if ([_pointer.x - _lastPointer.x, _pointer.y - _lastPointer.y].every(m => Math.abs(m) < 0.01)) return;
            //     // if ([_pointer.x - _lastPointer.x, _pointer.y - _lastPointer.y].some(m => Math.abs(m) > 0.02)) {
            //     //     _isPointerDown = false;
            //     //     _dragPointerId = -1;
            //     // }
            // }
            
			_raycaster.setFromCamera( _pointer, _camera );
            _raycaster.layers.set(2);

			if ( _selected ) {

				if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

					_selected.position.copy( _intersection.sub( _offset ).applyMatrix4( _inverseMatrix ) );

				}

				scope.dispatchEvent( { type: 'drag', object: _selected } );

				return;

			} 

			// hover support

			if ( event.pointerType === 'mouse' || event.pointerType === 'pen' ) {

				_intersections.length = 0;

				_raycaster.setFromCamera( _pointer, _camera );
				_raycaster.intersectObjects( _objects, true, _intersections );

				if ( _intersections.length > 0 ) {

					const object = _intersections[ 0 ].object;

					_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( object.matrixWorld ) );

					if ( _hovered !== object && _hovered !== null ) {

						scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

						_domElement.style.cursor = 'auto';
						_hovered = null;

					}

					if ( _hovered !== object ) {

						scope.dispatchEvent( { type: 'hoveron', object: object } );

						_domElement.style.cursor = 'pointer';
						_hovered = object;

					}

				} else {

					if ( _hovered !== null ) {

						scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

						_domElement.style.cursor = 'auto';
						_hovered = null;

					}

				}

			}

		}

		function onPointerDown( event ) {

            _pointerCount++;
            if (_pointerCount > 1) {
                return;
            }
            if ( scope.enabled === false ) return;
        
            updatePointer( event );            
            _lastPointer.x = _pointer.x;
            _lastPointer.y = _pointer.y;   

            _isPointerDown = true;
            _dragPointerId = event.pointerId;

            _intersections.length = 0;
        
            _raycaster.setFromCamera( _pointer, _camera );
            _raycaster.intersectObjects( _objects, true, _intersections );
        
            if ( _intersections.length > 0 ) {
        
                _selected = ( scope.transformGroup === true ) ? _objects[ 0 ] : _intersections[ 0 ].object;
            
                _plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( _selected.matrixWorld ) );
            
                if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
            
                    _inverseMatrix.copy( _selected.parent.matrixWorld ).invert();
                    _offset.copy( _intersection ).sub( _worldPosition.setFromMatrixPosition( _selected.matrixWorld ) );
            
                }
            
                _domElement.style.cursor = 'move';
                _isDragging = true;
                scope.dispatchEvent( { type: 'dragstart', object: _selected } );            
            }
          }
        
          function onPointerCancel(event) {
            console.log('cancel pointer count: ', _pointerCount);
            _pointerCount--;
            if (_pointerCount < 0)
                _pointerCount = 0;
            
            if ( scope.enabled === false ) return;
        
            if ( _selected && event.pointerId == _dragPointerId) {
              console.log("dragend!:",_dragPointerId, _selected, event.pointerId);
              scope.dispatchEvent( { type: 'dragend', object: _selected } );
              _selected = null;
              _isDragging = false;
        
            }
            if (_pointerCount == 0) {
                console.log("double dragon");
                _isPointerDown = false;
                _dragPointerId = -1;
                _domElement.style.cursor = _hovered ? 'pointer' : 'auto';
            }
          }

		function updatePointer( event ) {

			const rect = _domElement.getBoundingClientRect();
			_pointer.x = ( event.clientX - rect.left ) / rect.width * 2 - 1;
			_pointer.y = - ( event.clientY - rect.top ) / rect.height * 2 + 1;

		}

		activate();

		// API

		this.enabled = true;
		this.transformGroup = false;

		this.activate = activate;
		this.deactivate = deactivate;
		this.dispose = dispose;
		this.getObjects = getObjects;

	}

}

export { ThreeDragControls };