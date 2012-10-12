/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global THREE:false, Voxel:false */


(function() {
	
	'use strict';



	window.Voxel = function(dims, data) {
		this.dims			= dims.slice();
		this.subscribers	= [];
		this.symmetries		= [false, false, false];

		if (data !== undefined) {
			this.mtx = new Uint32Array(data);
		}
		else {
			var bytes = dims[0] * dims[1] * dims[2];
			var mtxBuffer = new ArrayBuffer(bytes * 4);
			this.mtx = new Uint32Array(mtxBuffer);
		}
	};



	window.Voxel.prototype = {
		_posToIdx: function(pos) {
			var a = this.dims[0];
			var b = a * this.dims[1];
			return pos[0] + pos[1] * a + pos[2] * b;
		},

		_s: function(pos, clr) {
			if (!this.isValidPos(pos)) {	throw 's!';	/*return false;*/	}
			var i = this._posToIdx(pos);
			var oldClr = this.mtx[i];
			this.mtx[i] = clr;
			var op;
			if (clr === oldClr) {	return;	}
			if (clr === 0) {			op = 'delete';	}
			else if (oldClr === 0) {	op = 'add';		}
			else {						op = 'update';	}
			this._notify(pos, clr, op, this);
		},

		_updateRepr: function(reset) {
			var x, y, z, pos, clr;
			for (z = 0; z < this.dims[2]; ++z) {
				for (y = 0; y < this.dims[1]; ++y) {
					for (x = 0; x < this.dims[0]; ++x) {
						pos = [x, y, z];
						clr = this.g(pos);
						if (!clr) {	continue;	}
						if (reset) {	this._notify(pos, 0, 'delete', this);	}
						else {			this._notify(pos, clr, 'add', this);	}
					}
				}
			}
		},

		_notify: function(pos, clr, op) {
			for (var i = 0; i < this.subscribers.length; ++i) {
				this.subscribers[i](pos, clr, op, this);
			}
		},

		_whichOp: function(oldClr, clr) {
			if (clr === oldClr) {	return '';			}
			if (clr === 0) {		return 'delete';	}
			if (oldClr === 0) {		return 'add';		}
									return 'update';
		},

		isValidPos: function(pos) {
			for (var i = 0, v; i < 3; ++i) {
				v = pos[i];
				if (v < 0 || v >= this.dims[i]) {	return false;	}
			}
			return true;
		},

		g: function(pos) {
			if (!this.isValidPos(pos)) {	throw 'g!';/*	return 0;*/	}
			var i = this._posToIdx(pos);
			return this.mtx[i];
		},

		s: function(pos, clr) {
			var i, f, pos2;
			var p = [pos];

			for (var I = 0; I < 3; ++I) {
				if (this.symmetries[I]) {
					for (i = 0, f = p.length; i < f; ++i) {
						pos = p[i];
						pos2 = pos.slice();
						pos2[I] = this.dims[I] - pos[I] - 1;
						p.push(pos2);
					}
				}
			}

			for (i = 0, f = p.length; i < f; ++i) {	this._s(p[i], clr);	}
		},

		subscribe: function(cb) {
			this.subscribers.push(cb);
		},

		clone: function() {
			return new window.Voxel(this.dims, this.data);
		},

		toString: function() {
			return ['{Voxel dims:[', this.dims.join(', '), ']}'].join('');
		},

		toJSON: function() {
			var m = new Array(this.mtx.length);
			for (var i = 0, f = this.mtx.length; i < f; ++i) {
				m[i] = this.mtx[i];
			}
			return [this.dims, m];
		},

		transform: function(genDims, genPos, iterative) {
			var other = new Voxel(genDims(this.dims));
			other.subscribers = this.subscribers.slice();
			other.symmetries = this.symmetries;
			var x, y, z, pos, pos2, oldClr, clr;
			if (!iterative) {	this._updateRepr(true);	}
			for (x = 0; x < this.dims[0]; ++x) {
				for (y = 0; y < this.dims[1]; ++y) {
					for (z = 0; z < this.dims[2]; ++z) {
						pos = [x, y, z];
						oldClr = 0;
						clr = 0;
						if (this.isValidPos(pos)) {		oldClr = this.g(pos);	}
						pos2 = genPos(pos, this.dims);
						if (this.isValidPos(pos2)) {		clr = this.g(pos2);		}
						other.mtx[	other._posToIdx(pos)	] = clr;
						if (iterative) {	other._notify(pos, clr, other._whichOp(oldClr, clr), other);	}
					}
				}
			}
			if (!iterative) {	other._updateRepr();	}
			return other;
		},

		shift: function(dx, dy, dz) {
			return this.transform(
				function(d) {	return d;	},
				function(p) {	return [p[0]-dx, p[1]-dy, p[2]-dz];	}
			);
		},

		rotateX: function() {
			return this.transform(
				function(d) {		return [d[0], d[2], d[1]];			},
				function(p, d) {	return [p[0], d[2]-1-p[2], p[1]];	}
			);
		},

		rotateY: function() {
			return this.transform(
				function(d) {		return [d[2], d[1], d[0]];			},
				function(p, d) {	return [d[2]-1-p[2], p[1], p[0]];	}
			);
		},

		rotateZ: function() {
			return this.transform(
				function(d) {	return [d[1], d[0], d[2]];	},
				function(p, d) {	return [d[1]-1-p[1], p[0], p[2]];	}
			);
		},

		expand: function(mx, my, mz) {
			return this.transform(
				function(d) {	return [d[0]+mx*2, d[1]+my*2, d[2]+mz*2];	},
				//function(p) {	return [p[0]-mx,   p[1]-my,   p[2]-mz];	}
				function(p) {	return [p[0],   p[1],   p[2]];	}
			);
		},

		generateGeometry: function(voxelLen) {		// 5 (2)
			var i, x, y, z, pos, clr, fc, ctr, vx, dx, dy, dz;

			var vl2 = voxelLen / 2;

			var normals = [
				[ 0,  1,  0],	// 0, up
				[ 0,  0, -1],	// 1, front
				[ 1,  0,  0],	// 2, right
				[ 0,  0,  1],	// 3, back
				[-1,  0,  1],	// 4, left
				[ 0, -1,  0]	// 5, down
			];

			dx = -(this.dims[0] / 2 - 0.5) * voxelLen;
			dy = -(this.dims[1] / 2 - 0.5) * voxelLen;
			dz = -(this.dims[2] / 2 - 0.5) * voxelLen;

			// 1) decompose filled voxels into array of faces, grouped by normal
			var faces = new Array(3);
			for (i = 0; i < 3; ++i) {
				faces[i] = [];
			}

			// a face should have:
			//   vertices (Number[4][3])
			//   centroid (Number[3]), avg of vertices
			//   color (Number)
			//   normal (Number[3])
			for (x = 0; x < this.dims[0]; ++x) {
				for (y = 0; y < this.dims[1]; ++y) {
					for (z = 0; z < this.dims[2]; ++z) {
						pos = [x, y, z];
						clr = this.g(pos);
						if (!clr) {	continue;	}

						ctr = [
							dx + pos[0] * voxelLen,
							dy + pos[1] * voxelLen,
							dz + pos[2] * voxelLen
						];

						// 0, up
						faces[1].push({
							centroid:	[ctr[0], ctr[1] + vl2, ctr[2]],
							vertices:	[
								[ctr[0] - vl2, ctr[1] + vl2, ctr[2] + vl2],
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] + vl2],
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] - vl2],
								[ctr[0] - vl2, ctr[1] + vl2, ctr[2] - vl2]
							],
							normal:		normals[0],
							color:		clr
						});

						// 1, front
						faces[2].push({
							centroid:	[ctr[0], ctr[1], ctr[2] - vl2],
							vertices:	[
								[ctr[0] - vl2, ctr[1] + vl2, ctr[2] - vl2],
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] - vl2],
								[ctr[0] + vl2, ctr[1] - vl2, ctr[2] - vl2],
								[ctr[0] - vl2, ctr[1] - vl2, ctr[2] - vl2]
							],
							normal:		normals[1],
							color:		clr
						});

						// 2, right
						faces[0].push({
							centroid:	[ctr[0] + vl2, ctr[1], ctr[2]],
							vertices:	[
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] - vl2],
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] + vl2],
								[ctr[0] + vl2, ctr[1] - vl2, ctr[2] + vl2],
								[ctr[0] + vl2, ctr[1] - vl2, ctr[2] - vl2]
							],
							normal:		normals[2],
							color:		clr
						});

						// 3, back
						faces[2].push({
							centroid:	[ctr[0], ctr[1], ctr[2] + vl2],
							vertices:	[
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] + vl2],
								[ctr[0] - vl2, ctr[1] + vl2, ctr[2] + vl2],
								[ctr[0] - vl2, ctr[1] - vl2, ctr[2] + vl2],
								[ctr[0] + vl2, ctr[1] - vl2, ctr[2] + vl2]
							],
							normal:		normals[3],
							color:		clr
						});

						// 4, left
						faces[0].push({
							centroid:	[ctr[0] - vl2, ctr[1], ctr[2]],
							vertices:	[
								[ctr[0] - vl2, ctr[1] + vl2, ctr[2] - vl2],
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] - vl2],
								[ctr[0] + vl2, ctr[1] + vl2, ctr[2] + vl2],
								[ctr[0] - vl2, ctr[1] + vl2, ctr[2] + vl2]
							],
							normal:		normals[4],
							color:		clr
						});

						// 5, down
						faces[1].push({
							centroid:	[ctr[0], ctr[1] - vl2, ctr[2]],
							vertices:	[
								[ctr[0] + vl2, ctr[1] - vl2, ctr[2] + vl2],
								[ctr[0] + vl2, ctr[1] - vl2, ctr[2] - vl2],
								[ctr[0] - vl2, ctr[1] - vl2, ctr[2] - vl2],
								[ctr[0] - vl2, ctr[1] - vl2, ctr[2] + vl2]
							],
							normal:		normals[5],
							color:		clr
						});
					}
				}
			}


			// 2) remove pairs of faces having the same centroid
			var facesAux, facesToDelete;
			var visitFace = function(fc, i) {
				var key = fc.centroid.join('_');
				var indices = facesAux[key];
				if (!indices) {	facesAux[key] = [i];	}
				else {			indices.push(i);		}
			};
			var revSort = function(a, b) {	return b-a;	};
			var toInt = function(n) {	return parseInt(n, 10);	};
			
			var removedDuplicateFaces = 0;
			for (x = 0; x < 3; ++x) {
				y = faces[x];
				facesAux = {};		// holds face indices indexed by centroid

				for (i = 0, f = y.length; i < f; ++i) {
					visitFace(y[i], i);
				}

				facesToDelete = {};	// auxiliary hash to remove doubles
				for (fc in facesAux) {
					z = facesAux[fc];
					if (z.length === 2) {
						facesToDelete[	z[0]	] = true;
						facesToDelete[	z[1]	] = true;
					}
				}

				facesToDelete = Object.keys(facesToDelete);
				facesToDelete = facesToDelete.map(toInt);
				facesToDelete.sort(	revSort	);

				// removes doubled faces
				removedDuplicateFaces += facesToDelete.length;
				for (i = 0, f = facesToDelete.length; i < f; ++i) {
					y.splice(facesToDelete[i], 1);
				}
			}

			console.log('#faces removed:', removedDuplicateFaces);


			// 3) join neighbour faces into bigger rectangles


			// 4) join all faces
			i = faces[0];
			i = i.concat(faces[1]);
			faces = i.concat(faces[2]);
			console.log('#faces:', faces.length);


			// 5) extract unique vertices into indexed array
			var num = 0;
			var vertices = {};
			var removedDuplicateVertices = 0;
			var getVertexIndex = function(vtx) {
				var key = vtx.join('_');
				var idx = vertices[key];
				if (!idx) {	vertices[key] = (idx = num);	++num;	}
				else {		++removedDuplicateVertices;			}
				return idx;
			};

			for (var f = 0, F = faces.length; f < F; ++f) {
				fc = faces[f];
				for (i = 0; i < 4; ++i) {
					fc.vertices[i] = getVertexIndex(	fc.vertices[i]	);
				}
			}

			// vertices hash to array TODO NOT RIGHT YET
			//console.log('VERTICES:');	console.log(vertices);
			x = new Array(num);
			for (y in vertices) {
				x[	vertices[y] ] = y.split('_').map(toInt);
			}
			vertices = x;

			//console.log(vertices);
			console.log('#vertices:', num);
			console.log('#vertices removed:', removedDuplicateVertices);


			// 6) extract faces, referencing their vertices and normals
			//console.log('VERTICES:');	console.log(vertices);
			//console.log('FACES:');		console.log(faces);
		}
	};

})();