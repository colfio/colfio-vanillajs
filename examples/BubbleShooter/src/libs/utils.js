// Convert radians to degrees
function radToDeg(angle) {
	return angle * (180 / Math.PI);
}

// Convert degrees to radians
function degToRad(angle) {
	return angle * (Math.PI / 180);
}

// Check if two circles intersect
function circleIntersection(x1, y1, r1, x2, y2, r2) {
	// Calculate the distance between the centers
	var dx = x1 - x2;
	var dy = y1 - y2;

	return (Math.abs(dx) < (r1 + r2) && Math.abs(dy) < (r1 + r2));
}

function isTime(frequency, lastTime, currentTime){
	let delta = currentTime - lastTime;
	return delta > (1.0 / frequency);
}


// Get a random int between low and high, inclusive
function randRange(low, high) {
	return Math.floor(low + Math.random() * (high - low + 1));
}

function resizeCanvas(canvas) {
	canvas.style.height = window.innerHeight + "px";
	// square viewport is the max
	let aspectRatio = Math.max(1, window.innerHeight / window.innerWidth);
	let aspectRatio2 = canvas.height / canvas.width;
	canvas.style.width = (window.innerHeight / aspectRatio2) + "px";

}

function playSound(sound) {
	let audio = loadedSounds[sound];
	if(audio) {
		if (audio.currentTime > 0 && !audio.paused) {
			// play again
			audio.pause();
			audio.currentTime = 0;
			audio.play();
		} else {
			audio.play();
		}
	}
}