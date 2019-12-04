// Tegu (released under CC0 https://creativecommons.org/publicdomain/zero/1.0/)

function createImageData(width, height) {
	var canvas = document.createElement("canvas");
	var image_data = canvas.getContext("2d").createImageData(width, height);
	return image_data;
}

function createXorTexture(width, height, scale) {
	scale = typeof scale !== "undefined" ? scale : 1;
	var image_data = createImageData(width, height);
	var buf = new ArrayBuffer(image_data.data.length);
	var buf8 = new Uint8ClampedArray(buf);
	var data = new Uint32Array(buf);
	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index = y * width + x;
			var value = ((x*scale) ^ (y*scale)) & 0xff;
			data[index] = 
				(255 << 24) |
				(value << 16) |
				(value << 8) |
				value;
		}
	}
	image_data.data.set(buf8);
	return image_data;
}

function createUVmap(width, height, texture_width, texture_height) {
	var uvmap = new Array(width*height);
	for (var y = 0; y < height; ++y) {
		for (var x = 0; x < width; ++x) {
			var index = (y * width + x);

			var cx = x-width/2;
			var cy = y-height/2;
			var angle = Math.atan2(cy, cx)+Math.PI;
			var distance = Math.sqrt(cx*cx + cy*cy);

			var u = Math.abs(Math.floor(texture_width*angle/Math.PI));
			var v = Math.abs(Math.floor(64*texture_height/distance));

			var xcoord = u%texture_width;
			var ycoord = v%texture_height;
			uvmap[index] = ycoord*texture_width+xcoord;
		}
	}
	return uvmap
}

function run(texture) {
	texture = typeof texture !== "undefined" ? texture : createXorTexture(256, 256);

	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d");
	var image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

	var uvmap = createUVmap(canvas.width, canvas.height, texture.width, texture.height);

	var buf = new ArrayBuffer(image_data.data.length);
	var buf8 = new Uint8ClampedArray(buf);
	var data = new Uint32Array(buf);
	var texdata = texture.data;
	var N = canvas.width*canvas.height;
	var texN = texture.width*texture.height;
	function drawTunnel(t) {
		var shiftX = Math.floor(t*0.05);
		var shiftY = Math.floor(2*shiftX*texture.width);
		for (var i = 0; i < N; ++i) {
			var index = i;
			var texindex = ((uvmap[i]+shiftY+shiftX)%texN)*4;
			data[index] = 
				(texdata[texindex+3] << 24) |
				(texdata[texindex+2] << 16) |
				(texdata[texindex+1] << 8) |
				(texdata[texindex]);
		}
		image_data.data.set(buf8);
		ctx.putImageData(image_data, 0, 0);
		requestAnimationFrame(drawTunnel);
	}

	requestAnimationFrame(drawTunnel);
}

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

run();

